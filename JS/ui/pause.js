/*
 *  pause.js — Pause Toggle
 */

import { state } from '../core/state.js';
import { refs } from '../core/dom-refs.js';
import { playClick } from '../systems/music-handler.js';

// FIX: pause screen starts display:none — never shown on menu
export function togglePause(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  if (state.gameState !== 'PLAYING' && state.gameState !== 'COUNTDOWN') return;
  playClick();
  state.isPaused = !state.isPaused;
  refs.pauseBtn.src = state.isPaused
    ? 'https://cdn-icons-png.flaticon.com/512/724/724927.png'
    : 'https://cdn-icons-png.flaticon.com/512/151/151859.png';
  refs.pauseScreen.style.display = state.isPaused ? 'flex' : 'none';
  state.isPaused ? refs.pauseScreen.classList.add('active') : refs.pauseScreen.classList.remove('active');
}

export function initPause() {
  refs.pauseBtn.addEventListener('click',      togglePause);
  refs.pauseBtn.addEventListener('touchstart', togglePause, { passive: false });
  refs.resumeBtn.addEventListener('click', togglePause);
}