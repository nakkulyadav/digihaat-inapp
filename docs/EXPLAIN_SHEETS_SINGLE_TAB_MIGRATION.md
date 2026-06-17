# Feature Explanation: Google Sheets Single-Tab / Category Column Migration
**Date:** 2026-06-17
**Files touched:**
- `src/config/constants.js`
- `.env.example`
- `src/config/categories.js`
- `src/lib/sheet.js`
- `src/components/BannerTool.jsx`

---

## What we built

Previously, the tool expected each product category (Grocery, Swadeshi, Electronics, etc.) to live on its own separate tab inside the Google Sheet, identified by a unique tab ID called a GID. We changed the tool so that all categories live on a single tab, with a new column called "Category" that tells the tool which category each row belongs to. The full sheet is now loaded once when the tool starts, and rows are sorted into their correct category in memory — no extra network requests needed when switching between categories.

---

## Files changed

### `src/config/constants.js`
**What this file does in the project:**
This file is the single place where environment variables (values that live outside the code in a `.env` file) are read and exported as named constants the rest of the app can import.

**What changed and why:**
We added one new constant: `SHEET_GID`. It reads the value of `VITE_SHEET_GID` from the environment, and if that variable is not set, it falls back to `"0"`.

```
export const SHEET_GID = import.meta.env.VITE_SHEET_GID ?? "0";
```

`"0"` is the GID (tab identifier) of the first/default tab in any Google Sheet — so if you never set `VITE_SHEET_GID` in your `.env`, the tool will point at the first tab automatically. This default was chosen because for most single-sheet setups, the data will live on the first tab.

This is where `SHEET_ID` (the document ID) already lived, so keeping `SHEET_GID` here is consistent — all sheet configuration is in one file.

**The part most likely to confuse you later:**
The `??` operator (called the "nullish coalescing" operator) means "use the right-hand value only if the left-hand value is null or undefined." It is NOT the same as `||`. If `VITE_SHEET_GID` is set to `""` (an empty string), `??` would still use `""`, while `||` would fall back to `"0"`. We used `??` intentionally — an explicitly empty string in `.env` is unusual and probably an error, so defaulting to `"0"` in that case is acceptable. If the GID is set correctly in `.env`, none of this matters.

---

### `.env.example`
**What this file does in the project:**
This is a safe template that documents what environment variables the app needs. Developers copy it to a real `.env` file and fill in actual values. The real `.env` is never committed to version control because it contains credentials. `.env.example` is safe to share and commit.

**What changed and why:**
We added a new entry, `VITE_SHEET_GID=0`, with a comment explaining what it is and where to find the value. The comment points to the sheet URL: the GID is the number that appears after `#gid=` when you click on a tab in Google Sheets.

The default value in `.env.example` is `0` — matching the fallback in `constants.js` — so if someone sets up the project fresh and forgets to update this, the tool will still attempt to read the first tab rather than crashing.

**The part most likely to confuse you later:**
Nothing non-obvious here. This file is documentation, not logic.

---

### `src/config/categories.js`
**What this file does in the project:**
This file defines the list of categories the tool knows about (Grocery, Swadeshi, Electronics, etc.) and which element types (Banner, Masthead, Widget) belong to each category.

**What changed and why:**
We removed the `gid` field from every entry in the `CATEGORIES` array. Previously each category had its own GID pointing to its own sheet tab:

```js
// Before
{ id: "grocery", label: "Grocery", gid: "0", enabled: true }

// After
{ id: "grocery", label: "Grocery", enabled: true }
```

The GID no longer lives per-category because there is no longer one tab per category. There is one tab for everything. The single GID for that tab lives in `constants.js` as `SHEET_GID`.

**The part most likely to confuse you later:**
If you look at Git history and see the `gid` field was removed, you might wonder if it was an accident. It was intentional — the concept of a per-category GID no longer exists in this architecture. The GID is now a single value shared across all categories.

---

### `src/lib/sheet.js`
**What this file does in the project:**
This file is responsible for fetching the Google Sheet as a CSV file and turning that raw text into a list of row objects the rest of the app can work with. It also holds `SAMPLE_ROWS` — a hardcoded set of real rows used as a fallback when the live sheet cannot be reached.

**What changed and why:**

**1. `fetchSheet()` no longer takes a `gid` argument.**
Previously the function was called as `fetchSheet(category.gid)` — you passed in which tab to fetch. Now it is called as `fetchSheet()` with no argument. Internally it uses `SHEET_GID` from `constants.js` to build the URL. This change means the function is simpler to call and there is no risk of accidentally passing the wrong GID.

**2. The CSV parser now reads a `Category` column.**
Inside `rowsFromCsv()`, the function that turns raw CSV text into row objects, we added `Category` to the list of columns the function looks for:

```js
iCat = idx("Category");
```

Each row object now includes `Category: c[iCat] || ""`. If the column is missing from the sheet (for example, in an older version of the sheet), the value defaults to an empty string and a warning is logged to the console — the app does not crash.

**3. Every row in `SAMPLE_ROWS` now has a `Category` field.**
`SAMPLE_ROWS` is the bundled offline fallback — 22 real rows from the live sheet. Before this change, none of them had a `Category` field. After this change, all of them have `Category: "Grocery"` because all the sample rows are grocery products.

This matters because the new filtering logic (explained in the `BannerTool.jsx` section below) checks `row.Category` to decide which rows belong to which category. If `SAMPLE_ROWS` had no `Category` field, the offline fallback would show zero rows in the product list — a confusing and silent failure.

**The part most likely to confuse you later:**
`SAMPLE_ROWS` is hardcoded with `Category: "Grocery"` on every row. If you ever add sample rows for other categories (Swadeshi, Electronics, etc.) for testing, you will need to set `Category` correctly on each one. A row with `Category: ""` will never appear in any category's product list.

---

### `src/components/BannerTool.jsx`
**What this file does in the project:**
This is the main UI component — the entire tool lives here. It manages all the state (what category is selected, what rows are loaded, what product is open in the workspace) and renders everything the user sees.

**What changed and why:**

**1. The sheet is now fetched once when the tool loads, not each time the user selects an element.**
Previously, fetching the sheet happened inside a `useEffect` (a piece of code that runs in response to something changing) that was triggered every time the user picked a different element type (e.g. switching from "Banner" to "Masthead"). This meant the sheet was re-fetched from Google's servers on every element selection.

Now, the fetch happens in a `useEffect` with no trigger conditions — it runs exactly once when the component first appears on screen. The full result is stored in a new piece of state called `allRows`.

```js
// New: fetch once on mount, store everything
const [allRows, setAllRows] = useState([]);

useEffect(() => {
  ...
  fetchedData = await fetchSheet();
  setAllRows(fetchedData);
}, []); // empty array = run once on mount
```

**2. `rows` is now derived in memory, not fetched per selection.**
Previously `rows` was a piece of state that was set by the fetch. Now it is a computed value (called a `useMemo` — a value that is recalculated automatically whenever its inputs change, but only then):

```js
const rows = useMemo(() => {
  if (!element) return [];
  return allRows.filter((r) =>
    r.Category.toLowerCase() === category.label.toLowerCase() &&
    r.Element.toLowerCase() === element.sheetElementValue.toLowerCase()
  );
}, [allRows, catId, elId]);
```

In plain English: every time `allRows`, the selected category, or the selected element changes, this code runs through all the rows and picks out the ones that match both the current category and the current element type. The result is what gets shown in the product list.

The category match compares `r.Category` from the sheet against `category.label` from `categories.js` — both converted to lowercase — so `"Grocery"`, `"grocery"`, and `"GROCERY"` in the sheet all match correctly.

**The part most likely to confuse you later:**
The `loadingRows` spinner state is now tied to the initial mount fetch, not to element selection. This means the loading spinner appears once when the app first loads, then never again — even when the user switches categories or elements. Previously, switching elements would show the spinner each time. If a future requirement asks for "show a loading state when switching categories," the current architecture does not support that without a re-fetch. This is intentional and the correct trade-off for a small sheet, but it is worth knowing the spinner no longer triggers on navigation.

---

## How the pieces connect

Here is the exact flow for this feature:

1. **User opens the tool** → `BannerTool.jsx` mounts and immediately starts fetching the sheet.
2. **`fetchSheet()` in `sheet.js`** builds the URL using `SHEET_ID` and `SHEET_GID` from `constants.js`, fetches the CSV from Google, and parses every row — including the new `Category` column — into a list of objects.
3. **Result stored in `allRows`** inside `BannerTool.jsx`. At this point every row from the sheet is in memory, regardless of category.
4. **User selects a category and an element** (e.g. Grocery → Top Banners) → the `rows` `useMemo` runs and filters `allRows` to only rows where `Category` matches `"Grocery"` and `Element` matches `"Banner"`.
5. **`visibleRows`** (a further filter that already existed) then applies the user's status filter (Pending / Done) and search query on top of `rows`.
6. **User sees the product list** populated with matching rows.

---

## Why this approach and not another

**Alternative 1: Keep one tab per category, just add a Category column too.**
This was the previous architecture. It was rejected because it requires N network requests (one per category) and requires maintaining GID mappings in code. A single tab with a Category column is simpler to maintain for the marketing team — they manage one sheet, not six.

**Alternative 2: Fetch the sheet on demand each time the user switches category.**
This would fetch the same single sheet URL repeatedly but filter results per-request. It was rejected because it provides no benefit over a single fetch — the URL and the data are identical every time. Fetching once and filtering in memory is strictly faster and uses fewer network requests.

---

## What this feature assumes

- **The sheet is publicly accessible** ("Anyone with the link — Viewer" sharing). The fetch uses no authentication headers. If the sheet is made private, the fetch will silently fail and the tool will fall back to `SAMPLE_ROWS`.
- **The `Category` column always contains one of the known category labels** (Grocery, Swadeshi, Electronics, Beauty, Lifestyle, Food). A row with a typo in Category (e.g. `"Groccery"`) will not appear in any category's product list. There is no warning shown to the user for unrecognised category values — they simply disappear.
- **All rows for all categories live on a single tab.** If the marketing team later splits the sheet back into multiple tabs, `SHEET_GID` would only point at one of them, and rows on the other tabs would not load.
- **The sheet's GID does not change.** Tab GIDs in Google Sheets are permanent once a tab is created. Renaming the tab does not change its GID. Deleting the tab and recreating it would assign a new GID — at which point `VITE_SHEET_GID` in `.env` would need to be updated.
- **`DATA_MODE` is still `"mock"`** — the catalogue API (product images, MRP, brand logo) is still synthesised locally. Loading real rows from the live sheet does not automatically mean real catalogue data; that is Phase 2.

---

## New terms introduced

**GID** — A permanent numeric identifier for a specific tab within a Google Sheets document. Visible in the URL when a tab is selected: `...#gid=1234567890`. The first/default tab always has GID `0`.

**`useMemo`** — A React mechanism for computing a derived value from other values. The computation only re-runs when its specified inputs change. Used here so that `rows` is recalculated from `allRows` whenever the user switches category or element, without re-fetching the sheet.

**Mount** — In React, "mounting" is the moment when a component first appears on screen. A `useEffect` with an empty dependency array (`[]`) runs exactly once at mount — equivalent to "do this when the page first loads."

**Nullish coalescing (`??`)** — A JavaScript operator that returns the right-hand value only when the left-hand value is `null` or `undefined`. Different from `||`, which also triggers on `0`, `""`, and `false`.
