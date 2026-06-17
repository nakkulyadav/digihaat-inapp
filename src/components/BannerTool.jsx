import { useState, useEffect, useRef, useMemo, useCallback } from "react";

import { CATEGORIES, ELEMENTS_BY_CATEGORY } from "../config/categories";
import BANNER_SKU_CONFIG from "../config/elements/banner_sku.json";
import { DATA_MODE, IMAGE_PROXY_ENDPOINT } from "../config/constants";
import { fetchSheet, SAMPLE_ROWS } from "../lib/sheet";
import { parseProductUrl } from "../lib/url";
import { fetchCatalogue } from "../lib/catalogue";
import { assembleProductData } from "../lib/assemble";
import { drawBanner } from "../lib/render";
import { T, mono, h2, linkBtn, btnPrimary, btnExport, btnDisabled, warnBox } from "./tokens";
import Toggle from "./atoms/Toggle";
import Field from "./atoms/Field";
import NumField from "./atoms/NumField";
import UploadBtn from "./atoms/UploadBtn";
import EmptyCard from "./atoms/EmptyCard";
import Chevron from "./atoms/Chevron";

export default function BannerTool() {
  const [fontReady, setFontReady] = useState(false);
  const [catId, setCatId] = useState("grocery");
  const [elId, setElId] = useState(null);
  const [allRows, setAllRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [sheetSource, setSheetSource] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending");

  const [active, setActive] = useState(null); // selected product row
  const [data, setData] = useState(null);     // assembled product data
  const [buildErr, setBuildErr] = useState("");
  const [overrides, setOverrides] = useState({});
  const [bgImg, setBgImg] = useState(null);
  const [logoImg, setLogoImg] = useState(null);
  const [logoErr, setLogoErr] = useState(null);
  const [approved, setApproved] = useState(false);
  const [cfg] = useState(BANNER_SKU_CONFIG); // [SWAP-FOR-LOCALSTORAGE] persist Settings here
  const [warnings, setWarnings] = useState([]);
  const [openAdj, setOpenAdj] = useState({});

  const canvasRef = useRef(null);

  const category = CATEGORIES.find((c) => c.id === catId);
  const elements = ELEMENTS_BY_CATEGORY[catId] || [];
  const element = elements.find((e) => e.id === elId) || null;

  /* wait for Inter (declared in inter.css) to be ready before drawing */
  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => { if (!cancelled) setFontReady(true); });
    return () => { cancelled = true; };
  }, []);

  /* fetch full sheet once on mount; partition in memory by category + element */
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

  /* open a product into the workspace */
  const openProduct = useCallback(async (row) => {
    setActive(row); setApproved(false); setOverrides({}); setBgImg(null);
    setLogoImg(null); setLogoErr(null); setData(null); setBuildErr(""); setOpenAdj({});
    try {
      const parsed = parseProductUrl(row.URL);
      const cat = await fetchCatalogue(parsed, row);
      setData(await assembleProductData(row, parsed, cat));
    } catch (e) {
      setBuildErr("Could not assemble product data: " + e.message);
    }
  }, []);

  /* draw whenever inputs change */
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

  /* auto-load brand logo through proxy when data assembles with a logo URL */
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

  const elList = useMemo(() =>
    Object.entries(cfg.elements).sort((a, b) => a[1].order - b[1].order), [cfg]);

  /* ──────────────────────────────── render ──────────────────────────────────── */
  return (
    <div style={{
      display: "flex", height: "100vh", minHeight: 640, fontFamily: "Inter, system-ui, sans-serif",
      color: T.text, background: T.work, fontSize: 14, overflow: "hidden",
    }}>
      {/* sidebar */}
      <aside style={{
        width: 220, background: T.ink, color: "#EDEDED", flexShrink: 0,
        display: "flex", flexDirection: "column", padding: "16px 0",
      }}>
        <div style={{ padding: "0 16px 16px", borderBottom: "1px solid #2A2A2F" }}>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "Jost, sans-serif", letterSpacing: ".04em" }}>Creative Studio</div>
          <div style={{ fontSize: 12, color: "#707072", marginTop: 4 }}>In-app banner automation</div>
        </div>
        <div style={{ padding: "12px 12px 4px", fontSize: 12, fontFamily: "Jost, sans-serif", letterSpacing: ".04em", color: "#707072", textTransform: "uppercase" }}>Categories</div>
        {CATEGORIES.map((c) => {
          const on = c.id === catId;
          return (
            <button key={c.id} disabled={!c.enabled}
              onClick={() => { if (c.enabled) { setCatId(c.id); setElId(null); setActive(null); } }}
              style={{
                textAlign: "left", margin: "2px 8px", padding: "8px 12px", borderRadius: 24,
                border: "none", cursor: c.enabled ? "pointer" : "not-allowed",
                background: on ? T.accent : "transparent",
                color: c.enabled ? (on ? "#fff" : "#D6D5DA") : "#56555B",
                fontSize: 13, fontWeight: 700, display: "flex", fontFamily: "Jost, sans-serif",
                justifyContent: "space-between", alignItems: "center",
              }}>
              {c.label}
              {!c.enabled && <span style={{ fontSize: 11, color: "#56555B" }}>soon</span>}
            </button>
          );
        })}
        <div style={{ marginTop: "auto", padding: "12px 16px", fontSize: 10, color: "#56555B", fontFamily: "JetBrains Mono, monospace", borderTop: "1px solid #2A2A2F" }}>
          Data mode: <span style={{ fontFamily: mono, color: DATA_MODE === "mock" ? T.warn : T.accent }}>{DATA_MODE}</span>
        </div>
      </aside>

      {/* main */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* breadcrumb */}
        <header style={{
          height: 48, borderBottom: `1px solid ${T.line}`, background: "#fff",
          display: "flex", alignItems: "center", padding: "0 16px", gap: 8, flexShrink: 0,
        }}>
          <span style={{ fontWeight: 600 }}>{category?.label}</span>
          {element && <><Chevron /><span style={{ color: T.sub }}>{element.label}</span></>}
          {active && <><Chevron /><span style={{ color: T.sub }}>{active.Subheader || "Untitled"}</span></>}
          <div style={{ marginLeft: "auto", fontSize: 11, color: T.disabled }}>
            {active && (
              <button onClick={() => { setActive(null); setData(null); }} style={linkBtn}>← Back to list</button>
            )}
          </div>
        </header>

        {/* body */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", minHeight: 0 }}>

          {/* ELEMENT PICKER (no element chosen) */}
          {!element && (
            <div style={{ padding: 24, overflow: "auto", width: "100%" }}>
              <h2 style={h2}>Choose an element</h2>
              <p style={{ color: T.sub, marginTop: 4, marginBottom: 24 }}>
                Pick which creative type you want to generate for {category?.label}.
              </p>
              {elements.length === 0 && (
                <EmptyCard text={`No elements configured for ${category?.label} yet.`} />
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
                {elements.map((e) => (
                  <button key={e.id} disabled={!e.enabled} onClick={() => e.enabled && setElId(e.id)}
                    style={{
                      textAlign: "left", padding: 16, borderRadius: 8, cursor: e.enabled ? "pointer" : "not-allowed",
                      border: `1px solid ${e.enabled ? T.line : T.line}`,
                      background: e.enabled ? "#fff" : "#F5F5F5",
                    }}>
                    <div style={{ fontWeight: 700, fontFamily: "Jost, sans-serif", color: e.enabled ? T.text : T.disabled }}>{e.label}</div>
                    <div style={{ fontSize: 11, color: T.disabled, marginTop: 4 }}>
                      {e.enabled ? "Ready" : "Coming soon"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PRODUCT LIST (element chosen, no product open) */}
          {element && !active && (
            <div style={{ padding: 24, overflow: "auto", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <h2 style={{ ...h2, margin: 0 }}>{element.label}</h2>
                <span style={{ fontSize: 11, color: T.disabled, fontFamily: mono }}>{sheetSource}</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)}
                    style={{ padding: "12px 14px", fontSize: 14, background: "#F5F5F5", border: "none", borderRadius: 8, width: 200, outline: "none" }} />
                  <div style={{ display: "flex", border: `1px solid ${T.line}`, borderRadius: 8, overflow: "hidden" }}>
                    {["Pending", "Done", "All"].map((s) => (
                      <button key={s} onClick={() => setStatusFilter(s)} style={{
                        padding: "8px 12px", fontSize: 11, border: "none", cursor: "pointer",
                        background: statusFilter === s ? T.accent : "#fff",
                        color: statusFilter === s ? "#fff" : T.sub, fontWeight: statusFilter === s ? 600 : 500,
                      }}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>

              {loadingRows ? <EmptyCard text="Loading products…" /> :
                visibleRows.length === 0 ? <EmptyCard text="No products match this filter." /> : (
                  <div style={{ border: `1px solid ${T.line}`, borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                    {visibleRows.map((r, i) => {
                      const done = (r.Status || "").trim().toLowerCase() === "done";
                      return (
                        <div key={i} onClick={() => openProduct(r)} style={{
                          display: "flex", alignItems: "center", gap: 16, padding: "12px 16px",
                          borderTop: i ? `1px solid ${T.line}` : "none", cursor: "pointer",
                        }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#F5F5F5"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600 }}>{r.Subheader || <span style={{ color: T.error }}>⚠ No headline in sheet</span>}</div>
                            <div style={{ fontSize: 11, color: T.disabled, fontFamily: mono, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {parseProductUrl(r.URL).item_id || "no item_id (store link)"}
                            </div>
                          </div>
                          <div style={{ fontSize: 12, color: T.sub, width: 90 }}>{r.Date}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, width: 110, textAlign: "right" }}>
                            {/^\d/.test(String(r.Discounted).trim()) ? "₹" : ""}{r.Discounted}
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, width: 58, textAlign: "center",
                            background: done ? "#111111" : "#F5F5F5",
                            color: done ? "#FFFFFF" : "#707072",
                          }}>{done ? "Done" : "Pending"}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          )}

          {/* WORKSPACE (product open) */}
          {element && active && (
            <>
              {/* canvas column */}
              <div style={{ flex: 1, minWidth: 0, overflow: "auto", padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
                {buildErr && <div style={{ ...warnBox, marginBottom: 16 }}>{buildErr}</div>}

                {/* artboard */}
                <div style={{
                  background: "#fff", border: `1px solid ${T.line}`, borderRadius: 0,
                  padding: 24, backgroundImage: "radial-gradient(#E9E8E4 1px, transparent 1px)", backgroundSize: "12px 12px",
                }}>
                  <canvas ref={canvasRef} style={{
                    width: 480, height: 250, display: "block", borderRadius: 16,
                    boxShadow: "0 4px 18px rgba(0,0,0,0.10)", background: "#F5F5F5",
                  }} />
                  <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: T.disabled, fontFamily: mono }}>
                    361 × 188 logical · exports at {cfg.canvas.scale}× ({cfg.canvas.wLogical * cfg.canvas.scale} × {cfg.canvas.hLogical * cfg.canvas.scale})
                  </div>
                </div>

                {/* upload */}
                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                  <UploadBtn label={bgImg ? "Replace lifestyle image" : "Upload lifestyle image"}
                    onFile={(f) => loadImageFile(f, setBgImg)} primary />
                  <UploadBtn label={logoImg ? "Replace brand logo" : "Upload brand logo"}
                    onFile={(f) => { setLogoErr(null); loadImageFile(f, setLogoImg); }} />
                </div>

                {logoErr && (
                  <div style={{ ...warnBox, marginTop: 8, maxWidth: 480 }}>⚠ {logoErr}</div>
                )}

                {warnings.length > 0 && (
                  <div style={{ ...warnBox, marginTop: 8, maxWidth: 480 }}>
                    {warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
                  </div>
                )}

                {/* approval / export */}
                <div style={{ marginTop: 24, width: 200 }}>
                  {!approved ? (
                    <div style={{ display: "flex", gap: 20 }}>
                      <button onClick={() => setApproved(true)} style={btnPrimary}>Approve creative</button>
                    </div>
                  ) : (
                    <div style={{ border: "1px solid #128A09", background: "#F5F5F5", borderRadius: 8, padding: 16 }}>
                      <div style={{ fontWeight: 600, color: "#128A09", marginBottom: 8 }}>Approved — export</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {["png", "webp", "jpg"].map((t) => (
                          <button key={t} onClick={() => exportAs(t)} style={btnExport}>Download .{t}</button>
                        ))}
                        <button disabled title="Coming soon" style={btnDisabled}>Upload to CMS · Coming soon</button>
                      </div>
                      <button onClick={() => setApproved(false)} style={{ ...linkBtn, marginTop: 8 }}>← Back to editing</button>
                    </div>
                  )}
                </div>
              </div>

              {/* properties panel */}
              <div style={{ width: 320, flexShrink: 0, borderLeft: `1px solid ${T.line}`, background: "#fff", overflow: "auto", padding: "16px 16px 48px" }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Elements</div>
                <div style={{ fontSize: 12, color: T.disabled, marginBottom: 12 }}>
                  Toggle, edit text, adjust position. Changes preview live and are session-only.
                </div>

                {elList.map(([key, base]) => {
                  const ov = overrides[key] || {};
                  const isOn = ov.visible !== undefined ? ov.visible : base.visible;
                  return (
                    <div key={key} style={{ border: `1px solid ${T.line}`, borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#F5F5F5" }}>
                        <span style={{ fontWeight: 600, fontSize: 12, flex: 1 }}>{base.label}</span>
                        {base.toggleable && <Toggle on={isOn} onChange={(v) => setOv(key, { visible: v })} />}
                      </div>
                      {isOn && (
                        <div style={{ padding: "8px 12px" }}>
                          {key === "headline" && (
                            <Field label="Text" value={ov.content ?? data?.fields.headline ?? ""} onChange={(v) => setOv(key, { content: v })} />
                          )}
                          {key === "price" && (<>
                            <Field label="Selling price" value={ov.selling ?? data?.fields.selling_display ?? ""} onChange={(v) => setOv(key, { selling: v })} />
                            <Field label="MRP (strikethrough)" value={ov.mrp ?? data?.fields.mrp ?? ""} onChange={(v) => setOv(key, { mrp: v })} mono />
                          </>)}
                          {key === "cta_button" && (
                            <Field label="Button text" value={ov.content ?? base.label_text} onChange={(v) => setOv(key, { content: v })} />
                          )}
                          {key === "tnc" && (
                            <Field label="Text" value={ov.content ?? base.text} onChange={(v) => setOv(key, { content: v })} />
                          )}
                          {key === "offer_badge" && (
                            <Field label="Badge text" value={ov.content ?? data?.fields.offer ?? ""} onChange={(v) => setOv(key, { content: v })} />
                          )}
                          {key === "quantity_badge" && (
                            <Field label="Quantity (e.g. 75 ml)" value={ov.content ?? data?.fields.quantity ?? ""} onChange={(v) => setOv(key, { content: v })} />
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
                                <input
                                  type="range"
                                  min={0}
                                  max={24}
                                  step={1}
                                  value={6 - (ov.pad ?? base.pad)}
                                  onChange={(e) => setOv(key, { pad: 6 - Number(e.target.value) })}
                                  style={{ width: "100%" }}
                                />
                              </div>
                            </>
                          )}

                          {/* position adjust */}
                          <button onClick={() => setOpenAdj((o) => ({ ...o, [key]: !o[key] }))}
                            style={{ ...linkBtn, marginTop: 4, fontSize: 11 }}>
                            {openAdj[key] ? "Hide position" : "Adjust position"}
                          </button>
                          {openAdj[key] && (
                            <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                              {("cx" in base) ? (<>
                                <NumField label="cx" value={ov.cx ?? base.cx} onChange={(v) => setOv(key, { cx: v })} />
                                <NumField label="cy" value={ov.cy ?? base.cy} onChange={(v) => setOv(key, { cy: v })} />
                                <NumField label="r" value={ov.r ?? base.r} onChange={(v) => setOv(key, { r: v })} />
                              </>) : (<>
                                <NumField label="x" value={ov.x ?? base.x} onChange={(v) => setOv(key, { x: v })} />
                                <NumField label="y" value={ov.y ?? base.y} onChange={(v) => setOv(key, { y: v })} />
                              </>)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <button onClick={() => { setOverrides({}); setOpenAdj({}); }} style={{ ...linkBtn, marginTop: 4 }}>
                  Reset all edits
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
