/*
 *  main.js — App Entry Point
 *  ──────────────────────────
 *  This file's only job is to import every feature module and start
 *  them in the right order. All the actual game logic lives in the
 *  individual JS/*.js files it imports below.
 */

import { initBanner, openEventBanner } from './systems/banner.js';
import { initIndependenceBanner, initIndependenceBannerDevPreview } from '../temp_event/JS/independence-banner.js';
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
import { isMobile } from './utils/utils.js';

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
initIndependenceBanner();
initIndependenceBannerDevPreview();

// ── Event button — reopens the banner ─────────────────────────
refs.eventBtn.addEventListener('click', () => {
  openEventBanner();
});

// ── Auto-hide idle cursor (desktop only) ───────────────────────
// Hides the mouse pointer after 500ms of no movement, and brings
// it back the instant the mouse moves again.
if (!isMobile) {
  const IDLE_MS = 500;
  const style = document.createElement('style');
  style.textContent = `body.cursor-idle, body.cursor-idle * { cursor: none !important; }`;
  document.head.appendChild(style);

  let idleTimer = null;
  const showCursor = () => {
    document.body.classList.remove('cursor-idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      document.body.classList.add('cursor-idle');
    }, IDLE_MS);
  };

  window.addEventListener('mousemove', showCursor);
  showCursor(); // start the timer immediately on load
}