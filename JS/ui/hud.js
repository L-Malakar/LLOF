/*
 *  hud.js — HUD Helpers
 */

import { state, DIFF_TIERS } from '../core/state.js';
import { refs } from '../core/dom-refs.js';

export function syncHUD() {
  refs.scoreVal.textContent    = Math.floor(state.score);
  refs.bestVal.textContent     = Math.floor(state.highScore);
  refs.hudCoinVal.textContent  = state.coins;
  refs.menuCoinVal.textContent = state.coins;
  refs.menuBestVal.textContent = Math.floor(state.highScore);
}

export function updateDiffLabel() {
  let tier = DIFF_TIERS[0];
  for (const t of DIFF_TIERS) { if (state.score >= t.threshold) tier = t; }
  refs.diffLabel.textContent = tier.label;
  const t = DIFF_TIERS.indexOf(tier);
  const colors = ['var(--clr-muted)', 'var(--clr-accent)', 'var(--clr-accent2)', 'var(--clr-gold)', 'var(--clr-danger)'];
  refs.diffLabel.style.borderColor = t >= 2 ? colors[t] : 'rgba(255,255,255,0.05)';
  refs.diffLabel.style.color = colors[t] || 'var(--clr-muted)';
  refs.diffLabel.style.textShadow = t >= 3 ? 'var(--glow-danger)' : '';
}

export function updateSpeedBar() {
  const pct = Math.min(1, (state.dynamicSpeed - 0.25) / (0.8 - 0.25)) * 100;
  refs.speedBar.style.width = pct + '%';
}

export function triggerShake(dur, intensity) {
  state.shakeDuration  = dur;
  state.shakeIntensity = intensity;
}

syncHUD();