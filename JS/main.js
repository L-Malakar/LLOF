/*
 *  main.js — App Entry Point
 *  ──────────────────────────
 *  This file's only job is to import every feature module and start
 *  them in the right order. All the actual game logic lives in the
 *  individual JS/*.js files it imports below.
 */

import { initBanner } from './systems/banner.js';
import { refs } from './core/dom-refs.js';

import { initSettingsPanel } from './ui/settings-panel.js';
import { initKeybinds } from './ui/keybinds.js';
import { initPlaneSelector } from './ui/plane-selector.js';
import { initPause } from './ui/pause.js';
import { initPlayFlow } from './gameplay/play-flow.js';
import { initConfirmModal } from './ui/confirm-modal.js';
import { initMapSelector } from './ui/map-selector.js';
import { initDevCheats } from './utils/dev-cheat.js';
import { animate } from './gameplay/game-loop.js';

// Order mirrors the original single-file build: settings UI first,
// then keybinds (which needs the settings modal to exist), then the
// plane carousel, pause button, play/retry/go-home flow, the generic
// confirm modal, the map selector, dev cheats, and finally the loop.
initSettingsPanel();
initKeybinds();
initPlaneSelector();
initPause();
initPlayFlow();
initConfirmModal();
initMapSelector();
initDevCheats();

animate();
initBanner();

// ── Event button — reopens the banner ─────────────────────────
refs.eventBtn.addEventListener('click', () => {
  // Remove the 'seen' flag so initBanner shows it again
  sessionStorage.removeItem('paperPlane_banner_summersale2025');
  // If banner already on screen don't add another
  if (document.getElementById('event-banner-overlay')) return;
  initBanner();
});