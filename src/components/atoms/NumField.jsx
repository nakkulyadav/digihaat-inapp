import { T, mono } from "../tokens";

export default function NumField({ label, value, onChange }) {
  return (
    <label style={{ flex: 1 }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: T.sub, display: "block", marginBottom: 4 }}>{label}</span>
      <input type="number" value={value} onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v); }}
        style={{
          width: "100%", boxSizing: "border-box", padding: "8px 12px", fontSize: 14,
          border: "none", borderRadius: 8, background: "#F5F5F5",
          fontFamily: mono, outline: "none", color: T.text,
        }} />
    </label>
  );
}
