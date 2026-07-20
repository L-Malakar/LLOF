/*
 *  settings-panel.js — Settings Modal
 */

import { MController } from '../systems/Mcontroller.js';
import { state } from '../core/state.js';
import { refs } from '../core/dom-refs.js';
import { isMobile, bindTouchAndClick } from '../utils/utils.js';
import { cameraRig } from '../core/scene-setup.js';
import {
  startMusic, toggleMute, toggleSFX,
  setMusicVolume, getMusicVolume,
  setSFXVolume,   getSFXVolume,
  playClick,
  getMusicMuted, getSFXMuted,
} from '../systems/music-handler.js';
import { renderKeybinds } from './keybinds.js';

let settingsPausedGame = false; // true only if openSettings() itself paused a running game

export function openSettings() {
  playClick();
  if (state.gameState === 'PLAYING' && !state.isPaused) {
    state.isPaused = true;
    settingsPausedGame = true;
  }
  refs.settingsModal.style.display = 'block';
  refs.settingsBackdrop.style.display = 'block';
  if (!isMobile) renderKeybinds();
}

export function closeSettings() {
  playClick();
  refs.settingsModal.style.display = 'none';
  refs.settingsBackdrop.style.display = 'none';
  if (settingsPausedGame) {
    state.isPaused = false;
    settingsPausedGame = false;
  }
}

function updateAudioIcons() {
  refs.muteBtn.src = getMusicMuted()
    ? 'https://cdn-icons-png.flaticon.com/512/727/727240.png'
    : 'https://cdn-icons-png.flaticon.com/512/727/727269.png';
  refs.sfxBtn.src  = getSFXMuted()
    ? 'https://cdn-icons-png.flaticon.com/512/727/727240.png'
    : 'https://cdn-icons-png.flaticon.com/512/727/727269.png';
}

function renderMobileCtrlOpts() {
  document.querySelectorAll('.ctrl-opt').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.mode === MController.mode);
  });
}

export function initSettingsPanel() {
  // ── Tabs ──────────────────────────────────────────────────────
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      playClick();
    });
  });

  // ── Audio settings ────────────────────────────────────────────
  startMusic();

  refs.musicSlider.value = getMusicVolume();
  refs.sfxSlider.value   = getSFXVolume();
  updateAudioIcons();

  refs.muteBtn.addEventListener('click', () => { toggleMute(); playClick(); updateAudioIcons(); });
  refs.sfxBtn.addEventListener( 'click', () => { toggleSFX();  if (!getSFXMuted()) playClick(); updateAudioIcons(); });
  refs.musicSlider.addEventListener('input', e => { setMusicVolume(+e.target.value); updateAudioIcons(); });
  refs.sfxSlider.addEventListener(  'input', e => { setSFXVolume(  +e.target.value); updateAudioIcons(); });

  // ── Smooth camera movement toggle ───────────────────────────────
  const _savedSmoothCam = localStorage.getItem('paperPlane_smoothCamera');
  const _smoothCamOn = _savedSmoothCam === null ? true : _savedSmoothCam === 'true';
  refs.smoothCameraToggle.checked = _smoothCamOn;
  cameraRig.setSmoothing(_smoothCamOn);
  refs.smoothCameraToggle.addEventListener('change', e => {
    cameraRig.setSmoothing(e.target.checked);
    localStorage.setItem('paperPlane_smoothCamera', e.target.checked.toString());
    playClick();
  });

  // ── Mobile control selection ─────────────────────────────────
  renderMobileCtrlOpts();
  document.querySelectorAll('.ctrl-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      MController.setMode(btn.dataset.mode);
      renderMobileCtrlOpts();
      playClick();
    });
  });

  // ── Open / close wiring ───────────────────────────────────────
  bindTouchAndClick(refs.settingsBackdrop, closeSettings);
  bindTouchAndClick(refs.mainSettingsBtn,                             openSettings);
  bindTouchAndClick(document.getElementById('go-settings-btn'),       openSettings);
  bindTouchAndClick(document.getElementById('pause-settings-btn'),    openSettings);
  bindTouchAndClick(document.getElementById('closeSettingsBtn'),      closeSettings);
}