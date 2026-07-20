/*
 *  plane-selector.js — Menu Plane Carousel
 */

import { game } from '../core/game-objects.js';
import { state } from '../core/state.js';
import { refs } from '../core/dom-refs.js';
import { getEventPhase } from '../systems/banner.js';
import { playClick } from '../systems/music-handler.js';

export function updateMenuUI() {
  const def = game.player.planeDefs[state.viewIndex];
  refs.planeNameEl.textContent = def.name;
  game.player.setPlaneType(state.viewIndex);

  // Remove any existing badge floating outside the button
  const _existingBadge = document.getElementById('plane-sale-badge');
  if (_existingBadge) _existingBadge.remove();

  if (state.ownedPlanes.includes(state.viewIndex)) {
    refs.playBtnText.textContent   = (state.viewIndex === state.currentPlane) ? 'PLAY' : 'SELECT';
    refs.playBtn.className         = '';
    refs.playBtn.style.borderColor = '';
    refs.playBtn.style.color       = '';
  } else {
    const phase = getEventPhase();
    const salePlanePrice = (phase === 'active')
      ? Math.floor(def.price * 0.75)   // 25% OFF during event
      : def.price;                       // normal price otherwise
    refs.playBtnText.textContent   = `⬡ BUY ${salePlanePrice}`;
    refs.playBtn.className         = 'btn-gold';
    refs.playBtn.style.borderColor = '';
    refs.playBtn.style.color       = '';

    // Inject badge as sibling, anchored to button's top-right corner
    if (phase === 'active') {
      const badge = document.createElement('div');
      badge.id        = 'plane-sale-badge';
      badge.className = 'btn-sale-tag';
      refs.playBtn.parentElement.appendChild(badge);
    }
  }
}

export function initPlaneSelector() {
  updateMenuUI();

  refs.prevPlaneBtn.addEventListener('click', () => {
    playClick();
    state.viewIndex = (state.viewIndex - 1 + game.player.planeDefs.length) % game.player.planeDefs.length;
    updateMenuUI();
  });
  refs.nextPlaneBtn.addEventListener('click', () => {
    playClick();
    state.viewIndex = (state.viewIndex + 1) % game.player.planeDefs.length;
    updateMenuUI();
  });
}