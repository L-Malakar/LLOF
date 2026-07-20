/*
 *  collisions.js — Obstacle & Coin/Power-up Collision Detection
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.136.0/build/three.module.js';
import { game } from '../core/game-objects.js';
import { state, saveProgress } from '../core/state.js';
import { applyPowerUp } from './powerups.js';
import { triggerShake, syncHUD } from '../ui/hud.js';
import { vibrate } from '../utils/utils.js';
import { playCoin } from '../systems/music-handler.js';
import { getEventPhase } from '../systems/banner.js';

const _planeBox = new THREE.Box3();
const _obsBox   = new THREE.Box3();
const _tmpVec   = new THREE.Vector3();

export function checkObstacleCollisions() {
  // SHIELD and GHOST_TRAIL and TURBO_FLIP all block crash-on-obstacle
  if (game.player.isGhost) return false;
  if (game.collectables.hasPowerUp('SHIELD'))      return false;
  if (game.collectables.hasPowerUp('GHOST_TRAIL')) return false;
  if (game.collectables.hasPowerUp('TURBO_FLIP'))  return false;

  _planeBox.setFromObject(game.player.hitbox);
  for (const obs of game.world.obstacles) {
    obs.getWorldPosition(_tmpVec);
    if (Math.abs(_tmpVec.z) > 3) continue;
    _obsBox.setFromObject(obs);
    if (_planeBox.intersectsBox(_obsBox)) return true;
  }
  return false;
}

export function checkCoinCollisions() {
  _planeBox.setFromObject(game.player.hitbox);

  // MAGNET: expand detection box to magnetRadius
  const magnetActive = game.collectables.hasPowerUp('MAGNET');
  const magnetRadius = 6;
  if (magnetActive) {
    _planeBox.min.x -= magnetRadius;
    _planeBox.min.y -= magnetRadius * 0.5;
    _planeBox.max.x += magnetRadius;
    _planeBox.max.y += magnetRadius * 0.5;
  }

  const _eventCoinMult = getEventPhase() === 'active' ? 2 : 1;
  const coinMult = (game.collectables.hasPowerUp('COLLECTOR') ? 2 : 1) * _eventCoinMult;

  for (const item of game.collectables.items) {
    if (!item.visible) continue;
    item.getWorldPosition(_tmpVec);
    if (Math.abs(_tmpVec.z) > (magnetActive ? magnetRadius + 3 : 3)) continue;

    if (item.userData.type === 'coin') {
      _obsBox.setFromObject(item);
      if (_planeBox.intersectsBox(_obsBox)) {
        item.visible    = false;
        item.position.y = -999;
        const gained    = coinMult;
        state.coins        += gained;
        state.sessionCoins += gained;
        playCoin();
        vibrate([10]);
        triggerShake(0.06, 0.08);
        syncHUD();
        saveProgress();
      }
    } else if (item.userData.type === 'powerup') {
      // Power-up pickup: use tighter box
      _obsBox.setFromObject(item);
      _obsBox.min.subScalar(0.3); // small extra tolerance
      _obsBox.max.addScalar(0.3);

      // Re-fetch hitbox without magnet expansion for PU pickup
      const puBox = new THREE.Box3().setFromObject(game.player.hitbox);
      if (puBox.intersectsBox(_obsBox)) {
        item.visible    = false;
        item.position.y = -999;
        applyPowerUp(item.userData.puId);
      }
    }
  }
}