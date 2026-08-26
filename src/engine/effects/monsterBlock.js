// VFX renderers: Monster Block, Super Spike, Service Ace
import {
  drawSubtitleBadge, fitFontSize, TITLE_FONT,
  easeOutExpo, enterExit, frameRandom,
} from '../renderUtils';

function colors(cfg) {
  return {
    p: cfg.primaryColor || '#00e5ff',
    s: cfg.secondaryColor || '#7c4dff',
    a: cfg.accentColor || '#ffffff',
    main: cfg.mainText || '',
    sub: cfg.subText || '',
    ls: Math.min(1.4, Math.max(0.6, (cfg.lineThickness ?? 0.8) * 1.25)),
  };
}

/* ---------------- MONSTER BLOCK ---------------- */
export function renderMonsterBlock(ctx, w, h, t, cfg) {
  const { p, s, a, main, sub, ls } = colors(cfg);
  const cx = w / 2;
  const cy = h / 2 - h * 0.02;
  const min = Math.min(w, h);
  const { alpha, scale } = enterExit(t, { inEnd: 0.22, outStart: 0.82 });

  ctx.save();
  ctx.globalAlpha = alpha;

  // Metallic energy dome
  const domeR = min * (0.16 + easeOutExpo(Math.min(1, t / 0.35)) * 0.08);
  const domeGrad = ctx.createRadialGradient(cx, cy, domeR * 0.2, cx, cy, domeR);
  domeGrad.addColorStop(0, `${s}55`);
  domeGrad.addColorStop(0.7, `${p}33`);
  domeGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = domeGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, domeR, 0, Math.PI * 2);
  ctx.fill();

  // Hex-frame shield outline
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 0.6);
  ctx.strokeStyle = p;
  ctx.lineWidth = Math.max(2, 3.5 * ls);
  ctx.shadowColor = p;
  ctx.shadowBlur = 18 * ls;
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const r = domeR * 1.12;
    if (i === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
    else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
  }
  ctx.stroke();
  ctx.restore();

  // Double shockwave rings triggered at impact (~0.15)
  if (t > 0.15) {
    for (let k = 0; k < 2; k++) {
      const bt = (t - 0.15 - k * 0.08) / 0.7;
      if (bt > 0 && bt < 1) {
        const rr = min * (0.08 + bt * 0.42);
        ctx.globalAlpha = alpha * (1 - bt) * (k === 0 ? 0.85 : 0.5);
        const rg = ctx.createRadialGradient(cx, cy, rr * 0.55, cx, cy, rr);
        rg.addColorStop(0, 'transparent');
        rg.addColorStop(0.55, s);
        rg.addColorStop(0.85, p);
        rg.addColorStop(1, 'transparent');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Deterministic sparks + electric arcs
  const rnd = frameRandom(Math.floor(t * 120));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = Math.min(1, alpha * 0.9);
  ctx.lineCap = 'round';
  for (let i = 0; i < 22; i++) {
    const ang = rnd() * Math.PI * 2;
    const dist = min * 0.12 + ((t * min * 0.9 + i * 31) % (min * 0.38));
    const len = 8 + rnd() * 26 * ls;
    ctx.strokeStyle = i % 3 === 0 ? a : i % 2 === 0 ? s : p;
    ctx.lineWidth = Math.max(1.5, 2.4 * ls);
    ctx.shadowColor = p;
    ctx.shadowBlur = 10 * ls;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * dist, Math.sin(ang) * dist);
    ctx.lineTo(Math.cos(ang) * (dist + len), Math.sin(ang) * (dist + len));
    ctx.stroke();
  }

  // Electric zigzag bolts around the shield
  if (t > 0.1) {
    for (let b = 0; b < 4; b++) {
      const baseAng = (b / 4) * Math.PI * 2 + t * 1.4;
      let px = Math.cos(baseAng) * domeR * 1.05;
      let py = Math.sin(baseAng) * domeR * 1.05;
      ctx.beginPath();
      ctx.moveTo(px, py);
      for (let seg = 0; seg < 3; seg++) {
        px += (rnd() - 0.5) * 34;
        py += (rnd() - 0.5) * 34;
        ctx.lineTo(px, py);
      }
      ctx.strokeStyle = a;
      ctx.lineWidth = Math.max(1, 1.6 * ls);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Title block
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.round(min * 0.075)}px ${TITLE_FONT}`;
  ctx.fillStyle = s;
  ctx.fillText('🛡️', 0, -h * 0.145);

  const maxW = w * 0.6;
  const fs = fitFontSize(ctx, main, maxW, Math.min(w * 0.078, 74));
  ctx.font = `900 ${fs}px ${TITLE_FONT}`;
  ctx.fillStyle = '#000';
  ctx.fillText(main, 4, 4);
  const grad = ctx.createLinearGradient(0, -fs, 0, fs);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.45, p);
  grad.addColorStop(1, s);
  ctx.fillStyle = grad;
  ctx.fillText(main, 0, 0);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = Math.max(1.2, 2.2 * ls);
  ctx.strokeText(main, 0, 0);

  drawSubtitleBadge(ctx, sub, fs * 0.62, maxW, s, p, Math.min(w * 0.03, 28), ls);
  ctx.restore();

  // White flash on impact
  if (t >= 0.13 && t < 0.24) {
    ctx.globalAlpha = (1 - (t - 0.13) / 0.11) * 0.32 * alpha;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }

  ctx.restore();
}
