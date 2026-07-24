/*
 *  dev-cheat.js — 🔧 DEV CHEAT — REMOVE BEFORE RELEASE
 */

import { state, saveProgress } from '../core/state.js';
import { applyMapToScene } from '../core/scene-setup.js';
import { rebuildWorld } from '../core/game-objects.js';
import { syncHUD } from '../ui/hud.js';
import { showPickupToast } from '../ui/toast.js';
import { renderMapSelector } from '../ui/map-selector.js';
import { refs } from '../core/dom-refs.js';
import { getDevPhaseOverride, setDevPhaseOverride } from './utils.js';

// 🔧 DEV CHEAT — REMOVE BEFORE RELEASE
// Lets devs force either event's banner into NOT ACTIVE / UPCOMING /
// ACTIVE / ENDED for testing, without touching the system clock.
// localhost/127.0.0.1 only. Saved in cookies.
export function initDevEventControls() {
  const _devHost = window.location.hostname;
  const _isLocal = _devHost === 'localhost' || _devHost === '127.0.0.1';
  if (!_isLocal) return;

  refs.devEventRowSummer.style.display = 'flex';
  refs.devEventRowIndep.style.display  = 'flex';
  refs.devPhaseResetRow.style.display  = 'flex';

  refs.devPhaseSummer.value       = getDevPhaseOverride('summer');
  refs.devPhaseIndependence.value = getDevPhaseOverride('independence');

  refs.devPhaseSummer.addEventListener('change', () => {
    setDevPhaseOverride('summer', refs.devPhaseSummer.value);
    showPickupToast('🔧 SUMMER SALE PHASE SET — reload to see it', 0x00e5ff);
  });

  refs.devPhaseIndependence.addEventListener('change', () => {
    setDevPhaseOverride('independence', refs.devPhaseIndependence.value);
    showPickupToast('🔧 TIRANGA PHASE SET — reload to see it', 0xFF9933);
  });

  refs.devPhaseResetBtn.addEventListener('click', () => {
    setDevPhaseOverride('summer', 'auto');
    setDevPhaseOverride('independence', 'auto');
    refs.devPhaseSummer.value = 'auto';
    refs.devPhaseIndependence.value = 'auto';
    showPickupToast('🔧 EVENT PHASES RESET TO DEFAULT — reload to see it', 0x00e5ff);
  });
}

export function initDevCheats() {
  const _devHost = window.location.hostname;
  const _devPort = window.location.port;
  const _isLocal = _devHost === 'localhost' || _devHost === '127.0.0.1';
  const _isLiveServer = _isLocal && _devPort === '5500';
  if (!_isLiveServer) return;

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyC' && e.ctrlKey && e.shiftKey && e.altKey) {
      e.stopPropagation();
      state.coins += 5000;
      saveProgress();
      syncHUD();
      showPickupToast('🔧 +5000 COINS', 0x00e5ff);
    }

    if (e.code === 'KeyM' && e.ctrlKey && e.shiftKey && e.altKey) {
      e.stopPropagation();
      if (!state.ownedMaps.includes('independence')) state.ownedMaps.push('independence');
      state.currentMap = 'independence';
      saveProgress();
      applyMapToScene();
      rebuildWorld();
      renderMapSelector();
      showPickupToast('🔧 TRIRANGA MAP', 0xFF9933);
    }
  }, true);
}