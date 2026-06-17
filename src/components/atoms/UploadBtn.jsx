import { useRef } from "react";
import { btnPrimary, btnGhost } from "../tokens";

export default function UploadBtn({ label, onFile, primary }) {
  const ref = useRef(null);
  return (
    <>
      <button onClick={() => ref.current?.click()} style={primary ? btnPrimary : btnGhost}>
        {label}
      </button>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
    </>
  );
}
