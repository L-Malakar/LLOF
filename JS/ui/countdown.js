/*
 *  countdown.js — Pre-Round Countdown Overlay
 */

import { refs } from '../core/dom-refs.js';
import { playBeep } from '../systems/music-handler.js';

// This element gets cloned/replaced on every step, so it's owned here
// rather than in the shared dom-refs cache.
let countdownText = document.getElementById('countdown-text');

export function startCountdown(onDone) {
  const steps = ['3', '2', '1', 'GO!'];
  let i = 0;
  refs.countdownOvr.classList.add('active');

  function showStep() {
    playBeep(steps[i] === 'GO!');
    const fresh = countdownText.cloneNode(true);
    fresh.id            = 'countdown-text';
    fresh.textContent   = steps[i];
    fresh.classList.toggle('go', steps[i] === 'GO!');
    countdownText.replaceWith(fresh);
    countdownText = fresh;
    i++;

    if (i < steps.length) {
      setTimeout(showStep, 900);
    } else {
      setTimeout(() => {
        const el = refs.countdownOvr.querySelector('#countdown-text');
        el.classList.add('fade-out');
        setTimeout(() => {
          refs.countdownOvr.classList.remove('active');
          // Show pause btn only now that game is active
          refs.pauseBtn.style.display = 'block';
          refs.diffLabel.style.display = 'block';
          onDone();
        }, 500);
      }, 600);
    }
  }
  showStep();
}