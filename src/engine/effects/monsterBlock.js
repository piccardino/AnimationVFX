// Monster Block — broadcast "wall" slam with vector ball impact
import {
  sc, phase, clamp01, quintOut, expoOut,
  slab, kineticTitle, chip, volleyball,
  INK, SURFACE, WHITE,
} from '../broadcastKit';
import { frameRandom } from '../renderUtils';

export function renderMonsterBlock(ctx, w, h, t, cfg) {
  const k = sc(w, h);
  const P = cfg.primaryColor || '#00E5FF';
  const S2 = cfg.secondaryColor || '#7C4DFF';
  const main = cfg.mainText || 'MONSTER BLOCK';
  const sub = cfg.subText || '';
  const cx = w / 2;
  const cy = h / 2;
  const { outA } = phase(t, { inD: 0.14, outS: 0.86 });

  ctx.save();
  ctx.globalAlpha = outA;

  // Background chevron slabs drifting left
  ctx.save();
  ctx.globalAlpha = outA * 0.07;
  const chevOff = t * 150 * k;
  for (let i = 0; i < 3; i++) {
    const bx = ((i * 0.42 - 0.25) * w + chevOff) % (w + 700 * k) - 350 * k;
    slab(ctx, bx, -40, 160 * k, h + 80, 260 * k, P);
  }
  ctx.restore();

  // The wall: three staggered slabs wiping in
  const wallW = Math.min(w * 0.68, 1180 * k);
  const wallH = 86 * k;
  const gap = 10 * k;
  const wallY = cy - (wallH * 3 + gap * 2) / 2 + 6 * k;
  const wallX = cx - wallW / 2;
  for (let i = 0; i < 3; i++) {
    const p = quintOut(clamp01((t - 0.02 - i * 0.05) / 0.2));
    if (p <= 0) continue;
    const ww = p * wallW;
    const y = wallY + i * (wallH + gap);
    slab(ctx, wallX, y, ww, wallH, 18 * k, i === 1 ? INK : SURFACE, {
      k,
      line: i === 1 ? P : 'rgba(255,255,255,0.10)',
      lw: i === 1 ? 3 : 1.5,
    });
    if (p < 1) {
      ctx.fillStyle = P;
      ctx.fillRect(wallX + ww - 4 * k, y, 4 * k, wallH);
    }
  }

  // Vector ball slams into the wall
  const impT = 0.17;
  const bp = quintOut(clamp01(t / impT));
  const tx = cx + wallW * 0.06;
  const ty = cy - wallH - gap * 1.5;
  if (t <= impT + 0.03) {
    const bx = cx - w * 0.44 + (tx - (cx - w * 0.44)) * bp;
    const by = cy - h * 0.34 + (ty - (cy - h * 0.34)) * bp - Math.sin(bp * Math.PI) * 60 * k;
    volleyball(ctx, bx, by, 46 * k, { k });
  }

  // Impact ring, cracks, flash
  if (t > impT) {
    const d = t - impT;
    const ringP = clamp01(d / 0.26);
    ctx.save();
    ctx.globalAlpha = outA * (1 - ringP) * 0.6;
    ctx.strokeStyle = P;
    ctx.lineWidth = 6 * k * (1 - ringP) + 1;
    ctx.beginPath();
    ctx.arc(tx, ty, (50 + ringP * 260) * k, 0, Math.PI * 2);
    ctx.stroke();

    const rnd = frameRandom(7);
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 3 * k;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + rnd() * 0.5;
      const len = (60 + rnd() * 110) * k * expoOut(ringP);
      ctx.beginPath();
      ctx.moveTo(tx + Math.cos(a) * 30 * k, ty + Math.sin(a) * 30 * k);
      ctx.lineTo(tx + Math.cos(a) * (30 * k + len), ty + Math.sin(a) * (30 * k + len));
      ctx.stroke();
    }
    ctx.restore();

    if (d < 0.09) {
      ctx.globalAlpha = outA * (1 - d / 0.09) * 0.26;
      ctx.fillStyle = WHITE;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = outA;
    }
  }

  // Title + underline + chip
  const fs = kineticTitle(ctx, main, cx, cy - 4 * k, {
    k, t, start: 0.22, stagger: 0.024, maxW: wallW - 70 * k,
    size: Math.min(w * 0.06, 72 * k),
    grad: [[0, '#FFFFFF'], [1, '#C9D6FF']],
  });
  const barP = quintOut(clamp01((t - 0.36) / 0.25));
  if (barP > 0) {
    const bw = 360 * k * barP;
    ctx.fillStyle = P;
    ctx.fillRect(cx - bw / 2, cy + fs * 0.64, bw, 9 * k);
    ctx.fillStyle = S2;
    ctx.fillRect(cx + bw / 2 - 44 * k * barP, cy + fs * 0.64, 44 * k * barP, 9 * k);
  }
  if (sub) {
    chip(ctx, sub.replace(/\n/g, ' '), cx, cy + fs * 0.64 + 56 * k, {
      k, color: S2, size: 26 * k, reveal: quintOut(clamp01((t - 0.44) / 0.22)),
    });
  }

  ctx.restore();
}
