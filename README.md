# Creative Studio — Banner Automation (prototype)

A single-file React prototype of the in-app creative automation tool. It covers the full
flow for **Grocery → Top Banners (SKU)**: read the sheet, parse the product URL, pull
catalogue data, composite the banner on a canvas per fixed rules, edit/toggle every
element live, approve, and export PNG/WEBP/JPG at 2×.

Everything else (other categories, other elements, MULTI banners, CMS upload) is
stubbed as disabled placeholders, by design.

---

## Run it

It's a standard React component with no external dependencies.

```bash
npm create vite@latest creative-studio -- --template react
cd creative-studio
# replace src/App.jsx with BannerTool.jsx (rename the export or import it)
npm install && npm run dev
```

Drop `BannerTool.jsx` in and render `<BannerTool />`.

---

## How the pieces map (for splitting in your IDE / Claude Code)

The file is one piece for portability. Split along these seams — they're already
separated by section comments:

| Section in file | Move to | Why |
|---|---|---|
| `CATEGORIES`, `ELEMENTS_BY_CATEGORY` | `/config/categories.js` | non-technical edits |
| `BANNER_SKU_CONFIG` | `/config/elements/banner_sku.json` | the layout rule-set; one per element later |
| `parseCsvLine`, `rowsFromCsv`, `fetchSheet` | `/lib/sheet.js` | data source |
| `parseProductUrl` | `/lib/url.js` | |
| `mapCatalogueResponse`, `mockCatalogue`, `fetchCatalogue` | `/lib/catalogue.js` | swap mock→live here |
| `assembleProductData` | `/lib/assemble.js` | single source of truth object |
| `drawBanner` + helpers | `/lib/render.js` | reads config, never hardcodes |
| everything under "main component" | `/components/*` | UI |

The architecture rule holds: **the renderer reads only the config and the assembled
data object. No pixel value is hardcoded in drawing code.** Adding a new element type
(masthead, widget) = a new config file + a small case in the panel, not a rewrite.

---

## The three things you must wire up for production

1. **Live catalogue API.** Set `DATA_MODE = "live"` and `CATALOGUE_ENDPOINT`, then
   confirm the field paths in `mapCatalogueResponse` against the real response.
   Note from your sample JSON: the brand logo is **not** top-level — it's at
   `raw_source.provider_details.descriptor.images[0]` (or `.symbol`), and MRP is at
   `raw_source.item_details.price.maximum_value`. The mapper already targets these.

2. **CORS.** Browser → ONDC catalogue API and the remote brand-logo image will be
   blocked, and a remote logo also *taints the canvas* and blocks export. Fix both with
   one tiny serverless proxy (Vercel free function). Until then, the tool falls back to a
   text logo placeholder and lets the user upload a logo, which keeps export working.

3. **Google Sheets.** Public CSV export works read-only now. For the "mark Done" button,
   add a service account with editor access and write back via your backend
   (marked `[SWAP-FOR-SERVICE-ACCOUNT]` in the file).

---

## Deliberate choices worth knowing

- **No localStorage.** Forbidden in the preview sandbox, and edits are session-only by
  spec anyway. For a persistent Settings tab in the IDE, back `cfg` with localStorage
  (marked `[SWAP-FOR-LOCALSTORAGE]`).
- **Position editing is numeric, not drag-and-drop.** Robust and handoff-clean. Drag is a
  clean later addition on top of the same override system (`setOv(key, {x, y})`).
- **Inline styles, not Tailwind.** The sandbox only allows core Tailwind classes (no
  arbitrary pixel values), which fights precise layout. Inline styles are reliable here
  and trivial for Claude Code to convert later.
- **Non-numeric prices handled.** Rows like `"Starting at Rs. 50"` render as-is with no
  `₹` prefix and no strikethrough; numeric rows get the prefix and the catalogue MRP.
- **Quantity badge is off by default.** There's no quantity column in the sheet yet, so
  it's toggle-on with a manual value (or fed from the catalogue's unitized measure later).

---

## Known edge cases already handled

- URLs with params in any order, URL-encoded domain (`ONDC%3ARET10`), and `/store/` links
  with no `item_id` (flagged in the list).
- Empty `Subheader` rows (flagged with a warning in the list and on canvas).
- Canvas-taint export failure (caught with a clear message instead of a silent break).
- Live sheet fetch failure (falls back to bundled real rows, labelled in the UI).