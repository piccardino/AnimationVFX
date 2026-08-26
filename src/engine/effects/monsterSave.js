// VFX renderer: Monster Save / Great Dig
import {
  drawSubtitleBadge, TITLE_FONT,
  easeOutExpo, enterExit, frameRandom,
} from '../renderUtils';

export function renderMonsterSave(ctx, w, h, t, cfg) {
  const p = cfg.primaryColor || '#00ff87';
  const s = cfg.secondaryColor || '#60efff';
  const a = cfg.accentColor || '#ffffff';
  const main = cfg.mainText || 'MONSTER SAVE';
  const sub = cfg.subText || '';
  const ls = Math.min(1.4, Math.max(0.6, (cfg.lineThickness ?? 0.8) * 1.25));
  const cx = w / 2;
  const cy = h * 0.46;
  const min = Math.min(w, h);
  const { alpha, scale } = enterExit(t, { inEnd: 0.2, outStart: 0.82 });

  ctx.save();
  ctx.globalAlpha = alpha;

  // Translucent aqua energy dome
  const domeR = min * (0.2 + easeOutExpo(Math.min(1, t / 0.4)) * 0.1);
  const dome = ctx.createRadialGradient(cx, cy + min * 0.08, domeR * 0.15, cx, cy + min * 0.08, domeR);
  dome.addColorStop(0, `${s}40`);
  dome.addColorStop(0.65, `${p}2a`);
  dome.addColorStop(1, 'transparent');
  ctx.fillStyle = dome;
  ctx.beginPath();
  ctx.arc(cx, cy + min * 0.08, domeR, 0, Math.PI * 2);
  ctx.fill();

  // Defensive liquid ripple waves expanding outward
  for (let k = 0; k < 3; k++) {
    const wt = ((t * 1.4 + k * 0.33) % 1);
    const rw = min * (0.06 + wt * 0.3);
    ctx.save();
    ctx.globalAlpha = alpha * (1 - wt) * 0.55;
    ctx.strokeStyle = k % 2 ? p : s;
    ctx.lineWidth = Math.max(1.5, 3 * ls * (1 - wt));
    ctx.shadowColor = s;
    ctx.shadowBlur = 12 * ls;
    ctx.beginPath();
    ctx.ellipse(cx, cy + min * 0.14, rw, rw * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Hydro splash droplets rising then falling
  const rnd = frameRandom(Math.floor(t * 80) + 11);
  ctx.save();
  for (let i = 0; i < 20; i++) {
    const life = ((t * 1.6 + rnd()) % 1);
    const bx = cx + (rnd() - 0.5) * min * 0.5;
    const by = cy + min * 0.18 - Math.sin(life * Math.PI) * min * (0.16 + rnd() * 0.14);
    const size = (1 - life) * (2.5 + rnd() * 3.5) * ls;
    ctx.globalAlpha = alpha * (1 - life) * 0.9;
    ctx.fillStyle = i % 3 === 0 ? a : i % 2 === 0 ? s : p;
    ctx.shadowColor = s;
    ctx.shadowBlur = 8 * ls;
    ctx.beginPath();
    ctx.arc(bx, by, Math.max(1, size), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Wavy hydro-electric horizontal energy lines
  ctx.save();
  ctx.globalAlpha = alpha * 0.5;
  for (let line = 0; line < 3; line++) {
    const ly = cy + min * (0.05 + line * 0.07);
    ctx.strokeStyle = line % 2 ? p : s;
    ctx.lineWidth = Math.max(1, 1.6 * ls);
    ctx.shadowColor = p;
    ctx.shadowBlur = 8 * ls;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 24) {
      const y = ly + Math.sin(x * 0.02 + t * 6 + line * 2) * 7 * (line + 1) * ls;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Title
  ctx.save();
  ctx.translate(cx, cy - min * 0.04);
  ctx.scale(scale, scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = `900 ${Math.round(min * 0.07)}px ${TITLE_FONT}`;
  ctx.fillStyle = s;
  ctx.fillText('🧤💥', 0, -h * 0.13);

  const maxW = w * 0.62;
  const fs = fitFontSize(ctx, main, maxW, Math.min(w * 0.075, 72), TITLE_FONT);
  ctx.font = `900 ${fs}px ${TITLE_FONT}`;
  ctx.fillStyle = '#000';
  ctx.fillText(main, 4, 4);
  const aqua = ctx.createLinearGradient(0, -fs, 0, fs);
  aqua.addColorStop(0, '#ffffff');
  aqua.addColorStop(0.4, a);
  aqua.addColorStop(0.75, p);
  aqua.addColorStop(1, s);
  ctx.fillStyle = aqua;
  ctx.fillText(main, 0, 0);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = Math.max(1.2, 2.2 * ls);
  ctx.strokeText(main, 0, 0);

  drawSubtitleBadge(ctx, sub, fs * 0.62, maxW, s, p, Math.min(w * 0.03, 27), ls);
  ctx.restore();

  ctx.restore();
}
