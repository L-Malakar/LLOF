/*
 *  confirm-modal.js — Generic Confirm Modal
 *  (the "map-confirm" markup is reused for any yes/no confirmation,
 *  not just map purchases — e.g. resetting keybinds)
 */

import { refs } from '../core/dom-refs.js';
import { bindTouchAndClick } from '../utils/utils.js';

let pendingConfirmAction = null;

export function openConfirm(title, desc, onYes) {
  refs.mapConfirmTitle.textContent = title;
  refs.mapConfirmDesc.textContent  = desc;
  refs.mapConfirmBackdrop.style.display = 'block';
  refs.mapConfirmModal.style.display    = 'block';
  pendingConfirmAction = onYes;
}

export function closeConfirm() {
  refs.mapConfirmBackdrop.style.display = 'none';
  refs.mapConfirmModal.style.display    = 'none';
  pendingConfirmAction = null;
}

export function initConfirmModal() {
  bindTouchAndClick(refs.mapConfirmYes, () => {
    if (!pendingConfirmAction) return;
    const action = pendingConfirmAction;
    closeConfirm();
    action();
  });
  bindTouchAndClick(refs.mapConfirmNo, closeConfirm);
}