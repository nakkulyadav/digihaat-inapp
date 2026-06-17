// Vercel serverless function: fetches brand logo URL from Digihaat's analytics API
// server-side to avoid the CORS restriction on prod.digihaat.in.
// Accepts: ?bpp_id=...&domain=...&provider_id=...
// Returns: { logoUrl: string | null }
const ANALYTICS_BASE = "https://prod.digihaat.in/analyticsDashboard/catalog/search";

export default async function handler(req, res) {
  const { bpp_id, domain, provider_id } = req.query;

  if (!bpp_id || !domain || !provider_id) {
    res.status(400).json({ error: "bpp_id, domain, and provider_id are required" });
    return;
  }

  const providerUniqueId = `${bpp_id}_${domain}_${provider_id}`;
  const qs = new URLSearchParams({ page: "1", pageSize: "1", provider_unique_id: providerUniqueId });

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
  const logoUrl = json?.data?.[0]?.raw_source?.provider_details?.descriptor?.images?.[0] || null;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.status(200).json({ logoUrl });
}
