// Main render dispatcher: clears the canvas, applies screen shake and routes to effects
import { frameRandom } from './renderUtils';
import { renderMonsterBlock } from './effects/monsterBlock';
import { renderSuperSpike } from './effects/superSpike';
import { renderServiceAce } from './effects/serviceAce';
import { renderMonsterSave } from './effects/monsterSave';
import { renderPerfectSet } from './effects/perfectSet';
import { renderMatchPoint } from './effects/matchPoint';
import { renderPlayerCard } from './effects/playerCard';

const EFFECT_RENDERERS = {
  monster_block: renderMonsterBlock,
  super_spike: renderSuperSpike,
  service_ace: renderServiceAce,
  great_dig: renderMonsterSave,
  perfect_set: renderPerfectSet,
  match_point: renderMatchPoint,
  player_card: renderPlayerCard,
};

/**
 * Draw one full animation frame at normalized time `progress` (0..1).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width canvas pixel width
 * @param {number} height canvas pixel height
 */
export function renderCanvasFrame(ctx, width, height, progress, config, bg = 'transparent') {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Background: keep alpha channel for chroma workflows unless a solid color is chosen
  ctx.clearRect(0, 0, width, height);
  if (bg && bg !== 'transparent') {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
  }

  const renderer = EFFECT_RENDERERS[config?.presetId] || EFFECT_RENDERERS.monster_block;

  // Broadcast-style screen shake centered on the impact window
  let shakeX = 0;
  let shakeY = 0;
  if (config?.enableShake !== false && progress > 0.11 && progress < 0.5) {
    const decay = 1 - (progress - 0.11) / 0.39;
    const amplitude = Math.min(width, height) * 0.013 * decay * decay;
    const rnd = frameRandom(Math.floor(progress * 100000));
    shakeX = (rnd() - 0.5) * 2 * amplitude;
    shakeY = (rnd() - 0.5) * 2 * amplitude;
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);
  renderer(ctx, width, height, Math.min(1, Math.max(0, progress)), config);
  ctx.restore();
}
