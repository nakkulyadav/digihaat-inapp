import { useState } from "react";
import { T, mono } from "../tokens";

export default function Field({ label, value, onChange, mono: m }) {
  const [focused, setFocused] = useState(false);
  return (
    <label style={{ display: "block", marginBottom: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 500, color: T.sub, display: "block", marginBottom: 4 }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", boxSizing: "border-box", padding: "7px 9px", fontSize: 13,
          border: `1px solid ${focused ? T.accent : T.line}`,
          boxShadow: focused ? T.orangeGlow : "none",
          borderRadius: 7, background: T.surface,
          color: T.text, fontFamily: m ? mono : "inherit",
        }}
      />
    </label>
  );
}
