/*
 *  utils.js — Small Shared Helpers
 */

/** Try to enter fullscreen on first interaction */
export const tryFullscreen = () => {
  if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
};
document.addEventListener('click',      tryFullscreen, { once: true });
document.addEventListener('touchstart', tryFullscreen, { once: true });

/** Haptic feedback helper */
export function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

/** Bind both click and touchstart to prevent double-fire */
export function bindTouchAndClick(el, handler) {
  if (!el) return;
  const wrapped = (e) => { e.preventDefault(); e.stopPropagation(); handler(e); };
  el.addEventListener('click',      wrapped, true);
  el.addEventListener('touchstart', wrapped, { passive: false, capture: true });
}

/** Mobile device detection, used to pick the active controller and tune quality */
export const isMobile = (
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  navigator.maxTouchPoints > 1
) && window.innerWidth <= 1024;
if (isMobile) document.body.classList.add('is-mobile');

/** Extra SFX: power-up pickup (synthesised inline, not a sound file) */
export function playPowerUp() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx  = new AudioCtx();
    const osc  = ctx.createOscillator();
    const env  = ctx.createGain();
    osc.connect(env); env.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.18);
    env.gain.setValueAtTime(0.25, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(); osc.stop(ctx.currentTime + 0.35);
    setTimeout(() => ctx.close(), 500);
  } catch (_) {}
}
