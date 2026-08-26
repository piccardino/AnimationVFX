// Renderer: Player Spotlight Card (broadcast lower third)
import {
  roundRectPath, BODY_FONT,
  easeOutBack, easeOutCubic,
} from '../renderUtils';

export function renderPlayerCard(ctx, w, h, t, cfg) {
  const p = cfg.primaryColor || '#7c3aed';
  const s = cfg.secondaryColor || '#06b6d4';
  const name = (cfg.mainText || 'PLAYER NAME').replace(/[()]/g, '').trim();
  const roleLine = (cfg.subText || '').replace(/[()]/g, '').trim();

  // Parse "#N • ROLE" style subtitle
  let number = '';
  let role = roleLine;
  const numMatch = roleLine.match(/^#?\s*(\d+)\s*[•\-–]?\s*/i);
  if (numMatch) {
    number = numMatch[1];
    role = roleLine.slice(numMatch[0].length).trim() || roleLine;
  }

  const cardH = h * 0.125;
  const startX = w * 0.036;
  const startY = h - cardH - h * 0.065;

  // Smooth slide-in with broadcast back bounce
  let currentX = startX;
  if (t < 0.15) currentX = startX - (1 - easeOutBack(t / 0.15)) * w * 0.25;
  else if (t > 0.85) currentX = startX - easeOutCubic((t - 0.85) / 0.15) * w * 0.25;
  const slideFade = t > 0.85 ? 1 - easeOutCubic((t - 0.85) / 0.15) : Math.min(1, t / 0.05);

  ctx.save();
  ctx.globalAlpha = slideFade;
  ctx.translate(Math.round(currentX), Math.round(startY));

  // Measure content to compute integer card width (avoids subpixel jitter)
  ctx.font = `900 ${Math.round(cardH * 0.32)}px ${BODY_FONT}`;
  const nameWidth = ctx.measureText(name).width;
  ctx.font = `800 ${Math.round(cardH * 0.17)}px ${BODY_FONT}`;
  const roleWidth = ctx.measureText(role).width;
  const textBlockX = cardH * 1.35;
  const maxReqW = Math.max(nameWidth, roleWidth);
  const cardW = Math.min(
    Math.floor(w * 0.8),
    Math.floor(textBlockX + maxReqW + cardH * 0.42)
  );

  // Dark high-contrast glass background
  roundRectPath(ctx, 0, 0, cardW, cardH, 20);
  const bgGrad = ctx.createLinearGradient(0, 0, cardW, cardH);
  bgGrad.addColorStop(0, 'rgba(6, 10, 24, 0.97)');
  bgGrad.addColorStop(1, 'rgba(16, 22, 42, 0.98)');
  ctx.fillStyle = bgGrad;
  ctx.shadowColor = p;
  ctx.shadowBlur = 20;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Gradient border
  const borderGrad = ctx.createLinearGradient(0, 0, cardW, 0);
  borderGrad.addColorStop(0, p);
  borderGrad.addColorStop(0.7, s);
  borderGrad.addColorStop(1, p);
  roundRectPath(ctx, 0, 0, cardW, cardH, 20);
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // Left accent column with jersey number & rank halo
  roundRectPath(ctx, 0, 0, cardH * 0.92, cardH, 20);
  const sideGrad = ctx.createLinearGradient(0, 0, cardH * 0.92, cardH);
  sideGrad.addColorStop(0, p);
  sideGrad.addColorStop(1, s);
  ctx.fillStyle = sideGrad;
  ctx.save();
  ctx.clip();
  ctx.fillRect(0, 0, cardH * 0.92, cardH);

  // Rank halo circles behind the number
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = `rgba(255,255,255,${0.25 - i * 0.07})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cardH * 0.46, cardH * 0.52, cardH * (0.18 + i * 0.07) + Math.sin(t * 5) * 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.round(cardH * 0.42)}px ${BODY_FONT}`;
  ctx.fillStyle = '#fff';
  ctx.fillText(number || '#', cardH * 0.46, cardH * 0.53);
  ctx.restore();

  // Name and role text
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `900 ${Math.round(cardH * 0.32)}px ${BODY_FONT}`;
  ctx.fillStyle = '#000';
  ctx.fillText(name, textBlockX + 2, cardH * 0.5 + 2);
  ctx.fillStyle = '#fff';
  ctx.fillText(name, textBlockX, cardH * 0.5);

  ctx.font = `800 ${Math.round(cardH * 0.17)}px ${BODY_FONT}`;
  const roleGrad = ctx.createLinearGradient(textBlockX, 0, textBlockX + roleWidth, 0);
  roleGrad.addColorStop(0, p);
  roleGrad.addColorStop(1, s);
  ctx.fillStyle = roleGrad;
  ctx.fillText(role.toUpperCase(), textBlockX, cardH * 0.78);

  // Team tag chip on the right end of the card
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.round(cardH * 0.13)}px ${BODY_FONT}`;
  const chipText = 'ON COURT';
  const chipW = ctx.measureText(chipText).width + cardH * 0.22;
  roundRectPath(ctx, cardW - chipW - cardH * 0.15, cardH * 0.09, chipW, cardH * 0.17, cardH * 0.085);
  ctx.strokeStyle = `${s}aa`;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = `${s}33`;
  ctx.fill();
  ctx.fillStyle = s;
  ctx.textAlign = 'center';
  ctx.fillText(chipText, cardW - chipW / 2 - cardH * 0.15, cardH * 0.185);

  // Metallic shimmer pass clipped inside the card
  ctx.save();
  roundRectPath(ctx, 0, 0, cardW, cardH, 20);
  ctx.clip();
  const shimmerX = ((t * 1.4 - 0.2) % 1.4) * cardW;
  const shimmerGrad = ctx.createLinearGradient(shimmerX - 90, 0, shimmerX + 90, cardH);
  shimmerGrad.addColorStop(0, 'transparent');
  shimmerGrad.addColorStop(0.5, 'rgba(255,255,255,0.13)');
  shimmerGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = shimmerGrad;
  ctx.fillRect(0, 0, cardW, cardH);

  // Floating light dust specks
  for (let i = 0; i < 9; i++) {
    const px = ((i * 91 + t * 70) % cardW);
    const py = (cardH * 0.25 + ((i * 53 + t * 24) % (cardH * 0.6)));
    ctx.globalAlpha = slideFade * 0.35 * (0.5 + Math.sin(t * 6 + i) * 0.5);
    ctx.fillStyle = '#fff';
    ctx.fillRect(px, py, 2, 2);
  }
  ctx.restore();

  ctx.restore();
}
