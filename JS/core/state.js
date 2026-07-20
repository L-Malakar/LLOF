/*
 *  state.js — Shared Game State
 *  ─────────────────────────────
 *  Every other file that needs to read or change game state imports
 *  the `state` object below and reads/writes its properties, e.g.
 *  `state.score += 1`. Because it's one shared object (not separate
 *  variables), every file always sees the latest values.
 */

export const state = {
  // Run-time state
  gameState:      'MENU',   // MENU | TRANSITION | COUNTDOWN | PLAYING | CRASHING | GAMEOVER
  isPaused:       false,
  score:          0,
  sessionCoins:   0,        // coins earned this run
  worldShiftX:    0,
  dynamicSpeed:   0.25,
  lerpFactor:     0,
  gameTime:       0,
  shakeDuration:  0,
  shakeIntensity: 0,

  // Persistent data (loaded from localStorage below)
  highScore:    parseFloat(localStorage.getItem('paperPlane_highScore') || '0'),
  coins:        parseInt( localStorage.getItem('paperPlane_coins')      || '0'),
  ownedPlanes:  JSON.parse(localStorage.getItem('paperPlane_owned')     || '[0]'),
  currentPlane: parseInt( localStorage.getItem('paperPlane_current')    || '0'),
  currentMap:   localStorage.getItem('paperPlane_map') || 'classic',
  ownedMaps:    JSON.parse(localStorage.getItem('paperPlane_ownedMaps') || '["classic"]'),
};

// Plane currently shown in the menu carousel (starts on the owned/selected plane)
state.viewIndex = state.currentPlane;

export const DIFF_TIERS = [
  { label: 'CADET',    threshold: 0    },
  { label: 'PILOT',    threshold: 200  },
  { label: 'ACE',      threshold: 500  },
  { label: 'LEGEND',   threshold: 1000 },
  { label: '∞ ULTRA',  threshold: 2000 },
];

export function saveProgress() {
  localStorage.setItem('paperPlane_coins',     state.coins.toString());
  localStorage.setItem('paperPlane_owned',     JSON.stringify(state.ownedPlanes));
  localStorage.setItem('paperPlane_current',   state.currentPlane.toString());
  localStorage.setItem('paperPlane_map',       state.currentMap);
  localStorage.setItem('paperPlane_ownedMaps', JSON.stringify(state.ownedMaps));
}
