// VFX renderer: Service Ace
import {
  drawSubtitleBadge, fitFontSize, TITLE_FONT,
  easeOutExpo, enterExit, frameRandom,
} from '../renderUtils';

export function renderServiceAce(ctx, w, h, t, cfg) {
  const p = cfg.primaryColor || '#ffd700';
  const s = cfg.secondaryColor || '#ff007f';
  const a = cfg.accentColor || '#ffffff';
  const main = cfg.mainText || 'SERVICE ACE!';
  const sub = cfg.subText || '';
  const ls = Math.min(1.4, Math.max(0.6, (cfg.lineThickness ?? 0.8) * 1.25));
  const cx = w / 2;
  const cy = h / 2;
  const min = Math.min(w, h);
  const { alpha, scale } = enterExit(t, { inEnd: 0.25, outStart: 0.8 });

  ctx.save();
  ctx.globalAlpha = alpha;

  // Expanding golden sonic boom ring
  if (t > 0.12) {
    const bt = (t - 0.12) / 0.75;
    if (bt < 1) {
      ctx.save();
      ctx.globalAlpha = (1 - bt) * 0.8;
      ctx.strokeStyle = p;
      ctx.lineWidth = Math.max(1, (3 - bt * 2) * ls);
      ctx.shadowColor = p;
      ctx.shadowBlur = 18 * ls;
      ctx.beginPath();
      ctx.arc(cx, cy, min * (0.06 + bt * 0.42), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Horizontal laser flare beam
  const beamW = Math.min(w * 0.55, 680) * (0.2 + easeOutExpo(Math.min(1, t / 0.3)) * 0.45);
  ctx.save();
  ctx.translate(cx, cy);
  const lg = ctx.createLinearGradient(-beamW / 2, 0, beamW / 2, 0);
  lg.addColorStop(0, 'transparent');
  lg.addColorStop(0.3, s);
  lg.addColorStop(0.5, '#ffffff');
  lg.addColorStop(0.7, p);
  lg.addColorStop(1, 'transparent');
  ctx.fillStyle = lg;
  ctx.shadowColor = p;
  ctx.shadowBlur = 12 * ls;
  const beamH = Math.max(2, 3.5 * ls);
  ctx.fillRect(-beamW / 2, -beamH / 2, beamW, beamH);
  ctx.restore();

  // Rotating lock-on crosshair gauge
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  const targetR = min * 0.085;

  ctx.save();
  ctx.rotate(t * Math.PI * 2);
  ctx.strokeStyle = p;
  ctx.lineWidth = Math.max(1, 1.5 * ls);
  ctx.shadowColor = p;
  ctx.shadowBlur = 8 * ls;
  ctx.beginPath();
  ctx.arc(0, 0, targetR, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * targetR, Math.sin(ang) * targetR);
    ctx.lineTo(Math.cos(ang) * (targetR + 8), Math.sin(ang) * (targetR + 8));
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.rotate(-t * Math.PI * 3);
  ctx.strokeStyle = s;
  ctx.lineWidth = Math.max(1, 1.2 * ls);
  ctx.beginPath();
  ctx.arc(0, 0, targetR * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Crosshair hairlines
  ctx.strokeStyle = a;
  ctx.lineWidth = Math.max(1, 1.8 * ls);
  ctx.beginPath();
  ctx.moveTo(-targetR - 14, 0);
  ctx.lineTo(targetR + 14, 0);
  ctx.moveTo(0, -targetR - 14);
  ctx.lineTo(0, targetR + 14);
  ctx.stroke();

  // Golden laser specks twinkling around the target
  const rnd = frameRandom(Math.floor(t * 90) + 21);
  for (let i = 0; i < 18; i++) {
    const sx = (rnd() - 0.5) * w * 0.7;
    const sy = (rnd() - 0.5) * h * 0.6;
    const tw = Math.sin(t * 22 + i * 3);
    if (tw > 0.2) {
      ctx.globalAlpha = tw * 0.8;
      ctx.fillStyle = i % 2 ? a : s;
      ctx.fillRect(sx, sy, 2.5, 2.5);
    }
  }
  ctx.restore();

  // Title
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale * 1.04); // subtle punch-in on lock-on
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxW = w * 0.58;
  const fs = fitFontSize(ctx, main, maxW, Math.min(w * 0.075, 72), TITLE_FONT);
  ctx.font = `900 ${fs}px ${TITLE_FONT}`;
  ctx.fillStyle = '#000';
  ctx.fillText(main, 4, 4);
  const gold = ctx.createLinearGradient(0, -fs, 0, fs);
  gold.addColorStop(0, '#ffffff');
  gold.addColorStop(0.4, a);
  gold.addColorStop(0.75, p);
  gold.addColorStop(1, '#b8860b');
  ctx.fillStyle = gold;
  ctx.fillText(main, 0, 0);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = Math.max(1.2, 2.2 * ls);
  ctx.strokeText(main, 0, 0);

  drawSubtitleBadge(ctx, sub, fs * 0.62, maxW, s, p, Math.min(w * 0.028, 26), ls);
  ctx.restore();

  ctx.restore();
}
