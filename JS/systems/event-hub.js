/*
 *  event-hub.js — Central registry for every site-wide event banner
 *  (Summer Sale, Tiranga, and any future temp_event addition).
 *
 *  Each event module calls registerEvent() once at load time. This
 *  file alone drives the corner EVENT button: hides it when nothing
 *  is running, themes it to the one active event, or flips between
 *  multiple active events every 5-10s. It also drives the '<'/'>'
 *  paging arrows shown while a banner is open.
 *
 *  Nothing here hard-imports from temp_event/ — events register
 *  themselves — so deleting that folder later just means one fewer
 *  registered event. No broken imports anywhere else.
 */

import { refs } from '../core/dom-refs.js';

const _events = []; // { id, name, getPhase, theme:{bg,glow}, open, overlayId, closeBtnId, cardId }
let _shownIndex = 0;
let _cycleTimeout = null;
let _flipping = false;
let _arrowsEl = null;
let _pollInterval = null;

/**
 * evt = {
 *   id: 'summer',
 *   name: 'SUMMER SALE',
 *   getPhase: () => 'none'|'pre'|'active'|'post',
 *   theme: { bg: 'linear-gradient(...)', glow: 'rgba(...)' },
 *   open: () => void,           // builds & shows that event's banner
 *   overlayId: 'event-banner-overlay',
 *   closeBtnId: 'banner-close-btn',
 *   cardId: 'event-banner-card',
 * }
 */
export function registerEvent(evt) {
  _events.push(evt);
}

function _activeEvents() {
  return _events.filter(e => e.getPhase() !== 'none');
}

function _applyTheme(theme) {
  refs.eventBtn.style.setProperty('--evt-bg', theme.bg);
  refs.eventBtn.style.setProperty('--evt-glow', theme.glow);
}

function _renderButton() {
  const active = _activeEvents();

  if (!active.length) {
    refs.eventBtn.style.display = 'none';
    clearTimeout(_cycleTimeout);
    return;
  }

  refs.eventBtn.style.display = 'inline-flex';
  if (_shownIndex >= active.length) _shownIndex = 0;
  _applyTheme(active[_shownIndex].theme);

  clearTimeout(_cycleTimeout);
  if (active.length > 1) _scheduleCycle();
}

function _scheduleCycle() {
  clearTimeout(_cycleTimeout);
  const delay = 5000 + Math.random() * 5000; // 5-10s
  _cycleTimeout = setTimeout(_flipToNext, delay);
}

function _flipToNext() {
  const active = _activeEvents();
  if (_flipping || active.length < 2) return;
  _flipping = true;
  refs.eventBtn.classList.add('evt-flipping');
  setTimeout(() => {
    _shownIndex = (_shownIndex + 1) % active.length;
    _applyTheme(active[_shownIndex].theme);
  }, 250); // midpoint of the flip — swap the face content
  setTimeout(() => {
    refs.eventBtn.classList.remove('evt-flipping');
    _flipping = false;
    _scheduleCycle();
  }, 500);
}

/** Close whichever registered banner is currently open, if any. */
function _closeAnyOpenBanner() {
  _events.forEach(e => {
    const overlay = document.getElementById(e.overlayId);
    const closeBtn = document.getElementById(e.closeBtnId);
    if (overlay && closeBtn) closeBtn.click();
  });
}

function _openByIndex(idx, direction) {
  const active = _activeEvents();
  if (!active.length) return;
  idx = (idx + active.length) % active.length;
  const evt = active[idx];
  _shownIndex = idx;

  const hadOverlayOpen = _events.some(e => document.getElementById(e.overlayId));
  _closeAnyOpenBanner();
  clearTimeout(_cycleTimeout);

  setTimeout(() => {
    evt.open();
    const card = document.getElementById(evt.cardId);
    if (direction && card) {
      card.classList.add(direction === 'next' ? 'evt-slide-in-right' : 'evt-slide-in-left');
      setTimeout(() => card.classList.remove('evt-slide-in-right', 'evt-slide-in-left'), 400);
    }
    if (active.length > 1) _showArrows(active.length);
    _startClosePoll();
  }, hadOverlayOpen ? 380 : 0);
}

function _showArrows(count) {
  if (_arrowsEl) return;
  _arrowsEl = document.createElement('div');
  _arrowsEl.id = 'evt-nav-arrows';
  _arrowsEl.innerHTML = `
    <button id="evt-nav-prev" aria-label="Previous event">‹</button>
    <button id="evt-nav-next" aria-label="Next event">›</button>
  `;
  document.body.appendChild(_arrowsEl);
  document.getElementById('evt-nav-prev').addEventListener('click', () => _openByIndex(_shownIndex - 1, 'prev'));
  document.getElementById('evt-nav-next').addEventListener('click', () => _openByIndex(_shownIndex + 1, 'next'));
}

function _removeArrows() {
  if (_arrowsEl) { _arrowsEl.remove(); _arrowsEl = null; }
}

/** Polls for any registered overlay disappearing, to clean up arrows & resume cycling. */
function _startClosePoll() {
  clearInterval(_pollInterval);
  _pollInterval = setInterval(() => {
    const stillOpen = _events.some(e => document.getElementById(e.overlayId));
    if (!stillOpen) {
      clearInterval(_pollInterval);
      _removeArrows();
      _renderButton(); // resumes cycling if still multiple events active
    }
  }, 300);
}

export function initEventHub() {
  _renderButton();

  refs.eventBtn.addEventListener('click', () => {
    _openByIndex(_shownIndex);
  });

  // Re-check periodically in case an event's phase changes while the
  // tab stays open across midnight, or a dev flips a phase dropdown.
  setInterval(_renderButton, 60000);
}