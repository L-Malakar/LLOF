/*
 *  toast.js — Floating Toast Notification
 */

export function showPickupToast(label, colorHex) {
  const hex = '#' + colorHex.toString(16).padStart(6, '0');
  const el  = document.createElement('div');
  el.className   = 'pu-toast';
  el.textContent = label;
  el.style.color = hex;
  el.style.textShadow = `0 0 12px ${hex}`;
  document.body.appendChild(el);
  // Animate out
  setTimeout(() => el.classList.add('pu-toast-out'), 1200);
  setTimeout(() => el.remove(), 1700);
}
