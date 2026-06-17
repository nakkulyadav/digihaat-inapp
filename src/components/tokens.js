// ─── Design tokens ────────────────────────────────────────────────────────────
export const T = {
  ink:      "#111111",  // primary — sidebar bg, dominant fills
  work:     "#F5F5F5",  // surface — workspace bg, cards, input fills
  line:     "#E5E5E5",  // border — card outlines, dividers
  sub:      "#707072",  // text-secondary — descriptions, supporting copy
  text:     "#111111",  // text-primary — headlines, labels
  accent:   "#FA5400",  // accent — urgency badges, active sidebar only
  success:  "#128A09",  // success — done, confirmed, exported
  warn:     "#FFC107",  // warning — non-blocking issues
  error:    "#D43F21",  // error — blocked states, critical
  disabled: "#8D8D8F",  // disabled text
};

export const mono = "JetBrains Mono, monospace";

// ─── Shared style objects ─────────────────────────────────────────────────────
export const h2 = {
  fontSize: 20, fontWeight: 700, margin: 0,
  fontFamily: "Jost, sans-serif", letterSpacing: "-0.01em",
};

export const linkBtn = {
  background: "none", border: "none", color: "#111111",
  cursor: "pointer", fontSize: 13, padding: 0, fontWeight: 600,
};

export const btnPrimary = {
  background: "#111111", color: "#FFFFFF", border: "none",
  borderRadius: 30, padding: "12px 28px", fontSize: 14, fontWeight: 500,
  cursor: "pointer", letterSpacing: "0.02em", textTransform: "uppercase",
};

export const btnGhost = {
  background: "#FFFFFF", color: "#111111", border: "1px solid #111111",
  borderRadius: 30, padding: "12px 28px", fontSize: 14, fontWeight: 500,
  cursor: "pointer", letterSpacing: "0.02em", textTransform: "uppercase",
};

export const btnExport = {
  background: "#FFFFFF", color: "#111111", border: "1px solid #111111",
  borderRadius: 30, padding: "12px 28px", fontSize: 14, fontWeight: 500,
  cursor: "pointer", letterSpacing: "0.02em", textTransform: "uppercase",
};

export const btnDisabled = {
  background: "#CACACB", color: "#8D8D8F", border: "none",
  borderRadius: 30, padding: "12px 28px", fontSize: 14, fontWeight: 500,
  cursor: "not-allowed", letterSpacing: "0.02em", textTransform: "uppercase",
};

export const warnBox = {
  background: "#FFC107", color: "#111111",
  borderRadius: 8, padding: "12px 16px", fontSize: 12, lineHeight: 1.5,
};
