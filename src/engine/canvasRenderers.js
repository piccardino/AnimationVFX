// High-Performance 2D Canvas Engine for Volleyball Overlays (Enhanced Broadcast VFX Edition)

export const PRESET_CATEGORIES = [
  { id: 'vfx', name: 'VFX Impact Effects', icon: 'Zap' },
  { id: 'player', name: 'Player Spotlight Card', icon: 'User' },
];

export const PRESETS = [
  {
    id: 'monster_block',
    name: 'Monster Block',
    category: 'vfx',
    defaultMainText: 'MONSTER BLOCK',
    defaultSubText: 'SPIKE REJECTED!',
    primaryColor: '#00e5ff',
    secondaryColor: '#7c4dff',
    accentColor: '#ffffff',
    duration: 3.5,
    description: '3D Metallic impact shield with energy shockwaves, spark particles, electric arcs, and screen shake.',
  },
  {
    id: 'super_spike',
    name: 'Super Spike',
    category: 'vfx',
    defaultMainText: 'SUPER SPIKE!',
    defaultSubText: '115 KM/H CANNONBALL',
    primaryColor: '#ff3d00',
    secondaryColor: '#ffea00',
    accentColor: '#ffffff',
    duration: 3.0,
    description: 'High-speed fireball shockwave detonation with flame trail particles and volcanic heatwave aura.',
  },
  {
    id: 'service_ace',
    name: 'Service Ace',
    category: 'vfx',
    defaultMainText: 'SERVICE ACE!',
    defaultSubText: 'UNTOUCHABLE SERVE',
    primaryColor: '#ffd700',
    secondaryColor: '#ff007f',
    accentColor: '#ffffff',
    duration: 3.2,
    description: 'Precision cybernetic targeting grid, golden sonic boom wave, and exploding laser light specks.',
  },
  {
    id: 'great_dig',
    name: 'Monster Save',
    category: 'vfx',
    defaultMainText: 'MONSTER SAVE',
    defaultSubText: 'GREAT DIG & DEFENSE',
    primaryColor: '#00ff87',
    secondaryColor: '#60efff',
    accentColor: '#ffffff',
    duration: 3.0,
    description: 'Hydro-electric splash particles, defensive liquid ripple waves, and translucent aqua energy dome.',
  },
  {
    id: 'perfect_set',
    name: 'Perfect Set',
    category: 'vfx',
    defaultMainText: 'PERFECT SET',
    defaultSubText: 'MAGIC HANDS',
    primaryColor: '#e040fb',
    secondaryColor: '#00e5ff',
    accentColor: '#ffffff',
    duration: 3.2,
    description: 'Multi-axis celestial orbits, stardust sparkle aura, golden volleyball halo, and cosmic gradient.',
  },
  {
    id: 'match_point',
    name: 'Set & Match Point Alert',
    category: 'vfx',
    defaultMainText: 'SET POINT',
    defaultSubText: 'DECISIVE RALLY',
    primaryColor: '#ff0055',
    secondaryColor: '#ffcc00',
    accentColor: '#ffffff',
    duration: 3.5,
    description: 'Broadcast animated hazard tapes, strobe alert perimeter, glitch entrance effect, and warning light halos.',
  },
  {
    id: 'player_card',
    name: 'Player Spotlight Card',
    category: 'player',
    defaultMainText: 'MARCO ZANGHERI',
    defaultSubText: '#7 • OUTSIDE HITTER',
    primaryColor: '#7c3aed',
    secondaryColor: '#06b6d4',
    accentColor: '#ffffff',
    duration: 4.0,
    description: 'Broadcast lower-third player card with diagonal slide, metallic shimmer pass, floating particle drift, and rank halo.',
  }
];

// Helper to draw rounded rectangle
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Dynamic Auto-Fit Font Size Helper to prevent text overflow
function getFittingFontSize(ctx, text, maxAllowedWidth, initialFontSize, fontFamily, fontWeight = '900') {
  if (!text) return initialFontSize;
  let fontSz = initialFontSize;
  ctx.font = `${fontWeight} ${fontSz}px ${fontFamily}`;
  let w = ctx.measureText(text).width;
  while (w > maxAllowedWidth && fontSz > 12) {
    fontSz -= 1;
    ctx.font = `${fontWeight} ${fontSz}px ${fontFamily}`;
    w = ctx.measureText(text).width;
  }
  return fontSz;
}

// Easing functions for silky smooth 60 FPS broadcast transitions
function easeOutExpo(x) {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

// Universal High-Visibility Subtitle Banner Renderer with support for clean 2-line layout without parentheses
function renderSubtitleBanner(ctx, subText, subY, maxMainW, sColor, pColor, baseFontSize = 26, ls = 1.0) {
  if (!subText) return;
  const lines = subText.split('\n');

  if (lines.length === 1) {
    const cleanText = subText.replace(/[()]/g, '').trim();
    const subFontSize = getFittingFontSize(ctx, cleanText, maxMainW - 40, baseFontSize, '"Outfit", "Montserrat", sans-serif', '800');
    ctx.font = `800 ${subFontSize}px "Outfit", "Montserrat", sans-serif`;
    const subWidth = Math.min(ctx.measureText(cleanText).width + 50, maxMainW);

    drawRoundedRect(ctx, -subWidth / 2, subY - subFontSize * 0.7, subWidth, subFontSize * 1.45, subFontSize * 0.7);
    
    // High contrast dark badge background with bright stroke
    ctx.fillStyle = 'rgba(10, 14, 28, 0.96)';
    ctx.shadowColor = pColor;
    ctx.shadowBlur = 12 * ls;
    ctx.fill();

    const borderGrad = ctx.createLinearGradient(-subWidth / 2, 0, subWidth / 2, 0);
    borderGrad.addColorStop(0, sColor);
    borderGrad.addColorStop(1, pColor);
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = Math.max(1, 2 * ls);
    ctx.stroke();

    // Text with stroke and crisp white fill
    ctx.font = `800 ${subFontSize}px "Outfit", "Montserrat", sans-serif`;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(1, 2.5 * ls);
    ctx.strokeText(cleanText, 0, subY);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(cleanText, 0, subY);
  } else {
    // 2-line clean banner: Line 1 = Name, Line 2 = Role & Number
    const line1 = lines[0].replace(/[()]/g, '').trim();
    const line2 = lines[1].replace(/[()]/g, '').trim();

    const sz1 = getFittingFontSize(ctx, line1, maxMainW - 40, baseFontSize * 1.1, '"Outfit", sans-serif', '900');
    const sz2 = getFittingFontSize(ctx, line2, maxMainW - 40, baseFontSize * 0.85, '"Montserrat", sans-serif', '800');

    ctx.font = `900 ${sz1}px "Outfit", sans-serif`;
    const w1 = ctx.measureText(line1).width;
    ctx.font = `800 ${sz2}px "Montserrat", sans-serif`;
    const w2 = ctx.measureText(line2).width;

    const bannerW = Math.min(Math.max(w1, w2) + 50, maxMainW);
    const bannerH = sz1 + sz2 + 20;
    const bannerTop = subY - 10;

    drawRoundedRect(ctx, -bannerW / 2, bannerTop, bannerW, bannerH, 14);
    
    // High contrast dark badge background with glowing border stroke
    ctx.fillStyle = 'rgba(8, 12, 24, 0.96)';
    ctx.shadowColor = pColor;
    ctx.shadowBlur = 15 * ls;
    ctx.fill();

    const borderGrad = ctx.createLinearGradient(-bannerW / 2, 0, bannerW / 2, 0);
    borderGrad.addColorStop(0, sColor);
    borderGrad.addColorStop(1, pColor);
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = Math.max(1, 2 * ls);
    ctx.stroke();

    // Line 1: Player Name (Crisp Bold White with Dark Stroke)
    ctx.font = `900 ${sz1}px "Outfit", sans-serif`;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(1, 2.5 * ls);
    ctx.strokeText(line1, 0, bannerTop + sz1 + 2);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(line1, 0, bannerTop + sz1 + 2);

    // Line 2: Role & Number (Pure High-Contrast White with Heavy Dark Outline)
    ctx.font = `800 ${sz2}px "Montserrat", sans-serif`;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(1, 2.5 * ls);
    ctx.strokeText(line2, 0, bannerTop + sz1 + sz2 + 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(line2, 0, bannerTop + sz1 + sz2 + 8);
  }
  ctx.shadowBlur = 0;
}

/**
 * Main Render Dispatcher
 */
export function renderCanvasFrame(ctx, width, height, progress, config, chromaBg) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (chromaBg === 'transparent') {
    ctx.clearRect(0, 0, width, height);
  } else {
    ctx.fillStyle = chromaBg || '#000000';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.save();

  const presetId = config.presetId || 'monster_block';
  const ls = typeof config.lineThickness === 'number' ? config.lineThickness : 1.0;

  // Screen shake effect ONLY for impact animations (NOT player_card!)
  let shakeX = 0;
  let shakeY = 0;
  if (config.enableShake && presetId !== 'player_card' && progress > 0.15 && progress < 0.45) {
    const shakeIntensity = (1 - (progress - 0.15) / 0.3) * 15 * (config.shakeAmount || 1);
    shakeX = (Math.random() - 0.5) * shakeIntensity;
    shakeY = (Math.random() - 0.5) * shakeIntensity;
  }
  ctx.translate(shakeX, shakeY);

  switch (presetId) {
    case 'monster_block':
      renderMonsterBlock(ctx, width, height, progress, config, ls);
      break;
    case 'super_spike':
      renderSuperSpike(ctx, width, height, progress, config, ls);
      break;
    case 'service_ace':
      renderServiceAce(ctx, width, height, progress, config, ls);
      break;
    case 'great_dig':
      renderGreatDig(ctx, width, height, progress, config, ls);
      break;
    case 'perfect_set':
      renderPerfectSet(ctx, width, height, progress, config, ls);
      break;
    case 'match_point':
      renderMatchPoint(ctx, width, height, progress, config, ls);
      break;
    case 'player_card':
      renderPlayerCard(ctx, width, height, progress, config, ls);
      break;
    default:
      renderMonsterBlock(ctx, width, height, progress, config, ls);
  }

  ctx.restore();
}

/**
 * 1. MONSTER BLOCK RENDERER (ENHANCED)
 */
function renderMonsterBlock(ctx, width, height, progress, config, ls = 1.0) {
  const cx = width / 2;
  const cy = height / 2;
  const pColor = config.primaryColor || '#00e5ff';
  const sColor = config.secondaryColor || '#7c4dff';
  const aColor = config.accentColor || '#ffffff';
  const mainText = config.mainText || 'MONSTER BLOCK';
  const subText = config.subText || 'SPIKE REJECTED!';

  let scale = 1;
  let alpha = 1;
  if (progress < 0.25) {
    const t = progress / 0.25;
    scale = easeOutBack(t);
    alpha = easeOutCubic(t);
  } else if (progress > 0.8) {
    const t = (progress - 0.8) / 0.2;
    scale = 1 + easeOutCubic(t) * 0.3;
    alpha = 1 - easeOutCubic(t);
  }

  const shieldRadius = Math.min(width, height) * 0.16;

  // Impact Flash at center frame (progress 0.15 - 0.35)
  if (progress >= 0.15 && progress <= 0.35) {
    const flashT = 1 - Math.abs(progress - 0.25) / 0.1;
    ctx.save();
    ctx.globalAlpha = flashT * 0.35;
    const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, shieldRadius * 3);
    flashGrad.addColorStop(0, '#ffffff');
    flashGrad.addColorStop(0.4, pColor);
    flashGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = flashGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // Expanding Hexagon Energy Shockwave Rings
  if (progress > 0.15) {
    const waveProgress = (progress - 0.15) / 0.7;
    for (let wave = 0; wave < 2; wave++) {
      const wavePhase = (waveProgress * 2.5 - wave * 0.4);
      if (wavePhase > 0 && wavePhase < 1) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.globalAlpha = (1 - wavePhase) * alpha * 0.7;
        ctx.strokeStyle = wave === 0 ? pColor : sColor;
        ctx.lineWidth = Math.max(1, (3 - wavePhase * 2) * ls);
        ctx.shadowColor = pColor;
        ctx.shadowBlur = 15 * ls;

        const wRadius = shieldRadius * (0.8 + wavePhase * 3.2);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
          const wx = Math.cos(angle) * wRadius;
          const wy = Math.sin(angle) * wRadius;
          if (i === 0) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // Particle Spark Explosions on Impact
  if (progress > 0.15 && progress < 0.75) {
    const sparkT = (progress - 0.15) / 0.6;
    ctx.save();
    ctx.translate(cx, cy);
    const sparkCount = 20;
    for (let i = 0; i < sparkCount; i++) {
      const angle = (i / sparkCount) * Math.PI * 2 + Math.sin(i * 99) * 0.5;
      const speed = 180 + Math.sin(i * 13) * 120;
      const sparkDist = sparkT * speed;
      const sparkAlpha = Math.max(0, (1 - sparkT * 1.2));

      const sx = Math.cos(angle) * sparkDist;
      const sy = Math.sin(angle) * sparkDist;
      const tailX = Math.cos(angle) * (sparkDist - 15 * ls);
      const tailY = Math.sin(angle) * (sparkDist - 15 * ls);

      ctx.strokeStyle = i % 2 === 0 ? pColor : aColor;
      ctx.lineWidth = Math.max(1, (2 - sparkT) * ls);
      ctx.globalAlpha = sparkAlpha * alpha;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Central Main Shield & Text Rendering
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha * 0.95);
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const pulse = Math.sin(progress * Math.PI * 8) * 5;
  
  ctx.shadowColor = pColor;
  ctx.shadowBlur = 18 * ls;

  // Outer Hexagon Shield Ring
  ctx.beginPath();
  const sides = 6;
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    const r = shieldRadius + pulse;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = pColor;
  ctx.lineWidth = Math.max(2, 3.5 * ls);
  ctx.stroke();

  // Inner Hexagon Grid pattern
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    const r = (shieldRadius + pulse) * 0.82;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = sColor;
  ctx.lineWidth = Math.max(1, 1.5 * ls);
  ctx.stroke();

  const fillGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, shieldRadius);
  fillGrad.addColorStop(0, `${pColor}55`);
  fillGrad.addColorStop(0.6, `${sColor}33`);
  fillGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = fillGrad;
  ctx.fill();

  // High-Energy Electric Arcs between Vertices
  if (progress > 0.12 && progress < 0.75) {
    ctx.strokeStyle = aColor;
    ctx.lineWidth = Math.max(1, 1.6 * ls);
    ctx.shadowColor = aColor;
    ctx.shadowBlur = 10 * ls;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      let lx = (Math.random() - 0.5) * shieldRadius * 1.3;
      let ly = (Math.random() - 0.5) * shieldRadius * 1.3;
      ctx.moveTo(lx, ly);
      for (let j = 0; j < 3; j++) {
        lx += (Math.random() - 0.5) * 30;
        ly += (Math.random() - 0.5) * 30;
        ctx.lineTo(lx, ly);
      }
      ctx.stroke();
    }
  }

  // Volleyball Shield Center Badge
  ctx.fillStyle = aColor;
  ctx.font = '900 48px Montserrat, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = pColor;
  ctx.shadowBlur = 12 * ls;
  ctx.fillText('🛡️ 🏐 🛡️', 0, -shieldRadius * 0.52);

  const maxMainW = width * 0.58;
  const initialFontSize = Math.min(width * 0.068, 64);
  const fontSize = getFittingFontSize(ctx, mainText, maxMainW, initialFontSize, '"Bebas Neue", "Anton", sans-serif', '900');
  ctx.font = `900 ${fontSize}px "Bebas Neue", "Anton", sans-serif`;

  // Heavy Shadow & Chromatic Outlines
  ctx.shadowColor = sColor;
  ctx.shadowBlur = 14 * ls;
  
  ctx.fillStyle = '#060614';
  ctx.fillText(mainText, 4, 4);
  ctx.fillStyle = sColor;
  ctx.fillText(mainText, 2, 2);

  const textGrad = ctx.createLinearGradient(0, -fontSize, 0, fontSize);
  textGrad.addColorStop(0, '#ffffff');
  textGrad.addColorStop(0.35, aColor);
  textGrad.addColorStop(0.7, pColor);
  textGrad.addColorStop(1, '#0077bb');
  ctx.fillStyle = textGrad;
  ctx.fillText(mainText, 0, 0);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1.2, 2.2 * ls);
  ctx.strokeText(mainText, 0, 0);

  renderSubtitleBanner(ctx, subText, fontSize * 0.65, maxMainW, sColor, pColor, Math.min(width * 0.032, 28), ls);

  ctx.restore();
}

/**
 * 2. SUPER SPIKE RENDERER (ENHANCED)
 */
function renderSuperSpike(ctx, width, height, progress, config, ls = 1.0) {
  const cx = width / 2;
  const cy = height / 2;
  const pColor = config.primaryColor || '#ff3d00';
  const sColor = config.secondaryColor || '#ffea00';
  const aColor = config.accentColor || '#ffffff';
  const mainText = config.mainText || 'SUPER SPIKE!';
  const subText = config.subText || '115 KM/H CANNONBALL';

  let scale = 1;
  let alpha = 1;
  if (progress < 0.25) {
    const t = progress / 0.25;
    scale = easeOutBack(t);
    alpha = easeOutCubic(t);
  } else if (progress > 0.8) {
    const t = (progress - 0.8) / 0.2;
    alpha = 1 - easeOutCubic(t);
  }

  // Explosive Fireball Shockwave Ring expanding from center
  if (progress > 0.12) {
    const blastT = (progress - 0.12) / 0.75;
    if (blastT < 1) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalAlpha = (1 - blastT) * alpha * 0.85;

      const blastR = Math.min(width, height) * (0.05 + blastT * 0.45);
      const ringGrad = ctx.createRadialGradient(0, 0, blastR * 0.6, 0, 0, blastR);
      ringGrad.addColorStop(0, 'transparent');
      ringGrad.addColorStop(0.5, sColor);
      ringGrad.addColorStop(0.85, pColor);
      ringGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = ringGrad;
      ctx.beginPath();
      ctx.arc(0, 0, blastR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Radiating Speed Streaks & Fire Flames Particles
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = Math.min(1, alpha * 0.85);

  // Speed Streaks
  ctx.strokeStyle = pColor;
  ctx.lineWidth = Math.max(1, 1.8 * ls);
  ctx.shadowColor = sColor;
  ctx.shadowBlur = 10 * ls;
  const linesCount = 18;
  for (let i = 0; i < linesCount; i++) {
    const angle = (i / linesCount) * Math.PI * 2 + progress * 0.5;
    const r1 = Math.min(width, height) * 0.08 + (progress * 30) % 20;
    const r2 = r1 + 35 + Math.sin(i * 5 + progress * 20) * 20;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
    ctx.lineTo(Math.cos(angle) * r2, Math.sin(angle) * r2);
    ctx.stroke();
  }

  // Fiery Flame & Ember Particles drifting radially outward
  const emberCount = 24;
  for (let i = 0; i < emberCount; i++) {
    const eAngle = (i / emberCount) * Math.PI * 2 + Math.sin(i * 17) * 0.5;
    const eDist = (progress * 350 + i * 15) % 260 + 40;
    const ex = Math.cos(eAngle) * eDist;
    const ey = Math.sin(eAngle) * eDist - progress * 40; // float upwards
    const eSize = (Math.sin(i + progress * 15) * 2 + 3) * ls;

    ctx.beginPath();
    ctx.arc(ex, ey, Math.max(1.5, eSize), 0, Math.PI * 2);
    ctx.fillStyle = i % 3 === 0 ? aColor : i % 2 === 0 ? sColor : pColor;
    ctx.shadowColor = pColor;
    ctx.shadowBlur = 8 * ls;
    ctx.fill();
  }

  ctx.restore();

  // Text & Main Canvas Badge
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  ctx.shadowColor = sColor;
  ctx.shadowBlur = 16 * ls;

  ctx.fillStyle = sColor;
  ctx.font = '900 52px Montserrat, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🔥 💥 🔥', 0, -height * 0.13);

  const maxMainW = width * 0.58;
  const initialFontSize = Math.min(width * 0.072, 68);
  const fontSize = getFittingFontSize(ctx, mainText, maxMainW, initialFontSize, '"Anton", "Bebas Neue", sans-serif', '900');
  ctx.font = `900 ${fontSize}px "Anton", "Bebas Neue", sans-serif`;

  const fireGrad = ctx.createLinearGradient(0, -fontSize, 0, fontSize);
  fireGrad.addColorStop(0, '#ffffff');
  fireGrad.addColorStop(0.25, sColor);
  fireGrad.addColorStop(0.65, pColor);
  fireGrad.addColorStop(1, '#660000');

  ctx.fillStyle = '#000000';
  ctx.fillText(mainText, 4, 4);

  ctx.fillStyle = fireGrad;
  ctx.fillText(mainText, 0, 0);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1.2, 2.2 * ls);
  ctx.strokeText(mainText, 0, 0);

  renderSubtitleBanner(ctx, subText, fontSize * 0.6, maxMainW, sColor, pColor, Math.min(width * 0.03, 26), ls);

  ctx.restore();
}

/**
 * 3. SERVICE ACE RENDERER (ENHANCED)
 */
function renderServiceAce(ctx, width, height, progress, config, ls = 1.0) {
  const cx = width / 2;
  const cy = height / 2;
  const pColor = config.primaryColor || '#ffd700';
  const sColor = config.secondaryColor || '#ff007f';
  const aColor = config.accentColor || '#ffffff';
  const mainText = config.mainText || 'SERVICE ACE!';
  const subText = config.subText || 'UNTOUCHABLE SERVE';

  let scale = 1;
  let alpha = 1;
  if (progress < 0.25) {
    const t = progress / 0.25;
    scale = easeOutBack(t);
    alpha = easeOutCubic(t);
  } else if (progress > 0.8) {
    const t = (progress - 0.8) / 0.2;
    alpha = 1 - easeOutCubic(t);
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);

  // Expanding Golden Sonic Boom Ring
  if (progress > 0.12) {
    const boomT = (progress - 0.12) / 0.75;
    if (boomT < 1) {
      ctx.save();
      ctx.globalAlpha = (1 - boomT) * alpha * 0.8;
      ctx.strokeStyle = pColor;
      ctx.lineWidth = Math.max(1, (3 - boomT * 2) * ls);
      ctx.shadowColor = pColor;
      ctx.shadowBlur = 18 * ls;

      const boomR = Math.min(width, height) * (0.06 + boomT * 0.42);
      ctx.beginPath();
      ctx.arc(0, 0, boomR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Golden Laser Beam Horizontal Flare Line with Center Star Flare
  const maxBeamW = Math.min(width * 0.55, 680);
  const beamW = maxBeamW * (0.2 + easeOutExpo(Math.min(1, progress / 0.3)) * 0.45);
  ctx.save();
  const laserGrad = ctx.createLinearGradient(-beamW / 2, 0, beamW / 2, 0);
  laserGrad.addColorStop(0, 'transparent');
  laserGrad.addColorStop(0.3, sColor);
  laserGrad.addColorStop(0.5, '#ffffff');
  laserGrad.addColorStop(0.7, pColor);
  laserGrad.addColorStop(1, 'transparent');

  ctx.fillStyle = laserGrad;
  ctx.shadowColor = pColor;
  ctx.shadowBlur = 12 * ls;
  const beamH = Math.max(2, 3.5 * ls);
  ctx.fillRect(-beamW / 2, -beamH / 2, beamW, beamH);
  ctx.restore();

  // Cybernetic Precision Lock-on Crosshair Grid & Rotating Degree Ticks
  const targetR = Math.min(width, height) * 0.085;
  ctx.save();
  ctx.scale(scale, scale);

  // Rotating outer tick gauge
  ctx.save();
  ctx.rotate(progress * Math.PI * 2);
  ctx.strokeStyle = pColor;
  ctx.lineWidth = Math.max(1, 1.5 * ls);
  ctx.shadowColor = pColor;
  ctx.shadowBlur = 8 * ls;

  ctx.beginPath();
  ctx.arc(0, 0, targetR, 0, Math.PI * 2);
  ctx.stroke();

  // Degree Tick Marks
  const tickCount = 12;
  for (let i = 0; i < tickCount; i++) {
    const tAngle = (i / tickCount) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(tAngle) * targetR, Math.sin(tAngle) * targetR);
    ctx.lineTo(Math.cos(tAngle) * (targetR + 8), Math.sin(tAngle) * (targetR + 8));
    ctx.stroke();
  }
  ctx.restore();

  // Inner counter-rotating ring
  ctx.save();
  ctx.rotate(-progress * Math.PI * 3);
  ctx.strokeStyle = sColor;
  ctx.lineWidth = Math.max(1, 1.2 * ls);
  ctx.beginPath();
  ctx.arc(0, 0, targetR * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Crosshair Hair Lines
  ctx.strokeStyle = aColor;
  ctx.lineWidth = Math.max(1, 1.8 * ls);
  ctx.beginPath();
  ctx.moveTo(-targetR - 12, 0);
  ctx.lineTo(targetR + 12, 0);
  ctx.moveTo(0, -targetR - 12);
  ctx.lineTo(0, targetR + 12);
  ctx.stroke();

  // Exploding Golden Light Specks
  for (let i = 0; i < 16; i++) {
    const sAngle = (i / 16) * Math.PI * 2 + progress * 5;
    const sDist = targetR * 1.3 + Math.sin(i * 3 + progress * 10) * 20;
    const sx = Math.cos(sAngle) * sDist;
    const sy = Math.sin(sAngle) * sDist;
    const sSize = Math.sin(i + progress * 12) * 1.8 + 2;

    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(1.5, sSize), 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? pColor : aColor;
    ctx.fill();
  }

  ctx.fillStyle = pColor;
  ctx.font = '900 46px Montserrat, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = sColor;
  ctx.shadowBlur = 10 * ls;
  ctx.fillText('⚡ 🏐 ⚡', 0, -targetR * 0.75);

  const maxMainW = width * 0.58;
  const initialFontSize = Math.min(width * 0.072, 68);
  const fontSize = getFittingFontSize(ctx, mainText, maxMainW, initialFontSize, '"Anton", "Bebas Neue", sans-serif', '900');
  ctx.font = `900 ${fontSize}px "Anton", "Bebas Neue", sans-serif`;

  const goldGrad = ctx.createLinearGradient(0, -fontSize, 0, fontSize);
  goldGrad.addColorStop(0, '#ffffff');
  goldGrad.addColorStop(0.35, pColor);
  goldGrad.addColorStop(0.75, sColor);
  goldGrad.addColorStop(1, '#e6005c');

  ctx.fillStyle = '#000000';
  ctx.fillText(mainText, 4, 4);

  ctx.fillStyle = goldGrad;
  ctx.fillText(mainText, 0, 0);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1.2, 2.2 * ls);
  ctx.strokeText(mainText, 0, 0);

  renderSubtitleBanner(ctx, subText, fontSize * 0.6, maxMainW, sColor, pColor, Math.min(width * 0.03, 26), ls);

  ctx.restore();
}

/**
 * 4. GREAT DIG / MONSTER SAVE RENDERER (ENHANCED)
 */
function renderGreatDig(ctx, width, height, progress, config, ls = 1.0) {
  const cx = width / 2;
  const cy = height / 2;
  const pColor = config.primaryColor || '#00ff87';
  const sColor = config.secondaryColor || '#60efff';
  const aColor = config.accentColor || '#ffffff';
  const mainText = config.mainText || 'MONSTER SAVE';
  const subText = config.subText || 'GREAT DIG & DEFENSE';

  let scale = 1;
  let alpha = 1;
  if (progress < 0.25) {
    const t = progress / 0.25;
    scale = easeOutBack(t);
    alpha = easeOutCubic(t);
  } else if (progress > 0.8) {
    const t = (progress - 0.8) / 0.2;
    alpha = 1 - easeOutCubic(t);
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);

  // Hydro Electric Concentric Ripple Waves
  for (let r = 1; r <= 4; r++) {
    const waveR = Math.min(width, height) * (0.035 * r) + Math.sin(progress * Math.PI * 6 + r) * 12;
    ctx.strokeStyle = r % 2 === 0 ? pColor : sColor;
    ctx.lineWidth = Math.max(1, (2.2 - r * 0.3) * ls);
    ctx.shadowColor = sColor;
    ctx.shadowBlur = 10 * ls;

    ctx.beginPath();
    ctx.arc(0, 0, waveR, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Hydro Translucent Energy Shield Dome
  ctx.save();
  ctx.scale(scale, scale);
  const domeW = Math.min(width, height) * 0.25;
  const domeH = domeW * 0.55;
  ctx.beginPath();
  ctx.ellipse(0, -10, domeW, domeH, 0, Math.PI, Math.PI * 2);
  const domeGrad = ctx.createLinearGradient(0, -domeH, 0, 0);
  domeGrad.addColorStop(0, `${sColor}55`);
  domeGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = domeGrad;
  ctx.fill();
  ctx.strokeStyle = pColor;
  ctx.lineWidth = Math.max(1, 2 * ls);
  ctx.stroke();
  ctx.restore();

  // Water Splash Particles radiating outward & falling gently
  for (let i = 0; i < 20; i++) {
    const pAngle = (i / 20) * Math.PI * 2 + progress * 3;
    const pDist = Math.min(width, height) * 0.14 + Math.sin(i * 5 + progress * 12) * 20;
    const spX = Math.cos(pAngle) * pDist;
    const spY = Math.sin(pAngle) * pDist + Math.pow(progress, 2) * 35; // gravity fall
    const spSize = Math.sin(i * 2 + progress * 14) * 2 + 2.2;

    ctx.beginPath();
    ctx.arc(spX, spY, Math.max(1.5, spSize), 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? sColor : pColor;
    ctx.shadowColor = pColor;
    ctx.shadowBlur = 8 * ls;
    ctx.fill();
  }

  ctx.save();
  ctx.scale(scale, scale);

  ctx.fillStyle = aColor;
  ctx.font = '900 46px Montserrat, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = sColor;
  ctx.shadowBlur = 10 * ls;
  ctx.fillText('💧 🏐 💧', 0, -height * 0.12);

  const maxMainW = width * 0.58;
  const initialFontSize = Math.min(width * 0.068, 64);
  const fontSize = getFittingFontSize(ctx, mainText, maxMainW, initialFontSize, '"Bebas Neue", "Anton", sans-serif', '900');
  ctx.font = `900 ${fontSize}px "Bebas Neue", "Anton", sans-serif`;

  const digGrad = ctx.createLinearGradient(0, -fontSize, 0, fontSize);
  digGrad.addColorStop(0, '#ffffff');
  digGrad.addColorStop(0.4, sColor);
  digGrad.addColorStop(0.85, pColor);
  digGrad.addColorStop(1, '#006644');

  ctx.fillStyle = '#000000';
  ctx.fillText(mainText, 3, 3);

  ctx.fillStyle = digGrad;
  ctx.fillText(mainText, 0, 0);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1.2, 2.2 * ls);
  ctx.strokeText(mainText, 0, 0);

  renderSubtitleBanner(ctx, subText, fontSize * 0.5, maxMainW, sColor, pColor, Math.min(width * 0.026, 24), ls);

  ctx.restore();
  ctx.restore();
}

/**
 * 5. PERFECT SET RENDERER (ENHANCED)
 */
function renderPerfectSet(ctx, width, height, progress, config, ls = 1.0) {
  const cx = width / 2;
  const cy = height / 2;
  const pColor = config.primaryColor || '#e040fb';
  const sColor = config.secondaryColor || '#00e5ff';
  const aColor = config.accentColor || '#ffffff';
  const mainText = config.mainText || 'PERFECT SET';
  const subText = config.subText || 'MAGIC HANDS';

  let scale = 1;
  let alpha = 1;
  if (progress < 0.25) {
    const t = progress / 0.25;
    scale = easeOutBack(t);
    alpha = easeOutCubic(t);
  } else if (progress > 0.8) {
    const t = (progress - 0.8) / 0.2;
    alpha = 1 - easeOutCubic(t);
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);

  // Multi-Axis Rotating Celestial Elliptical Orbits
  const orbitR = Math.min(width, height) * 0.1;
  const rotAngle = progress * Math.PI * 3;

  ctx.save();
  ctx.shadowColor = sColor;
  ctx.shadowBlur = 10 * ls;

  // Orbit 1: Tilted +30 deg
  ctx.save();
  ctx.rotate(rotAngle);
  ctx.strokeStyle = pColor;
  ctx.lineWidth = Math.max(1, 1.8 * ls);
  ctx.beginPath();
  ctx.ellipse(0, 0, orbitR, orbitR * 0.38, Math.PI / 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Orbit 2: Tilted -45 deg
  ctx.save();
  ctx.rotate(-rotAngle * 1.3);
  ctx.strokeStyle = sColor;
  ctx.lineWidth = Math.max(1, 1.4 * ls);
  ctx.beginPath();
  ctx.ellipse(0, 0, orbitR * 0.85, orbitR * 0.3, -Math.PI / 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Orbit 3: Horizontal Golden Ring Halo
  ctx.save();
  ctx.rotate(rotAngle * 0.7);
  ctx.strokeStyle = aColor;
  ctx.lineWidth = Math.max(0.8, 1.2 * ls);
  ctx.beginPath();
  ctx.ellipse(0, 0, orbitR * 1.1, orbitR * 0.25, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.restore();

  // Floating Stardust Magic Sparkle Aura rising gently
  for (let i = 0; i < 24; i++) {
    const sAngle = (i / 24) * Math.PI * 2 + progress * 3;
    const sDist = orbitR * (0.5 + Math.sin(i * 3 + progress * 10) * 0.4);
    const sx = Math.cos(sAngle) * sDist;
    const sy = Math.sin(sAngle) * sDist - (progress * 50 + i * 5) % 100 + 50; // rise up
    const sAlpha = Math.sin(i * 4 + progress * 15) * 0.4 + 0.6;
    const sSize = Math.sin(i + progress * 12) * 1.6 + 2;

    ctx.save();
    ctx.globalAlpha = Math.min(1, sAlpha * alpha);
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(1.2, sSize), 0, Math.PI * 2);
    ctx.fillStyle = i % 3 === 0 ? aColor : i % 2 === 0 ? sColor : pColor;
    ctx.shadowColor = pColor;
    ctx.shadowBlur = 8 * ls;
    ctx.fill();
    ctx.restore();
  }

  // Main Badge & Text
  ctx.save();
  ctx.scale(scale, scale);

  ctx.fillStyle = aColor;
  ctx.font = '900 42px Montserrat, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = pColor;
  ctx.shadowBlur = 12 * ls;
  ctx.fillText('✨ 🏐 ✨', 0, -height * 0.1);

  const maxMainW = width * 0.58;
  const initialFontSize = Math.min(width * 0.055, 54);
  const fontSize = getFittingFontSize(ctx, mainText, maxMainW, initialFontSize, '"Bebas Neue", "Anton", sans-serif', '900');
  ctx.font = `900 ${fontSize}px "Bebas Neue", "Anton", sans-serif`;

  const setGrad = ctx.createLinearGradient(0, -fontSize, 0, fontSize);
  setGrad.addColorStop(0, '#ffffff');
  setGrad.addColorStop(0.4, pColor);
  setGrad.addColorStop(0.8, sColor);
  setGrad.addColorStop(1, '#800080');

  ctx.fillStyle = '#000000';
  ctx.fillText(mainText, 3, 3);

  ctx.fillStyle = setGrad;
  ctx.fillText(mainText, 0, 0);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1.2, 2 * ls);
  ctx.strokeText(mainText, 0, 0);

  renderSubtitleBanner(ctx, subText, fontSize * 0.5, maxMainW, sColor, pColor, Math.min(width * 0.022, 22), ls);

  ctx.restore();
  ctx.restore();
}

/**
 * 6. MATCH POINT ALERT RENDERER (ENHANCED)
 */
function renderMatchPoint(ctx, width, height, progress, config, ls = 1.0) {
  const cx = width / 2;
  const cy = height / 2;
  const pColor = config.primaryColor || '#ff0055';
  const sColor = config.secondaryColor || '#ffcc00';
  const aColor = config.accentColor || '#ffffff';
  const mainText = config.mainText || 'SET POINT';
  const subText = config.subText || 'DECISIVE RALLY';

  let scale = 1;
  let alpha = 1;
  if (progress < 0.2) {
    const t = progress / 0.2;
    scale = easeOutExpo(t);
    alpha = easeOutCubic(t);
  } else if (progress > 0.8) {
    const t = (progress - 0.8) / 0.2;
    alpha = 1 - easeOutCubic(t);
  }

  // Draw Warning Hazard Tapes at Top & Bottom across full screen with neon stroke
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha * 0.95);

  const stripeH = 12 * ls;
  const stripeShift = (progress * 240) % 40;

  ctx.save();
  ctx.rotate(-0.02);

  // Top Tape
  ctx.fillStyle = pColor;
  ctx.shadowColor = pColor;
  ctx.shadowBlur = 10 * ls;
  ctx.fillRect(0, 15, width, stripeH);

  ctx.fillStyle = '#000000';
  for (let x = -40 + stripeShift; x < width + 40; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 15);
    ctx.lineTo(x + 20, 15);
    ctx.lineTo(x + 5, 15 + stripeH);
    ctx.lineTo(x - 15, 15 + stripeH);
    ctx.closePath();
    ctx.fill();
  }

  // Bottom Tape
  ctx.fillStyle = sColor;
  ctx.shadowColor = sColor;
  ctx.shadowBlur = 10 * ls;
  ctx.fillRect(0, height - 30, width, stripeH);

  ctx.fillStyle = '#000000';
  for (let x = -40 - stripeShift; x < width + 40; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, height - 30);
    ctx.lineTo(x + 20, height - 30);
    ctx.lineTo(x + 5, height - 30 + stripeH);
    ctx.lineTo(x - 15, height - 30 + stripeH);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();

  // Center Alert Box with Glitch Entrance & Strobe Border
  ctx.save();
  
  // Digital Entrance Glitch Shift (first 0.15s)
  let glitchX = 0;
  if (progress < 0.15 && Math.random() > 0.4) {
    glitchX = (Math.random() - 0.5) * 12;
  }
  ctx.translate(cx + glitchX, cy);
  ctx.scale(scale, scale);

  const alertW = width * 0.48;
  const alertH = height * 0.19;

  drawRoundedRect(ctx, -alertW / 2, -alertH / 2, alertW, alertH, 16);
  ctx.fillStyle = 'rgba(16, 2, 12, 0.95)';
  ctx.shadowColor = pColor;
  ctx.shadowBlur = 16 * ls;
  ctx.fill();

  // Strobe Pulsing Border
  const strobeColor = Math.floor(progress * 18) % 2 === 0 ? pColor : sColor;
  ctx.strokeStyle = strobeColor;
  ctx.lineWidth = Math.max(1.5, 2.4 * ls);
  ctx.stroke();

  // Siren Warning Halos on sides of icon
  const sirenRadius = 14;
  ctx.save();
  ctx.shadowColor = strobeColor;
  ctx.shadowBlur = 15 * ls;
  ctx.fillStyle = strobeColor;
  ctx.beginPath();
  ctx.arc(-alertW * 0.38, -alertH * 0.35, sirenRadius, 0, Math.PI * 2);
  ctx.arc(alertW * 0.38, -alertH * 0.35, sirenRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = aColor;
  ctx.font = '900 40px Montserrat, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚠️ 🏐 ⚠️', 0, -alertH * 0.35);

  const maxMainW = alertW * 0.88;
  const initialFontSize = Math.min(width * 0.062, 58);
  const fontSize = getFittingFontSize(ctx, mainText, maxMainW, initialFontSize, '"Anton", "Bebas Neue", sans-serif', '900');
  ctx.font = `900 ${fontSize}px "Anton", "Bebas Neue", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const alertGrad = ctx.createLinearGradient(0, -fontSize, 0, fontSize);
  alertGrad.addColorStop(0, '#ffffff');
  alertGrad.addColorStop(0.5, pColor);
  alertGrad.addColorStop(1, sColor);

  ctx.fillStyle = alertGrad;
  ctx.fillText(mainText, 0, -5);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1.2, 2 * ls);
  ctx.strokeText(mainText, 0, -5);

  renderSubtitleBanner(ctx, subText, alertH * 0.3, maxMainW, sColor, pColor, Math.min(width * 0.028, 24), ls);

  ctx.restore();
}

/**
 * 7. PLAYER SPOTLIGHT CARD / LOWER THIRD RENDERER (ENHANCED)
 */
function renderPlayerCard(ctx, width, height, progress, config, ls = 1.0) {
  const pColor = config.primaryColor || '#7c3aed';
  const sColor = config.secondaryColor || '#06b6d4';
  const playerName = (config.mainText || 'MARCO ZANGHERI').replace(/[()]/g, '').trim();
  const playerRole = (config.subText || '#7 • OUTSIDE HITTER').replace(/[()]/g, '').trim();

  ctx.save();

  const nameX = 145;
  ctx.font = '900 32px "Outfit", sans-serif';
  const nameWidth = ctx.measureText(playerName).width;
  ctx.font = '800 18px "Montserrat", sans-serif';
  const roleWidth = ctx.measureText(playerRole).width;
  const maxReqW = Math.max(nameWidth, roleWidth);

  // Integer card width to avoid micro subpixel jitter
  const cardW = Math.min(Math.floor(width * 0.8), Math.max(660, nameX + Math.ceil(maxReqW) + 50));
  const maxTextW = cardW - nameX - 30;

  const cardH = 135;
  const startX = 70;
  const startY = height - cardH - 70;

  // Pure Smooth Slide-in Motion with broadcast back bounce
  let currentX = startX;
  if (progress < 0.15) currentX = startX - (1 - easeOutBack(progress / 0.15)) * 480;
  if (progress > 0.85) currentX = startX - easeOutCubic((progress - 0.85) / 0.15) * 480;

  ctx.translate(Math.round(currentX), Math.round(startY));

  // Dark High-Contrast Glass Card Background
  drawRoundedRect(ctx, 0, 0, cardW, cardH, 22);
  const bgGrad = ctx.createLinearGradient(0, 0, cardW, cardH);
  bgGrad.addColorStop(0, 'rgba(6, 10, 24, 0.97)');
  bgGrad.addColorStop(1, 'rgba(16, 22, 42, 0.98)');
  ctx.fillStyle = bgGrad;
  ctx.shadowColor = pColor;
  ctx.shadowBlur = 20 * ls;
  ctx.fill();

  const borderGrad = ctx.createLinearGradient(0, 0, cardW, 0);
  borderGrad.addColorStop(0, pColor);
  borderGrad.addColorStop(0.7, sColor);
  borderGrad.addColorStop(1, pColor);
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = Math.max(1.2, 2.2 * ls);
  ctx.stroke();

  // Micro Metallic Sheen / Shimmer Pass moving across card surface
  const shimmerPos = (progress * 1.4 - 0.2) * cardW;
  ctx.save();
  drawRoundedRect(ctx, 0, 0, cardW, cardH, 22);
  ctx.clip();

  const shimmerGrad = ctx.createLinearGradient(shimmerPos - 80, 0, shimmerPos + 80, cardH);
  shimmerGrad.addColorStop(0, 'transparent');
  shimmerGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
  shimmerGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = shimmerGrad;
  ctx.fillRect(0, 0, cardW, cardH);

  // Subtle Floating Background Light Dust specks inside card
  for (let i = 0; i < 8; i++) {
    const px = (i * 85 + progress * 60) % cardW;
    const py = (Math.sin(i + progress * 5) * 0.4 + 0.5) * cardH;
    ctx.fillStyle = i % 2 === 0 ? pColor : sColor;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(px, py, 1.8 * ls, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Left Avatar / Jersey Number Circle with Dual Glowing Ring
  const circleX = 72;
  const circleY = Math.floor(cardH / 2);
  const circleR = 50;

  // Outer Halo Ring
  ctx.save();
  ctx.shadowColor = sColor;
  ctx.shadowBlur = 12 * ls;
  ctx.beginPath();
  ctx.arc(circleX, circleY, circleR + 3, 0, Math.PI * 2);
  ctx.strokeStyle = sColor;
  ctx.lineWidth = Math.max(1, 1.8 * ls);
  ctx.stroke();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
  const circleGrad = ctx.createLinearGradient(circleX - circleR, circleY - circleR, circleX + circleR, circleY + circleR);
  circleGrad.addColorStop(0, pColor);
  circleGrad.addColorStop(1, sColor);
  ctx.fillStyle = circleGrad;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1.2, 2 * ls);
  ctx.stroke();

  let jerseyNum = '🏐';
  const numMatch = playerRole.match(/(?:N\.|#)\s*(\d+)/i) || playerName.match(/(?:N\.|#)\s*(\d+)/i);
  if (numMatch && numMatch[1]) {
    jerseyNum = `#${numMatch[1]}`;
  }

  ctx.font = '900 36px "Anton", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 8 * ls;
  ctx.fillText(jerseyNum, circleX, circleY);

  ctx.textAlign = 'left';

  // Player Name with Auto-Fitting Font Size & High-Contrast Outline Stroke
  const nameFontSize = getFittingFontSize(ctx, playerName, maxTextW, 34, '"Outfit", sans-serif', '900');
  ctx.font = `900 ${nameFontSize}px "Outfit", sans-serif`;

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = Math.max(1, 2.8 * ls);
  ctx.strokeText(playerName, nameX, cardH * 0.38);

  ctx.fillStyle = '#ffffff';
  ctx.fillText(playerName, nameX, cardH * 0.38);

  // Role Subtitle / Team with High Contrast Pure White
  const roleFontSize = getFittingFontSize(ctx, playerRole, maxTextW, 19, '"Montserrat", sans-serif', '800');
  ctx.font = `800 ${roleFontSize}px "Montserrat", sans-serif`;

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = Math.max(1, 2.5 * ls);
  ctx.strokeText(playerRole, nameX, cardH * 0.65);

  ctx.fillStyle = '#ffffff';
  ctx.fillText(playerRole, nameX, cardH * 0.65);

  ctx.restore();
}
