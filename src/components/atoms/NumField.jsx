import { useState } from "react";
import { T, mono } from "../tokens";

export default function NumField({ label, value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <label style={{ flex: 1 }}>
      <span style={{ fontSize: 11, fontWeight: 500, color: T.sub, display: "block", marginBottom: 4 }}>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v); }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", boxSizing: "border-box", padding: "7px 9px", fontSize: 12,
          border: `1px solid ${focused ? T.accent : T.line}`,
          boxShadow: focused ? T.orangeGlow : "none",
          borderRadius: 7, background: T.surface,
          fontFamily: mono, color: T.text,
        }}
      />
    </label>
  );
}
