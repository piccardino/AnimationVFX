// Monster Save — dive wave with liquid sweep panel and save counter
import {
  sc, phase, clamp01, quintOut,
  kineticTitle, volleyball, tracked,
  SURFACE,
} from '../broadcastKit';

export function renderMonsterSave(ctx, w, h, t, cfg) {
  const k = sc(w, h);
  const P = cfg.primaryColor || '#00FF87';
  const S2 = cfg.secondaryColor || '#60EFFF';
  const main = cfg.mainText || 'MONSTER SAVE';
  const sub = cfg.subText || '';
  const cx = w / 2;
  const cy = h / 2;
  const { outA } = phase(t, { outS: 0.86 });

  ctx.save();
  ctx.globalAlpha = outA;

  // Diving ball: crosses the frame low and fast, gets "saved" mid-air
  const diveT = 0.34;
  const dp = quintOut(clamp01(t / diveT));
  const ballY = cy + h * 0.14;
  const bx = -80 * k + (w + 160 * k) * dp;
  if (t <= diveT + 0.05) {
    volleyball(ctx, bx, ballY - Math.sin(dp * Math.PI) * 30 * k, 42 * k, { k });
  }

  // Liquid sweep: two wave-stacked panels wipe across, then settle as the stage
  const sweep = quintOut(clamp01((t - 0.08) / 0.4));
  if (sweep > 0) {
    const panelW = w * 0.78 * sweep;
    const px = cx - panelW / 2;
    const py = cy - h * 0.16;
    const ph = h * 0.36;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + panelW, py);
    // wavy bottom edge
    for (let i = 10; i >= 0; i--) {
      const wx = px + (panelW * i) / 10;
      const wy = py + ph + Math.sin(i * 1.3 + t * 5) * 8 * k;
      ctx.lineTo(wx, wy);
    }
    ctx.closePath();
    ctx.fillStyle = SURFACE;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 22 * k;
    ctx.shadowOffsetY = 7 * k;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1.5 * k;
    ctx.stroke();

    // inner liquid lines
    ctx.clip();
    ctx.globalAlpha = outA * 0.25;
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = i % 2 ? P : S2;
      ctx.lineWidth = 2 * k;
      ctx.beginPath();
      for (let x = 0; x <= panelW; x += 18 * k) {
        const y = py + ph * (0.3 + i * 0.22) + Math.sin(x * 0.012 + t * 4 + i * 1.7) * 9 * k;
        if (x === 0) ctx.moveTo(px + x, y); else ctx.lineTo(px + x, y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // top & bottom accent rules
    ctx.fillStyle = P;
    ctx.fillRect(px, py - 5 * k, panelW, 5 * k);
    ctx.fillStyle = S2;
    ctx.fillRect(px, py + ph + 14 * k, panelW * 0.4, 4 * k);
  }

  // Splash droplets at the save moment
  if (t > diveT - 0.02) {
    const d = t - (diveT - 0.02);
    ctx.save();
    ctx.globalAlpha = outA * Math.max(0, 1 - d / 0.5);
    ctx.fillStyle = S2;
    for (let i = 0; i < 14; i++) {
      const a = -Math.PI / 2 + (i - 7) * 0.16;
      const dist = (60 + (i % 4) * 34) * k * quintOut(clamp01(d / 0.4));
      const dy = dist * Math.sin(a) + d * 300 * k * 0.4;
      ctx.beginPath();
      ctx.arc(bx + Math.cos(a) * dist * 0.6, ballY + dy, (3 + (i % 3)) * k, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Title + sub chip + "SAVED" counter
  const fs = kineticTitle(ctx, main, cx, cy - 6 * k, {
    k, t, start: 0.3, stagger: 0.026, maxW: w * 0.6,
    size: Math.min(w * 0.062, 74 * k),
    grad: [[0, '#FFFFFF'], [1, P]],
  });
  if (sub) {
    chip(ctx, sub.replace(/\n/g, ' '), cx, cy + fs * 0.66, {
      k, color: S2, size: 25 * k, reveal: quintOut(clamp01((t - 0.52) / 0.22)),
    });
  }
  if (t > diveT) {
    const cp = quintOut(clamp01((t - diveT) / 0.24));
    ctx.save();
    ctx.globalAlpha = outA * cp;
    tracked(ctx, 'DIG ✱ DEFENSE', cx, cy - fs * 0.85, {
      k, size: 26 * k, color: P, track: 8, align: 'center', weight: '900',
    });
    ctx.restore();
  }

  ctx.restore();
}
