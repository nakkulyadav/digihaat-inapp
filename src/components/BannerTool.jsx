import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

import { CATEGORIES, ELEMENTS_BY_CATEGORY } from "../config/categories";
import BANNER_SKU_CONFIG from "../config/elements/banner_sku.json";
import BANNER_BRAND_CONFIG from "../config/elements/banner_brand.json";
import { DATA_MODE, IMAGE_PROXY_ENDPOINT } from "../config/constants";
import { fetchSheet, SAMPLE_ROWS } from "../lib/sheet";
import { parseProductUrl } from "../lib/url";
import { fetchCatalogue } from "../lib/catalogue";
import { assembleProductData } from "../lib/assemble";
import { drawBanner } from "../lib/render";
import { T, mono, h1, h2, btnPrimary, btnOutlined, warnBox } from "./tokens";
import Toggle from "./atoms/Toggle";
import Field from "./atoms/Field";
import NumField from "./atoms/NumField";
import UploadBtn from "./atoms/UploadBtn";
import EmptyCard from "./atoms/EmptyCard";
import Chevron from "./atoms/Chevron";

// ─── Sub-components ───────────────────────────────────────────────────────────

function HoverBtn({ children, style, hoverStyle, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", ...style, ...(hovered ? hoverStyle : {}) }}>
      {children}
    </button>
  );
}

function SidebarBtn({ label, active, showSoon, soonColor, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
        width: "100%", textAlign: "left", marginBottom: 2, padding: "9px 12px", borderRadius: 7,
        border: "none", cursor: "pointer",
        fontFamily: "Jost, sans-serif", fontWeight: 700, fontSize: 13,
        letterSpacing: "0.04em", textTransform: "uppercase",
        background: active ? T.accent : hovered ? "rgba(255,255,255,0.06)" : "transparent",
        color: active ? "#FFFFFF" : "#D6D5DA",
        transition: "background 100ms ease-out",
      }}>
      <span>{label}</span>
      {showSoon && (
        <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: 9, letterSpacing: 0, textTransform: "lowercase", color: soonColor ?? T.disabled }}>
          soon
        </span>
      )}
    </button>
  );
}

function ElementCard({ element, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} disabled={!element.enabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        gap: 24, minHeight: 108, textAlign: "left", padding: 16,
        border: `1px solid ${T.line}`, borderRadius: 8,
        background: element.enabled ? T.surface : T.work,
        cursor: element.enabled ? "pointer" : "not-allowed",
        transform: hovered && element.enabled ? "translateY(-2px)" : "none",
        boxShadow: hovered && element.enabled ? `0 4px 12px rgba(0,0,0,0.50), ${T.orangeGlow}` : "none",
        transition: "transform 150ms ease-out, box-shadow 150ms ease-out",
      }}>
      <span style={{ fontFamily: "Jost, sans-serif", fontWeight: 700, fontSize: 16, color: element.enabled ? T.text : T.sub }}>
        {element.label}
      </span>
      <span style={{
        alignSelf: "flex-start", fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: 11,
        padding: "3px 8px", borderRadius: 4,
        background: element.enabled ? "rgba(29,191,18,0.12)" : T.work,
        color: element.enabled ? T.success : T.disabled,
      }}>
        {element.enabled ? "Ready" : "Coming soon"}
      </span>
    </button>
  );
}

function AdjustBtn({ label, onClick, style: extraStyle }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "none", border: "none", padding: 0, cursor: "pointer",
        fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: 11,
        color: hovered ? T.accent : T.text,
        ...extraStyle,
      }}>
      {label}
    </button>
  );
}

function PropertiesPanel({ inline, open, onClose, elList, overrides, data, logoImg, logoErr, openAdj, cfg, onToggleEl, onFieldChange, onToggleAdj, onReset }) {
  if (!inline && !open) return null;

  const panelStyle = inline
    ? { width: 320, flexShrink: 0, borderLeft: `1px solid ${T.line}`, background: T.surface, overflow: "auto", padding: 16 }
    : {
        position: "fixed", left: 0, right: 0, bottom: 0, maxHeight: "82vh",
        background: T.surface, overflow: "auto", padding: "16px 16px 24px",
        borderTop: `1px solid ${T.line}`, borderRadius: "16px 16px 0 0",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.60)", zIndex: 50,
      };

  return (
    <div style={panelStyle}>
      <div style={{ fontFamily: "Jost, sans-serif", fontWeight: 700, fontSize: 16, color: T.text }}>Elements</div>
      <div style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 400, fontSize: 11, color: T.sub, marginTop: 4, marginBottom: 14 }}>
        Toggle, edit text, adjust position. Changes preview live and are session-only.
      </div>

      {elList.map(([key, base]) => {
        const ov = overrides[key] || {};
        const isOn = ov.visible !== undefined ? ov.visible : base.visible;
        return (
          <div key={key} style={{ border: `1px solid ${T.line}`, borderRadius: 8, marginBottom: 10, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: T.surface2 }}>
              <span style={{ fontFamily: "Jost, sans-serif", fontWeight: 700, fontSize: 12.5, color: T.text, flex: 1 }}>{base.label}</span>
              {base.toggleable && <Toggle on={isOn} onChange={(v) => onToggleEl(key, v)} />}
            </div>
            {isOn && (
              <div style={{ padding: "10px 12px" }}>
                {key === "headline" && (
                  <label style={{ display: "block", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: T.sub, display: "block", marginBottom: 4 }}>Text</span>
                    <textarea
                      value={ov.content ?? data?.fields.headline ?? ""}
                      rows={2}
                      onChange={(e) => onFieldChange(key, { content: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        if (e.ctrlKey || e.altKey || e.metaKey) return;
                        e.preventDefault();
                        if (e.shiftKey) {
                          const current = ov.content ?? data?.fields.headline ?? "";
                          if (current.includes("\n")) return;
                          const cursor = e.target.selectionStart;
                          let before = current.slice(0, cursor);
                          const after = current.slice(cursor);
                          const hlCfg = BANNER_SKU_CONFIG.elements.headline;
                          const maxW = hlCfg.maxW;
                          const fontStr = `${hlCfg.weight} ${hlCfg.size}px Inter, system-ui, sans-serif`;
                          const offscreen = document.createElement("canvas");
                          const octx = offscreen.getContext("2d");
                          octx.font = fontStr;
                          if (octx.measureText(before).width > maxW) {
                            const words = before.split(/\s+/);
                            while (words.length > 1 && octx.measureText(words.join(" ") + "…").width > maxW) words.pop();
                            before = words.join(" ") + "…";
                          }
                          onFieldChange(key, { content: before + "\n" + after });
                        } else {
                          e.target.blur();
                        }
                      }}
                      onFocus={(e) => { e.target.style.border = `1px solid ${T.accent}`; e.target.style.boxShadow = T.orangeGlow; }}
                      onBlur={(e) => { e.target.style.border = `1px solid ${T.line}`; e.target.style.boxShadow = "none"; }}
                      style={{
                        width: "100%", boxSizing: "border-box", padding: "7px 9px", fontSize: 13,
                        border: `1px solid ${T.line}`, borderRadius: 7, background: T.surface,
                        color: T.text, fontFamily: "inherit", resize: "none", lineHeight: 1.5, display: "block",
                      }}
                    />
                  </label>
                )}
                {key === "header" && (
                  <Field label="Header" value={ov.content ?? data?.fields.header ?? ""} onChange={(v) => onFieldChange(key, { content: v })} />
                )}
                {key === "subheader" && (
                  <Field label="Subheader" value={ov.content ?? data?.fields.subheader ?? ""} onChange={(v) => onFieldChange(key, { content: v })} />
                )}
                {key === "price" && (<>
                  <Field label="Selling price" value={ov.selling ?? data?.fields.selling_display ?? ""} onChange={(v) => onFieldChange(key, { selling: v })} />
                  <Field label="MRP (strikethrough)" value={ov.mrp ?? data?.fields.mrp ?? ""} onChange={(v) => onFieldChange(key, { mrp: v })} mono />
                </>)}
                {key === "cta_button" && (
                  <Field label="Button text" value={ov.content ?? base.label_text} onChange={(v) => onFieldChange(key, { content: v })} />
                )}
                {key === "tnc" && (
                  <Field label="Text" value={ov.content ?? base.text} onChange={(v) => onFieldChange(key, { content: v })} />
                )}
                {key === "offer_badge" && (
                  <Field label="Badge text" value={ov.content ?? data?.fields.offer ?? ""} onChange={(v) => onFieldChange(key, { content: v })} />
                )}
                {key === "quantity_badge" && (
                  <Field label="Quantity (e.g. 75 ml)" value={ov.content ?? data?.fields.quantity ?? ""} onChange={(v) => onFieldChange(key, { content: v })} />
                )}
                {key === "brand_logo" && (
                  <>
                    <div style={{ fontSize: 11, color: logoErr ? T.error : T.sub }}>
                      {logoImg
                        ? "Brand logo loaded."
                        : logoErr
                          ? logoErr
                          : data?.fields.brand_logo_url
                            ? "Loading brand logo…"
                            : "No logo found — upload manually."}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>Logo size</div>
                      <input type="range" min={0} max={24} step={1}
                        value={6 - (ov.pad ?? base.pad)}
                        onChange={(e) => onFieldChange(key, { pad: 6 - Number(e.target.value) })}
                        style={{ width: "100%" }} />
                    </div>
                  </>
                )}

                <AdjustBtn
                  label={openAdj[key] ? "Hide position" : "Adjust position"}
                  onClick={() => onToggleAdj(key)}
                  style={{ marginTop: 8 }}
                />
                {openAdj[key] && (
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    {("cx" in base) ? (<>
                      <NumField label="cx" value={ov.cx ?? base.cx} onChange={(v) => onFieldChange(key, { cx: v })} />
                      <NumField label="cy" value={ov.cy ?? base.cy} onChange={(v) => onFieldChange(key, { cy: v })} />
                      <NumField label="r" value={ov.r ?? base.r} onChange={(v) => onFieldChange(key, { r: v })} />
                    </>) : (<>
                      <NumField label="x" value={ov.x ?? base.x} onChange={(v) => onFieldChange(key, { x: v })} />
                      <NumField label="y" value={ov.y ?? base.y} onChange={(v) => onFieldChange(key, { y: v })} />
                    </>)}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <AdjustBtn label="Reset all edits" onClick={onReset} style={{ marginTop: 4 }} />
    </div>
  );
}

function SettingsScreen({ cfg }) {
  const [open, setOpen] = useState({});
  const elEntries = Object.entries(cfg.elements).sort((a, b) => a[1].order - b[1].order);

  return (
    <div style={{ maxWidth: 880, display: "flex", flexDirection: "column", gap: 32 }}>

      <section>
        <h2 style={{ fontFamily: "Jost, sans-serif", fontWeight: 700, fontSize: 20, lineHeight: 1.1, letterSpacing: "-0.01em", color: T.text }}>Canvas</h2>
        <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[["Width (px)", cfg.canvas.wLogical], ["Height (px)", cfg.canvas.hLogical], ["Export scale (×)", cfg.canvas.scale]].map(([label, val]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500, fontSize: 12, color: T.sub }}>{label}</span>
              <input readOnly value={val}
                style={{ width: 140, fontFamily: mono, fontSize: 13, color: T.text, background: T.surface, borderRadius: 8, padding: "8px 12px", border: "none", outline: "none" }} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontFamily: "Jost, sans-serif", fontWeight: 700, fontSize: 20, lineHeight: 1.1, letterSpacing: "-0.01em", color: T.text }}>Elements</h2>
        <div style={{ marginTop: 16, maxWidth: 560 }}>
          {elEntries.map(([key, el]) => {
            const isOpen = !!open[key];
            const fields = Object.entries(el).filter(([k]) =>
              !["label", "order", "visible", "toggleable", "fontFamily"].includes(k)
            );
            return (
              <div key={key} style={{ border: `1px solid ${T.line}`, borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
                <button onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px", background: T.surface2, border: "none", cursor: "pointer",
                  }}>
                  <span style={{ fontFamily: "Jost, sans-serif", fontWeight: 700, fontSize: 13, color: T.text }}>{el.label}</span>
                  <span style={{ fontSize: 16, color: T.sub, display: "inline-block", transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 150ms ease-out" }}>›</span>
                </button>
                {isOpen && (
                  <div style={{ padding: "12px 14px", borderTop: `1px solid ${T.line}`, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 12 }}>
                    {fields.map(([k, v]) => (
                      <div key={k} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontFamily: mono, fontSize: 11, color: T.sub }}>{k}</span>
                        <input readOnly value={String(v)}
                          style={{ width: "100%", fontFamily: mono, fontSize: 12, color: T.text, background: T.surface, borderRadius: 8, padding: "8px 10px", border: "none", outline: "none" }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BannerTool() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // ── data state ───────────────────────────────────────────────────────────────
  const [fontReady, setFontReady] = useState(false);
  const [allRows, setAllRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [sheetSource, setSheetSource] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending");

  const [active, setActive] = useState(null);
  const [data, setData] = useState(null);
  const [buildErr, setBuildErr] = useState("");
  const [overrides, setOverrides] = useState({});
  const [bgImg, setBgImg] = useState(null);
  const [logoImg, setLogoImg] = useState(null);
  const [logoErr, setLogoErr] = useState(null);
  const [approved, setApproved] = useState(false);
  const [cfg, setCfg] = useState(BANNER_SKU_CONFIG); // [SWAP-FOR-LOCALSTORAGE] persist Settings here
  const [warnings, setWarnings] = useState([]);
  const [openAdj, setOpenAdj] = useState({});

  // ── responsive state ─────────────────────────────────────────────────────────
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 1440);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const canvasRef = useRef(null);

  // ── nav — derived from URL ────────────────────────────────────────────────────
  const catId = searchParams.get("cat") ?? "grocery";
  const elId = searchParams.get("el") ?? null;
  const pathname = location.pathname;
  const soonCat = pathname.startsWith("/soon/") ? decodeURIComponent(pathname.slice(6)) : null;
  const showSettings = pathname === "/settings";

  const category = CATEGORIES.find((c) => c.id === catId);
  const elements = ELEMENTS_BY_CATEGORY[catId] || [];
  const element = elements.find((e) => e.id === elId) || null;

  const isMobile = vw < 768;
  const panelInline = vw >= 1024;
  const screen = showSettings ? "settings"
    : soonCat ? "soon"
    : pathname === "/workspace" ? "workspace"
    : elId ? "list"
    : "picker";

  // ── effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (pathname === "/workspace" && !active) navigate("/", { replace: true });
  }, [pathname, active, navigate]);

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => { if (!cancelled) setFontReady(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handler = () => setVw(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingRows(true);
    (async () => {
      let fetchedData, src;
      try {
        fetchedData = await fetchSheet(); src = "Live sheet";
      } catch {
        fetchedData = SAMPLE_ROWS.map((r) => ({ ...r, Header: "" }));
        src = "Bundled sample (live fetch blocked)";
      }
      if (cancelled) return;
      setAllRows(fetchedData); setSheetSource(src); setLoadingRows(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const rows = useMemo(() => {
    if (!element) return [];
    return allRows.filter((r) =>
      (r.Category || "").trim().toLowerCase() === (category?.label || "").toLowerCase() &&
      (r.Element || "").trim().toLowerCase() === element.sheetElementValue.toLowerCase()
    );
  }, [allRows, catId, elId]);

  const visibleRows = useMemo(() => {
    return rows.filter((r) => {
      const done = (r.Status || "").trim().toLowerCase() === "done";
      if (statusFilter === "Pending" && done) return false;
      if (statusFilter === "Done" && !done) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (r.Subheader || "").toLowerCase().includes(q) ||
          (r.Date || "").toLowerCase().includes(q) ||
          (r.Offer || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [rows, statusFilter, search]);

  const openProduct = useCallback(async (row) => {
    setCfg(row.Type === "BRAND" ? BANNER_BRAND_CONFIG : BANNER_SKU_CONFIG);
    setActive(row); setApproved(false); setOverrides({}); setBgImg(null);
    setLogoImg(null); setLogoErr(null); setData(null); setBuildErr(""); setOpenAdj({});
    setDrawerOpen(false);
    navigate(`/workspace?cat=${catId}&el=${elId}`);
    try {
      const parsed = parseProductUrl(row.URL);
      const cat = await fetchCatalogue(parsed, row);
      setData(await assembleProductData(row, parsed, cat));
    } catch (e) {
      setBuildErr("Could not assemble product data: " + e.message);
    }
  }, [catId, elId, navigate]);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    const C = cfg.canvas;
    const cv = canvasRef.current;
    cv.width = C.wLogical * C.scale; cv.height = C.hLogical * C.scale;
    const ctx = cv.getContext("2d");
    ctx.setTransform(C.scale, 0, 0, C.scale, 0, 0);
    const w = drawBanner(ctx, cfg, data, overrides, { bg: bgImg, logo: logoImg });
    setWarnings(w);
  }, [data, overrides, bgImg, logoImg, cfg, fontReady]);

  useEffect(() => {
    const url = data?.fields.brand_logo_url;
    if (!url) return;
    let cancelled = false;
    const proxyUrl = `${IMAGE_PROXY_ENDPOINT}?url=${encodeURIComponent(url)}`;
    fetch(proxyUrl)
      .then((res) => { if (!res.ok) throw new Error("proxy fetch failed"); return res.blob(); })
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => { if (!cancelled) setLogoImg(img); };
        img.onerror = () => { if (!cancelled) setLogoErr("Brand logo could not be loaded — upload manually."); };
        img.src = objectUrl;
      })
      .catch(() => { if (!cancelled) setLogoErr("Brand logo could not be loaded — upload manually."); });
    return () => { cancelled = true; };
  }, [data?.fields.brand_logo_url]);

  // ── helpers ──────────────────────────────────────────────────────────────────
  const setOv = (key, patch) =>
    setOverrides((o) => ({ ...o, [key]: { ...(o[key] || {}), ...patch } }));

  const loadImageFile = (file, setter) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => setter(img);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const exportAs = (type) => {
    const cv = canvasRef.current; if (!cv) return;
    const mime = type === "png" ? "image/png" : type === "webp" ? "image/webp" : "image/jpeg";
    let url;
    try { url = cv.toDataURL(mime, 0.95); }
    catch { alert("Export blocked: an external image tainted the canvas. Use the uploaded background/logo, or proxy remote images in production."); return; }
    const a = document.createElement("a");
    const name = (active?.Subheader || "banner").replace(/\s+/g, "_").toLowerCase();
    a.href = url; a.download = `banner_sku_grocery_${name}.${type}`; a.click();
  };

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "banner_sku.json"; a.click();
  };

  const goCategory = () => navigate(`/?cat=${catId}`);
  const goElement = () => navigate(-1);
  const openSettings = () => navigate("/settings");

  const elList = useMemo(() =>
    Object.entries(cfg.elements).sort((a, b) => a[1].order - b[1].order), [cfg]);

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex", flexDirection: isMobile ? "column" : "row",
      height: "100vh", minHeight: 560, fontFamily: "Inter, system-ui, sans-serif",
      color: T.text, background: T.work, fontSize: 14, overflow: "hidden",
    }}>

      {/* ── sidebar (desktop only) ─────────────────────────────────────────────── */}
      {!isMobile && (
        <aside style={{
          width: 208, background: T.ink, color: "#EDEDED", flexShrink: 0,
          display: "flex", flexDirection: "column", height: "100%",
        }}>
          <div style={{ padding: "16px", borderBottom: `1px solid ${T.line}` }}>
            <div style={{ fontFamily: "Jost, sans-serif", fontWeight: 700, fontSize: 14, color: "#EDEDED", letterSpacing: "0.02em" }}>
              Creative Studio
            </div>
            <div style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 400, fontSize: 10.5, color: T.sub, marginTop: 4 }}>
              In-app banner automation
            </div>
          </div>

          <div style={{ padding: "16px 16px 8px", fontFamily: "Inter, system-ui, sans-serif", fontWeight: 400, fontSize: 10, color: T.disabled, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Categories
          </div>
          <div style={{ padding: "0 8px" }}>
            {CATEGORIES.map((c) => {
              const isActive = c.id === catId && !showSettings && !soonCat;
              return (
                <SidebarBtn key={c.id}
                  label={c.label}
                  active={isActive}
                  showSoon={!c.enabled}
                  soonColor={isActive ? "rgba(255,255,255,0.75)" : T.disabled}
                  onClick={() => {
                    if (c.enabled) navigate(`/?cat=${c.id}`);
                    else navigate(`/soon/${encodeURIComponent(c.label)}`);
                  }}
                />
              );
            })}
          </div>

          <div style={{ margin: "12px 12px 0", borderTop: `1px solid ${T.line}` }} />
          <div style={{ padding: "8px 8px 0" }}>
            <SidebarBtn label="Settings" active={showSettings} onClick={openSettings} />
          </div>

          <div style={{ marginTop: "auto", padding: "12px 16px", borderTop: `1px solid ${T.line}`, fontFamily: mono, fontSize: 10, color: T.disabled }}>
            Data mode: <span style={{ color: DATA_MODE === "mock" ? T.warn : T.accent }}>{DATA_MODE}</span>
          </div>
        </aside>
      )}

      {/* ── main ──────────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── header ── */}
        <header style={{
          height: 48, flexShrink: 0, borderBottom: `1px solid ${T.line}`,
          background: T.surface, display: "flex", alignItems: "center",
          padding: "0 16px", gap: 8, zIndex: 10,
        }}>
          <HoverBtn
            style={{ fontFamily: "Jost, sans-serif", fontWeight: 700, fontSize: 14, color: T.text }}
            hoverStyle={{ color: T.accent }}
            onClick={goCategory}>
            {category?.label}
          </HoverBtn>

          {screen === "settings" && (
            <><Chevron /><span style={{ fontFamily: "Jost, sans-serif", fontWeight: 700, fontSize: 14, color: T.sub }}>Settings</span></>
          )}
          {screen === "soon" && (
            <><Chevron /><span style={{ fontFamily: "Jost, sans-serif", fontWeight: 700, fontSize: 14, color: T.sub }}>{soonCat}</span></>
          )}
          {(screen === "list" || screen === "workspace") && element && (<>
            <Chevron />
            <HoverBtn
              style={{ fontFamily: "Jost, sans-serif", fontWeight: 700, fontSize: 14, color: T.sub }}
              hoverStyle={{ color: T.accent }}
              onClick={goElement}>
              {element.label}
            </HoverBtn>
          </>)}
          {screen === "workspace" && active && (<>
            <Chevron />
            <span style={{ fontFamily: "Jost, sans-serif", fontWeight: 700, fontSize: 14, color: T.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 240 }}>
              {active.Subheader || "Untitled"}
            </span>
          </>)}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            {screen === "list" && (
              <span style={{ fontFamily: mono, fontSize: 11, color: T.sub }}>{sheetSource}</span>
            )}
            {screen === "workspace" && (
              <HoverBtn
                style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: 12, color: T.text }}
                hoverStyle={{ color: T.accent }}
                onClick={goElement}>
                ← Back to list
              </HoverBtn>
            )}
            {screen === "settings" && (<>
              <HoverBtn
                style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: 12, color: T.text }}
                hoverStyle={{ color: T.accent }}
                onClick={exportConfig}>
                Export config JSON
              </HoverBtn>
              <button disabled title="Editing not yet available" style={{
                height: 32, padding: "0 18px", borderRadius: 30, border: "none",
                background: T.surface2, color: T.disabled,
                fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500, fontSize: 12,
                textTransform: "uppercase", letterSpacing: "0.02em",
                cursor: "not-allowed", opacity: 0.4,
              }}>Save changes</button>
            </>)}
          </div>
        </header>

        {/* ── body ── */}
        <div style={{ flex: 1, minHeight: 0, position: "relative", background: T.work }}>

          {/* SCREEN: ELEMENT PICKER */}
          {screen === "picker" && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "auto", padding: 32 }}>
              <h1 style={h1}>Choose an element</h1>
              <p style={{ marginTop: 8, fontFamily: "Inter, system-ui, sans-serif", fontWeight: 400, fontSize: 14, color: T.sub }}>
                Pick which creative type you want to generate for {category?.label}.
              </p>
              {elements.length === 0 && (
                <div style={{ marginTop: 24 }}>
                  <EmptyCard text={`No elements configured for ${category?.label} yet.`} />
                </div>
              )}
              <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12, maxWidth: 1040 }}>
                {elements.map((e) => (
                  <ElementCard key={e.id} element={e} onClick={() => e.enabled && navigate(`/list?cat=${catId}&el=${e.id}`)} />
                ))}
              </div>
            </div>
          )}

          {/* SCREEN: PRODUCT LIST */}
          {screen === "list" && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "auto", padding: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <h2 style={h2}>{element.label}</h2>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    placeholder="Search products…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={(e) => { e.currentTarget.style.boxShadow = T.orangeGlow; }}
                    onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                    style={{ width: 200, fontFamily: "Inter, system-ui, sans-serif", fontWeight: 400, fontSize: 13, color: T.text, background: T.surface, borderRadius: 8, padding: "8px 12px", border: `1px solid ${T.line}`, outline: "none" }}
                  />
                  <div style={{ display: "flex", border: `1px solid ${T.line}`, borderRadius: 8, overflow: "hidden" }}>
                    {["Pending", "Done", "All"].map((s) => (
                      <button key={s} onClick={() => setStatusFilter(s)} style={{
                        padding: "8px 14px", fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500, fontSize: 12,
                        border: "none", cursor: "pointer", transition: "background 150ms ease-out",
                        background: statusFilter === s ? T.accent : T.surface,
                        color: statusFilter === s ? "#FFFFFF" : T.sub,
                      }}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>

              {loadingRows ? (
                <EmptyCard text="Loading products…" />
              ) : visibleRows.length === 0 ? (
                <div style={{ maxWidth: 1040 }}><EmptyCard text="No products match this filter." /></div>
              ) : (
                <div style={{ border: `1px solid ${T.line}`, borderRadius: 8, overflow: "hidden", background: T.surface, maxWidth: 1040 }}>
                  {visibleRows.map((r, i) => {
                    const done = (r.Status || "").trim().toLowerCase() === "done";
                    return (
                      <div key={i} onClick={() => openProduct(r)}
                        style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", borderTop: i ? `1px solid ${T.line}` : "none", cursor: "pointer", transition: "background 100ms ease-out" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = T.surface2}
                        onMouseLeave={(e) => e.currentTarget.style.background = T.surface}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: 14, color: T.text }}>
                            {r.Subheader || <span style={{ color: T.error }}>⚠ No headline in sheet</span>}
                          </div>
                          <div style={{ fontFamily: mono, fontSize: 11, color: T.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
                            {parseProductUrl(r.URL).item_id || "no item_id (store link)"}
                          </div>
                        </div>
                        <div style={{ width: 90, flexShrink: 0, fontFamily: "Inter, system-ui, sans-serif", fontWeight: 400, fontSize: 12, color: T.sub }}>{r.Date}</div>
                        <div style={{ width: 110, flexShrink: 0, textAlign: "right", fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: 13, color: T.text }}>
                          {/^\d/.test(String(r.Discounted).trim()) ? "₹" : ""}{r.Discounted}
                        </div>
                        <span style={{
                          width: 58, flexShrink: 0, textAlign: "center",
                          fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: 11,
                          textTransform: "uppercase", letterSpacing: "0.02em",
                          padding: "3px 8px", borderRadius: 4,
                          background: done ? T.accent : T.work,
                          color: done ? "#FFFFFF" : T.sub,
                        }}>{done ? "Done" : "Pending"}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SCREEN: WORKSPACE */}
          {screen === "workspace" && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", overflow: "hidden" }}>

              {/* canvas column */}
              <div style={{ flex: 1, minWidth: 0, overflow: "auto", padding: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
                {buildErr && (
                  <div style={{ ...warnBox, marginBottom: 16, width: "100%", maxWidth: 480 }}>{buildErr}</div>
                )}

                {/* artboard */}
                <div style={{
                  background: T.surface2, border: `1px solid ${T.line}`, borderRadius: 0,
                  padding: 24,
                  backgroundImage: "radial-gradient(#2E2E2E 1px, transparent 1px)",
                  backgroundSize: "12px 12px",
                  boxShadow: "0 4px 18px rgba(0,0,0,0.60)",
                }}>
                  <canvas ref={canvasRef} style={{
                    width: 480, height: 250, display: "block", borderRadius: 0, background: T.work,
                  }} />
                  <div style={{ textAlign: "center", marginTop: 12, fontFamily: mono, fontSize: 11, color: T.sub }}>
                    361 × 188 logical · exports at {cfg.canvas.scale}× ({cfg.canvas.wLogical * cfg.canvas.scale} × {cfg.canvas.hLogical * cfg.canvas.scale})
                  </div>
                </div>

                {/* uploads */}
                <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                  <UploadBtn
                    label={bgImg ? "Replace lifestyle image" : "Upload lifestyle image"}
                    onFile={(f) => loadImageFile(f, setBgImg)}
                    primary
                  />
                  <UploadBtn
                    label={logoImg ? "Replace brand logo" : "Upload brand logo"}
                    onFile={(f) => { setLogoErr(null); loadImageFile(f, setLogoImg); }}
                  />
                </div>

                {logoErr && (
                  <div style={{ ...warnBox, marginTop: 16, width: "100%", maxWidth: 480 }}>⚠ {logoErr}</div>
                )}
                {warnings.length > 0 && (
                  <div style={{ ...warnBox, marginTop: 16, width: "100%", maxWidth: 480 }}>
                    {warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
                  </div>
                )}

                {/* approve / export */}
                <div style={{ marginTop: 20, width: "100%", maxWidth: 480 }}>
                  {!approved ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <button onClick={() => setApproved(true)} style={btnPrimary}>
                        Approve creative →
                      </button>
                      <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 400, fontSize: 11.5, color: T.sub, textAlign: "center", maxWidth: 320 }}>
                        Edit freely in the panel; approve when it looks right.
                      </span>
                    </div>
                  ) : (
                    <div style={{ border: `1px solid ${T.success}`, background: "rgba(29,191,18,0.08)", borderRadius: 12, padding: 16 }}>
                      <div style={{ fontFamily: "Jost, sans-serif", fontWeight: 700, fontSize: 14, color: T.success }}>
                        Approved — export
                      </div>
                      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {["png", "webp", "jpg"].map((t) => (
                          <button key={t} onClick={() => exportAs(t)}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(29,191,18,0.15)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = T.surface}
                            style={{
                              height: 36, padding: "0 14px", border: `1px solid ${T.success}`, borderRadius: 8,
                              background: T.surface, color: T.success,
                              fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: 12.5,
                              cursor: "pointer", transition: "background 150ms ease-out",
                            }}>
                            .{t}
                          </button>
                        ))}
                        <button disabled style={{
                          height: 36, padding: "0 14px", border: `1px solid ${T.line}`, borderRadius: 8,
                          background: T.surface2, color: T.disabled,
                          fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: 12.5,
                          cursor: "not-allowed",
                        }}>
                          Upload to CMS · Coming soon
                        </button>
                      </div>
                      <HoverBtn
                        style={{ marginTop: 12, fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: 12, color: T.success }}
                        hoverStyle={{ color: T.accent }}
                        onClick={() => setApproved(false)}>
                        ← Back to editing
                      </HoverBtn>
                    </div>
                  )}
                </div>
              </div>

              {/* properties panel — inline on wide, drawer on narrow */}
              <PropertiesPanel
                inline={panelInline}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                elList={elList}
                overrides={overrides}
                data={data}
                logoImg={logoImg}
                logoErr={logoErr}
                openAdj={openAdj}
                cfg={cfg}
                onToggleEl={(key, v) => setOv(key, { visible: v })}
                onFieldChange={setOv}
                onToggleAdj={(key) => setOpenAdj((o) => ({ ...o, [key]: !o[key] }))}
                onReset={() => { setOverrides({}); setOpenAdj({}); }}
              />

              {/* FAB + scrim on narrow screens */}
              {!panelInline && !drawerOpen && (
                <button onClick={() => setDrawerOpen(true)} style={{
                  position: "fixed", right: 16, bottom: 16, zIndex: 40,
                  height: 44, padding: "0 28px", borderRadius: 30,
                  background: T.accent, color: "#FFFFFF", border: "none",
                  fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500, fontSize: 14,
                  textTransform: "uppercase", letterSpacing: "0.02em",
                  boxShadow: T.orangeGlow, cursor: "pointer",
                }}>Edit</button>
              )}
              {!panelInline && drawerOpen && (
                <div onClick={() => setDrawerOpen(false)} style={{
                  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                  background: "rgba(0,0,0,0.60)", zIndex: 45,
                }} />
              )}
            </div>
          )}

          {/* SCREEN: SETTINGS */}
          {screen === "settings" && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "auto", padding: 32 }}>
              <SettingsScreen cfg={cfg} />
            </div>
          )}

          {/* SCREEN: COMING SOON */}
          {screen === "soon" && (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 8, padding: 32, textAlign: "center",
            }}>
              <div style={{ fontFamily: "Jost, sans-serif", fontWeight: 900, fontSize: 48, lineHeight: 0.95, letterSpacing: "-0.02em", textTransform: "uppercase", color: T.text }}>
                {soonCat}
              </div>
              <div style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 400, fontSize: 16, color: T.sub }}>
                This category is coming soon.
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── mobile bottom nav ─────────────────────────────────────────────────── */}
      {isMobile && (
        <nav style={{ flexShrink: 0, height: 56, background: T.ink, display: "flex", overflowX: "auto", borderTop: `1px solid ${T.line}` }}>
          {CATEGORIES.map((c) => {
            const isActive = c.id === catId && !showSettings && !soonCat;
            return (
              <button key={c.id}
                onClick={() => {
                  if (c.enabled) navigate(`/?cat=${c.id}`);
                  else navigate(`/soon/${encodeURIComponent(c.label)}`);
                }}
                style={{ flexShrink: 0, minWidth: 64, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", border: "none", background: "none", cursor: "pointer" }}>
                <span style={{ fontFamily: "Jost, sans-serif", fontWeight: 700, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.02em", color: isActive ? T.accent : T.sub }}>
                  {c.label.slice(0, 5)}
                </span>
              </button>
            );
          })}
          <button onClick={openSettings} style={{ flexShrink: 0, minWidth: 64, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", border: "none", background: "none", cursor: "pointer" }}>
            <span style={{ fontFamily: "Jost, sans-serif", fontWeight: 700, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.02em", color: showSettings ? T.accent : T.sub }}>
              Settings
            </span>
          </button>
        </nav>
      )}
    </div>
  );
}
