/*
 *  play-flow.js — Play / Go-Home / Leave-Confirm / Retry
 */

import { MController } from '../systems/Mcontroller.js';
import { game, rebuildWorld } from '../core/game-objects.js';
import { state, saveProgress } from '../core/state.js';
import { refs } from '../core/dom-refs.js';
import { isMobile, vibrate, bindTouchAndClick } from '../utils/utils.js';
import { camera, activeController } from '../core/scene-setup.js';
import { getEventPhase } from '../systems/banner.js';
import { playClick, playCoin, playCrash } from '../systems/music-handler.js';
import { syncHUD, triggerShake } from '../ui/hud.js';
import { updateMenuUI } from '../ui/plane-selector.js';
import { renderMapSelector } from '../ui/map-selector.js';
import { clearPowerUpHUD } from './powerups.js';
import { startCountdown } from '../ui/countdown.js';
import { clock } from './game-loop.js';

export function goHome() {
  playClick();
  state.gameState     = 'MENU';
  state.score         = 0;
  state.sessionCoins  = 0;
  state.worldShiftX   = 0;
  state.dynamicSpeed  = 0.25;
  state.lerpFactor    = 0;
  state.gameTime      = 0;
  state.isPaused      = false;

  // Reset camera
  camera.fov    = 75;
  camera.updateProjectionMatrix();

  // FIX: hide pause screen and pause btn — only visible when in-game
  refs.pauseBtn.style.display    = 'none';
  refs.pauseScreen.style.display = 'none';
  refs.diffLabel.style.display   = 'none';
  refs.ghostIndicator.style.display = 'none';
  refs.pauseBtn.src = 'https://cdn-icons-png.flaticon.com/512/151/151859.png';

  rebuildWorld();
  clearPowerUpHUD();

  refs.gameOverUI.style.display = 'none';
  refs.hud.style.display        = 'none';
  refs.menuUI.style.display     = 'block';
  refs.menuStats.style.display  = 'block';
  refs.mainSettingsBtn.style.display = 'block';
  refs.mapBtnWrap.style.display = 'block';
  syncHUD();
  updateMenuUI();
  renderMapSelector();
  setTimeout(() => { refs.menuUI.style.opacity = '1'; refs.menuStats.style.opacity = '1'; }, 10);
}

export function openLeaveConfirm() {
  refs.leaveConfirmBackdrop.style.display = 'block';
  refs.leaveConfirmModal.style.display    = 'block';
}
function closeLeaveConfirm() {
  refs.leaveConfirmBackdrop.style.display = 'none';
  refs.leaveConfirmModal.style.display    = 'none';
}

export function initPlayFlow() {
  // ── Play button ─────────────────────────────────────────────
  refs.playBtn.addEventListener('click', () => {
    if (state.gameState !== 'MENU') return;
    const def = game.player.planeDefs[state.viewIndex];

    // Buy
    if (!state.ownedPlanes.includes(state.viewIndex)) {
      const _buyPhase = getEventPhase();
      const _effectivePlanePrice = (_buyPhase === 'active')
        ? Math.floor(def.price * 0.75)
        : def.price;
      if (state.coins >= _effectivePlanePrice) {
        playCoin();
        vibrate([30]);
        triggerShake(0.1, 0.05);
        state.coins -= _effectivePlanePrice;
        state.ownedPlanes.push(state.viewIndex);
        saveProgress();
        syncHUD();
        updateMenuUI();
      } else {
        playCrash();
        vibrate([50, 30, 50]);
      }
      return;
    }

    // Select without playing
    if (state.viewIndex !== state.currentPlane) {
      playClick();
      state.currentPlane = state.viewIndex;
      saveProgress();
      updateMenuUI();
      return;
    }

    // START GAME
    playClick();

    // If either event banner is still on screen (player was fast /
    // clicked PLAY behind it), force it closed immediately instead
    // of letting it hang around over the gameplay view.
    const eventBannerClose = document.getElementById('banner-close-btn');
    if (eventBannerClose) eventBannerClose.click();
    const indepBannerClose = document.getElementById('indep-banner-close');
    if (indepBannerClose) indepBannerClose.click();

    if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(()=>{});
    state.gameState = 'TRANSITION';
    refs.menuUI.style.opacity  = '0';
    refs.menuStats.style.opacity = '0';
    refs.mainSettingsBtn.style.display = 'none';
    refs.mapBtnWrap.style.display = 'none';
    refs.mapSelector.style.display = 'none';
    setTimeout(() => { refs.menuUI.style.display = 'none'; refs.menuStats.style.display = 'none'; }, 600);
    refs.hud.style.display = 'block';
    state.sessionCoins = 0;
    if (isMobile) MController.init();
    activeController.init();
  });

  // ── Go home ─────────────────────────────────────────────────
  bindTouchAndClick(refs.goHomeBtn, goHome);

  bindTouchAndClick(refs.pauseHomeBtn, openLeaveConfirm);
  bindTouchAndClick(refs.leaveConfirmYes, () => { closeLeaveConfirm(); goHome(); });
  bindTouchAndClick(refs.leaveConfirmNo,  closeLeaveConfirm);
  bindTouchAndClick(refs.leaveConfirmBackdrop, closeLeaveConfirm);

  // ── Retry ───────────────────────────────────────────────────
  refs.rebootBtn.addEventListener('click', () => {
    playClick();
    state.score         = 0;
    state.sessionCoins  = 0;
    state.worldShiftX   = 0;
    state.dynamicSpeed  = 0.25;
    state.lerpFactor    = 1;
    state.gameTime      = 0;
    state.isPaused      = false;
    camera.fov    = 75;
    camera.updateProjectionMatrix();

    if (isMobile) MController.reset();

    rebuildWorld();
    clearPowerUpHUD();
    game.player.group.position.set(0, 3, 0);
    game.player.group.rotation.set(0, 0, 0);
    game.player.crumpleFactor = 0;
    game.player.fallVelocity  = 0;
    game.player._crashTimer   = 0;
    refs.gameOverUI.style.display = 'none';
    refs.hud.style.display        = 'block';
    refs.pauseBtn.style.display   = 'none'; // hidden until countdown ends
    refs.ghostIndicator.style.display = 'none';
    refs.diffLabel.style.display  = 'none';
    syncHUD();

    activeController.init();

    state.gameState = 'COUNTDOWN';
    game.player.setGhost(true);
    activeController.isGhostMode = true;
    clock.getDelta(); // flush

    startCountdown(() => {
      game.player.setGhost(false);
      activeController.isGhostMode = false;
      refs.ghostIndicator.style.display = 'none';
      state.gameState = 'PLAYING';
    });
  });
}