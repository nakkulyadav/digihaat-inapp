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
