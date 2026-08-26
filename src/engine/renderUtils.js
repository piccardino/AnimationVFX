// Shared drawing utilities for the canvas render engine

/** Deterministic PRNG so previews and exports produce identical frames */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function frameRandom(progress) {
  return mulberry32(Math.floor(progress * 100000) || 1);
}

export function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function fillRoundRect(ctx, x, y, w, h, r, style) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = style;
  ctx.fill();
}

export function strokeRoundRect(ctx, x, y, w, h, r, style, lineWidth) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.strokeStyle = style;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

/** Shrink font size until `text` fits within maxWidth */
export function fitFontSize(ctx, text, maxWidth, startSize, family = '"Anton", "Bebas Neue", sans-serif') {
  let size = startSize;
  ctx.font = `900 ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 12) {
    size -= 1;
    ctx.font = `900 ${size}px ${family}`;
  }
  return size;
}

export const TITLE_FONT = '"Anton", "Bebas Neue", sans-serif';
export const BODY_FONT = '"Outfit", "Montserrat", sans-serif';

// Easings
export const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
export const easeOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

/** Standard broadcast in/out envelope: fade/scale in during [0,inEnd], out during [outStart,1] */
export function enterExit(progress, { inEnd = 0.2, outStart = 0.82, easing = easeOutBack } = {}) {
  let alpha = 1;
  let scale = 1;
  if (progress < inEnd) {
    const t = progress / inEnd;
    scale = easing(t);
    alpha = easeOutCubic(t);
  } else if (progress > outStart) {
    alpha = 1 - easeOutCubic((progress - outStart) / (1 - outStart));
  }
  return { alpha, scale };
}

/** Shared palette/typography bundle for every effect renderer */
export function getPalette(cfg) {
  return {
    p: cfg.primaryColor || '#00e5ff',
    s: cfg.secondaryColor || '#7c4dff',
    a: cfg.accentColor || '#ffffff',
    main: cfg.mainText || '',
    sub: cfg.subText || '',
    ls: Math.min(1.4, Math.max(0.6, (cfg.lineThickness ?? 0.8) * 1.25)),
  };
}

/** Draw the big broadcast title with black offset shadow + gradient fill + white stroke */
export function drawTitle(ctx, text, { maxW, baseSize, gradStops, offsetY = 0 }) {
  const fs = fitFontSize(ctx, text, maxW, baseSize);
  ctx.font = `900 ${fs}px ${TITLE_FONT}`;
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillText(text, 4, offsetY + 4);
  const grad = ctx.createLinearGradient(0, -fs + offsetY, 0, fs + offsetY);
  (gradStops || [['0', '#ffffff'], ['1', '#999999']]).forEach(([stop, color]) =>
    grad.addColorStop(Number(stop), color)
  );
  ctx.fillStyle = grad;
  ctx.fillText(text, 0, offsetY);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1.2, 2.2);
  ctx.strokeText(text, 0, offsetY);
  return fs;
}

export function drawSubtitleBadge(ctx, subText, y, maxWidth, sColor, pColor, baseSize = 26, ls = 1) {
  if (!subText) return;
  const lines = String(subText).split('\n');

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (lines.length === 1) {
    const text = lines[0].replace(/[()]/g, '').trim();
    const fontSize = fitFontSize(ctx, text, maxWidth - 40, baseSize, BODY_FONT);
    ctx.font = `800 ${fontSize}px ${BODY_FONT}`;
    const boxW = Math.min(ctx.measureText(text).width + 52, maxWidth);
    const boxH = fontSize * 1.5;

    roundRectPath(ctx, -boxW / 2, y - boxH / 2, boxW, boxH, boxH / 2);
    ctx.fillStyle = 'rgba(10, 14, 28, 0.96)';
    ctx.shadowColor = pColor;
    ctx.shadowBlur = 14 * ls;
    ctx.fill();

    const borderGrad = ctx.createLinearGradient(-boxW / 2, 0, boxW / 2, 0);
    borderGrad.addColorStop(0, sColor);
    borderGrad.addColorStop(1, pColor);
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = Math.max(1, 2 * ls);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.max(1, 2.5 * ls);
    ctx.strokeText(text, 0, y + 1);
    ctx.fillStyle = '#fff';
    ctx.fillText(text, 0, y + 1);
    ctx.restore();
    return;
  }

  // Two-line layout: line 1 emphasized (name), line 2 lighter (role • number)
  const [l1, l2] = lines.map((l) => l.replace(/[()]/g, '').trim());
  const sz1 = fitFontSize(ctx, l1, maxWidth - 40, baseSize * 1.15, BODY_FONT);
  const sz2 = fitFontSize(ctx, l2, maxWidth - 40, baseSize * 0.85, BODY_FONT);

  ctx.font = `900 ${sz1}px ${BODY_FONT}`;
  const w1 = ctx.measureText(l1).width;
  ctx.font = `800 ${sz2}px ${BODY_FONT}`;
  const w2 = ctx.measureText(l2).width;

  const boxW = Math.min(Math.max(w1, w2) + 56, maxWidth);
  const boxH = sz1 + sz2 + baseSize * 0.95;
  roundRectPath(ctx, -boxW / 2, y - boxH / 2, boxW, boxH, 16);
  ctx.fillStyle = 'rgba(10, 14, 28, 0.96)';
  ctx.shadowColor = pColor;
  ctx.shadowBlur = 14 * ls;
  ctx.fill();

  const borderGrad = ctx.createLinearGradient(-boxW / 2, 0, boxW / 2, 0);
  borderGrad.addColorStop(0, pColor);
  borderGrad.addColorStop(1, sColor);
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = Math.max(1, 2 * ls);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.font = `900 ${sz1}px ${BODY_FONT}`;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = Math.max(1, 2.5 * ls);
  ctx.strokeText(l1, 0, y - sz1 * 0.42);
  ctx.fillStyle = '#fff';
  ctx.fillText(l1, 0, y - sz1 * 0.42);

  ctx.font = `800 ${sz2}px ${BODY_FONT}`;
  ctx.strokeText(l2, 0, y + sz2 * 0.62);
  ctx.fillStyle = sColor;
  ctx.fillText(l2, 0, y + sz2 * 0.62);

  ctx.restore();
}
