/*
 *  game-loop.js — Main Animate Loop
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.136.0/build/three.module.js';
import { MController } from '../systems/Mcontroller.js';
import { game } from '../core/game-objects.js';
import { state } from '../core/state.js';
import { refs } from '../core/dom-refs.js';
import { isMobile, vibrate } from '../utils/utils.js';
import { scene, camera, renderer, cameraRig, cameraWheel, activeController } from '../core/scene-setup.js';
import { playCrash } from '../systems/music-handler.js';
import { updateDiffLabel, updateSpeedBar, triggerShake, syncHUD } from '../ui/hud.js';
import { checkObstacleCollisions, checkCoinCollisions } from './collisions.js';
import { handlePowerUpExpiry, updatePowerUpBlink, renderPowerUpHUD, clearPowerUpHUD } from './powerups.js';
import { startCountdown } from '../ui/countdown.js';

export const clock = new THREE.Clock();

// Single source of truth: mobile controls are visible only while the
// player actually needs to steer — COUNTDOWN or PLAYING, and not paused.
// Checked every frame so no individual state-change handler can forget it.
let _mobileControlsVisible = null;
function syncMobileControls() {
  if (!isMobile) return;
  const shouldShow = (state.gameState === 'COUNTDOWN' || state.gameState === 'PLAYING') && !state.isPaused;
  if (shouldShow === _mobileControlsVisible) return;
  _mobileControlsVisible = shouldShow;
  if (shouldShow) {
    MController.enabled = true;
    MController.showControls();
  } else {
    MController.disable();
  }
}

export function animate() {
  requestAnimationFrame(animate);
  syncMobileControls();
  if (state.gameState === 'GAMEOVER') return;

  const delta = Math.min(clock.getDelta(), 0.05); // cap at 50ms to prevent tunnelling
  if (state.isPaused || cameraWheel.isOpen) { renderer.render(scene, camera); return; }

  state.gameTime += delta;
  const t = state.gameTime;

  // Tick power-up timers and handle expiry
  if (state.gameState === 'PLAYING') {
    const expired = game.collectables.tickPowerUps(delta);
    if (expired.length) handlePowerUpExpiry(expired);
    updatePowerUpBlink(t);
    renderPowerUpHUD();
  }

  // ── Speed modifiers from power-ups ───────────────────────────
  let effectiveSpeed = state.dynamicSpeed;
  if (game.collectables.hasPowerUp('SPEED'))      effectiveSpeed *= 2.0;
  if (game.collectables.hasPowerUp('SLOW_MO'))    effectiveSpeed *= 0.5;
  if (game.collectables.hasPowerUp('TURBO_FLIP')) effectiveSpeed *= 3.0;

  // Always scroll world (even in countdown so it feels alive)
  game.world.distance = state.score;
  game.world.update(effectiveSpeed, state.worldShiftX, t);
  game.collectables.update(effectiveSpeed, state.worldShiftX, t, state.score, game.player.group.position.y);

  // ─── MENU ────────────────────────────────────────────────────
  if (state.gameState === 'MENU') {
    camera.position.lerp(new THREE.Vector3(2, 4, 8), 0.05);
    cameraRig.smoothLookAt(camera, game.player.group.position.x, game.player.group.position.y, game.player.group.position.z, delta);
    game.player.updateMenuAnimation(t);

  // ─── TRANSITION ──────────────────────────────────────────────
  } else if (state.gameState === 'TRANSITION') {
    state.lerpFactor += 0.015;
    game.player.group.position.x = THREE.MathUtils.lerp(-5, 0, state.lerpFactor);
    const introTarget = cameraRig.getTarget(0, game.player.group.position.y + 1.5, 5, game.player.group.position.y);
    camera.position.lerp(
      new THREE.Vector3(introTarget.pos.x, introTarget.pos.y, introTarget.pos.z), 0.05
    );
    cameraRig.smoothLookAt(camera, introTarget.look.x, introTarget.look.y, introTarget.look.z, delta);
    if (state.lerpFactor >= 1) {
      cameraRig.prevIndex = cameraRig.index;
      cameraRig._t = 1; // already at the target angle — no blend jump
      state.gameState = 'COUNTDOWN';
      game.player.setGhost(true);
      activeController.isGhostMode = true;
      refs.ghostIndicator.style.display = 'block';
      clock.getDelta();
      startCountdown(() => {
        game.player.setGhost(false);
        activeController.isGhostMode = false;
        refs.ghostIndicator.style.display = 'none';
        state.gameState = 'PLAYING';
      });
    }

  // ─── COUNTDOWN ───────────────────────────────────────────────
  } else if (state.gameState === 'COUNTDOWN') {
    state.dynamicSpeed = 0.25;
    const ctrl   = activeController.update(game.player.group, state.worldShiftX, delta);
    state.worldShiftX  = ctrl.worldShiftX;
    game.player.updateFlightAnimation(t, ctrl);
    game.player.updateGlitch(t);
    cameraRig.apply(camera, 0, game.player.group.position.y + 1.5, 5, game.player.group.position.y, delta);

  // ─── PLAYING ─────────────────────────────────────────────────
  } else if (state.gameState === 'PLAYING') {
    // Speed ramp: 0.25 → 0.8 over 2000 m
    state.dynamicSpeed = Math.min(0.25 + state.score * 0.000275, 0.8);
    state.score       += effectiveSpeed * 6 * delta;

    refs.scoreVal.textContent = Math.floor(state.score);
    updateDiffLabel();
    updateSpeedBar();

    // FOV stretch with speed
    const targetFov = 75 + (effectiveSpeed - 0.25) * 30;
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.05);
    camera.updateProjectionMatrix();

    const ctrl = activeController.update(game.player.group, state.worldShiftX, delta);
    state.worldShiftX = ctrl.worldShiftX;
    game.player.updateFlightAnimation(t, ctrl);
    if (game.player.isGhost) game.player.updateGlitch(t);

    let camX = 0, camY = game.player.group.position.y + 1.5;
    if (state.shakeDuration > 0) {
      camX += (Math.random() - 0.5) * state.shakeIntensity;
      camY += (Math.random() - 0.5) * state.shakeIntensity;
      state.shakeDuration -= delta;
      if (isMobile) vibrate([8]);
    }
    game.player.mesh.visible = cameraRig.mode !== 'Up-close';
    game.player.ghostMesh.visible = cameraRig.mode !== 'Up-close' && game.player.isGhost;
    cameraRig.apply(camera, camX, camY, 5, game.player.group.position.y, delta);

    checkCoinCollisions();

    // BUG FIX: ctrl.isCrashed can fire when ghost mode is on (ground hit).
    // Guard it against active shield/ghost power-ups as well.
    const shieldActive = game.collectables.hasPowerUp('SHIELD') ||
                         game.collectables.hasPowerUp('GHOST_TRAIL') ||
                         game.collectables.hasPowerUp('TURBO_FLIP');
    const groundCrash  = !shieldActive && (ctrl.isCrashed || ctrl.isGroundHit);

    if (groundCrash || checkObstacleCollisions()) {
      // Clear power-ups on crash
      game.collectables.activePowerUps = [];
      clearPowerUpHUD();
      game.player.setGhost(false);
      game.player.group.scale.set(1, 1, 1); // reset TINY
      activeController.isGhostMode = false;
      refs.ghostIndicator.style.display = 'none';

      playCrash();
      vibrate([80, 30, 80, 30, 150]);
      triggerShake(0.6, 0.9);
      state.gameState = 'CRASHING';
      refs.pauseBtn.style.display   = 'none';
      refs.diffLabel.style.display  = 'none';
    }

  // ─── CRASHING ────────────────────────────────────────────────
  } else if (state.gameState === 'CRASHING') {
    game.player.updateCrashAnimation(delta);

    let camX = 0, camY = game.player.group.position.y + 1.5;
    if (state.shakeDuration > 0) {
      camX += (Math.random() - 0.5) * state.shakeIntensity;
      camY += (Math.random() - 0.5) * state.shakeIntensity;
      state.shakeDuration -= delta;
    }
    game.player.mesh.visible = cameraRig.mode !== 'Up-close';
    game.player.ghostMesh.visible = cameraRig.mode !== 'Up-close' && game.player.isGhost;
    cameraRig.apply(camera, camX, camY, 5, game.player.group.position.y, delta);

    if (game.player.group.position.y <= 0 && refs.gameOverUI.style.display !== 'block') {
      if (state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem('paperPlane_highScore', state.highScore.toString());
      }
      // Populate game-over stats
      refs.goScore.textContent = Math.floor(state.score) + 'm';
      refs.goBest.textContent  = Math.floor(state.highScore) + 'm';
      refs.goCoins.textContent = state.sessionCoins;
      syncHUD();
      refs.gameOverUI.style.display = 'block';
      refs.hud.style.display        = 'none';
      state.gameState                = 'GAMEOVER';
    }
  }

  renderer.render(scene, camera);
}