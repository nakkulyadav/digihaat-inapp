// Parses a Digihaat product or store URL into its ONDC query parameters.
// Returns empty strings for any missing param rather than throwing.
export function parseProductUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const p = u.searchParams;
    const domainRaw = p.get("domain") || "";
    return {
      domain: decodeURIComponent(domainRaw),
      provider_id: p.get("provider_id") || "",
      bpp_id: p.get("bpp_id") || "",
      item_id: p.get("item_id") || "", // empty for /store/ links
      isStore: u.pathname.includes("/store/"),
    };
  } catch {
    return { domain: "", provider_id: "", bpp_id: "", item_id: "", isStore: false };
  }
}
