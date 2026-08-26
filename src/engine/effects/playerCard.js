// Player Spotlight Card — broadcast lower third with jersey block and stat strip
import {
  sc, clamp01, quintOut,
  slab, tracked, volleyball,
  SURFACE, WHITE,
} from '../broadcastKit';
import { roundRectPath, BODY_FONT } from '../renderUtils';

export function renderPlayerCard(ctx, w, h, t, cfg) {
  const k = sc(w, h);
  const P = cfg.primaryColor || '#7C3AED';
  const S2 = cfg.secondaryColor || '#06B6D4';
  const name = (cfg.mainText || 'NOME GIOCATORE').replace(/[()]/g, '').trim();
  const roleLine = (cfg.subText || '').replace(/[()]/g, '').trim();

  // Parse "#N • ROLE" or "ROLE" formats
  let number = '';
  let role = roleLine;
  const m = roleLine.match(/^#?\s*(\d+)\s*[•\-–]?\s*/i);
  if (m) {
    number = m[1];
    role = roleLine.slice(m[0].length).trim() || roleLine;
  }

  const cardH = 148 * k;
  const cardY = h - cardH - h * 0.1;
  const enter = quintOut(clamp01(t / 0.22));
  const exit = 1 - clamp01((t - 0.86) / 0.14);
  const slide = (1 - enter) * (w * 0.5);

  ctx.save();
  ctx.globalAlpha = exit;
  ctx.translate(-slide, 0);

  const x = w * 0.06;
  const numW = cardH * 1.06;
  const nameSize = 54 * k;
  const roleSize = 27 * k;

  ctx.font = `900 ${nameSize}px ${BODY_FONT}`;
  const nameW = ctx.measureText(name).width;
  ctx.font = `800 ${roleSize}px ${BODY_FONT}`;
  const roleW = ctx.measureText(role.toUpperCase()).width;
  const cardW = Math.min(w * 0.78, numW + Math.max(nameW, roleW) + 120 * k);

  // Main card slab
  slab(ctx, x, cardY, cardW * enter, cardH, 24 * k, SURFACE, {
    k, line: 'rgba(255,255,255,0.12)', lw: 1.5,
  });

  // Jersey number block (gradient team colors)
  const nbW = numW * enter;
  const grad = ctx.createLinearGradient(x, cardY, x + nbW, cardY + cardH);
  grad.addColorStop(0, P);
  grad.addColorStop(1, S2);
  slab(ctx, x, cardY, nbW, cardH, 24 * k, grad, { k });

  // Jersey number with scale pop
  if (number) {
    const pop = quintOut(clamp01((t - 0.16) / 0.26));
    ctx.save();
    ctx.translate(x + nbW / 2, cardY + cardH / 2);
    ctx.scale(0.6 + 0.4 * pop, 0.6 + 0.4 * pop);
    ctx.globalAlpha = exit * pop;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${62 * k}px ${BODY_FONT}`;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillText(number, 0, 5 * k);
    ctx.fillStyle = WHITE;
    ctx.fillText(number, 0, 0);
    ctx.restore();
  } else {
    volleyball(ctx, x + nbW / 2, cardY + cardH / 2, 30 * k, { k });
  }

  // Name with per-word highlight of the last name
  const textX = x + numW + 34 * k;
  const nameY = cardY + cardH * 0.42;
  const nameP = quintOut(clamp01((t - 0.24) / 0.24));
  if (nameP > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 10 * k, cardY - 10 * k, (cardW + 20 * k) * clamp01((t - 0.2) / 0.3), cardH + 20 * k);
    ctx.clip();
    ctx.globalAlpha = exit * nameP;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const words = name.split(/\s+/);
    const last = words.pop() || '';
    ctx.font = `900 ${nameSize}px ${BODY_FONT}`;
    const firstText = words.join(' ');
    const firstW = firstText ? ctx.measureText(firstText + ' ').width : 0;
    ctx.fillStyle = WHITE;
    if (firstText) ctx.fillText(firstText, textX, nameY);
    // last name in team gradient
    const lg = ctx.createLinearGradient(textX + firstW, nameY - nameSize, textX + firstW, nameY);
    lg.addColorStop(0, WHITE);
    lg.addColorStop(1, P);
    ctx.fillStyle = lg;
    ctx.fillText(last, textX + firstW, nameY);
    ctx.restore();

    // underline sweep under the name
    const uw = (firstW + ctx.measureText(last).width) * quintOut(clamp01((t - 0.4) / 0.24));
    ctx.fillStyle = P;
    ctx.fillRect(textX, nameY + 16 * k, uw, 4 * k);
  }

  // Role line
  if (role) {
    const rp = quintOut(clamp01((t - 0.34) / 0.22));
    ctx.save();
    ctx.globalAlpha = exit * rp;
    tracked(ctx, role.toUpperCase(), textX, cardY + cardH * 0.72, {
      k, size: roleSize, color: 'rgba(255,255,255,0.82)', track: 3, weight: '800',
    });
    ctx.restore();
  }

  // Team chip on the right edge
  if (t > 0.5) {
    const cp = quintOut(clamp01((t - 0.5) / 0.22));
    const chipW = 150 * k, chipH = 46 * k;
    const chX = x + cardW * enter - chipW - 20 * k;
    const chY = cardY - chipH / 2;
    ctx.save();
    ctx.globalAlpha = exit * cp;
    slab(ctx, chX + (1 - cp) * 40 * k, chY, chipW, chipH, 10 * k, P, { k });
    tracked(ctx, 'ON COURT', chX + (1 - cp) * 40 * k + chipW / 2, chY + chipH / 2 + 1, {
      k, size: 19 * k, color: WHITE, track: 3, align: 'center', weight: '900',
    });
    ctx.restore();
  }

  // Shimmer pass across the card
  if (t > 0.35 && t < 0.8) {
    ctx.save();
    roundRectPath(ctx, x, cardY, cardW * enter, cardH, 20 * k);
    ctx.clip();
    const shX = x + ((t - 0.35) / 0.45) * (cardW + 300 * k) - 150 * k;
    const sg = ctx.createLinearGradient(shX - 120 * k, 0, shX + 120 * k, cardH);
    sg.addColorStop(0, 'rgba(255,255,255,0)');
    sg.addColorStop(0.5, 'rgba(255,255,255,0.14)');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(x, cardY, cardW, cardH);
    ctx.restore();
  }

  ctx.restore();
}
