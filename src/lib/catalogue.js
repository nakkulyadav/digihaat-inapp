import { DATA_MODE, CATALOGUE_ENDPOINT } from "../config/constants";

const ANALYTICS_BASE = "https://prod.digihaat.in/analyticsDashboard/catalog/search";

// Fetches the provider/brand logo URL from Digihaat's analytics API.
// Returns the first image URL from provider_details, or null on any failure.
export async function fetchProviderLogo(bppId, domain, providerLocalId) {
  if (!bppId || !domain || !providerLocalId) return null;
  try {
    const providerUniqueId = `${bppId}_${domain}_${providerLocalId}`;
    const qs = new URLSearchParams({ page: "1", pageSize: "1", provider_unique_id: providerUniqueId });
    const res = await fetch(`${ANALYTICS_BASE}?${qs}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.[0]?.raw_source?.provider_details?.descriptor?.images?.[0] || null;
  } catch {
    return null;
  }
}

// ─── Live API mapper ──────────────────────────────────────────────────────────
// Maps the real ONDC catalogue API response to the shape the rest of the app
// expects. Field paths confirmed against the sample JSON provided by the API team.
// Note: brand logo is NOT top-level — it is nested under raw_source.
// [SWAP-FOR-LIVE-API] Verify these paths against the actual response when going live.
export function mapCatalogueResponse(raw) {
  const rs = raw?.raw_source || {};
  return {
    item_name: raw?.item_name || rs?.item_details?.descriptor?.name || "",
    mrp: rs?.item_details?.price?.maximum_value ?? raw?.mrp ?? null,
    selling_api: raw?.price ?? rs?.item_details?.price?.value ?? null,
    brand_logo_url:
      rs?.provider_details?.descriptor?.images?.[0] ||
      rs?.provider_details?.descriptor?.symbol || "",
    item_image_url: raw?.item_image || rs?.item_details?.descriptor?.images?.[0] || "",
    provider_name: raw?.provider_name || rs?.provider_details?.descriptor?.name || "",
    quantity: (() => {
      const m = rs?.item_details?.quantity?.unitized?.measure;
      return m ? `${m.value} ${m.unit}` : null;
    })(),
  };
}

// ─── Mock catalogue ───────────────────────────────────────────────────────────
// Synthesises brand/MRP/quantity from sheet data so the tool is usable offline.
// MRP is derived deterministically from the item_id hash so it stays stable across
// renders. Flip DATA_MODE to 'live' and fill CATALOGUE_ENDPOINT to replace this.
export function mockCatalogue(parsed, row) {
  let h = 0;
  const s = (parsed.item_id || parsed.provider_id || row.Subheader || "x");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const sellNum = parseFloat(String(row.Discounted).replace(/[^\d.]/g, ""));
  // 1.40–2.19×: realistic FMCG markup range; hash-derived so MRP is stable across re-renders
  const factor = 1.4 + ((h % 80) / 100);
  const mrp = isFinite(sellNum) && sellNum > 0 ? Math.round(sellNum * factor) : null;
  return {
    item_name: row.Subheader || "Product",
    mrp,
    selling_api: isFinite(sellNum) ? sellNum : null,
    brand_logo_url: "", // none in mock → placeholder; real API supplies URL
    item_image_url: "",
    provider_name: row.Subheader ? row.Subheader.split(" ").slice(0, 2).join(" ") : "Brand",
    quantity: null, // no quantity column in sheet; toggle on + type manually
  };
}

// ─── Fetch ────────────────────────────────────────────────────────────────────
export async function fetchCatalogue(parsed, row) {
  if (DATA_MODE === "mock" || !CATALOGUE_ENDPOINT || !parsed.item_id) {
    return mockCatalogue(parsed, row);
  }
  // [SWAP-FOR-LIVE-API] Real call via CORS proxy.
  const qs = new URLSearchParams({
    domain: parsed.domain,
    provider_id: parsed.provider_id,
    bpp_id: parsed.bpp_id,
    item_id: parsed.item_id,
  });
  const res = await fetch(`${CATALOGUE_ENDPOINT}?${qs}`);
  if (!res.ok) throw new Error("catalogue fetch failed");
  return mapCatalogueResponse(await res.json());
}
