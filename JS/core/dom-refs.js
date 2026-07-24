/*
 *  dom-refs.js — Cached DOM Elements
 *  ──────────────────────────────────
 *  Grabs every element the game needs once, up front, so other files
 *  can just do `refs.playBtn` instead of repeating getElementById calls.
 */

export const refs = {
  // Menu / HUD
  playBtn:         document.getElementById('playBtn'),
  playBtnText:     document.getElementById('playBtnText'),
  rebootBtn:       document.getElementById('rebootBtn'),
  pauseBtn:        document.getElementById('pause-btn'),
  pauseScreen:     document.getElementById('pause-screen'),
  menuUI:          document.getElementById('ui-layer'),
  hud:             document.getElementById('hud'),
  gameOverUI:      document.getElementById('game-over-screen'),
  countdownOvr:    document.getElementById('countdown-overlay'),
  planeNameEl:     document.getElementById('planeName'),
  menuStats:       document.getElementById('menu-stats'),
  mainSettingsBtn: document.getElementById('main-settings-btn'),
  devEventRowSummer:    document.getElementById('devEventRowSummer'),
  devEventRowIndep:     document.getElementById('devEventRowIndep'),
  devPhaseSummer:       document.getElementById('devPhaseSummer'),
  devPhaseIndependence: document.getElementById('devPhaseIndependence'),
  devPhaseResetRow:     document.getElementById('devPhaseResetRow'),
  devPhaseResetBtn:     document.getElementById('devPhaseResetBtn'),
  pauseSettingsBtn: document.getElementById('pause-settings-btn'),
  goSettingsBtn:    document.getElementById('go-settings-btn'),
  settingsModal:   document.getElementById('settings-modal'),
  speedBar:        document.getElementById('speed-bar'),
  diffLabel:       document.getElementById('diff-label'),
  ghostIndicator:  document.getElementById('ghost-indicator'),

  // Settings modal
  settingsBackdrop: document.getElementById('settings-backdrop'),
  muteBtn:          document.getElementById('muteBtn'),
  sfxBtn:           document.getElementById('sfxBtn'),
  musicSlider:      document.getElementById('musicSlider'),
  sfxSlider:        document.getElementById('sfxSlider'),
  smoothCameraToggle: document.getElementById('smoothCameraToggle'),

  // Plane selector
  prevPlaneBtn: document.getElementById('prevPlaneBtn'),
  nextPlaneBtn: document.getElementById('nextPlaneBtn'),

  // Pause / leave / retry
  resumeBtn:            document.getElementById('resume-btn'),
  goHomeBtn:            document.getElementById('go-home-btn'),
  leaveConfirmBackdrop: document.getElementById('leave-confirm-backdrop'),
  leaveConfirmModal:    document.getElementById('leave-confirm-modal'),
  pauseHomeBtn:         document.getElementById('pause-home-btn'),
  leaveConfirmYes:      document.getElementById('leave-confirm-yes'),
  leaveConfirmNo:       document.getElementById('leave-confirm-no'),

  // Power-up HUD
  powerupHud: document.getElementById('powerup-hud'),

  // Speed FX
  speedFxOverlay: document.getElementById('speed-fx-overlay'),

  // Map selector + its confirm modal
  mapConfirmBackdrop: document.getElementById('map-confirm-backdrop'),
  mapConfirmModal:    document.getElementById('map-confirm-modal'),
  mapConfirmYes:      document.getElementById('map-confirm-yes'),
  mapConfirmNo:       document.getElementById('map-confirm-no'),
  mapConfirmTitle:    document.getElementById('map-confirm-title'),
  mapConfirmDesc:     document.getElementById('map-confirm-desc'),
  mapBtn:             document.getElementById('mapBtn'),
  mapSelector:        document.getElementById('map-selector'),
  mapOpts:            document.getElementById('map-options'),
  mapBtnWrap:         document.getElementById('map-btn-wrap'),

  // Scores
  scoreVal:     document.getElementById('scoreVal'),
  bestVal:      document.getElementById('bestVal'),
  hudCoinVal:   document.getElementById('hudCoinVal'),
  menuCoinVal:  document.getElementById('menuCoinVal'),
  menuBestVal:  document.getElementById('menuBestVal'),
  goScore:      document.getElementById('go-score'),
  goBest:       document.getElementById('go-best'),
  goCoins:      document.getElementById('go-coins'),

  // Keybinds
  keybindsGrid:   document.getElementById('keybinds-grid'),
  resetBindsBtn:  document.getElementById('resetBindsBtn'),
  controlsHint:   document.getElementById('controls-hint'),

  // Event banner
  eventBtn: document.getElementById('eventBtn'),
};
