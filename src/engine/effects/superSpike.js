// Super Spike — speed lines, ball strike and split-panel reveal
import {
  sc, phase, clamp01, quintOut,
  slab, kineticTitle, volleyball, tracked,
  SURFACE,
} from '../broadcastKit';

export function renderSuperSpike(ctx, w, h, t, cfg) {
  const k = sc(w, h);
  const P = cfg.primaryColor || '#FF3D00';
  const S2 = cfg.secondaryColor || '#FFEA00';
  const main = cfg.mainText || 'SUPER SPIKE!';
  const cx = w / 2;
  const cy = h / 2;
  const { outA } = phase(t, { outS: 0.86 });

  ctx.save();
  ctx.globalAlpha = outA;

  // Speed dash bands racing left
  for (const [bandY, color] of [[cy - h * 0.31, P], [cy + h * 0.31, S2]]) {
    ctx.save();
    ctx.globalAlpha = outA * 0.13;
    ctx.fillStyle = color;
    const dash = 90 * k, gap = 70 * k, off = (t * 1500 * k) % (dash + gap);
    for (let x = -dash - gap + off; x < w + dash; x += dash + gap) {
      ctx.fillRect(x, bandY - 4 * k, dash, 8 * k);
    }
    ctx.restore();
  }

  // Incoming ball with afterimages
  const impT = 0.15;
  const posAt = (tt) => {
    const p = tt <= 0 ? 0 : quintOut(clamp01(tt / impT));
    return [cx - w * 0.52 + w * 0.52 * p, cy - h * 0.10 + h * 0.10 * p - Math.sin(p * Math.PI) * 70 * k];
  };
  for (let i = 5; i >= 1; i--) {
    const tt = t - i * 0.013;
    if (tt <= 0 || tt > impT) continue;
    const [ax, ay] = posAt(tt);
    ctx.save();
    ctx.globalAlpha = outA * 0.22 * (1 - i / 6);
    ctx.fillStyle = P;
    ctx.beginPath();
    ctx.arc(ax, ay, 40 * k * (1 - i * 0.1), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (t <= impT + 0.02) {
    const [bx, by] = posAt(t);
    volleyball(ctx, bx, by, 46 * k, { k });
  }

  // Split panels clapping shut at impact, then opening to reveal the title
  const clapP = quintOut(clamp01((t - impT) / 0.12));
  const panelH = h * 0.155;
  const skew = 26 * k;
  if (clapP > 0) {
    const slide = (1 - clapP) * w;
    slab(ctx, -w + slide, cy - panelH - 8 * k, w + skew, panelH, skew, SURFACE, { k, line: 'rgba(255,255,255,0.08)', lw: 1.5 });
    slab(ctx, w - slide, cy + 8 * k, w + skew, panelH, skew, SURFACE, { k, line: 'rgba(255,255,255,0.08)', lw: 1.5 });
    ctx.fillStyle = P;
    ctx.fillRect(0, cy - 8 * k - 5 * k, w * clapP, 5 * k);
    ctx.fillStyle = S2;
    ctx.fillRect(w - w * clapP, cy + 8 * k, w * clapP, 5 * k);
  }

  // Radial sparks on impact
  if (t > impT && t < impT + 0.3) {
    const d = (t - impT) / 0.3;
    ctx.save();
    ctx.globalAlpha = outA * (1 - d);
    ctx.strokeStyle = S2;
    ctx.lineWidth = 4 * k;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.4;
      const r1 = (60 + d * 160) * k;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * (r1 + 70 * k), cy + Math.sin(a) * (r1 + 70 * k));
      ctx.stroke();
    }
    ctx.restore();
  }

  // Title + live speed ticker
  const fs = kineticTitle(ctx, main, cx, cy, {
    k, t, start: impT + 0.1, stagger: 0.024, maxW: w * 0.72,
    size: Math.min(w * 0.064, 76 * k),
    grad: [[0, '#FFFFFF'], [0.55, '#FFE9A8'], [1, P]],
  });
  const spd = Math.floor(115 * quintOut(clamp01((t - impT - 0.16) / 0.5)));
  if (spd > 0) {
    tracked(ctx, `${spd} KM/H`, cx, cy + fs * 0.72, {
      k, size: 30 * k, color: S2, track: 6, align: 'center', weight: '900',
    });
  }

  ctx.restore();
}
