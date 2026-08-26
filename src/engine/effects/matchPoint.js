// VFX renderer: Set & Match Point Alert
import {
  roundRectPath, drawSubtitleBadge, TITLE_FONT,
  enterExit, frameRandom,
} from '../renderUtils';

export function renderMatchPoint(ctx, w, h, t, cfg) {
  const p = cfg.primaryColor || '#ff0055';
  const s = cfg.secondaryColor || '#ffcc00';
  const main = cfg.mainText || 'SET POINT';
  const sub = cfg.subText || '';
  const ls = Math.min(1.4, Math.max(0.6, (cfg.lineThickness ?? 0.8) * 1.25));
  const cx = w / 2;
  const cy = h / 2;
  const { alpha, scale } = enterExit(t, { inEnd: 0.2, outStart: 0.82 });

  ctx.save();

  // Animated hazard tapes across top & bottom
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha * 0.95);
  const stripeH = 13 * ls;
  const shift = (t * 260) % 44;

  // Top tape
  ctx.fillStyle = p;
  ctx.shadowColor = p;
  ctx.shadowBlur = 10 * ls;
  ctx.fillRect(0, 14, w, stripeH);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#000';
  for (let x = -50 + shift; x < w + 40; x += 44) {
    ctx.beginPath();
    ctx.moveTo(x, 14);
    ctx.lineTo(x + 22, 14);
    ctx.lineTo(x + 7, 14 + stripeH);
    ctx.lineTo(x - 15, 14 + stripeH);
    ctx.closePath();
    ctx.fill();
  }

  // Bottom tape (opposite scroll direction)
  ctx.fillStyle = s;
  ctx.shadowColor = s;
  ctx.shadowBlur = 10 * ls;
  ctx.fillRect(0, h - 16 - stripeH, w, stripeH);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#000';
  for (let x = -50 - shift; x < w + 40; x += 44) {
    ctx.beginPath();
    ctx.moveTo(x, h - 16 - stripeH);
    ctx.lineTo(x + 22, h - 16 - stripeH);
    ctx.lineTo(x + 7, h - 16);
    ctx.lineTo(x - 15, h - 16);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Center alert box with deterministic glitch entrance + strobe border
  ctx.save();
  let glitchX = 0;
  if (t < 0.15) {
    const rnd = frameRandom(Math.floor(t * 400) || 3);
    if (rnd() > 0.4) glitchX = (rnd() - 0.5) * 14;
  }
  ctx.globalAlpha = alpha;
  ctx.translate(cx + glitchX, cy);
  ctx.scale(scale, scale);

  const alertW = w * 0.48;
  const alertH = h * 0.19;

  roundRectPath(ctx, -alertW / 2, -alertH / 2, alertW, alertH, 18);
  ctx.fillStyle = 'rgba(16, 2, 12, 0.95)';
  ctx.shadowColor = p;
  ctx.shadowBlur = 16 * ls;
  ctx.fill();

  const strobeOn = Math.floor(t * 20) % 2 === 0;
  ctx.strokeStyle = strobeOn ? p : s;
  ctx.lineWidth = Math.max(1.5, 2.6 * ls);
  ctx.stroke();

  // Siren warning halos on both sides of the icon
  const sirenR = 15 * ls;
  [['-1', p], ['1', s]].forEach(([side, color]) => {
    const sx = side === '-1' ? -alertW * 0.28 : alertW * 0.28;
    const pulse = (Math.sin(t * 12 + (side === '-1' ? 0 : Math.PI)) + 1) / 2;
    const grad = ctx.createRadialGradient(sx, 0, 2, sx, 0, sirenR * (1.4 + pulse));
    grad.addColorStop(0, `${color}dd`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sx, 0, sirenR * (1.4 + pulse), 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(sirenR * 1.6)}px ${TITLE_FONT}`;
    ctx.fillText('🚨', sx, 0);
  });

  // Alert headline text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = Math.min(w * 0.058, 58);
  ctx.font = `900 ${size}px ${TITLE_FONT}`;
  while (ctx.measureText(main).width > alertW * 0.68 && size > 14) {
    size -= 1;
    ctx.font = `900 ${size}px ${TITLE_FONT}`;
  }
  ctx.font = `900 ${size}px ${TITLE_FONT}`;
  ctx.fillStyle = '#000';
  ctx.fillText(main, 3, alertH * 0.12 + 3);
  const alertGrad = ctx.createLinearGradient(0, -size + alertH * 0.12, 0, size + alertH * 0.12);
  alertGrad.addColorStop(0, '#ffffff');
  alertGrad.addColorStop(0.5, strobeOn ? p : s);
  alertGrad.addColorStop(1, strobeOn ? s : p);
  ctx.fillStyle = alertGrad;
  ctx.fillText(main, 0, alertH * 0.12);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = Math.max(1.2, 2 * ls);
  ctx.strokeText(main, 0, alertH * 0.12);

  drawSubtitleBadge(ctx, sub, alertH * 0.38, alertW, s, p, Math.min(w * 0.024, 22), ls);

  ctx.restore();
  ctx.restore();
}
