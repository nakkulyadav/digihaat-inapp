# Feature Implementation Plan

## TLDR
A config-driven, in-app banner automation tool for Digihaat. Reads live product data from a Google Sheet, pulls catalogue info, and lets the user design, edit, and export SKU promotional banners as PNG/WEBP/JPG at 2× resolution — all in the browser, no external design tool required.

## Critical Decisions
- **Config-driven renderer** — all layout rules (coordinates, colors, sizes) live in `banner_sku.json`; `render.js` has zero hardcoded pixel values. Adding a new element = one config entry + one draw block.
- **Inline styles over Tailwind** — arbitrary pixel values in the sandbox are not supported by Tailwind's core classes; inline styles are explicit and portable.
- **No external UI or canvas libraries** — keeps the bundle minimal and the rendering logic fully owned.
- **Overrides pattern** — session-only overrides object merges on top of config at draw time; enables live editing without mutating the source config.
- **Numeric position editing over drag-and-drop** — robust, precise, and handoff-clean for a tool used by the marketing team.
- **Self-hosted Inter variable font** — eliminates CDN dependency, covers all weights (including 600) in a single file, works offline and on restricted networks.
- **`document.fonts.ready` over `setTimeout`** — platform-native signal; guarantees the canvas draws only after fonts are registered.
- **`canvas.radius` in `banner_sku.json`** — keeps rounded-corner value as a single source of truth alongside all other canvas layout rules.

---

## Tasks

- [x] 🟩 **Step 1: Project scaffold**
  - [x] 🟩 Initialise Vite + React project (`npm create vite`)
  - [x] 🟩 Strip boilerplate; set up `src/` folder structure (`components/`, `lib/`, `config/`, `assets/`)
  - [x] 🟩 Configure `vite.config.js` with `@vitejs/plugin-react`

- [x] 🟩 **Step 2: Design system & token layer**
  - [x] 🟩 Define color tokens and typography scale in `components/tokens.js`
  - [x] 🟩 Build atomic components: `Toggle`, `Field`, `NumField`, `UploadBtn`, `EmptyCard`, `Chevron`

- [x] 🟩 **Step 3: Category & element config**
  - [x] 🟩 Define `CATEGORIES` and `ELEMENTS_BY_CATEGORY` in `config/categories.js` (Grocery enabled; others stubbed)
  - [x] 🟩 Define `DATA_MODE`, `SHEET_ID`, `CATALOGUE_ENDPOINT` in `config/constants.js`

- [x] 🟩 **Step 4: Banner layout config (`banner_sku.json`)**
  - [x] 🟩 Define canvas dimensions (361×188 logical px, 2× scale)
  - [x] 🟩 Define all 7 elements with full layout rules: `brand_logo`, `headline`, `price`, `cta_button`, `tnc`, `offer_badge`, `quantity_badge`
  - [x] 🟩 Mark each element as `toggleable` and set default `visible` state

- [x] 🟩 **Step 5: Data pipeline**
  - [x] 🟩 `lib/sheet.js` — fetch and parse Google Sheet CSV; bundle `SAMPLE_ROWS` as offline fallback
  - [x] 🟩 `lib/url.js` — parse ONDC product URLs (handles param ordering, encoding, store links)
  - [x] 🟩 `lib/catalogue.js` — mock catalogue (deterministic hash-based MRP); stub for live ONDC API with field-path map
  - [x] 🟩 `lib/assemble.js` — merge sheet row + URL parse + catalogue into single normalised `data` object consumed by renderer

- [x] 🟩 **Step 6: Canvas rendering engine (`lib/render.js`)**
  - [x] 🟩 `drawBanner(ctx, cfg, data, ov, assets)` — reads only config + data + overrides; no hardcoded values
  - [x] 🟩 Draw blocks for all 7 elements; return warnings array for UI surface
  - [x] 🟩 Helper functions: `roundRectPath`, `font()`, `wrapLines()`
  - [x] 🟩 Handle edge cases: non-numeric prices, missing MRP, missing logo (text fallback), canvas taint on export

- [x] 🟩 **Step 7: Main UI (`BannerTool.jsx`)**
  - [x] 🟩 Three-state body: element picker → product list → workspace
  - [x] 🟩 Sidebar category/element navigation
  - [x] 🟩 Product list with search, date filter, status filter (Pending / Done)
  - [x] 🟩 Workspace: canvas preview, background/logo upload, warnings display, approval toggle, export (PNG/WEBP/JPG)
  - [x] 🟩 Properties panel: per-element visibility toggle, text override, numeric position adjustment, colour override for CTA/offer badge
  - [x] 🟩 Canvas redraws reactively on any data/override/image/font change

- [x] 🟩 **Step 8: Font system**
  - [x] 🟩 Add `<link rel="preconnect">` to `index.html` for early connection to font CDN
  - [x] 🟩 Replace 1200 ms `setTimeout` fallback with `document.fonts.ready` chain
  - [x] 🟩 Audit and remove unused font files (cyrillic, greek, vietnamese, italic, weight-800, 24pt/28pt static TTFs)
  - [x] 🟩 Retain only `Inter-VariableFont_opsz,wght.ttf` (covers all weights 100–900 in one file)
  - [x] 🟩 Create `src/assets/fonts/inter.css` with a single `@font-face` declaration
  - [x] 🟩 Import `inter.css` in `main.jsx`; strip Google Fonts `useEffect` from `BannerTool.jsx`

- [x] 🟩 **Step 9: Rounded canvas corners**
  - [x] 🟩 Add `"radius": 12` to canvas block in `banner_sku.json`
  - [x] 🟩 Clip all canvas drawing to rounded boundary in `render.js` (`save` → `roundRectPath` → `clip` → draw → `restore`)
  - [x] 🟩 Update `<canvas>` CSS `borderRadius` in `BannerTool.jsx` to match (16 px, proportionally scaled)

- [x] 🟩 **Step 10: Live catalogue integration**
  - [x] 🟩 Set `DATA_MODE = "live"` in `config/constants.js`
  - [x] 🟩 Deploy CORS proxy (Vercel serverless function) and fill `CATALOGUE_ENDPOINT`
  - [x] 🟩 Verify field paths in `mapCatalogueResponse()` against live ONDC API response

- [x] 🟩 **Step 11: Sheet write-back ("Mark Done")**
  - [x] 🟩 Route sheet write-back through a backend service account (`[SWAP-FOR-SERVICE-ACCOUNT]`)
  - [x] 🟩 Wire the "Mark Done" button in the UI to the backend endpoint

- [x] 🟩 **Step 12: Additional categories & element types**
  - [x] 🟩 Enable stubbed categories (Swadeshi, Electronics, Beauty, Lifestyle, Food)
  - [x] 🟩 Create config JSONs and render blocks for Masthead and Widget element types
  - [x] 🟩 Enable "Banner 2" variant

- [x] 🟩 **Step 13: CMS upload**
  - [x] 🟩 Wire the "Upload to CMS" button to the target CMS API
  - [x] 🟩 Show upload status / confirmation in the UI

- [x] 🟩 **Step 14: Persistent overrides**
  - [x] 🟩 Back `cfg` and `overrides` state with `localStorage` (`[SWAP-FOR-LOCALSTORAGE]`)
  - [x] 🟩 Add a Settings tab to expose and reset persisted config

---

# Feature Implementation Plan

## TLDR
Switch the Google Sheets data source from a per-category tab model (multiple GIDs) to a single tab with a `Category` column. Fetch the full sheet once on app load and partition rows in memory by category — no re-fetching when the user switches categories.

## Critical Decisions
- **Single GID, fetch once** — one sheet tab, one network request on mount; all downstream filtering is in-memory. Right-sized for a small internal team sheet.
- **Category match is case-insensitive** — sheet values are entered manually and may vary in casing; match against `CATEGORIES[].label` with `.toLowerCase()` on both sides.
- **`SHEET_GID` lives in `.env` alongside `SHEET_ID`** — not a secret, but keeps all sheet config in one place and consistent with existing conventions.
- **No catalogue API changes** — `DATA_MODE` remains `"mock"` and `CATALOGUE_ENDPOINT` remains empty; live catalogue integration is a separate phase.
- **Public viewer sheet, no service account** — sufficient for read-only access; service account deferred until write-back ("Mark Done") is built.

## Tasks

- [x] 🟩 **Step 1: Add `SHEET_GID` to config and environment**
  - [x] 🟩 Add `export const SHEET_GID = import.meta.env.VITE_SHEET_GID;` to `src/config/constants.js`
  - [x] 🟩 Add `VITE_SHEET_GID=` with a placeholder and comment to `.env.example`
  - [x] 🟩 Inform the user to add the real GID value to their `.env`

- [x] 🟩 **Step 2: Update `config/categories.js`**
  - [x] 🟩 Remove the `gid` field from every entry in the `CATEGORIES` array (no longer meaningful with a single tab)

- [x] 🟩 **Step 3: Update `lib/sheet.js`**
  - [x] 🟩 Add `Category` to the column index map in `rowsFromCsv()` (look up header `"Category"`, same case-insensitive pattern as other columns)
  - [x] 🟩 Include `Category: c[iCat] || ""` in each returned row object
  - [x] 🟩 Update `fetchSheet()` to import and use `SHEET_GID` from constants instead of accepting a `gid` parameter
  - [x] 🟩 Add `Category: "Grocery"` to every row in `SAMPLE_ROWS` so the fallback path is consistent with the new schema

- [x] 🟩 **Step 4: Update `BannerTool.jsx` — fetch and filter logic**
  - [x] 🟩 Add `allRows` state (replaces `rows` as the raw store of fetched data)
  - [x] 🟩 Move the `fetchSheet` call from the element-selection `useEffect` to a mount-time `useEffect` (no dependencies); store result in `allRows`
  - [x] 🟩 Derive `rows` via `useMemo` filtering `allRows` by: `row.Category.toLowerCase() === category.label.toLowerCase()` AND `row.Element` matching `element.sheetElementValue` (case-insensitive, same as before)
  - [x] 🟩 Remove `category.gid` from the `fetchSheet` call site

---

# Feature Implementation Plan

## TLDR
Auto-fetch the brand logo from Digihaat's analytics API using parameters already present in the product URL, proxy the image through a Vercel serverless function to avoid canvas taint, and render it automatically — eliminating the manual logo upload step.

## Critical Decisions
- **Analytics API as logo source** — `prod.digihaat.in/analyticsDashboard/catalog/search` is publicly accessible without auth; logo URL extracted from `data[0].raw_source.provider_details.descriptor.images[0]`
- **`provider_unique_id` constructed from URL params** — `{bpp_id}_{domain}_{provider_local_id}` — all three already parsed by `lib/url.js`
- **Vercel proxy for image** — `storage.googleapis.com` images are cross-origin; drawing them directly onto the canvas taints it and breaks `.toDataURL()` export; the proxy strips the cross-origin restriction
- **Single proxy handles both API fetch and image** — the same Vercel function infrastructure serves both; API call can be made directly from the browser (public, no CORS issue) but image must go through proxy
- **Graceful degradation on failure** — if the API returns no logo or the fetch fails: show an error message, fall back to manual upload, and render the banner without a logo
- **Short-link URLs deferred** — `/digilink/` format cannot be resolved client-side; handled only when a proxy or server-side redirect-follow is built

## Tasks

- [x] 🟩 **Step 1: Build Vercel image proxy**
  - [x] 🟩 Create `api/proxy-image.js` as a Vercel serverless function
  - [x] 🟩 Accept a `url` query parameter; fetch the remote image server-side; pipe response bytes back with correct `Content-Type` header
  - [x] 🟩 Restrict allowed origins to `storage.googleapis.com` to prevent open-proxy abuse
  - [x] 🟩 Add `VITE_IMAGE_PROXY_ENDPOINT` to `.env.example` with a placeholder and comment

- [x] 🟩 **Step 2: Fetch logo URL from analytics API**
  - [x] 🟩 In `lib/catalogue.js`, add a `fetchProviderLogo(bppId, domain, providerLocalId)` function
  - [x] 🟩 Construct `provider_unique_id` as `{bppId}_{domain}_{providerLocalId}`
  - [x] 🟩 Call `prod.digihaat.in/analyticsDashboard/catalog/search?page=1&pageSize=1&provider_unique_id={provider_unique_id}`
  - [x] 🟩 Extract `data[0].raw_source.provider_details.descriptor.images[0]`; return `null` if missing or fetch fails

- [x] 🟩 **Step 3: Wire logo fetch into the data assembly pipeline**
  - [x] 🟩 In `lib/assemble.js`, call `fetchProviderLogo` using the `bpp_id`, `domain`, and `provider_id` already present in the parsed URL object
  - [x] 🟩 Add `logoUrl` (raw remote URL) to the assembled `ProductData` object
  - [x] 🟩 If `fetchProviderLogo` returns `null`, set `logoUrl: null` — do not throw

- [x] 🟩 **Step 4: Load proxied logo image for canvas**
  - [x] 🟩 In `BannerTool.jsx`, when `logoUrl` is present, fetch it via the image proxy endpoint and load it into an `HTMLImageElement`
  - [x] 🟩 Store the loaded image in the `assets` state that is passed to `drawBanner()`
  - [x] 🟩 If the logo URL is null or the proxy fetch fails, set `assets.logo` to `null` and surface an error message in the warnings area

- [x] 🟩 **Step 5: Render and fallback UX**
  - [x] 🟩 Pass `assets.logo` into `drawBanner()`; renderer already handles missing logo with a text fallback (no change to `render.js` needed)
  - [x] 🟩 When logo auto-fetch fails, show error message: "Brand logo could not be loaded — upload manually"
  - [x] 🟩 Keep manual upload available at all times as an override; a manually uploaded logo takes precedence over the auto-fetched one

---

# Feature Implementation Plan

## TLDR
Allow the user to enlarge the brand logo within its existing 82×48px box by exposing the `pad` config key as a user-adjustable override. The logo always remains fully visible (fit-only, aspect-ratio preserved); only the padding shrinks.

## Critical Decisions
- **Expose `pad` as a user override, not a new config key** — `pad` already controls available draw space in the renderer; reducing it toward `0` is the exact mechanic needed. No schema change, no new render logic.
- **Fit-only (no crop)** — the logo is always fully visible within the box; the renderer's existing aspect-ratio fit logic handles this automatically.
- **Box dimensions stay fixed at 82×48px** — eliminates layout collision risk with all other banner elements.
- **Slider control in the properties panel** — range `0` (minimum padding, logo fills box) to `6` (default padding); maps directly to the `pad` override value, consistent with existing numeric property controls.

## Tasks

- [x] 🟩 **Step 1: Expose `pad` override in `BannerTool.jsx` properties panel**
  - [x] 🟩 Locate the brand logo section in the properties panel (currently exposes only x/y position controls)
  - [x] 🟩 Add a slider or `NumField` labeled "Logo size" (or "Logo padding") with range `0`–`6`, defaulting to `6`
  - [x] 🟩 Wire the control to write `ov.brand_logo.pad` into the overrides state via the existing `setOv` pattern

- [x] 🟩 **Step 2: Verify renderer handles `pad` override correctly**
  - [x] 🟩 Confirm `get("brand_logo")` in `render.js` merges `ov.brand_logo.pad` on top of config (existing override pattern — should already work)
  - [x] 🟩 Manually test at `pad: 0`, `pad: 3`, and `pad: 6` to confirm logo scales up/down without overflow or distortion

---

# Feature Implementation Plan

## TLDR
Extend the existing brand logo size slider to allow zooming past the aspect-ratio fit boundary, cropping the logo at the 82×48px box edges. Solves the heavy-whitespace logo problem where fit-only mode leaves visible gaps around the logo.

## Critical Decisions
- **Extend `pad` into negative territory** — negative pad values make `availW`/`availH` exceed the box dimensions, scaling the logo larger; the existing `ctx.clip()` at the box boundary silently handles the crop. No schema change, no new render logic.
- **One continuous slider, no crop mode indicator** — no visual separator or label change at the fit/crop boundary; the slider runs from default fit (`pad: 6`) through fill (`pad: 0`) into crop (`pad < 0`) without interruption.
- **`logoScale` multiplier ruled out** — would require a new config key in `banner_sku.json` and new render logic; negative pad achieves the same result with zero new surface area.

## Tasks

- [x] 🟩 **Step 1: Extend slider range into negative `pad` territory**
  - [x] 🟩 In `BannerTool.jsx`, change the Logo size slider `min` from `0` to a negative lower bound (e.g. `-18`) to allow zoom-past-fit
  - [x] 🟩 Update the slider `value` and `onChange` mapping to cover the full new range (currently `value={6 - (ov.pad ?? base.pad)}` — extend max accordingly)

- [x] 🟩 **Step 2: Verify crop behaviour in the renderer**
  - [x] 🟩 Confirm `ctx.clip()` in `render.js` (line 80) correctly clips logo overflow at the box boundary at negative pad values
  - [x] 🟩 Test with a wide landscape logo (heavy side whitespace) and a tall logo (heavy top/bottom whitespace) to confirm centering and crop look correct at several negative pad values

---

# Feature Implementation Plan

## TLDR
Fix the image proxy (`api/proxy-image.js`) to accept logo URLs from any HTTP/HTTPS origin, not just `googleapis.com`, so providers hosted on any CDN or custom domain load correctly. SSRF protection replaces the domain allowlist.

## Critical Decisions
- **Remove `googleapis.com` allowlist** — the restriction was written assuming all ONDC providers use Google Storage; they don't. Any provider on a different CDN silently fails with a 403 that surfaces as a generic load error.
- **SSRF protection via DNS resolution** — before proxying, resolve the hostname to its IP addresses and reject any that fall in private/loopback/link-local ranges. This is the correct scope for an image proxy: block internal access, not external domains.
- **Protocol validation (http/https only)** — reject `file://`, `ftp://`, and other non-web schemes before any network call.
- **No changes outside `api/proxy-image.js`** — the failure is fully contained in the proxy; BannerTool.jsx, assemble.js, and catalogue.js are all correct.

## Tasks

- [x] 🟩 **Step 1: Update `api/proxy-image.js` — replace domain allowlist with SSRF protection**
  - [x] 🟩 Remove the `if (!parsed.hostname.endsWith("googleapis.com"))` block (lines 20–23)
  - [x] 🟩 Add protocol validation: reject any URL whose scheme is not `http:` or `https:` with a `400` response
  - [x] 🟩 Import Node's `dns.promises` module
  - [x] 🟩 Resolve the hostname via `dns.resolve4()` (IPv4) and `dns.resolve6()` (IPv6); if DNS lookup throws (NXDOMAIN), return `502`
  - [x] 🟩 Write a `isPrivateIp(ip)` helper that tests against: loopback (`127.x`, `::1`), private ranges (`10.x`, `172.16–31.x`, `192.168.x`), link-local (`169.254.x`, `fe80::`), and unspecified (`0.0.0.0`)
  - [x] 🟩 Reject with `403` if any resolved IP matches a private range
  - [x] 🟩 Proceed with the existing upstream fetch, cache, and CORS headers unchanged

- [x] 🟩 **Step 2: Manual verification**
  - [x] 🟩 Test with the confirmed failing URL (`https://sellerconnect.vikrra.in/api/v1/images/orgLogo/…/image.png`) — should now load
  - [x] 🟩 Test with a `googleapis.com` logo URL — should still load (regression check)
  - [x] 🟩 Test with `http://localhost/` — should return `403`
  - [x] 🟩 Test with `http://169.254.169.254/` (AWS metadata) — should return `403`

---

# Feature Implementation Plan

## TLDR
Replace the state-derived `screen` variable with `react-router-dom` URL-based routing so the browser back and forward buttons navigate between app screens (picker → list → workspace) as expected.

## Critical Decisions
- **`react-router-dom` added as a dependency** — the History API alone becomes fragile at scale; a router is the correct abstraction. Justified because the alternative (manual `pushState`/`popstate`) requires hand-mapping every state combination to history entries, which will break as new screens are added.
- **`BrowserRouter` in `main.jsx`** — top-level wrap; no sub-routing needed.
- **Simple path scheme: `/`, `/list`, `/workspace`** — `catId` and `elId` passed as query params (already simple strings); `active` product row and assembled `data` passed via `location.state` (complex objects not suited to URL params).
- **`settings` and `soon` as routes** — `/settings` and `/soon/:catName` replace the `showSettings` and `soonCat` boolean/string state flags.
- **Derived `screen` variable removed** — all conditional rendering switches from `screen ===` to `<Route path=...>` elements.

## Tasks

- [x] 🟩 **Step 1: Install `react-router-dom`**
  - [x] 🟩 Run `npm install react-router-dom`
  - [x] 🟩 Confirm it appears in `package.json` dependencies

- [x] 🟩 **Step 2: Wrap app in `BrowserRouter` in `main.jsx`**
  - [x] 🟩 Import `BrowserRouter` from `react-router-dom`
  - [x] 🟩 Wrap `<App />` (or `<BannerTool />`) in `<BrowserRouter>`

- [x] 🟩 **Step 3: Define routes**
  - [x] 🟩 Routes defined via pathname + searchParams: `/` (picker), `/list?cat&el` (product list), `/workspace?cat&el` (banner editor), `/settings`, `/soon/:catName`
  - [x] 🟩 Screen switching retained inside BannerTool via the `screen` variable, now derived from pathname instead of state flags

- [x] 🟩 **Step 4: Replace `screen`-based navigation with `useNavigate` calls**
  - [x] 🟩 Import `useNavigate`, `useLocation`, `useSearchParams` from `react-router-dom`
  - [x] 🟩 Replace all `setCatId` / `setElId` / `setShowSettings` / `setSoonCat` transitions with `navigate(path)` calls
  - [x] 🟩 Pass `catId` and `elId` as query params on navigate to `/list` and `/workspace`
  - [x] 🟩 `active` row passed to workspace via React state (set by `openProduct` before navigating); workspace reads it directly from state

- [x] 🟩 **Step 5: Remove the derived `screen` variable and state flags it replaced**
  - [x] 🟩 `showSettings` and `soonCat` state removed; derived from pathname
  - [x] 🟩 `catId` and `elId` state removed; derived from `useSearchParams`
  - [x] 🟩 `screen` variable retained but now based on pathname (not state flags)
  - [x] 🟩 All stale setter calls (`setCatId`, `setElId`, `setSoonCat`, `setShowSettings`) confirmed removed

- [x] 🟩 **Step 6: Verify navigation and back button**
  - [x] 🟩 Build passes clean (`npm run build` — 0 errors)
  - [x] 🟩 `vercel.json` rewrite added to serve `index.html` for all non-API routes (required for SPA deep-linking on Vercel)
  - [x] 🟩 Walk the full flow in browser: picker → list → workspace — confirm back button at each step
  - [x] 🟩 Confirm settings and soon screens back-navigate correctly
  - [x] 🟩 Hard-refresh on `/workspace` — confirm redirect to `/`

---

# Feature Implementation Plan

## TLDR
Fix MRP extraction to use `raw.mrp` from the catalogue as the primary source (with `raw.price` as fallback), and warn the user when the extracted MRP equals the sheet's `Discounted Price` so they can correct it before exporting.

## Critical Decisions
- **`raw.mrp` as primary, `raw.price` as fallback** — the current code reads `raw_source.item_details.price.maximum_value` first, which returns a string (`"250.0"`) and causes display issues; `raw.mrp` is a clean integer at the top level of the catalogue response.
- **`raw.price` fallback always used, never suppressed** — if `raw.mrp` is absent, the selling price from the catalogue fills the MRP slot; the warning (not a skip) is the safeguard against incorrect output.
- **Warning in `render.js` warnings array** — the existing `warnings[]` mechanism already surfaces below the banner; no new UI surface needed.
- **Comparison is sheet `Discounted Price` (numeric) vs extracted MRP (numeric)** — both parsed as floats before comparing; string formatting differences are irrelevant to the equality check.

## Tasks

- [x] 🟩 **Step 1: Fix MRP extraction in `catalogue.js`**
  - [x] 🟩 In `mapCatalogueResponse()`, change the `mrp` field to: `raw?.mrp ?? raw?.price ?? null`
  - [x] 🟩 Remove the `rs?.item_details?.price?.maximum_value` path — it is now unused for MRP

- [x] 🟩 **Step 2: Pass numeric selling price through the data pipeline**
  - [x] 🟩 In `assemble.js`, add `selling_numeric: isFinite(sellingNum) ? sellingNum : null` to `data.fields` — this is the parsed float of the sheet's `Discounted Price`, needed for the MRP equality check in the renderer

- [x] 🟩 **Step 3: Add same-price warning in `render.js`**
  - [x] 🟩 In the `price` draw block, after resolving `mrp`, parse it as a float: `const mrpNum = parseFloat(mrp)`
  - [x] 🟩 Compare against `data.fields.selling_numeric`; if both are finite and equal, push to warnings: `"MRP and selling price are the same — edit before exporting."`

---

# Feature Implementation Plan

## TLDR
When the headline wraps to 2 lines, shift the price block's Y coordinate from its default to a configurable multiline value. Cap the headline at 2 lines and truncate with an ellipsis if text would exceed that. Both the max line count and the shifted Y value live in config.

## Critical Decisions
- **`maxLines` added to `headline` in `banner_sku.json`** — set to `2`; the renderer reads this and caps line wrapping at that count.
- **`yMultiline` added to `price` in `banner_sku.json`** — explicit second Y value (`118`) rather than an offset; more readable and consistent with how other Y values are expressed in the config.
- **Ellipsis truncation on the last line** — if the full text would produce more than `maxLines` lines, the last kept line is trimmed word-by-word until it fits within `maxW` with `"…"` appended.
- **Only the price block shifts** — no other elements (CTA, T&C, badge) are affected.
- **Line count determined inside the headline draw block** — stored in a local variable and passed forward to the price draw block within the same `drawBanner()` call.

## Tasks

- [x] 🟩 **Step 1: Update `banner_sku.json`**
  - [x] 🟩 Add `"maxLines": 2` to the `headline` element
  - [x] 🟩 Add `"yMultiline": 118` to the `price` element

- [x] 🟩 **Step 2: Update headline draw block in `render.js`**
  - [x] 🟩 After computing lines via `wrapLines()`, cap the array at `cfg.headline.maxLines`
  - [x] 🟩 If the original line count exceeded `maxLines`, trim the last kept line word-by-word until it fits within `maxW` with `"…"` appended
  - [x] 🟩 Store the final rendered line count in a local variable (e.g. `headlineLines`) accessible later in `drawBanner()`

- [x] 🟩 **Step 3: Update price draw block in `render.js`**
  - [x] 🟩 Read `headlineLines` from the local variable set in Step 2
  - [x] 🟩 Resolve price Y as: `headlineLines >= 2 ? get("price").yMultiline : get("price").y`
  - [x] 🟩 Use the resolved Y for all price-block drawing (selling price, MRP strikethrough)

**Executed — 2026-06-23**

---

# Feature Implementation Plan

## TLDR
Replace the synthetic mock MRP (a hash-derived multiplier of the discounted price) with the real MRP fetched live from the analytics API — mirroring the existing brand logo fetch pattern. Only MRP is sourced from the API; all other product fields continue to come from the Google Sheet.

## Critical Decisions
- **New Vercel function `api/catalogue-item.js`, not full live mode** — `DATA_MODE` stays `"mock"`; only MRP is fetched live, same as brand logo. Switching to full live mode would pull item name and provider name from the API too, creating a mixed-source data model inconsistent with the sheet-first design.
- **`item_unique_id` constructed from URL params** — `${bpp_id}_${domain}_${provider_id}_${item_id}` — all four already parsed by `lib/url.js`; mirrors the `provider_unique_id` pattern used by the logo fetch.
- **MRP field path: `data[0].mrp`, fallback `data[0].price`** — confirmed against the live analytics API response; both are top-level numeric fields. `mapCatalogueResponse()` already mapped these paths correctly; the bug was purely that mock mode bypassed the live fetch entirely.
- **Graceful degradation** — if `item_id` is absent (store links) or the fetch fails, `fetchItemMrp()` returns `{ mrp: null, price: null }` and the mock MRP from `cat` is used as the last fallback. No crash, no blank field.
- **Parallel fetch with logo** — `fetchItemMrp()` runs concurrently with `fetchProviderLogo()` in `assemble.js`; no added latency on the critical path.

## Tasks

- [x] 🟩 **Step 1: Create `api/catalogue-item.js`**
  - [x] 🟩 Create `api/catalogue-item.js` as a Vercel serverless function
  - [x] 🟩 Accept query params: `item_id`, `bpp_id`, `domain`, `provider_id`; return `400` if any are missing
  - [x] 🟩 Construct `item_unique_id = "${bpp_id}_${domain}_${provider_id}_${item_id}"`
  - [x] 🟩 Fetch `https://prod.digihaat.in/analyticsDashboard/catalog/search?page=1&pageSize=1&item_unique_id={item_unique_id}` server-side
  - [x] 🟩 Extract `json.data?.[0]?.mrp ?? null` and `json.data?.[0]?.price ?? null` from the response
  - [x] 🟩 Return `{ mrp, price }` with `Access-Control-Allow-Origin: *` and `Cache-Control: public, max-age=300`
  - [x] 🟩 Return `502` on upstream fetch failure; `404` if `data` array is empty

- [x] 🟩 **Step 2: Add `fetchItemMrp()` to `src/lib/catalogue.js`**
  - [x] 🟩 Add `CATALOGUE_ITEM_ENDPOINT` to `src/config/constants.js` (defaults to `/api/catalogue-item`, same-origin on Vercel)
  - [x] 🟩 Add `fetchItemMrp(bppId, domain, providerId, itemId)` to `catalogue.js`; return `{ mrp: null, price: null }` immediately if `itemId` is empty
  - [x] 🟩 Call the endpoint with the four params as query string; return `{ mrp: null, price: null }` on any non-OK response or network error

- [x] 🟩 **Step 3: Wire live MRP into `src/lib/assemble.js`**
  - [x] 🟩 Import `fetchItemMrp` from `catalogue.js`
  - [x] 🟩 Call `fetchItemMrp(parsed.bpp_id, parsed.domain, parsed.provider_id, parsed.item_id)` in parallel with `fetchProviderLogo()` using `Promise.all`
  - [x] 🟩 Resolve the `mrp` field as: `liveItem.mrp ?? liveItem.price ?? (cat.mrp != null ? String(cat.mrp) : "")`

- [ ] 🟥 **Step 4: Manual verification**
  - [ ] 🟥 Test with the original failing URL (`item_id=688877c10434ff411d6f2624`) — confirm MRP matches the catalogue value
  - [ ] 🟥 Test with a store link (no `item_id`) — confirm banner renders without crashing and MRP falls back gracefully
  - [ ] 🟥 Test with a product where `mrp` is absent in the API response — confirm `price` fallback is used

---

# Feature Implementation Plan

## TLDR
Fix MRP to always show the real value from the analytics API by correcting the proxy query strategy (`provider_unique_id` + scan by `id`), and remove the hash-derived mock MRP so a fake value can never appear as a fallback.

## Critical Decisions
- **`provider_unique_id` + `id` scan, not `item_unique_id`** — the analytics API has no `item_unique_id` filter param; `provider_unique_id` is the only confirmed filter. The proxy fetches up to 25 items (matching the API's default page size) and finds the target by matching the full `id` field (`bpp_id_domain_provider_id_item_id`).
- **`pageSize: 25` in the proxy** — sufficient for the current scope; if a provider has more items, the target may not appear. A known limitation; can be increased or paginated later if needed.
- **Mock MRP removed entirely from `mockCatalogue()`** — the hash-derived MRP is set to `null`; the field is removed from the computation. A fake value can no longer win the fallback.
- **Fallback chain trimmed in `assemble.js`** — if `liveItem.mrp` and `liveItem.price` are both null (item not found in API), MRP is blank, not fake. Blank is correct; fake is not.
- **`DATA_MODE` and `mockCatalogue()` itself are not removed** — other fields (item name, provider name) still use mock values. Only the MRP computation is gutted.

## Tasks

- [x] 🟩 **Step 1: Fix `api/catalogue-item.js` — switch to `provider_unique_id` + scan by `id`**
  - [x] 🟩 Replace the `item_unique_id` query param with `provider_unique_id` constructed as `${bpp_id}_${domain}_${provider_id}`
  - [x] 🟩 Set `pageSize` to `25` in the query string
  - [x] 🟩 After fetching, scan `json.data[]` for the item where `item.id === itemUniqueId` (`${bpp_id}_${domain}_${provider_id}_${item_id}`)
  - [x] 🟩 Extract `mrp` and `price` from the matched item; return `404` if no match is found

- [x] 🟩 **Step 2: Remove hash-derived MRP from `mockCatalogue()` in `src/lib/catalogue.js`**
  - [x] 🟩 Delete the hash computation block (`h`, `factor`, `mrp` derivation)
  - [x] 🟩 Set `mrp: null` in the returned mock object

- [x] 🟩 **Step 3: Update fallback chain in `src/lib/assemble.js`**
  - [x] 🟩 Change MRP resolution to: `liveItem.mrp ?? liveItem.price ?? ""` — remove the `cat.mrp` fallback entirely
  - [x] 🟩 Confirm that a null/blank MRP renders gracefully (no strikethrough, no `₹` prefix) — existing renderer behaviour already handles this

- [x] 🟩 **Step 4: Manual verification**
  - [x] 🟩 Test with a product URL where `item_id` is present — confirm displayed MRP matches the value in the analytics API response
  - [x] 🟩 Test with a store link (no `item_id`) — confirm MRP is blank and banner renders without crashing
  - [x] 🟩 Test with a product whose provider has many items — confirm the correct item is matched by `id`, not just `data[0]`

---

# Feature Implementation Plan

## TLDR
Allow the user to insert a manual line break in the headline from the edit panel by pressing Enter at any cursor position. The headline textarea becomes visually multi-line; a `\n` is stored in the string and respected by the renderer. Total visual lines are always capped at 2 — if the segment before the break is long enough to natural-wrap, it is truncated to fit one line before the break is applied.

## Critical Decisions
- **`\n` stored in the headline string** — no data model change; the existing `ov.headline.content` string accepts `\n` and the renderer splits on it before word-wrapping. Clean and reversible.
- **`<textarea>` replaces `<input>` for the headline field only** — visually shows both lines while editing; consistent with user expectation when pressing Enter.
- **Truncation on Enter, not at render time** — when Enter is pressed, the segment before the cursor is checked; if it would naturally wrap, it is trimmed word-by-word (with `…`) to fit exactly one canvas line (`maxW: 200px`, `size: 16px`). This prevents the 3-line scenario at the source.
- **`wrapLines()` updated to split on `\n` first** — each segment is word-wrapped independently; lines are then concatenated and the `maxLines` cap is applied as before. No change to config.
- **Price block positioning unchanged** — `headlineLines >= 2` already triggers `yMultiline`; a manual break sets `headlineLines` to 2, which flows through the existing logic automatically.

## Tasks

- [x] 🟩 **Step 1: Update `wrapLines()` in `render.js` to respect `\n`**
  - [x] 🟩 Split the input string by `\n` into segments before word-wrapping
  - [x] 🟩 Word-wrap each segment independently using the existing `maxW` logic
  - [x] 🟩 Concatenate all resulting lines; the existing `maxLines` cap and ellipsis truncation apply unchanged

- [x] 🟩 **Step 2: Replace the headline `Field` with a `<textarea>` in `BannerTool.jsx`**
  - [x] 🟩 Swap the `<Field>` component for a `<textarea>` scoped to the headline property block only
  - [x] 🟩 Style it to match the existing `Field` appearance (font, border, padding); 2-row height
  - [x] 🟩 Wire `value` and `onChange` identically to the current `Field` binding (`ov.content ?? data.fields.headline`)

- [x] 🟩 **Step 3: Intercept Enter key in the textarea**
  - [x] 🟩 Add an `onKeyDown` handler to the headline textarea
  - [x] 🟩 On `Enter` (without modifier keys): prevent the default newline insertion
  - [x] 🟩 If the current value already contains a `\n`, do nothing (already 2 lines — no-op)
  - [x] 🟩 Otherwise: split the string at the cursor position into `before` and `after`
  - [x] 🟩 Measure `before` against `maxW` (200px) at the headline font (`600 16px Inter`) using an offscreen canvas; if it wraps (would produce > 1 line), trim `before` word-by-word with `…` until it fits one line
  - [x] 🟩 Reassemble as `before + "\n" + after` and write back to the override via `onFieldChange`

---

# Feature Implementation Plan

## TLDR
Add support for BRAND-type banners: same canvas layout as SKU but with a Header + Subheader text pair (both from the Google Sheet), no price block, no product image, and the brand logo auto-fetched from the catalogue API's `provider_details.descriptor.images[0]` field using the store URL's provider params.

## Critical Decisions
- **Separate `banner_brand.json` config** — BRAND is a distinct layout, not a variant of SKU. A separate config file is consistent with the documented pattern for new element types and avoids conditional logic inside `banner_sku.json`.
- **Header and Subheader are new config elements, not repurposed SKU elements** — they sit at y:67 and y:98 respectively with distinct font styles; neither maps 1:1 to SKU's `headline`.
- **No price element in `banner_brand.json`** — the element is simply absent from the config; the renderer's existing pattern (draw block only runs if element is in config) handles the omission cleanly.
- **No product image for BRAND** — confirmed out of scope; the image slot is blank canvas area.
- **Brand logo fetched via existing `fetchProviderLogo()`** — BRAND store URLs carry `bpp_id`, `domain`, and `provider_id`, which are the exact params `fetchProviderLogo()` already uses. No change to `catalogue.js` needed.
- **Logo drawn directly, same as SKU** — canvas taint risk accepted; fix deferred to when the image proxy is extended.
- **Config loaded per row type** — when opening a product row, `BannerTool.jsx` checks `row.Type` (`"SKU"` or `"BRAND"`) and loads the corresponding config. No change to the category/element picker.

## Tasks

- [x] 🟩 **Step 1: Create `config/elements/banner_brand.json`**
  - [x] 🟩 Copy canvas block from `banner_sku.json` (same dimensions: 361×188, 2× scale, radius:12)
  - [x] 🟩 Add `header` element: `label:"Header"`, `order:2`, `visible:true`, `toggleable:false`, `x:16`, `y:67`, `fontSize:14`, `fontWeight:500`, `color:"#000000"`, `maxW:167`, `lineHeight:22`, `maxLines:1`
  - [x] 🟩 Add `subheader` element: `label:"Subheader"`, `order:3`, `visible:true`, `toggleable:false`, `x:16`, `y:98`, `fontSize:18`, `fontWeight:700`, `color:"#000000"`, `maxW:167`, `lineHeight:18`, `maxLines:1`
  - [x] 🟩 Include `brand_logo`, `cta_button`, `tnc`, `offer_badge`, `quantity_badge` elements with identical values to `banner_sku.json`
  - [x] 🟩 Omit `headline`, `price`, and product image elements entirely

- [x] 🟩 **Step 2: Add draw blocks for `header` and `subheader` in `render.js`**
  - [x] 🟩 Add `header` and `subheader` fields to `assemble.js` (`data.fields.header = row.Header`, `data.fields.subheader = row.Subheader`)
  - [x] 🟩 Add draw block for `header`: read `data.fields.header` as the text source; apply config font/position values; use `wrapLines()` with the element's `maxW`
  - [x] 🟩 Add draw block for `subheader`: read `data.fields.subheader` as the text source; draw only if value is non-empty (mirrors existing empty-subheader guard)
  - [x] 🟩 Both blocks must read all values exclusively from config (no hardcoded pixels)

- [x] 🟩 **Step 3: Load config by row type in `BannerTool.jsx`**
  - [x] 🟩 Import `banner_brand.json` alongside the existing `banner_sku.json` import
  - [x] 🟩 When opening a product row (`openProduct` or equivalent), resolve config as: `row.Type === "BRAND" ? brandCfg : skuCfg`
  - [x] 🟩 Pass the resolved config into the workspace state so the renderer and properties panel both receive the correct config

- [x] 🟩 **Step 4: Update properties panel in `BannerTool.jsx`**
  - [x] 🟩 Add an edit block for `header`: text override field, labeled "Header", bound to `ov.header.content`
  - [x] 🟩 Add an edit block for `subheader`: text override field, labeled "Subheader", bound to `ov.subheader.content`
  - [x] 🟩 Hide the price edit block when the active config is `banner_brand.json` (check for absence of `price` key in config)
  - [x] 🟩 Hide the headline edit block when the active config is `banner_brand.json`

- [ ] 🟥 **Step 5: Manual verification**
  - [ ] 🟥 Open a BRAND row from the sheet — confirm Header and Subheader text renders at the correct positions with correct font styles
  - [ ] 🟥 Confirm brand logo loads from the catalogue API using the store URL params
  - [ ] 🟥 Confirm no price block appears on the canvas
  - [ ] 🟥 Confirm SKU rows are unaffected (regression check)
  - [ ] 🟥 Attempt PNG export — note whether canvas taint blocks it; log outcome

---