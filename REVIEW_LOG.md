# Review Log — Digihaat In-App Banner Automation Tool

---
## Review: Full Codebase Audit (Baseline)
**Date:** 2026-06-16
**Touched files:** All files reviewed (baseline pass)
- `src/main.jsx`, `src/App.jsx`
- `src/components/BannerTool.jsx`
- `src/components/atoms/Field.jsx`, `NumField.jsx`, `Toggle.jsx`, `Chevron.jsx`, `UploadBtn.jsx`, `EmptyCard.jsx`
- `src/components/tokens.js`
- `src/config/constants.js`, `src/config/categories.js`
- `src/config/elements/banner_sku.json`
- `src/lib/sheet.js`, `url.js`, `catalogue.js`, `assemble.js`, `render.js`
- `src/assets/fonts/inter.css`
- `package.json`, `vite.config.js`, `index.html`

### Findings

#### 🔴 Critical (fix before next feature)
- ✅ [render.js:70] — Hardcoded color `#B9AE9C` for background placeholder text. Violates the core architectural rule: all visual values must live in config. Should be `cfg.canvas.placeholderTextColor` in `banner_sku.json`. — fixed 2026-06-16
- ✅ [render.js:91] — Hardcoded color `#222` for brand logo text placeholder. Same violation. Should be `cfg.elements.brand_logo.placeholderTextColor` in `banner_sku.json`. — fixed 2026-06-16

#### 🟡 Warning (fix soon, not blocking)
- ✅ [render.js:131,185] — Magic numbers `0.32` and `0.55` used as vertical scale offsets for strikethrough position and quantity badge text. No comment explaining their derivation. One change to font size would silently break both. — fixed 2026-06-16
- ✅ [src/config/constants.js:8] — `SHEET_ID` is a hardcoded live sheet ID. Low risk now (read-only), but must move to `VITE_SHEET_ID` before write-back (PLAN.md Step 11) to avoid leaking a writable credential. — fixed 2026-06-16
- ✅ [src/lib/sheet.js:throughout] — No validation that a parsed CSV row has the expected number of fields. Malformed rows with missing columns silently produce sparse objects that flow into the renderer. — fixed 2026-06-16
- ✅ [src/components/atoms/NumField.jsx:10] — `parseFloat` on change emits `NaN` for non-numeric input (e.g. typing `-`). `NaN` propagates into overrides and into canvas draw calls without guard. — fixed 2026-06-16
- ⏸️ [src/components/BannerTool.jsx:throughout] — 420-line monolith handling navigation, data fetching, canvas redraw, and 12 state hooks. Untestable as a unit. Should split into `ProductList`, `CanvasArea`, `PropertiesPanel`, and `Workspace` after current milestone. — deferred 2026-06-16 (working as-is; refactor after milestone)
- ⏸️ [No test files found] — Zero test coverage. Complex edge-case logic in `render.js`, `assemble.js`, `catalogue.js`, and `sheet.js` is entirely untested. Regressions on non-numeric prices, store links, missing MRPs, and empty headlines are undetectable. — deferred 2026-06-16 (significant setup effort; revisit after milestone)

#### 🔵 Note (low priority / informational)
- ✅ [src/config/constants.js:9] — `DATA_MODE` and `CATALOGUE_ENDPOINT` are hardcoded constants, not env vars. This is intentional for the mock-first prototype; note this for when switching to live mode (PLAN.md Step 10). — accepted 2026-06-16 (intentional; `.env.example` now documents both for when they move)
- ✅ [src/assets/fonts/inter.css] — Font file is TTF, not WOFF2. WOFF2 would reduce ~160KB → ~50KB. Not urgent for an internal tool but worth converting before any public-facing deployment. — accepted 2026-06-16 (no-code asset conversion; revisit before public deploy)
- ✅ [src/components/BannerTool.jsx] — No React Error Boundary. A thrown error in any sub-tree crashes the whole app with a blank screen. Low risk given the narrow user base; add before rolling out to more team members. — fixed 2026-06-16
- ✅ [index.html:7] — `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` is present but Jost and JetBrains Mono are never explicitly imported in CSS. They appear to be expected from CDN but no `@import` or `<link>` loads them. Verify these fonts actually load in production. — fixed 2026-06-16
- ✅ [src/lib/sheet.js:5–28] — `SAMPLE_ROWS` contains real marketing data (offer names, live URLs) hardcoded as a fallback. This is intentional and documented, but note that any change to the sheet schema (column names, order) requires updating this block manually. — accepted 2026-06-16 (intentional pattern; column validation warning added in Warning 3 will surface schema drift)
- ✅ [src/lib/catalogue.js:35] — MRP generation multiplier `1.40–2.19×` (hash-derived) is undocumented. The bounds are reasonable but not explained. A comment with rationale would prevent confusion when someone edits this in future. — fixed 2026-06-16

#### ✅ Clean
- **Security** — No secrets, API keys, or credentials in source. `.env` is gitignored. No user input flows into eval or raw fetch URLs. Canvas-taint on export is correctly caught and surfaced to the user. No XSS vectors in the render pipeline.
- **Architectural rule compliance** — With the two exceptions in render.js (🔴 above), the renderer is fully config-driven. All positional and size values read from `banner_sku.json`. No hardcoded pixel coordinates in draw calls.
- **Data flow** — Sheet → URL → Catalogue → Assemble → Renderer chain is intact. No shortcutting; each layer is independent.
- **Font loading** — `document.fonts.ready` guard correctly prevents text draw before Inter resolves. Cancellation guard on unmount is present.
- **Non-numeric price handling** — `selling_is_numeric` flag in `assemble.js` correctly preserves string prices ("Starting at Rs. 50") without coercing them.
- **Store link handling** — `parseProductUrl` correctly sets `isStore: true` and short-circuits catalogue fetch for store URLs.
- **Empty headline** — Renderer draws nothing for empty headline; does not crash or skip the whole banner.
- **Canvas export** — `exportAs` catches canvas-taint exception and surfaces a user-readable message.
- **useMemo on filtered list** — Product list filtering is memoized; no re-computation on unrelated state changes.
- **Bundle hygiene** — No `import *` patterns. No new npm dependencies beyond React. No unused imports found.
- **Design system** — UI colors reference `T` tokens throughout. Spacing uses 4px grid. Motion uses 150ms ease-out. Sidebar matches spec.

**All actionable issues resolved — 2026-06-16** (2 items deferred by choice: component split ⏸️, test coverage ⏸️)

### Drift check (full codebase)
- [render.js:70,91] — Two hardcoded color values (`#B9AE9C`, `#222`) violate the no-hardcoded-values rule. Already logged as 🔴 Critical above.
- [render.js:131,185] — Two undocumented magic scale factors. Already logged as 🟡 Warning above.
- No `import *` patterns detected.
- No untracked `VITE_*` env variable references found beyond `VITE_SHEET_ID`, `VITE_DATA_MODE`, `VITE_CATALOGUE_ENDPOINT` (all present in `.env.example`).
- No undeclared dependencies in `package.json`.

---
## Review: Image Proxy Domain Fix
**Date:** 2026-06-18
**Touched files:** `api/proxy-image.js`

### Findings

#### 🔴 Critical (fix before next feature)
- None.

#### 🟡 Warning (fix soon, not blocking)
- [api/proxy-image.js:46,64] — **TOCTOU / DNS rebinding gap.** The DNS IP check (line 46) and the `fetch()` call (line 64) are separate steps with a time gap between them. A DNS server configured with a very short TTL could return a safe public IP during the check and a private IP during the actual fetch — bypassing the SSRF protection. This is a known attack class called DNS rebinding. Risk is near-zero for a 3–4 person internal tool (requires controlling a DNS server), but the vulnerability is architectural. The correct fix is to resolve the hostname to an IP once, then construct the fetch URL using that IP directly (with the `Host` header preserved). Deferred until threat model grows.
- ✅ [api/proxy-image.js:64] — **No timeout on upstream `fetch()`.** If a provider's image server hangs, the Vercel function waits silently until the platform kills it (10s on Hobby tier). From the user's perspective the logo never loads and no error appears — the UI stays in "Loading brand logo…" state indefinitely. Adding `AbortSignal.timeout(8000)` to the fetch call would cap the wait and surface a clean 502 error instead. — fixed 2026-06-18

#### 🔵 Note (low priority / informational)
- ✅ [api/proxy-image.js:75] — **Content-Type is not validated before proxying.** If an upstream URL accidentally serves HTML or a redirect to non-image content, the proxy returns it with the wrong Content-Type. The browser silently fails to render it as an image and `img.onerror` fires — so UX degrades gracefully. No security risk; just a potential source of confusing "logo could not be loaded" errors that are actually content-type mismatches. — fixed 2026-06-18
- ✅ [api/proxy-image.js:10] — **`0.0.0.0/8` block is only partially covered.** The regex `/^0\.0\.0\.0/` matches `0.0.0.0` but not `0.1.2.3` through `0.255.255.255`. No practical SSRF uses these addresses; negligible real-world risk. Changing the regex to `/^0\./` would be complete. — fixed 2026-06-18

#### ✅ Clean
- **Security (no new secrets)** — No credentials, API keys, or hardcoded URLs introduced. No user input flows into `eval` or unvalidated fetches.
- **Env variables** — No new `VITE_*` references. All four existing VITE_ vars remain documented in `.env.example`.
- **Architecture** — No render functions, config reads, or ProductData access. File scope is correctly limited to the proxy layer.
- **Bundle hygiene** — No new npm packages. `dns` is a Node.js built-in. No `import *` patterns. No unused imports.
- **Code hygiene** — No `console.log` or debug statements. No TODO comments. No hardcoded category or element names.

### Drift check (full codebase)
- No new `import *` patterns detected in `src/`.
- No untracked `VITE_*` env variable references. `VITE_IMAGE_PROXY_ENDPOINT` and `VITE_PROVIDER_LOGO_ENDPOINT` (added in the prior feature) are both present in `.env.example`.
- No new entries in `package.json`.
- No hardcoded pixel values or colors in any render function.

**All actionable issues resolved — 2026-06-18** (Warning 1 / TOCTOU gap deferred by choice ⏸️)

---
## Review: MRP Extraction Fix
**Date:** 2026-06-23
**Touched files:** `src/lib/catalogue.js`, `src/lib/assemble.js`, `src/lib/render.js`

### Findings

#### 🔴 Critical (fix before next feature)
- None.

#### 🟡 Warning (fix soon, not blocking)
- None.

#### 🔵 Note (low priority / informational)
- [assemble.js:8,20] — `selling_numeric` is extracted via `parseFloat(sellingRaw.replace(/[^\d.]/g, ""))` for all rows, including those where `selling_is_numeric` is false (e.g. "Starting at Rs. 50" → `selling_numeric = 50`). If the catalogue MRP is also 50, the warning fires even though the banner displays a string price, not "₹50". The warning message ("MRP and selling price are the same") is technically misleading in this case. Low real-world frequency for grocery SKU banners.
- [render.js:120-124] — The same-price warning fires on `ov.price.mrp` overrides too, since `mrp` resolves the override first. If a user intentionally sets MRP to match selling price (legitimate no-discount scenario), the warning cannot be dismissed — there is no suppress/acknowledge mechanism. No fix needed now; worth noting if the team finds the warning noisy.
- [catalogue.js:28-29] — `mrp` and `selling_api` both fall back to `raw.price` when `raw.mrp` is null. In that case both fields carry the same value, and the same-price warning fires correctly. No bug — noting the coupling so it's not a surprise when debugging fallback cases.

#### ✅ Clean
- **Security** — No new secrets, API keys, or user-controlled input flows. No new fetch calls.
- **Architecture** — No hardcoded pixel values, colors, or layout numbers. No component reading raw API fields directly. Data flow chain intact.
- **Performance** — No new render-time blocking operations. `parseFloat` calls are trivially fast.
- **Bundle hygiene** — No new npm packages. No new imports. No `import *` patterns.
- **Code hygiene** — No `console.log` or debug statements. No TODO comments. No untracked env variables.
- **Env variables** — No new `VITE_*` references. All existing variables remain documented in `.env.example`.

### Drift check (full codebase)
- No new hardcoded pixel values or colors in any render function.
- No new `import *` patterns in `src/`.
- No untracked `VITE_*` env variable references.
- No new entries in `package.json`.

**All actionable issues resolved — 2026-06-23** (3 Notes accepted; all low-frequency edge cases or future UX considerations)

---
## Review: Headline Multiline Cap + Price Y Shift
**Date:** 2026-06-23
**Touched files:** `src/config/elements/banner_sku.json`, `src/lib/render.js`

### Findings

#### 🔴 Critical (fix before next feature)
- None.

#### 🟡 Warning (fix soon, not blocking)
- None.

#### 🔵 Note (low priority / informational)
- [render.js:126] — If a future banner config omits `yMultiline` from its `price` element, `priceY` resolves to `undefined`, `baseline` becomes `NaN`, and all price drawing silently fails (canvas ignores NaN coordinates — no error thrown). A one-line guard `e.yMultiline ?? e.y` would make this safe for extension. Only matters when new banner types are added.
- [render.js:110] — When the last capped line reduces to a single word that still exceeds `maxW`, it renders as `"word…"` regardless of overflow width. The loop exits on `words.length === 1` unconditionally. Not a real-world concern for grocery product headline lengths, but character-level truncation would be needed to fully handle it.

#### ✅ Clean
- **Security** — No secrets, API keys, or credentials. No user-controlled input flows into eval or raw fetch URLs. `ctx.fillText` is safe.
- **Architecture** — `maxLines` and `yMultiline` live in config, not in the renderer. `headlineLines` is a local variable scoped to `drawBanner()`; no state leakage. No direct API/sheet reading. Visible/toggleable pattern untouched.
- **Performance** — Truncation loop calls `ctx.measureText()` per word on the last line only, bounded by word count of a single headline. Negligible at render scale.
- **Bundle hygiene** — No new npm packages. No new imports. No `import *` patterns. No new font weights.
- **Code hygiene** — No `console.log` or debug statements. No TODO comments. No hardcoded category names or element names outside config.
- **Env variables** — No new `VITE_*` references.

### Drift check (full codebase)
- No new hardcoded pixel values or colors in any render function.
- No new `import *` patterns in `src/`.
- No untracked `VITE_*` env variable references.
- No new entries in `package.json`.

**All actionable issues resolved — 2026-06-23** (2 Notes accepted; both low-frequency edge cases relevant only at future extension time)

---
## Review: Manual Headline Line Breaks
**Date:** 2026-06-29
**Touched files:** `src/lib/render.js`, `src/components/BannerTool.jsx`

### Findings

#### 🔴 Critical (fix before next feature)
- None.

#### 🟡 Warning (fix soon, not blocking)
- ✅ [BannerTool.jsx:146] — Enter handler does not check modifier keys. Resolved: Shift+Enter now inserts the line break; plain Enter saves and blurs; Ctrl/Alt/Meta+Enter are ignored. — fixed 2026-06-29

#### 🔵 Note (low priority / informational)
- [BannerTool.jsx:155] — `fontStr` in the Enter handler manually duplicates the `font()` helper string from `render.js` (`"${weight} ${size}px Inter, system-ui, sans-serif"`). `font()` is unexported so duplication was forced. If the font fallback stack ever changes, it must be updated in two places.
- [render.js:29] — An empty segment (cursor at position 0, Enter pressed) pushes `""` as a line, consuming one of the two available slots and rendering blank vertical space on the canvas. Current guard is `if (!words.length) { lines.push(""); continue; }` — changing it to `continue` (no push) would silently drop the blank line. No crash either way; noting for awareness.

#### ✅ Clean
- **Security** — No secrets, API keys, or credentials. No user-controlled input flows into eval or raw fetch URLs. `ctx.fillText` is safe; offscreen canvas used only for measurement.
- **Architecture** — No hardcoded pixel values or colors in the renderer. Config values (`maxW`, `weight`, `size`) are read from `BANNER_SKU_CONFIG.elements.headline` at handler time, not hardcoded. Price block Y-switching (`yMultiline`) is handled by the existing `headlineLines >= 2` logic — no change required.
- **Performance** — Offscreen canvas is created on Enter keypress only (a rare user action), not on every keystroke. No change to the onChange→redraw path.
- **Bundle hygiene** — No new npm packages. No new imports. No `import *` patterns. No new font weights.
- **Env variables** — No new `VITE_*` references.
- **Code hygiene** — No `console.log` or debug statements. No TODO comments. No hardcoded category or element names outside config.

### Drift check (full codebase)
- No new hardcoded pixel values or colors in any render function.
- No new `import *` patterns in `src/`.
- No untracked `VITE_*` env variable references.
- No new entries in `package.json`.
