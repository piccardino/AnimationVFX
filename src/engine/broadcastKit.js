// Broadcast kit: shared primitives for professional sports-style overlays
import { TITLE_FONT, BODY_FONT, fitFontSize } from './renderUtils';

export const INK = '#0A0F1C';
export const SURFACE = 'rgba(9, 13, 26, 0.95)';
export const WHITE = '#FFFFFF';

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const quintOut = (x) => 1 - Math.pow(1 - x, 5);
export const expoOut = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const sc = (w, h) => Math.min(w, h) / 1080;

/** in/out envelopes: inP eased 0..1 over first inD, outA alpha during exit */
export function phase(t, { inD = 0.12, outS = 0.87 } = {}) {
  return { inP: quintOut(clamp01(t / inD)), outA: 1 - clamp01((t - outS) / 0.13) };
}

/** Soft editorial drop shadow, scale-aware */
export function shadow(ctx, k, blur = 22, dy = 7, alpha = 0.4) {
  ctx.shadowColor = `rgba(0, 0, 0, ${alpha})`;
  ctx.shadowBlur = blur * k;
  ctx.shadowOffsetY = dy * k;
}

export function noShadow(ctx) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

/** Parallelogram slab; skew = px the top edge is shifted right */
export function slabPath(ctx, x, y, w, h, skew) {
  ctx.beginPath();
  ctx.moveTo(x + skew, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - skew, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
}

export function slab(ctx, x, y, w, h, skew, fill, opt = {}) {
  const k = opt.k || 1;
  slabPath(ctx, x, y, w, h, skew);
  if (fill) {
    shadow(ctx, k);
    ctx.fillStyle = fill;
    ctx.fill();
    noShadow(ctx);
  }
  if (opt.line) {
    ctx.strokeStyle = opt.line;
    ctx.lineWidth = (opt.lw || 2) * k;
    ctx.stroke();
  }
}

/** Scrolling diagonal hazard stripes inside a rect (call within save/restore if needed) */
export function hazard(ctx, x, y, w, h, stripeColor, k, offset = 0, gap = 26) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = stripeColor;
  const g = gap * k;
  const start = x - h - g + (((offset % g) + g) % g);
  for (let px = start; px < x + w + h; px += g) {
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px + g * 0.52, y);
    ctx.lineTo(px + g * 0.52 - h, y + h);
    ctx.lineTo(px - h, y + h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Per-letter kinetic typography; returns final font size used */
export function kineticTitle(ctx, text, cx, cy, opt) {
  const {
    k, t, start = 0, stagger = 0.03, dur = 0.24, maxW, size,
    font = TITLE_FONT, fill = WHITE, grad = null, weight = '900',
  } = opt;
  const fs = fitFontSize(ctx, text, maxW, size, font);
  ctx.font = `${weight} ${fs}px ${font}`;
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0);
  let x = cx - total / 2;
  chars.forEach((ch, i) => {
    const p = clamp01((t - start - i * stagger) / dur);
    if (p <= 0) { x += widths[i]; return; }
    const dy = (1 - expoOut(p)) * 70 * k;
    ctx.save();
    ctx.globalAlpha *= clamp01(p * 1.5);
    if (grad) {
      const g = ctx.createLinearGradient(0, cy - fs * 0.75 + dy, 0, cy + fs * 0.75 + dy);
      grad.forEach(([stop, color]) => g.addColorStop(stop, color));
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = fill;
    }
    shadow(ctx, k, 26, 8, 0.45);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch, x, cy + dy);
    ctx.restore();
    x += widths[i];
  });
  noShadow(ctx);
  return fs;
}

/** Stylized vector volleyball with swirl seams */
export function volleyball(ctx, x, y, r, { k = 1, seam = '#0E1526', base = '#F4F7FF' } = {}) {
  ctx.save();
  shadow(ctx, k, 18, 6, 0.35);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = base;
  ctx.fill();
  noShadow(ctx);
  ctx.clip();
  ctx.strokeStyle = seam;
  ctx.lineWidth = Math.max(1.5, r * 0.09);
  for (const a of [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6]) {
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.72, a + Math.PI * 0.8, a + Math.PI * 1.5);
    ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = seam;
  ctx.lineWidth = Math.max(1.2, r * 0.06);
  ctx.stroke();
}

/** Small label chip with accent bar on the left; reveal = 0..1 wipe */
export function chip(ctx, text, cx, cy, opt = {}) {
  const { k = 1, color = '#7C4DFF', size = 26, reveal = 1, alpha = 1, font = BODY_FONT, weight = '800' } = opt;
  ctx.font = `${weight} ${size}px ${font}`;
  const tw = ctx.measureText(text).width;
  const pad = 18 * k;
  const barW = 7 * k;
  const w = tw + pad * 2 + barW;
  const h = size * 1.9;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.beginPath();
  ctx.rect(cx - w / 2, cy - h / 2, w * clamp01(reveal), h);
  ctx.clip();
  slab(ctx, cx - w / 2, cy - h / 2, w, h, 0, SURFACE, { k });
  ctx.fillStyle = color;
  ctx.fillRect(cx - w / 2, cy - h / 2, barW, h);
  ctx.fillStyle = WHITE;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx - w / 2 + barW + pad, cy + 1);
  ctx.restore();
  return { w, h };
}

/** Letter-spaced small uppercase label (broadcast ticker style) */
export function tracked(ctx, text, x, y, { k = 1, size = 22, color = WHITE, weight = '800', track = 4, align = 'left', font = BODY_FONT, alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  const gap = track * k;
  const total = [...text].reduce((a, c) => a + ctx.measureText(c).width + gap, -gap);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  ctx.textAlign = 'left';
  for (const c of text) {
    ctx.fillText(c, cx, y);
    cx += ctx.measureText(c).width + gap;
  }
  ctx.restore();
  return total;
}
