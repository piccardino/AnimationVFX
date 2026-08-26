// Perfect Set — orbiting assist geometry with floating ball and elite tag
import {
  sc, phase, clamp01, quintOut,
  slab, kineticTitle, volleyball, tracked,
  SURFACE, WHITE,
} from '../broadcastKit';

export function renderPerfectSet(ctx, w, h, t, cfg) {
  const k = sc(w, h);
  const P = cfg.primaryColor || '#E040FB';
  const S2 = cfg.secondaryColor || '#00E5FF';
  const main = cfg.mainText || 'PERFECT SET';
  const sub = cfg.subText || '';
  const cx = w / 2;
  const cy = h / 2;
  const { outA } = phase(t, { outS: 0.86 });

  ctx.save();
  ctx.globalAlpha = outA;

  // Center stage panel (slim vertical slab)
  const pw = Math.min(w * 0.6, 1000 * k);
  const ph = h * 0.4;
  const pp = quintOut(clamp01((t - 0.06) / 0.34));
  if (pp > 0) {
    const pwv = pw * pp;
    slab(ctx, cx - pwv / 2, cy - ph / 2, pwv, ph, 26 * k, SURFACE, {
      k, line: 'rgba(255,255,255,0.10)', lw: 1.5,
    });
    // corner accent dots
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      ctx.fillStyle = P;
      ctx.beginPath();
      ctx.arc(cx + (dx * pwv) / 2 - dx * 18 * k, cy + (dy * ph) / 2 - dy * 18 * k, 4 * k, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Floating ball hovering above the panel with slow spin
  const hoverY = cy - ph / 2 - 92 * k + Math.sin(t * 2.6) * 10 * k;
  volleyball(ctx, cx, hoverY, 52 * k, { k });

  // Orbit rings + satellites around the ball
  const grow = quintOut(clamp01((t - 0.18) / 0.4));
  ctx.save();
  ctx.translate(cx, hoverY);
  for (let o = 0; o < 2; o++) {
    const rx = (110 + o * 58) * k * grow;
    const ry = rx * (0.36 + o * 0.1);
    ctx.globalAlpha = outA * grow * 0.8;
    ctx.rotate(Math.sin(t * 0.7 + o * 1.4) * 0.3);
    ctx.strokeStyle = o % 2 ? `${S2}AA` : `${P}AA`;
    ctx.lineWidth = 2 * k;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    const sa = t * (2.4 - o * 0.7) + o * 2.2;
    ctx.fillStyle = o % 2 ? S2 : P;
    ctx.beginPath();
    ctx.arc(Math.cos(sa) * rx, Math.sin(sa) * ry, 6 * k, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Precision assist ticks around the ball (radar feel)
  if (grow > 0.2) {
    ctx.save();
    ctx.translate(cx, hoverY);
    ctx.globalAlpha = outA * 0.5;
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 2 * k;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + t * 0.5;
      const r1 = 74 * k;
      const r2 = r1 + (i % 3 === 0 ? 14 : 8) * k;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Title + elite tag + sub chip
  const fs = kineticTitle(ctx, main, cx, cy - 8 * k, {
    k, t, start: 0.3, stagger: 0.026, maxW: pw - 90 * k,
    size: Math.min(w * 0.056, 66 * k),
    grad: [[0, '#FFFFFF'], [0.6, '#F3C6FF'], [1, P]],
  });
  if (t > 0.5) {
    const tp = quintOut(clamp01((t - 0.5) / 0.22));
    ctx.save();
    ctx.globalAlpha = outA * tp;
    tracked(ctx, 'ASSIST MASTER', cx, cy + fs * 0.42, {
      k, size: 24 * k, color: S2, track: 9, align: 'center', weight: '900',
    });
    ctx.restore();
  }
  if (sub) {
    chip(ctx, sub.replace(/\n/g, ' '), cx, cy + fs * 0.78 + 18 * k, {
      k, color: P, size: 24 * k, reveal: quintOut(clamp01((t - 0.58) / 0.22)),
    });
  }

  ctx.restore();
}
