# CLAUDE.md — Creative Studio (Banner Automation)

This file tells Claude how to work in this codebase. Read it fully before touching anything.

---

## What this project is

An internal browser tool for a 3–4 person marketing team at Digihaat. It automates the creation of in-app promotional creatives (banners, mastheads, widgets) by reading product data from Google Sheets + an ONDC catalogue API, compositing the creative on an HTML5 Canvas per a JSON config, and exporting it as a PNG/WEBP/JPG.

**Current scope:** Grocery category → Top Banners (SKU type) only. Everything else is stubbed as a placeholder.

---

## Project structure

```
src/
  BannerTool.jsx        ← full component (to be split later)
  main.jsx              ← entry point

config/                 ← source of truth for all layout rules
  categories.js         ← category list, GIDs, enabled flags
  elements/
    banner_sku.json     ← the SKU banner layout ruleset
    [others later]

lib/
  sheet.js              ← Google Sheets CSV fetch + parser
  url.js                ← product URL parser (extracts item_id etc.)
  catalogue.js          ← catalogue API fetch, response mapper, mock fallback
  assemble.js           ← merges sheet + API into unified ProductData object
  render.js             ← canvas drawing engine (reads config, draws elements)

.env                    ← NEVER TOUCH. contains real credentials.
.env.example            ← safe reference. Claude edits this, not .env.
```

---

## The one architectural rule that must never break

**The renderer never hardcodes a number.**

Every pixel value — position, size, font size, color, radius, padding — comes from the config object loaded at runtime. The render functions receive `(ctx, config, data, overrides, assets)` and read everything from there.

If you catch yourself writing `ctx.fillRect(16, 147, 68, 31)` in a render function, stop. That number belongs in `banner_sku.json`, not in code. This is what makes the tool configurable without a developer.

---

## The data flow (never break this chain)

```
Google Sheet row
      ↓ sheet.js
URL parsed → item_id, provider_id, bpp_id, domain
      ↓ url.js
Catalogue API (or mock)
      ↓ catalogue.js → mapCatalogueResponse()
Unified ProductData object        ← assembleProductData() in assemble.js
      ↓
Renderer reads config + ProductData + user overrides + uploaded assets
      ↓
Canvas → export
```

Each layer is independent. A change to the API response format is fixed only in `mapCatalogueResponse()`. A change to layout is only in the config. The renderer never knows about either.

---

## Environment variables

**Never read, write, or reference `.env` directly. Ever.**

To add or change an env variable:
1. Update `.env.example` with the new key and a placeholder value + a comment explaining what it is.
2. Tell the user what to add to their own `.env` in the chat. They will do it themselves.

Current variables (see `.env.example`):

| Variable | Purpose |
|---|---|
| `VITE_SHEET_ID` | Google Sheets document ID |
| `VITE_DATA_MODE` | `mock` (prototype) or `live` (real API) |
| `VITE_CATALOGUE_ENDPOINT` | Proxied catalogue API base URL |

---

## Known gotchas — check these before every render-related change

**Canvas taint.** Any image drawn onto the canvas from a cross-origin URL (brand logos from `googleapis.com`, product images) will taint the canvas and silently block `.toDataURL()` export. The fix is a proxy. Until the proxy is built, the tool lets the user upload a local logo file instead. Do not draw remote images directly onto the canvas unless they go through the proxy.

**Inter font loading.** The canvas uses `Inter` loaded via the `FontFace` API before first render. If a font-dependent draw runs before the font resolves, text renders in the browser default serif. The `fontReady` state flag guards this. Do not remove that guard or draw text synchronously on mount.

**Non-numeric prices.** The `Discounted Price` column in the sheet is not always a number. Rows like `"Starting at Rs. 50"` or `"Rs. 20 off above 99"` are valid. The renderer handles this: it only prepends `₹` and shows a strikethrough MRP when the value is purely numeric. Do not add a `parseFloat()` that loses this string case.

**CORS on catalogue API.** The real ONDC catalogue API cannot be called directly from the browser. In production this goes through a Vercel serverless function proxy. `DATA_MODE=mock` bypasses this entirely. Do not attempt a direct browser fetch to the catalogue API and expect it to work.

**Empty subheader rows.** Some sheet rows have no `Subheader` value. The product list flags these visually. The renderer draws nothing for an empty headline rather than crashing. Do not add a guard that skips rendering the whole banner for a missing headline.

**Store links vs product links.** Some URLs use `/store/` paths and have no `item_id`. `parseProductUrl()` handles this and sets `isStore: true`. The catalogue fetch short-circuits to mock for these. Do not assume `item_id` is always present.

---

## Config schema — how to add a new element

1. Add a new key to the relevant element config file (e.g. `banner_sku.json`) with at minimum: `label`, `order`, `visible`, `toggleable`, and all positional/style properties.
2. Add a draw block for it in `render.js` that reads exclusively from config.
3. Add an edit block for it in the properties panel in the UI component.
4. That's it. No other file should need to change.

To add a new element type (e.g. masthead):
1. Create `config/elements/masthead.json` with its own full ruleset.
2. Enable it in `ELEMENTS_BY_CATEGORY` in `categories.js`.
3. Wire a renderer for it in `render.js`.
4. The category/element picker in the UI handles the rest automatically.

---

## What Claude should never do autonomously

- **Never touch `.env`.**
- Never rename or move files without being explicitly asked.
- Never refactor code that is currently working just to "clean it up" unless the task is explicitly a refactor.
- Never change the config schema structure (key names, nesting) without checking first — the renderer, the properties panel, and any settings UI all depend on exact key names.
- Never add a new npm dependency without flagging it first. This project runs on zero dependencies beyond React. Any addition needs a reason.
- Never change export filenames or folder structure without asking — Claude Code file splits will follow the structure documented above.

---

## Deployment

Vercel free tier. `npm run build` → deploy. No backend. No database.

The catalogue API proxy (when built) will be a Vercel serverless function in `/api/catalogue.js`. It will be the only server-side code in the project.

---

## Scope as of now

| Feature | Status |
|---|---|
| Grocery → Top Banners (SKU) | Built |
| All other categories | Placeholder (disabled) |
| Grocery → Masthead, Widget, Banner 2 | Placeholder (disabled) |
| MULTI banner type | Not started |
| Settings tab (config editor UI) | Not started |
| Mark as Done (write back to sheet) | Manual for now; service account later |
| Upload to CMS | Button exists, disabled. Not started. |
| Catalogue API (live mode) | Mocked. Flip `VITE_DATA_MODE=live` when proxy is ready. |

When picking up a new session, check this table first. Do not build features that are not in scope without asking.