// ═══════════════════════════════════════════════════════════════
//  camera.js — multi-angle camera rig
// ───────────────────────────────────────────────────────────────
//  Drop-in module that adds several selectable camera angles to a
//  game that currently drives the camera with a single hard-coded
//  position/lookAt every frame.
//
//  It does NOT touch your scene/physics — you keep computing the
//  same "base" camera position you already do (including screen
//  shake), and just hand it to CameraRig.apply(...) instead of
//  calling camera.position.set(...) / camera.lookAt(...) yourself.
//  The rig applies a per-mode offset on top of that base and
//  smoothly blends whenever the mode changes, so switching angles
//  never pops.
//
//  No THREE import needed — pure numbers in, camera mutated out.
// ═══════════════════════════════════════════════════════════════

export class CameraRig {
  constructor() {
    // Each preset receives the "base" the game already computed —
    // { x, y, z } for the follow position (behind the player, with
    // shake baked in) and playerY (player's current height) — and
    // returns the actual camera position + look-at target.
    this.presets = [
      {
        name: 'Default',
        // Original behaviour: straight on, right behind the plane.
        pos:  (b) => ({ x: b.x,       y: b.y,        z: b.z       }),
        look: (b) => ({ x: 0,         y: b.playerY,  z: -2        }),
      },
      {
        name: 'Near',
        // Tighter follow cam, sits lower and nearer the plane.
        pos:  (b) => ({ x: b.x,       y: b.y - 0.5,  z: b.z - 1.8 }),
        look: (b) => ({ x: 0,         y: b.playerY + 0.2, z: -3   }),
      },
      {
        name: 'Top',
        // Overhead / bird's-eye view, further back.
        pos:  (b) => ({ x: b.x,       y: b.y + 3.0,  z: b.z + 2.0 }),
        look: (b) => ({ x: 0,         y: b.playerY,  z: -4        }),
      },
      {
        name: 'Side-Right',
        // Cinematic side-on angle (camera on the right).
        pos:  (b) => ({ x: b.x + 4.2, y: b.y + 0.3,  z: b.z - 1.0 }),
        look: (b) => ({ x: 0,         y: b.playerY,  z: -2        }),
      },
      {
        name: 'Side-Left',
        // Cinematic side-on angle, mirrored (camera on the left).
        pos:  (b) => ({ x: b.x - 4.2, y: b.y + 0.3,  z: b.z - 1.0 }),
        look: (b) => ({ x: 0,         y: b.playerY,  z: -2        }),
      },
      {
        name: 'Back',
        // Dramatic Back, wide-feeling chase cam.
        pos:  (b) => ({ x: b.x,       y: b.y - 1.15, z: b.z - 0.5 }),
        look: (b) => ({ x: 0,         y: b.playerY + 0.3, z: -6   }),
      },
      {
        name: 'Close',
        // First-person, sitting just behind/above the plane's nose.
        pos:  (b) => ({ x: b.x,       y: b.y - 1.0,  z: b.z - 3.8 }),
        look: (b) => ({ x: 0,         y: b.playerY + 0.3, z: -18  }),
      },
      {
        name: 'Up-close',
        // First-person, right at the nose looking straight down the track.
        pos:  (b) => ({ x: b.x,       y: b.y - 1.5,  z: b.z - 4.8 }),
        look: (b) => ({ x: 0,         y: b.playerY,  z: -25       }),
      },
    ];

    const saved = CameraRig._loadSavedIndex();
    this.index     = saved;
    this.prevIndex = saved;
    this._t        = 1;      // 1 = transition finished
    this._blendSpeed = 3.0;  // higher = snappier mode switch
    this._look        = null; // persisted, eased look-at point (shared across ALL states)
    this._lookSmooth  = 4.0;  // higher = snappier look-at easing
    this.smoothingEnabled = true; // toggle for "Smooth Camera Movement" setting

    this._onChange = null;   // optional callback(name, index)
  }

  /** Turn the eased blending/look-at on or off (instant cuts when off). */
  setSmoothing(enabled) { this.smoothingEnabled = enabled; }

  /**
   * Ease the camera's look-at point toward (x,y,z), continuing from
   * wherever the look-at last was (even if that was set by MENU,
   * TRANSITION, or apply() in a different frame). Call this from ANY
   * camera-driving state instead of camera.lookAt(...) directly, so
   * hand-offs between states never snap the view.
   */
  smoothLookAt(camera, x, y, z, delta, speed = this._lookSmooth) {
    if (!this.smoothingEnabled) {
      this._look = { x, y, z };
      camera.lookAt(x, y, z);
      return;
    }
    if (!this._look) this._look = { x, y, z };
    const s = Math.min(1, delta * speed);
    this._look.x += (x - this._look.x) * s;
    this._look.y += (y - this._look.y) * s;
    this._look.z += (z - this._look.z) * s;
    camera.lookAt(this._look.x, this._look.y, this._look.z);
  }

  get mode() { return this.presets[this.index].name; }

  onChange(fn) { this._onChange = fn; }

  /**
   * Fully-resolved (non-blending) position/look for the CURRENT mode,
   * given the same base values you'd pass to apply(). Used by an
   * intro/transition sequence so it can lerp toward the right target
   * instead of a hard-coded one.
   */
  getTarget(baseX, baseY, baseZ, playerY) {
    const base = { x: baseX, y: baseY, z: baseZ, playerY };
    const cur  = this.presets[this.index];
    return { pos: cur.pos(base), look: cur.look(base) };
  }

  /** Switch to the next camera mode, cycling back to the first. */
  next() {
    this.prevIndex = this.index;
    this.index = (this.index + 1) % this.presets.length;
    this._t = 0;
    CameraRig._saveIndex(this.index);
    if (this._onChange) this._onChange(this.mode, this.index);
    return this.mode;
  }

  /** Jump straight to a mode by name or index (no cycling). */
  set(modeOrIndex) {
    const i = typeof modeOrIndex === 'number'
      ? modeOrIndex
      : this.presets.findIndex(p => p.name === modeOrIndex);
    if (i < 0 || i === this.index) return this.mode;
    this.prevIndex = this.index;
    this.index = i;
    this._t = 0;
    CameraRig._saveIndex(this.index);
    if (this._onChange) this._onChange(this.mode, this.index);
    return this.mode;
  }

  /**
   * Apply the current (blending) camera mode to a THREE.PerspectiveCamera.
   * @param {THREE.Camera} camera
   * @param {number} baseX      the x you'd normally camera.position.set(x,_,_) with (shake included)
   * @param {number} baseY      the y you'd normally camera.position.set(_,y,_) with (shake included)
   * @param {number} baseZ      the z you'd normally camera.position.set(_,_,z) with
   * @param {number} playerY    player.group.position.y
   * @param {number} delta      frame delta time (seconds), for the blend speed
   */
  apply(camera, baseX, baseY, baseZ, playerY, delta) {
    if (!this.smoothingEnabled) this._t = 1;
    else if (this._t < 1) this._t = Math.min(1, this._t + delta * this._blendSpeed);

    const base = { x: baseX, y: baseY, z: baseZ, playerY };
    const cur  = this.presets[this.index];
    const prev = this.presets[this.prevIndex];

    const a  = cur.pos(base),  b  = prev.pos(base);
    const la = cur.look(base), lb = prev.look(base);
    const k  = this._t;

    const x = lerp(b.x, a.x, k);
    const y = lerp(b.y, a.y, k);
    const z = lerp(b.z, a.z, k);
    camera.position.set(x, y, z);

    const lx = lerp(lb.x, la.x, k);
    const ly = lerp(lb.y, la.y, k);
    const lz = lerp(lb.z, la.z, k);
    this.smoothLookAt(camera, lx, ly, lz, delta);
  }
}

/**
 * GTAV-style radial camera-select wheel. Sits on top of the game,
 * freezes nothing itself (the caller checks `.isOpen` to pause the
 * game loop) — this class only owns the visuals + pointer tracking
 * and commits a selection into the CameraRig on close(true).
 */
export class CameraWheel {
  constructor(rig) {
    this.rig = rig;
    this.isOpen = false;
    this._selected = rig.index;
    this._build();
  }

  _build() {
    const wrap = document.createElement('div');
    wrap.id = 'camera-wheel-overlay';

    const ring = document.createElement('div');
    ring.id = 'camera-wheel-ring';

    const pointer = document.createElement('div');
    pointer.id = 'camera-wheel-pointer';
    ring.appendChild(pointer);

    const hub = document.createElement('div');
    hub.id = 'camera-wheel-hub';
    hub.innerHTML = `<span id="camera-wheel-hub-label"></span>`;
    ring.appendChild(hub);

    const count = this.rig.presets.length;
    this._nodes = this.rig.presets.map((p, i) => {
      const node = document.createElement('div');
      node.className = 'wheel-node';
      const angle = (360 / count) * i; // 0 index at top, clockwise
      node.style.setProperty('--angle', `${angle}deg`);
      node.innerHTML = `<span>${p.name}</span>`;
      ring.appendChild(node);
      return node;
    });

    wrap.appendChild(ring);
    document.body.appendChild(wrap);

    this._wrap  = wrap;
    this._ring  = ring;
    this._pointer   = pointer;
    this._hubLabel  = hub.querySelector('#camera-wheel-hub-label');

    this._injectStyle();
  }

  _injectStyle() {
    if (document.getElementById('camera-wheel-style')) return;
    const style = document.createElement('style');
    style.id = 'camera-wheel-style';
    style.textContent = `
      #camera-wheel-overlay {
        position: fixed; inset: 0; z-index: 200;
        display: none;
        align-items: center; justify-content: center;
        background: rgba(0,0,0,0.35);
        backdrop-filter: blur(2px);
        -webkit-tap-highlight-color: transparent;
        touch-action: none;
      }
      #camera-wheel-overlay.open { display: flex; }
      #camera-wheel-ring {
        position: relative;
        width: min(70vw, 70vh, 420px);
        height: min(70vw, 70vh, 420px);
      }
      #camera-wheel-hub {
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 30%; height: 30%;
        border-radius: 50%;
        background: rgba(10,10,10,0.75);
        border: 1px solid rgba(255,255,255,0.3);
        display: flex; align-items: center; justify-content: center;
        text-align: center; padding: 6px;
        color: #fff; font: 700 13px/1.2 system-ui, sans-serif;
        letter-spacing: 0.05em; text-transform: uppercase;
        pointer-events: none;
      }
      #camera-wheel-pointer {
        position: absolute; top: 50%; left: 50%;
        width: 50%; height: 2px;
        background: linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0));
        transform-origin: 0 50%;
        transform: rotate(-90deg);
        pointer-events: none;
      }
      .wheel-node {
        position: absolute; top: 50%; left: 50%;
        width: 84px; height: 84px; margin: -42px;
        transform: rotate(var(--angle)) translate(0, -120px) rotate(calc(-1 * var(--angle)));
        border-radius: 50%;
        background: rgba(20,20,20,0.6);
        border: 1px solid rgba(255,255,255,0.2);
        display: flex; align-items: center; justify-content: center;
        text-align: center; padding: 4px;
        color: rgba(255,255,255,0.75);
        font: 600 11px/1.15 system-ui, sans-serif;
        letter-spacing: 0.03em; text-transform: uppercase;
        transition: background 0.12s ease, color 0.12s ease, transform 0.12s ease;
        pointer-events: none;
      }
      .wheel-node.active {
        background: rgba(255,255,255,0.9);
        color: #0a0a0a;
        transform: rotate(var(--angle)) translate(0, -120px) rotate(calc(-1 * var(--angle))) scale(1.12);
      }
      @media (max-width: 480px) {
        .wheel-node { width: 66px; height: 66px; margin: -33px; font-size: 9.5px; }
      }
    `;
    document.head.appendChild(style);
  }

  /** Open the wheel, defaulting the highlighted slice to the current mode. */
  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this._selected = this.rig.index;
    this._wrap.classList.add('open');
    this._updateVisual();
  }

  /** @param {boolean} confirm  true = commit the hovered selection to the rig, false = cancel with no change */
  close(confirm) {
    if (!this.isOpen) return;
    this.isOpen = false;
    this._wrap.classList.remove('open');
    if (confirm) this.rig.set(this._selected);
  }

  /** Feed live mouse (desktop) or touch (mobile) coordinates while the wheel is open. */
  updatePointer(clientX, clientY) {
    if (!this.isOpen) return;
    const rect = this._ring.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    if (Math.hypot(dx, dy) < 24) return; // dead zone near the hub: keep last selection

    let deg = Math.atan2(dy, dx) * 180 / Math.PI + 90; // 0deg = top, matches node layout
    deg = (deg + 360) % 360;

    const count = this.rig.presets.length;
    const idx = Math.round(deg / (360 / count)) % count;
    if (idx !== this._selected) {
      this._selected = idx;
      this._updateVisual();
    }
  }

  _updateVisual() {
    const count = this.rig.presets.length;
    const angle = (360 / count) * this._selected;
    // The node-placement angle is measured from a translate-then-rotate
    // composition whose resting direction is "up". The pointer element's
    // own resting direction (before any transform) is "right" (it's a
    // plain horizontal bar), so it needs an extra -90deg to line up with
    // the same node it's pointing at.
    this._pointer.style.transform = `rotate(${angle - 90}deg)`;
    this._nodes.forEach((n, i) => n.classList.toggle('active', i === this._selected));
    this._hubLabel.textContent = this.rig.presets[this._selected].name;
  }
}

function lerp(a, b, k) { return a + (b - a) * k; }

CameraRig._STORAGE_KEY = 'cameraRig.modeIndex';
CameraRig._loadSavedIndex = function () {
  try {
    const v = parseInt(localStorage.getItem(CameraRig._STORAGE_KEY), 10);
    return Number.isInteger(v) && v >= 0 ? v : 0;
  } catch (e) { return 0; }
};
CameraRig._saveIndex = function (i) {
  try { localStorage.setItem(CameraRig._STORAGE_KEY, String(i)); } catch (e) {}
};

// ───────────────────────────────────────────────────────────────
//  UI: top-center rotate button + 'R' keyboard shortcut
// ───────────────────────────────────────────────────────────────
/**
 * Wires up a top-center camera-rotate button (created on the fly,
 * no HTML edits required) plus the 'R' key shortcut. Call once at
 * startup with your CameraRig instance and (optionally) a function
 * that returns whether the button should currently be visible
 * (e.g. only during COUNTDOWN/PLAYING/CRASHING).
 *
 * @param {CameraRig} rig
 * @param {() => boolean} [isVisibleFn]  called every frame-ish (on a
 *        short interval) to decide whether to show/hide the button.
 *        If omitted, the button is always visible.
 */
export function initCameraUI(rig, isVisibleFn, wheel) {
  const btn = document.createElement('button');
  btn.id = 'camera-toggle-btn';
  btn.type = 'button';
  btn.title = 'Change camera angle (R)';
  btn.setAttribute('aria-label', 'Change camera angle');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 3a2 2 0 0 1 2 2v1.2l2.1-1.2.9 1.6-3 1.7V15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12z"/>
      <circle cx="11" cy="10.5" r="2.6"/>
      <path d="M19.5 19a7.5 7.5 0 0 1-13-3.2" />
      <path d="M4.5 5a7.5 7.5 0 0 1 13 3.2" />
      <path d="M17.5 20.6 19.5 19l1.8 1.3" />
      <path d="M6.5 3.4 4.5 5 2.7 3.7" />
    </svg>
    <span id="camera-toggle-label">${rig.mode}</span>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #camera-toggle-btn {
      position: fixed;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 60;
      display: none;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(10,10,10,0.55);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 20px;
      color: #fff;
      font: 600 12px/1 system-ui, sans-serif;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      backdrop-filter: blur(4px);
      transition: background 0.15s ease, transform 0.1s ease;
    }
    #camera-toggle-btn.visible { display: flex; }
    #camera-toggle-btn:hover  { background: rgba(30,30,30,0.75); }
    #camera-toggle-btn:active { transform: translateX(-50%) scale(0.94); }
    #camera-toggle-btn svg { flex: none; }
    @media (max-width: 480px) {
      #camera-toggle-btn { top: 10px; padding: 5px 10px; font-size: 11px; }
      #camera-toggle-btn svg { width: 18px; height: 18px; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(btn);

  const label = btn.querySelector('#camera-toggle-label');
  const flashLabel = () => {
    label.textContent = rig.mode;
    btn.style.background = 'rgba(60,60,60,0.85)';
    clearTimeout(flashLabel._t);
    flashLabel._t = setTimeout(() => { btn.style.background = ''; }, 220);
  };

  rig.onChange(() => flashLabel());

  // Hold-to-open wheel (mobile). A quick tap still just cycles (rig.next()),
  // same as before — only a sustained press opens the radial select.
  if (wheel) {
    const HOLD_MS = 180;
    let holdTimer  = null;
    let holdActive = false;
    let justHeld   = false;

    const clearHold = () => { clearTimeout(holdTimer); holdTimer = null; };

    btn.addEventListener('touchstart', () => {
      clearHold();
      holdActive = false;
      holdTimer = setTimeout(() => {
        holdActive = true;
        wheel.open();
      }, HOLD_MS);
    }, { passive: true });

    btn.addEventListener('touchmove', (e) => {
      if (!holdActive) return;
      const t = e.touches[0];
      if (t) wheel.updatePointer(t.clientX, t.clientY);
    }, { passive: true });

    const endTouch = () => {
      clearHold();
      if (holdActive) {
        wheel.close(true);
        justHeld = true;
      }
      holdActive = false;
    };
    btn.addEventListener('touchend',    endTouch);
    btn.addEventListener('touchcancel', endTouch);

    btn.addEventListener('click', () => {
      if (justHeld) { justHeld = false; return; } // swallow the click that follows a hold-select
      rig.next();
    });
  } else {
    btn.addEventListener('click', () => rig.next());
  }

  if (isVisibleFn) {
    setInterval(() => {
      btn.classList.toggle('visible', !!isVisibleFn());
    }, 100);
  } else {
    btn.classList.add('visible');
  }

  return btn;
}