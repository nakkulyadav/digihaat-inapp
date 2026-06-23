import { fetchProviderLogo, fetchItemMrp } from "./catalogue";

// Merges sheet row + parsed URL + catalogue response into a single normalised
// data object. This is the single source of truth passed to the renderer and
// the properties panel. Nothing downstream should read raw sheet/catalogue fields.
export async function assembleProductData(row, parsed, cat) {
  const sellingRaw = String(row.Discounted || "").trim();
  const sellingNum = parseFloat(sellingRaw.replace(/[^\d.]/g, ""));

  // Fetch brand logo and live item MRP in parallel from the analytics API.
  // Both fall back gracefully on failure — logo to null, MRP to mock cat value.
  const [logoUrl, liveItem] = await Promise.all([
    fetchProviderLogo(parsed.bpp_id, parsed.domain, parsed.provider_id),
    fetchItemMrp(parsed.bpp_id, parsed.domain, parsed.provider_id, parsed.item_id),
  ]);

  const mrp = liveItem.mrp ?? liveItem.price ?? (cat.mrp != null ? String(cat.mrp) : "");

  return {
    meta: { date: row.Date, type: row.Type, category: "grocery", url: row.URL, parsed },
    fields: {
      headline: row.Subheader || cat.item_name || "",
      selling_display: isFinite(sellingNum) && /^\s*\d/.test(sellingRaw) ? String(sellingNum) : sellingRaw,
      selling_is_numeric: isFinite(sellingNum) && /^\s*[\d.]+\s*$/.test(sellingRaw),
      mrp: mrp !== "" ? String(mrp) : "",
      selling_numeric: isFinite(sellingNum) ? sellingNum : null,
      offer: row.Offer || "Free Delivery",
      quantity: cat.quantity || "",
      brand_name: cat.provider_name || "",
      brand_logo_url: logoUrl || cat.brand_logo_url || "",
    },
  };
}
