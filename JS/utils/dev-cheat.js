/*
 *  dev-cheat.js — 🔧 DEV CHEAT — REMOVE BEFORE RELEASE
 */

import { state, saveProgress } from '../core/state.js';
import { applyMapToScene } from '../core/scene-setup.js';
import { rebuildWorld } from '../core/game-objects.js';
import { syncHUD } from '../ui/hud.js';
import { showPickupToast } from '../ui/toast.js';
import { renderMapSelector } from '../ui/map-selector.js';

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
      if (!state.ownedMaps.includes('beach')) state.ownedMaps.push('beach');
      state.currentMap = 'beach';
      saveProgress();
      applyMapToScene();
      rebuildWorld();
      renderMapSelector();
      showPickupToast('🔧 BEACH SUNSET MAP', 0x00e5ff);
    }
  }, true);
}