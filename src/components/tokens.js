// ─── Design tokens ────────────────────────────────────────────────────────────
// Source of truth: DESIGN.md. Never introduce hex values outside this file.
export const T = {
  ink:        "#080808",  // sidebar bg — darkest surface
  work:       "#0F0F0F",  // workspace bg — main canvas area
  surface:    "#1A1A1A",  // cards, panels, inputs
  surface2:   "#252525",  // elevated surfaces: panel headers, artboard bg
  line:       "#2E2E2E",  // borders, dividers
  sub:        "#888889",  // text-secondary — descriptions, supporting copy
  text:       "#F0F0F0",  // text-primary — headlines, labels
  accent:     "#FA5400",  // orange accent — urgency badges, active sidebar, primary actions
  success:    "#1DBF12",  // success — done, confirmed, exported
  warn:       "#FFC107",  // warning — non-blocking issues
  error:      "#FF4D30",  // error — blocked states, critical
  disabled:   "#484849",  // disabled text
  orangeGlow: "0 0 0 2px rgba(250,84,0,0.25), 0 0 10px rgba(250,84,0,0.18)",
};

export const mono = "JetBrains Mono, monospace";

// ─── Type styles ─────────────────────────────────────────────────────────────
export const h1 = {
  fontFamily: "Jost, sans-serif", fontWeight: 900, fontSize: 28,
  lineHeight: 0.95, letterSpacing: "-0.02em", margin: 0,
};

export const h2 = {
  fontFamily: "Jost, sans-serif", fontWeight: 900, fontSize: 20,
  lineHeight: 1.1, letterSpacing: "-0.01em", margin: 0,
};

// ─── Shared style objects ─────────────────────────────────────────────────────
export const linkBtn = {
  background: "none", border: "none", color: "#F0F0F0",
  cursor: "pointer", fontSize: 13, padding: 0, fontWeight: 600,
  fontFamily: "Inter, system-ui, sans-serif",
};

export const btnPrimary = {
  height: 44, background: "#FA5400", color: "#FFFFFF", border: "none",
  borderRadius: 30, padding: "0 28px", fontSize: 14, fontWeight: 500,
  cursor: "pointer", letterSpacing: "0.02em", textTransform: "uppercase",
  fontFamily: "Inter, system-ui, sans-serif", transition: "background 150ms ease-out",
};

export const btnOutlined = {
  height: 44, background: "#1A1A1A", color: "#F0F0F0", border: "1px solid #2E2E2E",
  borderRadius: 30, padding: "0 28px", fontSize: 14, fontWeight: 500,
  cursor: "pointer", letterSpacing: "0.02em", textTransform: "uppercase",
  fontFamily: "Inter, system-ui, sans-serif", transition: "background 150ms ease-out",
};

// aliases kept for backward-compat
export const btnGhost = btnOutlined;
export const btnExport = btnOutlined;

export const btnDisabled = {
  height: 44, background: "#252525", color: "#484849", border: "none",
  borderRadius: 30, padding: "0 28px", fontSize: 14, fontWeight: 500,
  cursor: "not-allowed", letterSpacing: "0.02em", textTransform: "uppercase",
  fontFamily: "Inter, system-ui, sans-serif",
};

// amber warning box — used for render warnings and logo errors
export const warnBox = {
  background: "rgba(250,169,0,0.10)", border: "1px solid rgba(250,169,0,0.28)",
  borderRadius: 8, padding: "10px 14px", fontSize: 12, lineHeight: 1.5,
  color: "#FFC107",
};
