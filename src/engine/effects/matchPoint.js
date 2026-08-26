// Match Point — broadcast alert: ticker tapes, strobe frame and score bug
import {
  sc, phase, clamp01, quintOut,
  slab, hazard, kineticTitle, tracked,
  SURFACE,
} from '../broadcastKit';
import { frameRandom } from '../renderUtils';

export function renderMatchPoint(ctx, w, h, t, cfg) {
  const k = sc(w, h);
  const P = cfg.primaryColor || '#FF0055';
  const S2 = cfg.secondaryColor || '#FFCC00';
  const main = cfg.mainText || 'SET POINT';
  const sub = cfg.subText || '';
  const cx = w / 2;
  const cy = h / 2;
  const strobe = Math.floor(t * 16) % 2 === 0;
  const { outA } = phase(t, { inD: 0.1, outS: 0.87 });

  ctx.save();
  ctx.globalAlpha = outA;

  // Top & bottom scrolling hazard tapes
  const tapeH = 16 * k;
  hazard(ctx, 0, h * 0.085, w, tapeH, P, k, t * 320 * k, 30 * k);
  hazard(ctx, 0, h - h * 0.085 - tapeH, w, tapeH, S2, k, -t * 320 * k, 30 * k);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(0, h * 0.085 - 5 * k, w, 2 * k);
  ctx.fillRect(0, h - h * 0.085 + tapeH + 3 * k, w, 2 * k);

  // Central alert slab with glitch entrance
  const glitch = t < 0.12 ? (frameRandom(Math.floor(t * 400) || 3)() - 0.5) * 16 * k : 0;
  const aw = Math.min(w * 0.58, 940 * k);
  const ah = h * 0.2;
  const ap = quintOut(clamp01((t - 0.04) / 0.2));
  if (ap > 0) {
    ctx.save();
    ctx.translate(cx + glitch, cy);
    slab(ctx, -aw / 2 - 10 * k, -ah / 2 - 10 * k, aw + 20 * k, ah + 20 * k, 22 * k, null, {
      k, line: strobe ? P : S2, lw: 2.5,
    });
    slab(ctx, -aw / 2, -ah / 2, aw * ap, ah, 20 * k, SURFACE, { k, line: 'rgba(255,255,255,0.12)', lw: 1.5 });
    ctx.restore();
  }

  // Pulsing siren bars on both sides
  for (const side of [-1, 1]) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 10 + (side > 0 ? Math.PI : 0));
    const sx = cx + side * (aw / 2 + 54 * k);
    ctx.save();
    ctx.globalAlpha = outA * (0.35 + 0.65 * pulse);
    ctx.fillStyle = side < 0 ? P : S2;
    for (let i = 0; i < 3; i++) {
      const bh2 = (26 + i * 18) * k;
      const bxx = sx + (i - 1) * 20 * k;
      ctx.fillRect(bxx - 5 * k, cy - bh2 / 2, 10 * k, bh2);
    }
    ctx.restore();
  }

  // Headline + kicker + sub
  const fs = kineticTitle(ctx, main, cx, cy - 6 * k, {
    k, t, start: 0.14, stagger: 0.024, maxW: aw - 80 * k,
    size: Math.min(w * 0.062, 74 * k),
    grad: [[0, '#FFFFFF'], [0.55, strobe ? P : S2], [1, strobe ? S2 : P]],
  });
  tracked(ctx, 'DECISIVE RALLY', cx, cy - ah / 2 - 26 * k, {
    k, size: 24 * k, color: 'rgba(255,255,255,0.85)', track: 10, align: 'center', weight: '900',
  });
  if (sub) {
    const cp = quintOut(clamp01((t - 0.4) / 0.2));
    ctx.save();
    ctx.globalAlpha = outA * cp;
    tracked(ctx, sub.replace(/\n/g, ' ').toUpperCase(), cx, cy + fs * 0.72, {
      k, size: 26 * k, color: strobe ? S2 : P, track: 6, align: 'center', weight: '800',
    });
    ctx.restore();
  }

  // Score bug sliding in bottom-right
  const bugW = 190 * k, bugH = 74 * k;
  const bugP = quintOut(clamp01((t - 0.3) / 0.24));
  if (bugP > 0) {
    const bxp = w - bugW - w * 0.05 + (1 - bugP) * (bugW + 60 * k);
    const byp = h - bugH - h * 0.11;
    slab(ctx, bxp, byp, bugW, bugH, 14 * k, SURFACE, { k, line: 'rgba(255,255,255,0.15)', lw: 1.5 });
    ctx.fillStyle = P;
    ctx.fillRect(bxp, byp, 8 * k, bugH);
    tracked(ctx, 'MATCH', bxp + 26 * k, byp + bugH * 0.32, {
      k, size: 20 * k, color: 'rgba(255,255,255,0.7)', track: 5, weight: '900',
    });
    tracked(ctx, 'POINTS', bxp + 26 * k, byp + bugH * 0.7, {
      k, size: 20 * k, color: S2, track: 5, weight: '900',
    });
  }

  ctx.restore();
}

