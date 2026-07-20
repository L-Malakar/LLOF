/*
 *  powerups.js — Power-Up HUD, Effects, and Expiry
 */

import { POWERUP_DEFS } from '../systems/collectable.js';
import { game } from '../core/game-objects.js';
import { state, saveProgress } from '../core/state.js';
import { refs } from '../core/dom-refs.js';
import { activeController } from '../core/scene-setup.js';
import { syncHUD } from '../ui/hud.js';
import { showPickupToast } from '../ui/toast.js';
import { vibrate, playPowerUp } from '../utils/utils.js';

const _puPillEls = {}; // id -> { pill, bar, time } — persisted across frames

export function clearPowerUpHUD() {
  if (refs.powerupHud) refs.powerupHud.innerHTML = '';
  for (const k in _puPillEls) delete _puPillEls[k];
}

export function renderPowerUpHUD() {
  if (!refs.powerupHud) return;
  const activeIds = new Set(game.collectables.activePowerUps.map(p => p.id));

  // Remove pills whose power-up is no longer active
  for (const id in _puPillEls) {
    if (!activeIds.has(id)) {
      _puPillEls[id].pill.remove();
      delete _puPillEls[id];
    }
  }

  game.collectables.activePowerUps.forEach(({ id, timeLeft }) => {
    const def = POWERUP_DEFS.find(d => d.id === id);
    if (!def) return;
    const pct = Math.max(0, timeLeft / def.duration) * 100;
    const hex = '#' + def.color.toString(16).padStart(6, '0');

    let entry = _puPillEls[id];
    if (!entry) {
      const pill = document.createElement('div');
      pill.className = 'pu-pill';
      pill.innerHTML = `
        <span class="pu-label">${def.label}</span>
        <div class="pu-bar-wrap">
          <div class="pu-bar" style="background:${hex};box-shadow:0 0 6px ${hex};"></div>
        </div>
        <span class="pu-time"></span>
      `;
      refs.powerupHud.appendChild(pill);
      entry = _puPillEls[id] = {
        pill,
        bar:  pill.querySelector('.pu-bar'),
        time: pill.querySelector('.pu-time'),
      };
    }
    entry.bar.style.width  = pct.toFixed(1) + '%';
    entry.time.textContent = timeLeft.toFixed(1) + 's';
  });
}

// ── Apply power-up effects ─────────────────────────────────────
export function applyPowerUp(id) {
  playPowerUp();
  vibrate([20, 10, 40]);

  if (id === 'COIN_BURST') {
    // Instant: +15 coins
    const burst = 15;
    state.coins        += burst;
    state.sessionCoins += burst;
    syncHUD();
    saveProgress();
    showPickupToast('💥 +15 COINS!', 0xff8800);
    return;
  }

  game.collectables.activatePowerUp(id);

  const def = POWERUP_DEFS.find(d => d.id === id);
  showPickupToast(def ? def.label : id, def ? def.color : 0xffffff);

  // Immediate side-effects that need game-state changes
  if (id === 'GHOST_TRAIL' || id === 'SHIELD' || id === 'TURBO_FLIP') {
    game.player.setGhost(true);
    activeController.isGhostMode = true;
    refs.ghostIndicator.style.display = 'block';
    refs.ghostIndicator.textContent   =
      id === 'TURBO_FLIP' ? '▸ TURBO' :
      id === 'SHIELD'     ? '▸ SHIELD' : '▸ GHOST';
  }
  if (id === 'TINY') {
    game.player.group.scale.set(0.5, 0.5, 0.5);
  }
}

// ── Handle power-up expiry ─────────────────────────────────────
export function handlePowerUpExpiry(expiredIds) {
  expiredIds.forEach(id => {
    if (id === 'GHOST_TRAIL' || id === 'TURBO_FLIP') {
      // Only remove ghost if SHIELD is also gone
      if (!game.collectables.hasPowerUp('SHIELD') &&
          !game.collectables.hasPowerUp('GHOST_TRAIL') &&
          !game.collectables.hasPowerUp('TURBO_FLIP')) {
        game.player.setGhost(false);
        activeController.isGhostMode = false;
        refs.ghostIndicator.style.display = 'none';
      }
    }
    if (id === 'SHIELD') {
      if (!game.collectables.hasPowerUp('GHOST_TRAIL') &&
          !game.collectables.hasPowerUp('TURBO_FLIP')) {
        game.player.setGhost(false);
        activeController.isGhostMode = false;
        refs.ghostIndicator.style.display = 'none';
      }
    }
    if (id === 'TINY') {
      game.player.group.scale.set(1, 1, 1);
    }
  });
}

// ── Blink warning in the final second before a visual power-up expires ──
const GHOST_PU_IDS = ['SHIELD', 'GHOST_TRAIL', 'TURBO_FLIP'];

export function updatePowerUpBlink(t) {
  const blinkOn = Math.floor(t * 8) % 2 === 0; // ~4 on/off cycles per second

  // SHIELD / GHOST_TRAIL / TURBO_FLIP: blink between normal plane and ghost model
  const activeGhostIds = GHOST_PU_IDS.filter(id => game.collectables.hasPowerUp(id));
  if (activeGhostIds.length === 1) {
    const timeLeft = game.collectables.getTimeLeft(activeGhostIds[0]);
    if (timeLeft > 0 && timeLeft <= 1) {
      game.player.setGhost(blinkOn);
    } else {
      game.player.setGhost(true);
    }
  }

  // TINY: blink between shrunk and normal scale
  const tinyLeft = game.collectables.getTimeLeft('TINY');
  if (tinyLeft > 0) {
    if (tinyLeft <= 1) {
      const s = blinkOn ? 0.5 : 1.0;
      game.player.group.scale.set(s, s, s);
    } else {
      game.player.group.scale.set(0.5, 0.5, 0.5);
    }
  }
}