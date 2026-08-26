// VFX renderer: Super Spike
import {
  drawSubtitleBadge, TITLE_FONT,
  easeOutCubic, enterExit,
} from '../renderUtils';

export function renderSuperSpike(ctx, w, h, t, cfg) {
  const p = cfg.primaryColor || '#ff3d00';
  const s = cfg.secondaryColor || '#ffea00';
  const a = cfg.accentColor || '#ffffff';
  const main = cfg.mainText || 'SUPER SPIKE!';
  const sub = cfg.subText || '';
  const ls = Math.min(1.4, Math.max(0.6, (cfg.lineThickness ?? 0.8) * 1.25));
  const cx = w / 2;
  const cy = h / 2;
  const min = Math.min(w, h);
  const { alpha, scale } = enterExit(t, { inEnd: 0.18, outStart: 0.82 });

  // Heat haze aura
  ctx.save();
  ctx.globalAlpha = alpha;
  const auraR = min * (0.28 + Math.sin(t * 9) * 0.02);
  const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, auraR);
  aura.addColorStop(0, `${p}44`);
  aura.addColorStop(0.7, `${s}18`);
  aura.addColorStop(1, 'transparent');
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, w, h);

  // Incoming fireball streak before impact
  if (t < 0.3) {
    const ft = Math.min(1, t / 0.3);
    for (let i = 0; i < 7; i++) {
      const tr = i / 7;
      const headX = cx + (1 - easeOutCubic(ft)) * min * 0.85 - tr * min * 0.22;
      const headY = cy - (1 - easeOutCubic(ft)) * min * 0.55 + tr * min * 0.15;
      const r = min * 0.055 * (1 - tr * 0.8);
      const g = ctx.createRadialGradient(headX, headY, 0, headX, headY, r);
      g.addColorStop(0, i === 0 ? s : p);
      g.addColorStop(1, 'transparent');
      ctx.globalAlpha = alpha * Math.min(1, ft * 3);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(headX, headY, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Detonation shockwave ring
  ctx.save();
  if (t > 0.12) {
    const bt = (t - 0.12) / 0.75;
    if (bt < 1) {
      ctx.globalAlpha = alpha * (1 - bt) * 0.85;
      const br = min * (0.05 + bt * 0.45);
      const rg = ctx.createRadialGradient(cx, cy, br * 0.6, cx, cy, br);
      rg.addColorStop(0, 'transparent');
      rg.addColorStop(0.5, s);
      rg.addColorStop(0.85, p);
      rg.addColorStop(1, 'transparent');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(cx, cy, br, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Speed streaks + rising embers
  ctx.translate(cx, cy);
  ctx.globalAlpha = alpha * 0.85;
  ctx.strokeStyle = p;
  ctx.lineWidth = Math.max(1, 1.8 * ls);
  ctx.shadowColor = s;
  ctx.shadowBlur = 10 * ls;
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2 + t * 0.4;
    const r1 = min * 0.08 + ((t * 40) % 22);
    const r2 = r1 + 30 + Math.sin(i * 5 + t * 20) * 18;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
    ctx.lineTo(Math.cos(ang) * r2, Math.sin(ang) * r2);
    ctx.stroke();
  }
  for (let i = 0; i < 24; i++) {
    const ang = (i / 24) * Math.PI * 2 + Math.sin(i * 17) * 0.5;
    const dist = ((t * 380 + i * 17) % 260) + 38;
    const ex = Math.cos(ang) * dist;
    const ey = Math.sin(ang) * dist - t * 42;
    ctx.beginPath();
    ctx.arc(ex, ey, Math.max(1.5, (2 + Math.sin(i + t * 14)) * ls), 0, Math.PI * 2);
    ctx.fillStyle = i % 3 === 0 ? a : i % 2 === 0 ? s : p;
    ctx.shadowColor = p;
    ctx.shadowBlur = 8 * ls;
    ctx.fill();
  }
  ctx.restore();

  // Title block
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.round(min * 0.07)}px ${TITLE_FONT}`;
  ctx.fillStyle = s;
  ctx.fillText('🔥💥🔥', 0, -h * 0.135);

  const fs = fitLocal(ctx, main, w * 0.58, Math.min(w * 0.072, 68));
  ctx.font = `900 ${fs}px ${TITLE_FONT}`;
  ctx.fillStyle = '#000';
  ctx.fillText(main, 4, 4);
  const fireGrad = ctx.createLinearGradient(0, -fs, 0, fs);
  fireGrad.addColorStop(0, '#ffffff');
  fireGrad.addColorStop(0.25, s);
  fireGrad.addColorStop(0.65, p);
  fireGrad.addColorStop(1, '#660000');
  ctx.fillStyle = fireGrad;
  ctx.fillText(main, 0, 0);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = Math.max(1.2, 2.2 * ls);
  ctx.strokeText(main, 0, 0);

  drawSubtitleBadge(ctx, sub, fs * 0.6, w * 0.58, s, p, Math.min(w * 0.03, 26), ls);
  ctx.restore();

  // Impact flash
  if (t >= 0.11 && t < 0.2) {
    ctx.save();
    ctx.globalAlpha = (1 - (t - 0.11) / 0.09) * 0.35 * alpha;
    ctx.fillStyle = s;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

function fitLocal(ctx, text, maxW, startSize) {
  let size = startSize;
  ctx.font = `900 ${size}px ${TITLE_FONT}`;
  while (ctx.measureText(text).width > maxW && size > 12) {
    size -= 1;
    ctx.font = `900 ${size}px ${TITLE_FONT}`;
  }
  return size;
}
