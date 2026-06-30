import { SHEET_ID, SHEET_GID } from "../config/constants";

// ─── Bundled sample rows ──────────────────────────────────────────────────────
// Real grocery rows from the live sheet. Used as an offline fallback when the
// sheet fetch is blocked (e.g. CORS in local dev, network issue).
// The UI labels the source so the user knows which data they're seeing.
export const SAMPLE_ROWS = [
  { Date: "4/2/2026", Element: "Banner", Type: "SKU", Offer: "Free delivery", Discounted: "19", Subheader: "Value Besan Deal", Status: "", Category: "Grocery", URL: "https://digihaat.in/en/product?provider_id=0a754b2a3fdc47049b547e1ed54dde95&bpp_id=ondcseller-prod.costbo.com&domain=ONDC%3ARET10&item_id=b88b5cdff9c44f8dbec6ed06c37cbd85" },
  { Date: "4/2/2026", Element: "Banner", Type: "SKU", Offer: "Free delivery", Discounted: "49", Subheader: "Organic Jaggery Powder", Status: "", Category: "Grocery", URL: "https://digihaat.in/en/product?domain=ONDC%3ARET10&provider_id=4143420c8d9143c89c41b7f171d17f5a&bpp_id=ondcseller-prod.costbo.com&item_id=8c4020c1285149368123d0d8b4ab16ce" },
  { Date: "4/2/2026", Element: "Banner", Type: "SKU", Offer: "Free delivery", Discounted: "129", Subheader: "Ruffpad Writing Tablet", Status: "", Category: "Grocery", URL: "https://digihaat.in/en/product?provider_id=ac137db17ab942ba8d2b9c56b5109194&bpp_id=ondcseller-prod.costbo.com&domain=ONDC%3ARET14&item_id=7791c16b1d5f4424bb50f9590603f8f9" },
  { Date: "4/3/2026", Element: "Banner", Type: "SKU", Offer: "Free delivery", Discounted: "174", Subheader: "Microbial Bodywash", Status: "", Category: "Grocery", URL: "https://digihaat.in/en/product?provider_id=20f322470cdc4f07974cd4b0946c1493&bpp_id=ondcseller-prod.costbo.com&domain=ONDC%3ARET13&item_id=718aa01ae6b1455497d45765a4d7ba3a" },
  { Date: "4/3/2026", Element: "Banner", Type: "SKU", Offer: "Free delivery", Discounted: "69", Subheader: "Volt Deodorant", Status: "", Category: "Grocery", URL: "https://digihaat.in/en/product?provider_id=93334845c9154deb84b748ba769d84d9&bpp_id=ondcseller-prod.costbo.com&domain=ONDC%3ARET13&item_id=0369c4e56f2e41c682fbc6f714c8a4de" },
  { Date: "4/6/2026", Element: "Banner", Type: "SKU", Offer: "Free delivery", Discounted: "94", Subheader: "Mustard Oil", Status: "", Category: "Grocery", URL: "https://digihaat.in/en/product?provider_id=3ed4d6155f834700961cb09fb61cf022&bpp_id=ondcseller-prod.costbo.com&domain=ONDC%3ARET10&item_id=740ea60c5bc34b3d957f1050845c4a43" },
  { Date: "4/6/2026", Element: "Banner", Type: "SKU", Offer: "Free delivery", Discounted: "99", Subheader: "Fresh Neem Face Wash", Status: "", Category: "Grocery", URL: "https://digihaat.in/en/product?provider_id=064f0bd6a61042adb9e50b8bc1beeac9&bpp_id=ondcseller-prod.costbo.com&domain=ONDC%3ARET13&item_id=88af6ea270ca49edace62e90295aa1cb" },
  { Date: "4/6/2026", Element: "Banner", Type: "SKU", Offer: "Free delivery", Discounted: "21", Subheader: "Organic Jowar Flour", Status: "", Category: "Grocery", URL: "https://digihaat.in/en/product?domain=ONDC%3ARET10&provider_id=4143420c8d9143c89c41b7f171d17f5a&bpp_id=ondcseller-prod.costbo.com&item_id=a38ebb7ef3b547759aa421f5a17034ca" },
  { Date: "4/7/2026", Element: "Banner", Type: "SKU", Offer: "Free delivery", Discounted: "69", Subheader: "Premium Omani Dates", Status: "", Category: "Grocery", URL: "https://digihaat.in/en/product?domain=ONDC%3ARET10&provider_id=abc779c45a614179abb2c1b00f74955a&bpp_id=ondcseller-prod.costbo.com&item_id=3de0a0c86b9843d5a6a3723a3ed3e7db" },
  { Date: "4/7/2026", Element: "Banner", Type: "SKU", Offer: "Free delivery", Discounted: "21", Subheader: "Organic Ragi Flour", Status: "", Category: "Grocery", URL: "https://digihaat.in/en/product?provider_id=4143420c8d9143c89c41b7f171d17f5a&bpp_id=ondcseller-prod.costbo.com&domain=ONDC%3ARET10&item_id=ecf9c326d02e446f8d47bbeac0143ece" },
  { Date: "4/8/2026", Element: "Banner", Type: "SKU", Offer: "Free delivery", Discounted: "69", Subheader: "Charcoal Body Wash", Status: "", Category: "Grocery", URL: "https://digihaat.in/en/product?provider_id=93334845c9154deb84b748ba769d84d9&bpp_id=ondcseller-prod.costbo.com&domain=ONDC%3ARET13&item_id=bce6b0ad302e4d5cb6ef9d1801bcacee" },
  { Date: "4/11/2026", Element: "Banner", Type: "SKU", Offer: "Free delivery", Discounted: "49", Subheader: "Vegetable Chopper", Status: "Done", Category: "Grocery", URL: "https://digihaat.in/en/product?provider_id=1156429&bpp_id=ondcapi.shopclues.com&domain=ONDC%3ARET16&item_id=153664383" },
  { Date: "4/15/2026", Element: "Banner", Type: "SKU", Offer: "Free delivery", Discounted: "79", Subheader: "Crunchy Peanut Butter", Status: "", Category: "Grocery", URL: "https://digihaat.in/en/product?provider_id=1143072&bpp_id=ondcapi.shopclues.com&domain=ONDC%3ARET16&item_id=153726663" },
  { Date: "4/15/2026", Element: "Banner", Type: "SKU", Offer: "Free delivery", Discounted: "29", Subheader: "Date Bites", Status: "", Category: "Grocery", URL: "https://digihaat.in/en/product?provider_id=45323fbee41f4b0b9d560ea32ada35c6&bpp_id=ondcseller-prod.costbo.com&domain=ONDC%3ARET10&item_id=07d2fdf27de745c09c9153400cf86217" },
  { Date: "4/19/2026", Element: "Banner", Type: "SKU", Offer: "Free delivery", Discounted: "94", Subheader: "Banana Chips", Status: "", Category: "Grocery", URL: "https://digihaat.in/en/product?provider_id=82d8ad57eac9405183deb2a652b5e79a&bpp_id=ondcseller-prod.costbo.com&domain=ONDC%3ARET10&item_id=e630540ae2724f749cb266d59f5c1de9" },
  { Date: "4/19/2026", Element: "Banner", Type: "SKU", Offer: "Free delivery", Discounted: "57", Subheader: "Garam Masala", Status: "", Category: "Grocery", URL: "https://digihaat.in/en/product?provider_id=276d13b8cad24eaab2b4ff0c5b150ffc&bpp_id=ondcseller-prod.costbo.com&domain=ONDC%3ARET10&item_id=7ee7597ecc0140c3b78a95786b50c8aa" },
  { Date: "4/29/2026", Element: "Banner", Type: "SKU", Offer: "Free delivery", Discounted: "115", Subheader: "Premium Quality Ghee", Status: "", Category: "Grocery", URL: "https://digihaat.in/en/product?provider_id=63203&bpp_id=smartsell.samhita.org&domain=ONDC%3ARET10&item_id=ondc3345" },
  { Date: "5/4/2026", Element: "Banner", Type: "SKU", Offer: "Free delivery", Discounted: "29", Subheader: "Natural Honey", Status: "", Category: "Grocery", URL: "https://digihaat.in/en/product?domain=ONDC%3ARET10&provider_id=66f1137f5521b8011f83db31&bpp_id=prd.mystore.in&item_id=69ef007a0247ffa0fb491c15" },
  { Date: "5/13/2026", Element: "Banner", Type: "SKU", Offer: "Free delivery", Discounted: "Starting at Rs. 50", Subheader: "Millet n Minutes", Status: "", Category: "Grocery", URL: "https://digihaat.in/en/store/millet-n-minutes?location_id=688177&bpp_id=smartsell.samhita.org&provider_id=58548&domain=ONDC%3ARET10" },
  { Date: "5/13/2026", Element: "Banner", Type: "SKU", Offer: "Free shipping", Discounted: "Rs. 20 off above 99", Subheader: "Relishta", Status: "", Category: "Grocery", URL: "https://digihaat.in/en/store/relishta?location_id=737082&bpp_id=smartsell.samhita.org&provider_id=56308&domain=ONDC%3ARET10" },
  { Date: "5/16/2026", Element: "Banner", Type: "SKU", Offer: "Free delivery", Discounted: "71", Subheader: "Organic Toor Dal", Status: "", Category: "Grocery", URL: "https://digihaat.in/en/p/grocery/bharat-organics/organic-unpolished-toor-arhar-dal-bharat-organics?provider_id=3000136454481&bpp_id=sellerconnect.vikrra.in&domain=ONDC%3ARET10&item_id=3000141209035" },
  { Date: "5/19/2026", Element: "Banner", Type: "SKU", Offer: "Free delivery", Discounted: "39", Subheader: "Green Elaichi", Status: "", Category: "Grocery", URL: "https://digihaat.in/en/product?domain=ONDC%3ARET10&provider_id=212d0407-3d15-4a8e-9f77-c82793c82fea&bpp_id=prod-sellerapp.shiprocket.com&item_id=83c90aab-457b-4e92-9d9e-5dd9beb361c0" },
];

// ─── CSV parsing ─────────────────────────────────────────────────────────────

function parseCsvLine(line) {
  const out = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (c === "," && !q) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur); return out;
}

function rowsFromCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (!lines.length) return [];
  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const idx = (name) => header.findIndex((h) => h.toLowerCase() === name.toLowerCase());
  const iDate = idx("Date"), iEl = idx("Element"), iType = idx("Type (SKU/BRAND)"),
    iOffer = idx("Offer"), iUrl = idx("URL"), iPrice = idx("Discounted Price"),
    iHead = idx("Header"), iSub = idx("Subheader"), iStatus = idx("Status"),
    iCat = idx("Category");

  const missingCols = Object.entries({ Date: iDate, Element: iEl, "Type (SKU/BRAND)": iType, Offer: iOffer, URL: iUrl, "Discounted Price": iPrice, Subheader: iSub, Category: iCat })
    .filter(([, i]) => i === -1).map(([name]) => name);
  if (missingCols.length) console.warn("[sheet] Missing expected columns:", missingCols.join(", "));

  return lines.slice(1).map((l) => {
    const c = parseCsvLine(l);
    return {
      Date: c[iDate] || "", Element: c[iEl] || "", Type: c[iType] || "",
      Offer: c[iOffer] || "", URL: c[iUrl] || "", Discounted: c[iPrice] || "",
      Header: iHead > -1 ? c[iHead] || "" : "", Subheader: c[iSub] || "",
      Status: iStatus > -1 ? c[iStatus] || "" : "",
      Category: iCat > -1 ? c[iCat] || "" : "",
    };
  }).filter((r) => r.URL);
}

// [SWAP-FOR-SERVICE-ACCOUNT] For write-back ("mark Done"), route through your
// backend with a service account that has editor access on the sheet.
export async function fetchSheet() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("sheet fetch failed");
  return rowsFromCsv(await res.text());
}
