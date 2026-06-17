import { T, mono } from "../tokens";

export default function Field({ label, value, onChange, mono: m }) {
  return (
    <label style={{ display: "block", marginBottom: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: T.sub, display: "block", marginBottom: 4 }}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} style={{
        width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: 14,
        border: "none", borderRadius: 8, background: "#F5F5F5",
        color: T.text, fontFamily: m ? mono : "inherit", outline: "none",
      }} />
    </label>
  );
}
