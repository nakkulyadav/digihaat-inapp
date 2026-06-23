import { DATA_MODE } from "../config/constants";

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = typeof r === "number" ? { tl: r, tr: r, br: r, bl: r } : r;
  ctx.beginPath();
  ctx.moveTo(x + rr.tl, y);
  ctx.lineTo(x + w - rr.tr, y);
  ctx.arcTo(x + w, y, x + w, y + rr.tr, rr.tr);
  ctx.lineTo(x + w, y + h - rr.br);
  ctx.arcTo(x + w, y + h, x + w - rr.br, y + h, rr.br);
  ctx.lineTo(x + rr.bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr.bl, rr.bl);
  ctx.lineTo(x, y + rr.tl);
  ctx.arcTo(x, y, x + rr.tl, y, rr.tl);
  ctx.closePath();
}

function font(weight, size) {
  return `${weight} ${size}px Inter, system-ui, sans-serif`;
}

function wrapLines(ctx, text, maxW) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = []; let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// ─── Banner compositor ────────────────────────────────────────────────────────
// Reads only cfg (from banner_sku.json) and the assembled data object.
// No pixel value is hardcoded here — all layout comes from the config file.
// Returns an array of validation warning strings to surface in the UI.
export function drawBanner(ctx, cfg, data, ov, assets) {
  const C = cfg.canvas;
  const E = cfg.elements;
  const warnings = [];
  const get = (k) => ({ ...E[k], ...(ov[k] || {}) });
  const visible = (k) => {
    const e = get(k);
    return ov[k]?.visible !== undefined ? ov[k].visible : e.visible;
  };

  ctx.clearRect(0, 0, C.wLogical, C.hLogical);

  // clip all drawing to rounded canvas boundary
  if (C.radius) {
    roundRectPath(ctx, 0, 0, C.wLogical, C.hLogical, C.radius);
    ctx.save();
    ctx.clip();
  }

  // background
  if (assets.bg) {
    const img = assets.bg;
    const cr = C.wLogical / C.hLogical, ir = img.width / img.height;
    let dw, dh, dx, dy;
    if (ir > cr) { dh = C.hLogical; dw = dh * ir; dx = (C.wLogical - dw) / 2; dy = 0; }
    else { dw = C.wLogical; dh = dw / ir; dx = 0; dy = (C.hLogical - dh) / 2; }
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    ctx.fillStyle = C.fallbackBg;
    ctx.fillRect(0, 0, C.wLogical, C.hLogical);
    ctx.fillStyle = C.placeholderTextColor;
    ctx.font = font(600, 11);
  }

  // brand logo
  if (visible("brand_logo")) {
    const e = get("brand_logo");
    roundRectPath(ctx, e.x, e.y, e.boxW, e.boxH, e.radius);
    ctx.fillStyle = e.bg; ctx.fill();
    if (e.border) { ctx.lineWidth = e.border; ctx.strokeStyle = e.borderColor; ctx.stroke(); }
    ctx.save(); roundRectPath(ctx, e.x, e.y, e.boxW, e.boxH, e.radius); ctx.clip();
    if (assets.logo) {
      const img = assets.logo;
      const availW = e.boxW - e.pad * 2, availH = e.boxH - e.pad * 2;
      const r = Math.min(availW / img.width, availH / img.height);
      const w = img.width * r, h = img.height * r;
      ctx.drawImage(img, e.x + (e.boxW - w) / 2, e.y + (e.boxH - h) / 2, w, h);
    } else {
      ctx.fillStyle = e.placeholderTextColor; ctx.font = font(700, 8);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const nm = ("Upload Brand\nLogo");
      const lines = wrapLines(ctx, nm, e.maxW);
      ctx.fillText(nm.length > 20 ? nm.slice(0, 20) : nm, e.x + e.boxW / 2, e.y + e.boxH / 2);
      ctx.textAlign = "left";
    }
    ctx.restore();
  }

  // headline
  let headlineLines = 1;
  if (visible("headline")) {
    const e = get("headline");
    ctx.fillStyle = e.color; ctx.font = font(e.weight, e.size);
    ctx.textBaseline = "top"; ctx.textAlign = "left";
    let lines = wrapLines(ctx, ov.headline?.content ?? data.fields.headline, e.maxW);
    if (e.maxLines && lines.length > e.maxLines) {
      lines = lines.slice(0, e.maxLines);
      let words = lines[lines.length - 1].split(" ");
      while (words.length > 0) {
        const candidate = words.join(" ") + "…";
        if (ctx.measureText(candidate).width <= e.maxW || words.length === 1) {
          lines[lines.length - 1] = candidate;
          break;
        }
        words.pop();
      }
    }
    headlineLines = lines.length;
    lines.forEach((ln, i) => ctx.fillText(ln, e.x, e.y + i * e.lineHeight));
    if (!String(ov.headline?.content ?? data.fields.headline).trim())
      warnings.push("Headline is empty.");
  }

  // price
  if (visible("price")) {
    const e = get("price");
    const priceY = headlineLines >= 2 ? e.yMultiline : e.y;
    const baseline = priceY + e.sellingSize;
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    const sell = ov.price?.selling ?? data.fields.selling_display;
    const sellTxt = (data.fields.selling_is_numeric ? e.prefix : "") + sell;
    ctx.font = font(e.sellingWeight, e.sellingSize); ctx.fillStyle = e.sellingColor;
    ctx.fillText(sellTxt, e.x, baseline);
    const sellW = ctx.measureText(sellTxt).width;
    const mrp = ov.price?.mrp ?? data.fields.mrp;
    if (mrp) {
      const mrpNum = parseFloat(mrp);
      if (isFinite(mrpNum) && mrpNum === data.fields.selling_numeric) {
        warnings.push("MRP and selling price are the same — edit before exporting.");
      }
      const mrpTxt = e.prefix + mrp;
      ctx.font = font(e.mrpWeight, e.mrpSize); ctx.fillStyle = e.mrpColor;
      const mx = e.x + sellW + e.mrpGap;
      ctx.fillText(mrpTxt, mx, baseline);
      const mw = ctx.measureText(mrpTxt).width;
      ctx.strokeStyle = e.mrpColor; ctx.lineWidth = 1;
      ctx.beginPath();
      // 0.32× font size ≈ mid-cap-height: positions strikethrough through the centre of uppercase glyphs
      ctx.moveTo(mx, baseline - e.mrpSize * 0.32);
      ctx.lineTo(mx + mw, baseline - e.mrpSize * 0.32);
      ctx.stroke();
    } else if (DATA_MODE !== "mock") {
      warnings.push("No MRP from catalogue — strikethrough hidden.");
    }
  }

  // cta button
  let ctaBottom = null;
  if (visible("cta_button")) {
    const e = get("cta_button");
    roundRectPath(ctx, e.x, e.y, e.w, e.h, e.radius);
    ctx.fillStyle = ov.cta_button?.bg ?? e.bg; ctx.fill();
    ctx.fillStyle = e.color; ctx.font = font(e.weight, e.size);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText((ov.cta_button?.content ?? e.label_text).toUpperCase(),
      e.x + e.w / 2, e.y + e.h / 2 + 0.5);
    ctx.textAlign = "left";
    ctaBottom = e.y + e.h;
  }

  // tnc
  if (visible("tnc")) {
    const e = get("tnc");
    const y = (ctaBottom ?? get("cta_button").y + get("cta_button").h) + e.gapBelowCta;
    ctx.fillStyle = e.color; ctx.font = font(e.weight, e.size);
    ctx.textBaseline = "top"; ctx.textAlign = "left";
    ctx.fillText(ov.tnc?.content ?? e.text, e.x, y);
  }

  // offer badge
  if (visible("offer_badge")) {
    const e = get("offer_badge");
    const txt = ov.offer_badge?.content ?? data.fields.offer;
    roundRectPath(ctx, e.x, e.y, e.w, e.h, { tl: 0, tr: 0, br: 0, bl: e.radiusBL });
    ctx.fillStyle = ov.offer_badge?.bg ?? e.bg; ctx.fill();
    ctx.fillStyle = e.color; ctx.font = font(e.weight, e.size);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(txt, e.x + e.w / 2, e.y + e.h / 2 + 0.5);
    ctx.textAlign = "left";
  }

  // quantity badge
  if (visible("quantity_badge")) {
    const e = get("quantity_badge");
    const txt = ov.quantity_badge?.content ?? data.fields.quantity;
    if (txt) {
      ctx.beginPath(); ctx.arc(e.cx, e.cy, e.r, 0, Math.PI * 2);
      ctx.fillStyle = e.bg; ctx.fill();
      ctx.fillStyle = e.color; ctx.font = font(e.weight, e.size);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const parts = String(txt).split(" ");
      if (parts.length > 1) {
        // 0.5/0.55× font size splits two lines symmetrically around the badge centre
        ctx.fillText(parts[0], e.cx, e.cy - e.size * 0.5);
        ctx.fillText(parts.slice(1).join(" "), e.cx, e.cy + e.size * 0.55);
      } else ctx.fillText(txt, e.cx, e.cy);
      ctx.textAlign = "left";
    }
  }

  ctx.textBaseline = "alphabetic";
  if (C.radius) ctx.restore();
  return warnings;
}
