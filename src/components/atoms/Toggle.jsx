import { T } from "../tokens";

export default function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} aria-pressed={on} style={{
      width: 34, height: 20, borderRadius: 9999, border: "none", cursor: "pointer",
      background: on ? T.accent : "#3A3A3C", position: "relative", flexShrink: 0,
      transition: "background 150ms ease-out", padding: 0,
    }}>
      <span style={{
        position: "absolute", top: 2, left: on ? 16 : 2, width: 16, height: 16,
        borderRadius: 9999, background: "#fff", transition: "left 150ms ease-out",
        boxShadow: "0 1px 2px rgba(0,0,0,.50)",
      }} />
    </button>
  );
}
