import { T } from "../tokens";

export default function EmptyCard({ text }) {
  return (
    <div style={{
      border: `1px dashed ${T.line}`, borderRadius: 8, padding: "48px 32px",
      textAlign: "center", color: T.sub, background: T.surface,
      fontFamily: "Jost, sans-serif", fontWeight: 700, fontSize: 15,
    }}>
      {text}
    </div>
  );
}
