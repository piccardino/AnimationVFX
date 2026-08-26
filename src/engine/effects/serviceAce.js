// Service Ace — targeting HUD lock-on with serve trajectory and ace ticker
import {
  sc, phase, clamp01, quintOut,
  slab, kineticTitle, chip, volleyball, tracked,
  SURFACE, WHITE,
} from '../broadcastKit';

export function renderServiceAce(ctx, w, h, t, cfg) {
  const k = sc(w, h);
  const P = cfg.primaryColor || '#FFD700';
  const S2 = cfg.secondaryColor || '#FF007F';
  const main = cfg.mainText || 'SERVICE ACE!';
  const sub = cfg.subText || '';
  const cx = w / 2;
  const { outA } = phase(t, { outS: 0.87 });

  ctx.save();
  ctx.globalAlpha = outA;

  const lockT = 0.3;              // crosshair locks here
  const serveT = 0.16;            // ball serve arc starts here

  // Corner HUD brackets framing the frame
  const L = 60 * k, m = 46 * k;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 3 * k;
  const corners = [
    [m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1],
  ];
  for (const [x, y, dx, dy] of corners) {
    const gp = quintOut(clamp01((t - 0.05) / 0.3));
    ctx.beginPath();
    ctx.moveTo(x + dx * L * gp, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * L * gp);
    ctx.stroke();
  }

  // Serve arc with dashed trail and landing ball
  const ballR = 34 * k;
  const target = { x: w * 0.72, y: h * 0.62 };
  if (t >= serveT) {
    const bp = quintOut(clamp01((t - serveT) / 0.5));
    const start = { x: w * 0.2, y: h * 0.24 };
    const bx = start.x + (target.x - start.x) * bp;
    const by = start.y + (target.y - start.y) * bp - Math.sin(bp * Math.PI) * 170 * k;

    // dashed trajectory
    ctx.save();
    ctx.globalAlpha = outA * 0.5;
    ctx.strokeStyle = P;
    ctx.lineWidth = 2.5 * k;
    ctx.setLineDash([12 * k, 14 * k]);
    ctx.lineDashOffset = -t * 260 * k;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const p = (i / 40) * bp;
      const x = start.x + (target.x - start.x) * p;
      const y = start.y + (target.y - start.y) * p - Math.sin(p * Math.PI) * 170 * k;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    if (bp < 1) volleyball(ctx, bx, by, ballR, { k });
  }

  // Rotating reticle lock-on at target
  const lockP = quintOut(clamp01((t - 0.2) / (lockT - 0.2)));
  const R = 120 * k;
  ctx.save();
  ctx.translate(target.x, target.y);
  ctx.globalAlpha = outA * (0.35 + 0.65 * lockP);
  ctx.rotate(t * Math.PI * 1.6);
  ctx.strokeStyle = lockP >= 1 ? P : WHITE;
  ctx.lineWidth = 3 * k;
  for (let q = 0; q < 4; q++) {
    ctx.beginPath();
    ctx.arc(0, 0, R * (0.7 + 0.3 * lockP), (q * Math.PI) / 2 + 0.28, (q * Math.PI) / 2 + Math.PI / 2 - 0.28);
    ctx.stroke();
  }
  ctx.rotate(-t * Math.PI * 2.6);
  ctx.strokeStyle = S2;
  ctx.lineWidth = 2 * k;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.55, 0, Math.PI * 1.5);
  ctx.stroke();
  ctx.rotate(t * Math.PI * 2.6);
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 2.5 * k;
  const cross = 26 * k * lockP;
  ctx.beginPath();
  ctx.moveTo(-cross, 0); ctx.lineTo(cross, 0);
  ctx.moveTo(0, -cross); ctx.lineTo(0, cross);
  ctx.stroke();
  ctx.restore();

  // ACE confirm flash + expanding square
  if (t > lockT) {
    const d = t - lockT;
    const sp = clamp01(d / 0.32);
    ctx.save();
    ctx.globalAlpha = outA * (1 - sp) * 0.85;
    ctx.strokeStyle = P;
    ctx.lineWidth = 5 * k * (1 - sp) + 1;
    const s = R * (1 + sp * 1.6);
    ctx.strokeRect(target.x - s / 2, target.y - s / 2, s, s);
    ctx.restore();
    if (d < 0.08) {
      ctx.globalAlpha = outA * (1 - d / 0.08) * 0.2;
      ctx.fillStyle = WHITE;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = outA;
    }
  }

  // Lower-third ace banner
  const bh = 132 * k;
  const bw = Math.min(w * 0.62, 980 * k);
  const bx = cx - bw / 2;
  const by = h - bh - h * 0.12;
  const bannerP = quintOut(clamp01((t - 0.38) / 0.26));
  if (bannerP > 0) {
    ctx.save();
    const slide = (1 - bannerP) * (bw + 80 * k);
    ctx.translate(-slide, 0);
    slab(ctx, bx, by, bw, bh, 30 * k, SURFACE, { k, line: 'rgba(255,255,255,0.12)', lw: 1.5 });
    // left accent ribbon
    ctx.save();
    slabPathClip(ctx, bx, by, bw, bh, 30 * k);
    ctx.fillStyle = P;
    ctx.fillRect(bx, by, 16 * k, bh);
    ctx.fillStyle = S2;
    ctx.fillRect(bx + 16 * k, by, 6 * k, bh);
    ctx.restore();
    tracked(ctx, 'UNTOUCHABLE SERVE', bx + 52 * k, by + 36 * k, {
      k, size: 24 * k, color: 'rgba(255,255,255,0.75)', track: 7, weight: '800',
    });
    ctx.restore();

    kineticTitle(ctx, main, bx + bw / 2 + 20 * k, by + bh * 0.62, {
      k, t, start: 0.48, stagger: 0.026, maxW: bw - 110 * k,
      size: 58 * k,
      grad: [[0, '#FFFFFF'], [1, P]],
    });
  }

  if (sub) {
    chip(ctx, sub.replace(/\n/g, ' '), cx, by - 44 * k, {
      k, color: S2, size: 24 * k, reveal: quintOut(clamp01((t - 0.6) / 0.2)),
    });
  }

  ctx.restore();
}

// helper: clip to slab path
function slabPathClip(ctx, x, y, w2, h2, skew) {
  ctx.beginPath();
  ctx.moveTo(x + skew, y);
  ctx.lineTo(x + w2, y);
  ctx.lineTo(x + w2 - skew, y + h2);
  ctx.lineTo(x, y + h2);
  ctx.closePath();
  ctx.clip();
}
