// VFX renderer: Perfect Set
import {
  drawSubtitleBadge, TITLE_FONT,
  enterExit, frameRandom,
} from '../renderUtils';

export function renderPerfectSet(ctx, w, h, t, cfg) {
  const p = cfg.primaryColor || '#e040fb';
  const s = cfg.secondaryColor || '#00e5ff';
  const a = cfg.accentColor || '#ffffff';
  const main = cfg.mainText || 'PERFECT SET';
  const sub = cfg.subText || '';
  const ls = Math.min(1.4, Math.max(0.6, (cfg.lineThickness ?? 0.8) * 1.25));
  const cx = w / 2;
  const cy = h / 2;
  const min = Math.min(w, h);
  const { alpha, scale } = enterExit(t, { inEnd: 0.22, outStart: 0.82 });

  ctx.save();
  ctx.globalAlpha = alpha;

  // Cosmic gradient backdrop
  const cosmic = ctx.createRadialGradient(cx, cy, 0, cx, cy, min * 0.42);
  cosmic.addColorStop(0, `${p}30`);
  cosmic.addColorStop(0.55, `${s}1e`);
  cosmic.addColorStop(1, 'transparent');
  ctx.fillStyle = cosmic;
  ctx.fillRect(0, 0, w, h);

  // Golden volleyball halo behind the emoji icon
  const haloY = cy - min * 0.17;
  const haloPulse = 1 + Math.sin(t * 7) * 0.06;
  const haloR = min * 0.085 * haloPulse;
  const halo = ctx.createRadialGradient(cx, haloY, haloR * 0.3, cx, haloY, haloR);
  halo.addColorStop(0, `${a}cc`);
  halo.addColorStop(0.5, `${s}66`);
  halo.addColorStop(1, 'transparent');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, haloY, haloR, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.round(min * 0.075)}px ${TITLE_FONT}`;
  ctx.shadowColor = s;
  ctx.shadowBlur = 18 * ls;
  ctx.fillText('🏐✨', cx, haloY);
  ctx.restore();

  // Multi-axis celestial orbits with glowing satellites
  ctx.save();
  ctx.translate(cx, cy + min * 0.05);
  for (let orbit = 0; orbit < 3; orbit++) {
    const rA = min * (0.2 + orbit * 0.07);
    const rB = rA * (0.32 + orbit * 0.08);
    ctx.rotate(Math.sin(t * 0.9 + orbit) * 0.35);
    ctx.strokeStyle = orbit % 2 ? `${s}77` : `${p}77`;
    ctx.lineWidth = Math.max(1, 1.4 * ls);
    ctx.beginPath();
    ctx.ellipse(0, 0, rA, rB, 0, 0, Math.PI * 2);
    ctx.stroke();

    const satAng = t * (2.2 - orbit * 0.45) + orbit * 2.4;
    const sx = Math.cos(satAng) * rA;
    const sy = Math.sin(satAng) * rB;
    ctx.save();
    ctx.shadowColor = orbit % 2 ? s : p;
    ctx.shadowBlur = 14 * ls;
    ctx.fillStyle = orbit % 2 ? s : a;
    ctx.beginPath();
    ctx.arc(sx, sy, 4.5 * ls, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Stardust twinkle field
  const rnd = frameRandom(Math.floor(t * 60) + 33);
  for (let i = 0; i < 26; i++) {
    const dx = (rnd() - 0.5) * w * 0.85;
    const dy = (rnd() - 0.5) * h * 0.75;
    const tw = Math.sin(t * 10 + i * 2.3);
    if (tw > 0.3) {
      ctx.save();
      ctx.globalAlpha = tw * 0.85 * alpha;
      ctx.fillStyle = i % 2 ? a : s;
      ctx.shadowColor = p;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(dx, dy, 1.6 + rnd() * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Title
  ctx.save();
  ctx.translate(cx, cy + min * 0.05);
  ctx.scale(scale, scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxW = w * 0.58;
  const fs = fitFontSize(ctx, main, maxW, Math.min(w * 0.075, 72), TITLE_FONT);
  ctx.font = `900 ${fs}px ${TITLE_FONT}`;
  ctx.fillStyle = '#000';
  ctx.fillText(main, 4, 4);
  const celestial = ctx.createLinearGradient(0, -fs, 0, fs);
  celestial.addColorStop(0, '#ffffff');
  celestial.addColorStop(0.4, p);
  celestial.addColorStop(0.8, s);
  celestial.addColorStop(1, '#800080');
  ctx.fillStyle = celestial;
  ctx.fillText(main, 0, 0);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = Math.max(1.2, 2.2 * ls);
  ctx.strokeText(main, 0, 0);

  drawSubtitleBadge(ctx, sub, fs * 0.6, maxW, s, p, Math.min(w * 0.028, 24), ls);
  ctx.restore();

  ctx.restore();
}
