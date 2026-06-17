// ─── Categories ──────────────────────────────────────────────────────────────
//
// Each category maps to one sheet tab (identified by its gid).
// To activate a category: set enabled: true and supply the correct gid.
// The gid is the number after "gid=" in the sheet tab URL.
export const CATEGORIES = [
  { id: "grocery", label: "Grocery", enabled: true },
  { id: "swadeshi", label: "Swadeshi", enabled: true },
  { id: "electronics", label: "Electronics", enabled: false },
  { id: "beauty", label: "Beauty", enabled: false },
  { id: "lifestyle", label: "Lifestyle", enabled: false },
  { id: "food", label: "Food", enabled: false },
];

// ─── Elements per category ────────────────────────────────────────────────────
//
// sheetElementValue must match the "Element" column value in the sheet exactly
// (case-insensitive match is applied at runtime).
// To add a new element: append an entry and create a matching config file under
// /config/elements/ and a render case in /lib/render.js.
export const ELEMENTS_BY_CATEGORY = {
  grocery: [
    { id: "top_banners", label: "Top Banners", sheetElementValue: "Banner", enabled: true },
    { id: "masthead", label: "Masthead", sheetElementValue: "Masthead", enabled: false },
    { id: "widget", label: "Widget", sheetElementValue: "Widget", enabled: false },
    { id: "banner_2", label: "Banner 2", sheetElementValue: "Banner 2", enabled: false },
  ],
  swadeshi: [{ id: "top_banners", label: "Top Banners", sheetElementValue: "Banner", enabled: true },
  { id: "masthead", label: "Masthead", sheetElementValue: "Masthead", enabled: false },
  { id: "widget", label: "Widget", sheetElementValue: "Widget", enabled: false },
  { id: "banner_2", label: "Banner 2", sheetElementValue: "Banner 2", enabled: false },
  ],
  electronics: [],
  beauty: [],
  lifestyle: [],
  food: [],
};
