/*
 *  game-objects.js — Player / World / Collectables Lifecycle
 *  ────────────────────────────────────────────────────────────
 *  `game.player`, `game.world`, and `game.collectables` get replaced
 *  each time the world rebuilds (new map, retry, etc). Because other
 *  files import the same `game` object, they always see the current
 *  instances without needing to re-import anything.
 */

import { Player } from '../systems/player.js';
import { WorldManager } from '../systems/world.js';
import { CollectableManager } from '../systems/collectable.js';
import { scene } from './scene-setup.js';
import { state } from './state.js';
import { isMobile } from '../utils/utils.js';

export const game = {
  player: null,
  world: null,
  collectables: null,
};

export function initGameObjects() {
  game.player = new Player(scene);
  game.player.setPlaneType(state.currentPlane);
  game.player.setMapSkin(state.currentMap);
  game.world = new WorldManager(scene, isMobile, state.currentMap);
  game.collectables = new CollectableManager(scene, isMobile);
}

export function rebuildWorld() {
  scene.remove(game.player.group);
  game.world.dispose();
  game.collectables.dispose();
  initGameObjects();
}

initGameObjects();