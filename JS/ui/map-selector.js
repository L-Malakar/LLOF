/*
 *  map-selector.js — Map Skin Selector
 */

import { SKIN_CONFIGS } from '../systems/world.js';
import { state, saveProgress } from '../core/state.js';
import { refs } from '../core/dom-refs.js';
import { getEventPhase } from '../systems/banner.js';
import { playClick, playCoin, playCrash } from '../systems/music-handler.js';
import { openConfirm } from './confirm-modal.js';
import { applyMapToScene } from '../core/scene-setup.js';
import { rebuildWorld } from '../core/game-objects.js';
import { syncHUD, triggerShake } from './hud.js';
import { showPickupToast } from './toast.js';
import { vibrate } from '../utils/utils.js';

export function renderMapSelector() {
  refs.mapOpts.innerHTML = '';
  const phase = getEventPhase(); // 'pre' | 'active' | 'post'

  Object.entries(SKIN_CONFIGS).forEach(([id, cfg]) => {
    const owned  = state.ownedMaps.includes(id);
    const active = state.currentMap === id;

    // Beach map is locked with COMING SOON only during pre-event
    const isComingSoon = cfg.comingSoon === true;

    const card = document.createElement('div');
    card.className = 'map-card'
      + (active      ? ' active' : '')
      + (!owned && !isComingSoon ? ' locked' : '')
      + (isComingSoon ? ' coming-soon-card' : '');

    let statusHTML = '';
    if (isComingSoon) {
      // Override everything — show COMING SOON badge, block interaction
      statusHTML = `<span class="map-status map-status-coming-soon">${cfg.comingSoonLabel || '🔒 COMING SOON'}</span>`;
    } else if (active) {
      statusHTML = '<span class="map-status map-status-active">✓ ACTIVE</span>';
    } else if (owned) {
      statusHTML = '<span class="map-status">TAP TO SELECT</span>';
    } else {
      // Show sale price only during active event, normal price otherwise
      if (phase === 'active' && cfg.price > 0) {
        const salePrice = Math.floor(cfg.price * 0.5);
        statusHTML = `
          <div class="map-price-wrap">
            <span class="map-status map-status-price map-price-old">⬡ ${cfg.price}</span>
            <span class="map-status map-status-price map-price-new">⬡ ${salePrice}</span>
          </div>`;
      } else {
        statusHTML = `<span class="map-status map-status-price">⬡ ${cfg.price}</span>`;
      }
    }

    // Sale ribbon only during active event
    const saleRibbon = !owned && cfg.price > 0 && phase === 'active' && !isComingSoon
      ? '<div class="sale-ribbon"></div>'
      : '';

    card.innerHTML = `
      <div class="map-card-img-wrap">
        <img class="map-card-img" src="${cfg.img}" alt="${cfg.label}" loading="lazy">
      </div>
      ${saleRibbon}
      <div class="map-card-name">${cfg.label}</div>
      <div class="map-card-desc">${cfg.desc}</div>
      ${statusHTML}
    `;

    card.addEventListener('click', () => {
      if (isComingSoon) return; // block purchase before event starts
      selectMap(id);
    });
    refs.mapOpts.appendChild(card);
  });
}

export function selectMap(mapId) {
  if (mapId === state.currentMap) { refs.mapSelector.style.display = 'none'; return; }

  const cfg = SKIN_CONFIGS[mapId];

  if (!state.ownedMaps.includes(mapId)) {
    const phase = getEventPhase();
    const effectivePrice = (phase === 'active' && cfg.price > 0)
      ? Math.floor(cfg.price * 0.5)
      : cfg.price;

    if (state.coins < effectivePrice) {
      playCrash();
      vibrate([50, 30, 50]);
      showPickupToast('⬡ NOT ENOUGH COINS', 0xff2255);
      return;
    }

    openMapConfirm(mapId, effectivePrice);
    return;
  }

  finalizeMapSelect(mapId);
}

function openMapConfirm(mapId, effectivePrice) {
  const cfg = SKIN_CONFIGS[mapId];
  openConfirm('BUY MAP SKIN?', `Buy "${cfg.label}" for ${effectivePrice} coins?`, () => {
    state.coins -= effectivePrice;
    state.ownedMaps.push(mapId);
    saveProgress();
    syncHUD();
    playCoin();
    vibrate([30]);
    triggerShake(0.1, 0.05);
    finalizeMapSelect(mapId);
  });
}

export function finalizeMapSelect(mapId) {
  state.currentMap = mapId;
  saveProgress();
  applyMapToScene();
  rebuildWorld();
  renderMapSelector();
  playClick();
}

export function initMapSelector() {
  renderMapSelector();

  refs.mapBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playClick();
    const visible = refs.mapSelector.style.display === 'block';
    refs.mapSelector.style.display = visible ? 'none' : 'block';
    if (!visible) renderMapSelector();
  });

  // Close map selector when clicking outside
  document.addEventListener('click', (e) => {
    if (refs.mapSelector.style.display === 'block' &&
        !refs.mapSelector.contains(e.target) &&
        e.target !== refs.mapBtn && !refs.mapBtn.contains(e.target)) {
      refs.mapSelector.style.display = 'none';
    }
  });
}