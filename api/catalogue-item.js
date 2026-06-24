// Vercel serverless function: fetches item MRP and price from Digihaat's analytics API
// server-side to avoid the CORS restriction on prod.digihaat.in.
// Accepts: ?item_id=...&bpp_id=...&domain=...&provider_id=...
// Returns: { mrp: number | null, price: number | null }
const ANALYTICS_BASE = "https://prod.digihaat.in/analyticsDashboard/catalog/search";

export default async function handler(req, res) {
  const { item_id, bpp_id, domain, provider_id } = req.query;

  if (!item_id || !bpp_id || !domain || !provider_id) {
    res.status(400).json({ error: "item_id, bpp_id, domain, and provider_id are required" });
    return;
  }

  const providerUniqueId = `${bpp_id}_${domain}_${provider_id}`;
  const itemUniqueId = `${bpp_id}_${domain}_${provider_id}_${item_id}`;
  const qs = new URLSearchParams({ page: "1", pageSize: "100", provider_unique_id: providerUniqueId });

  let upstream;
  try {
    upstream = await fetch(`${ANALYTICS_BASE}?${qs}`);
  } catch {
    res.status(502).json({ error: "upstream unreachable" });
    return;
  }

  if (!upstream.ok) {
    res.status(502).json({ error: "upstream fetch failed" });
    return;
  }

  const json = await upstream.json();
  const item = (json?.data || []).find((d) => d.id === itemUniqueId);

  if (!item) {
    res.status(404).json({ error: "item not found" });
    return;
  }

  const mrp = item.mrp ?? null;
  const price = item.price ?? null;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).json({ mrp, price });
}
