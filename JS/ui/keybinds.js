/*
 *  keybinds.js — Keybind Display, Rebinding, and Global Hotkeys
 */

import { Controller } from '../systems/controller.js';
import { state } from '../core/state.js';
import { refs } from '../core/dom-refs.js';
import { isMobile } from '../utils/utils.js';
import { activeController, cameraRig, cameraWheel } from '../core/scene-setup.js';
import { playClick } from '../systems/music-handler.js';
import { openConfirm } from './confirm-modal.js';
import { moveMapFocus, activateFocusedMap } from './map-selector.js';

// Generic left/right focus-ring helper reused by the pause & game-over
// 3-button rows below (mirrors the map-selector focus pattern).
function _makeBtnRowFocus(getBtns) {
  let idx = 1; // center button (RESUME / RETRY) is the default focus
  return {
    move(delta) {
      const btns = getBtns();
      if (!btns.length) return;
      idx = (idx + delta + btns.length) % btns.length;
      btns.forEach((b, i) => b.classList.toggle('kb-focused', i === idx));
    },
    activate() {
      const btns = getBtns();
      if (btns[idx]) btns[idx].click();
    },
    reset() {
      idx = 1;
      getBtns().forEach((b, i) => b.classList.toggle('kb-focused', i === 1));
    },
  };
}
import { togglePause } from './pause.js';
import { openSettings, closeSettings } from './settings-panel.js';
import { goHome, openLeaveConfirm } from '../gameplay/play-flow.js';

const KB_ACTIONS = [
  { action: 'up',       label: 'MOVE UP'     },
  { action: 'down',     label: 'MOVE DOWN'   },
  { action: 'left',     label: 'MOVE LEFT'   },
  { action: 'right',    label: 'MOVE RIGHT'  },
  null, // divider
  { action: 'pause',    label: 'PAUSE'       },
  { action: 'restart',  label: 'RETRY'       },
  { action: 'home',     label: 'HOME'        },
  { action: 'settings', label: 'SETTINGS'    },
  null, // divider
  { action: 'camera',      label: 'CAMERA'       },
  { action: 'cameraWheel', label: 'CAMERA WHEEL' },
  null, // divider
  { action: 'confirmYes', label: 'CONFIRM — YES' },
  { action: 'confirmNo',  label: 'CONFIRM — NO'  },
];

/** Space doesn't render visibly as a single character — show a readable label instead. */
function formatKeyLabel(k) {
  if (k === ' ') return 'SPACE';
  return (k && k.length === 1) ? k.toUpperCase() : k;
}

let listeningAction = null;
let defaultBinds = null;

export function renderKeybinds() {
  const grid = refs.keybindsGrid;
  grid.innerHTML = '';

  KB_ACTIONS.forEach(entry => {
    if (!entry) {
      const div = document.createElement('div');
      div.className = 'kb-divider';
      grid.appendChild(div);
      // need two cells for the grid columns
      const gap = document.createElement('div'); gap.className = 'kb-divider';
      grid.appendChild(gap);
      return;
    }
    const label = document.createElement('div');
    label.className   = 'kb-action';
    label.textContent = entry.label;

    const keyEl = document.createElement('div');
    keyEl.className   = 'kb-key';
    const raw  = Controller.binds[entry.action] || '?';
    keyEl.textContent = formatKeyLabel(raw);
    if (listeningAction === entry.action) keyEl.classList.add('listening');

    keyEl.addEventListener('click', () => {
      listeningAction = entry.action;
      renderKeybinds();
    });

    grid.appendChild(label);
    grid.appendChild(keyEl);
  });

  syncKeyBadges();
}

function syncKeyBadges() {
  const b = Controller.binds;
  const safe = formatKeyLabel;
  document.querySelectorAll('[id^="kb-badge-"]').forEach(el => {
    const type = el.id.replace('kb-badge-', '').replace(/-/g, '');
    const map = { home: 'home', settings: 'settings', restart: 'restart', gohome: 'home', gosettings: 'settings' };
    if (map[type]) el.textContent = safe(b[map[type]]);
  });
  refs.controlsHint.textContent =
    `[ ${safe(b.up)} / ${safe(b.left)} / ${safe(b.down)} / ${safe(b.right)} ] or [ ARROW KEYS ] — NAVIGATE`;
}

function updateResetBtnState() {
  const btn = refs.resetBindsBtn;
  const isDefault = KB_ACTIONS
    .filter(Boolean)
    .every(entry => Controller.binds[entry.action] === defaultBinds[entry.action]);
  btn.disabled = isDefault;
  btn.classList.toggle('btn-disabled', isDefault);
}

export function initKeybinds() {
  if (!isMobile) {
    defaultBinds = { ...Controller.binds };

    const pauseFocus = _makeBtnRowFocus(() => [refs.pauseHomeBtn, refs.resumeBtn, refs.pauseSettingsBtn]);
    const goFocus     = _makeBtnRowFocus(() => [refs.goHomeBtn, refs.rebootBtn, refs.goSettingsBtn]);

    renderKeybinds();
    updateResetBtnState();

    refs.resetBindsBtn.addEventListener('click', () => {
      if (refs.resetBindsBtn.disabled) return;
      openConfirm('RESET KEYBINDS?', 'This will restore all keybinds to default.', () => {
        Controller.resetBinds();
        listeningAction = null;
        renderKeybinds();
        updateResetBtnState();
        playClick();
      });
    });

    // Listen for remap key
    window.addEventListener('keydown', (e) => {
      if (!listeningAction) return;
      e.preventDefault();
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      Controller.rebind(listeningAction, key);
      listeningAction = null;
      renderKeybinds();
      updateResetBtnState();
    });

    // Global hotkeys when modal/pause closed
    window.addEventListener('keydown', (e) => {
      if (listeningAction) return;

      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      // Confirm Yes/No dialogs take priority over EVERYTHING below,
      // including the settings-modal check — they can render on top
      // of an open Settings panel (e.g. Reset Keybinds), so they must
      // be checked first or Space/C never reach them.
      if (refs.mapConfirmModal.style.display === 'block') {
        if (k === Controller.binds.confirmYes) { e.preventDefault(); refs.mapConfirmYes.click(); return; }
        if (k === Controller.binds.confirmNo)  { e.preventDefault(); refs.mapConfirmNo.click();  return; }
        return;
      }

      // Same for the separate "Leave Run?" confirm dialog
      if (refs.leaveConfirmModal.style.display === 'block') {
        if (k === Controller.binds.confirmYes) { e.preventDefault(); refs.leaveConfirmYes.click(); return; }
        if (k === Controller.binds.confirmNo)  { e.preventDefault(); refs.leaveConfirmNo.click();  return; }
        return;
      }

      if (refs.settingsModal.style.display === 'block') {
        if (k === Controller.binds.settings) closeSettings();
        return;
      }

      // Map skin window: arrows navigate cards, Space activates,
      // 'm' closes it — and this `return` stops the plane-switch
      // arrows/Space below from ever firing while it's open.
      if (refs.mapSelector.style.display === 'block') {
        if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); moveMapFocus(-1); return; }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); moveMapFocus(1);  return; }
        if (k === ' ' && !isMobile) { e.preventDefault(); activateFocusedMap(); return; }
        if (k === 'm') { refs.mapBtn.click(); return; }
        return;
      }

      // Pause screen: arrows move between HOME / RESUME / SETTINGS, Space activates.
      if (refs.pauseScreen.style.display === 'flex' && state.isPaused) {
        if (e.key === 'ArrowLeft')  { e.preventDefault(); pauseFocus.move(-1); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); pauseFocus.move(1);  return; }
        if (k === ' ' && !isMobile) { e.preventDefault(); pauseFocus.activate(); return; }
      }

      // Game-over screen: arrows move between HOME / RETRY / SETTINGS, Space activates.
      if (refs.gameOverUI.style.display === 'block') {
        if (e.key === 'ArrowLeft')  { e.preventDefault(); goFocus.move(-1); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); goFocus.move(1);  return; }
        if (k === ' ' && !isMobile) { e.preventDefault(); goFocus.activate(); return; }
      }

      if (k === Controller.binds.pause && state.gameState === 'PLAYING') {
        pauseFocus.reset();
        togglePause(); return;
      }
      if ((k === 'enter' || (k === ' ' && !isMobile)) && state.gameState === 'MENU') {
        e.preventDefault(); // stop Space from scrolling the page
        refs.playBtn.click(); return;
      }
      if (e.key === 'ArrowLeft' && state.gameState === 'MENU') {
        e.preventDefault();
        refs.prevPlaneBtn.click(); return;
      }
      if (e.key === 'ArrowRight' && state.gameState === 'MENU') {
        e.preventDefault();
        refs.nextPlaneBtn.click(); return;
      }
      if (k === Controller.binds.restart && state.gameState === 'GAMEOVER') {
        refs.rebootBtn.click(); return;
      }
      if (k === Controller.binds.home && state.gameState === 'GAMEOVER') {
        goHome(); return;
      }
      if (k === Controller.binds.home && (state.gameState === 'PLAYING' || state.isPaused)) {
        openLeaveConfirm(); return;
      }
      if (state.gameState === 'GAMEOVER') goFocus.reset();
      if (k === Controller.binds.settings && state.gameState !== 'COUNTDOWN') {
        openSettings(); return;
      }
      if (k === Controller.binds.camera &&
          (state.gameState === 'COUNTDOWN' || state.gameState === 'PLAYING') &&
          !state.isPaused) {
        cameraRig.next(); return;
      }
      if (k === 'm' && state.gameState === 'MENU') {
        refs.mapBtn.click(); return;
      }
    });

    // ── Camera wheel (hold TAB) ─────────────────────────────────
    window.addEventListener('keydown', (e) => {
      if (listeningAction) return;
      if (refs.settingsModal.style.display === 'block') return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === Controller.binds.cameraWheel &&
          state.gameState === 'PLAYING' &&
          !state.isPaused &&
          !cameraWheel.isOpen) {
        e.preventDefault();
        cameraWheel.open();
      }
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === Controller.binds.cameraWheel && cameraWheel.isOpen) {
        cameraWheel.close(true);
      }
    });
    window.addEventListener('mousemove', (e) => {
      if (cameraWheel.isOpen) cameraWheel.updatePointer(e.clientX, e.clientY);
    });
  } else {
    // Mobile: hide keybinds tab
    document.querySelector('[data-tab="keybinds"]').style.display = 'none';
    refs.controlsHint.textContent = 'TOUCH TO STEER';
  }

  if (!isMobile) {
    // Desktop: hide mobile-controls tab, it has nothing relevant here
    document.querySelector('[data-tab="mobile"]').style.display = 'none';
  }
}