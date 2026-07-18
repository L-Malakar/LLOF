/**
 * ═══════════════════════════════════════════════════════════════
 *  Mcontroller.js — Mobile Controller
 *  Modes: virtual-joystick | dpad | gyroscope
 * ═══════════════════════════════════════════════════════════════
 */

export const MController = {
  // ── State ────────────────────────────────────────────────────
  input: { x: 0, y: 0 },
  joystickActive: false,
  enabled: true,
  isGhostMode: false,

  /** @type {'joystick'|'dpad'|'gyro'} */
  mode: localStorage.getItem('paperPlane_mobileCtrl') || 'joystick',

  // ── Config ───────────────────────────────────────────────────
  config: {
    moveSpeed:      0.22,
    verticalSpeed:  0.10,
    maxHeight:      6,
    minHeight:      0,
    ghostMinHeight: 0.5,
    chunkSize:      40,
    gyroSensX:      3.0,   // tilt sensitivity horizontal (gamma)
    gyroSensY:      2.0,   // tilt sensitivity vertical (beta offset)
    gyroDeadzone:   2.0,   // degrees ignored near centre
    gyroStaleMs:    500,   // treat orientation data older than this as "gone neutral"
  },

  // ── Internal refs ────────────────────────────────────────────
  _listenersAdded: false,
  _gyroPermissionRequested: false, // a permission prompt is in flight / already resolved
  _gyroListenerAdded: false,       // the actual 'deviceorientation' listener is attached
  _gyroOrientation: null,          // last DeviceOrientationEvent
  _gyroLastUpdate: 0,              // performance.now() timestamp of that event
  _dpadState: { up: false, down: false, left: false, right: false },
  _joystickTouchId: null,          // identifier of the finger currently driving the stick

  // ── Init ─────────────────────────────────────────────────────
  init() {
    this._buildJoystickUI();
    this._buildDpadUI();
  },

  // ── Show / hide correct input layer ──────────────────────────
  showControls() {
    document.getElementById('joystick-container').style.display = 'none';
    document.getElementById('dpad-container').style.display     = 'none';
    if (this.mode === 'joystick') this._showJoystick();
    else if (this.mode === 'dpad') this._showDpad();
    else if (this.mode === 'gyro') this._startGyro();
  },

  setMode(mode) {
    if (mode === this.mode) return;
    this.mode = mode;
    localStorage.setItem('paperPlane_mobileCtrl', mode);

    // Wipe whatever state the previous mode left behind so nothing carries
    // over into the new one (e.g. a joystick still "active" after switching
    // to d-pad, silently fighting the d-pad's own input every frame).
    this._resetInputState();

    // If controls are already on screen (mode changed mid-run via Settings),
    // swap the visible layer immediately instead of waiting for the next
    // enable/disable transition to notice.
    if (this.enabled) this.showControls();
  },

  _resetInputState() {
    this.joystickActive  = false;
    this._joystickTouchId = null;
    this._dpadState = { up: false, down: false, left: false, right: false };
    this.input = { x: 0, y: 0 };

    const pad  = document.getElementById('joystick-pad');
    const knob = document.getElementById('joystick-knob');
    if (pad)  { pad.style.opacity = '0.3'; pad.style.removeProperty('left'); pad.style.removeProperty('top'); }
    if (knob) knob.style.transform = 'translate(0px, 0px)';

    ['dpad-up', 'dpad-down', 'dpad-left', 'dpad-right'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.classList.remove('pressed');
    });
  },

  // ─────────────────────────────────────────────────────────────
  //  JOYSTICK
  // ─────────────────────────────────────────────────────────────
  _buildJoystickUI() {
    if (document.getElementById('joystick-container')) return;
    const container = document.createElement('div');
    container.id = 'joystick-container';

    const pad = document.createElement('div');
    pad.id = 'joystick-pad';
    const knob = document.createElement('div');
    knob.id = 'joystick-knob';
    pad.appendChild(knob);
    container.appendChild(pad);
    document.body.appendChild(container);
  },

  _showJoystick() {
    const container = document.getElementById('joystick-container');
    container.style.display = 'block';
    if (this._listenersAdded) return;
    this._listenersAdded = true;

    const pad  = document.getElementById('joystick-pad');
    const knob = document.getElementById('joystick-knob');

    const applyTouch = (touch) => {
      const rect    = pad.getBoundingClientRect();
      const centerX = rect.left + rect.width  / 2;
      const centerY = rect.top  + rect.height / 2;
      let dx = touch.clientX - centerX;
      let dy = touch.clientY - centerY;
      const dist   = Math.hypot(dx, dy);
      const radius = rect.width / 2;

      if (dist > radius) { dx *= radius / dist; dy *= radius / dist; }

      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.input.x = dx / radius;
      this.input.y = dy / radius;
    };

    const releaseStick = () => {
      this.joystickActive   = false;
      this._joystickTouchId = null;
      this.input.x = 0;
      this.input.y = 0;
      knob.style.transform = 'translate(0px, 0px)';
      pad.style.opacity = '0.3';
    };

    const onTouchStart = (e) => {
      // Bail out FIRST when controls are disabled/wrong-mode (e.g. game-over
      // screens, or another input mode is active). This must run before any
      // preventDefault() so taps on game-over UI (buttons, spans, badges)
      // are never swallowed or hijacked, and so a stray touch can't drive
      // the joystick's math while the d-pad or gyro is actually in charge.
      if (!this.enabled || this.mode !== 'joystick') return;
      if (this.joystickActive) return; // already tracking a finger, ignore extra ones
      if (e.target.closest && e.target.closest('button, [data-ui-block]')) return;
      if (e.target.tagName === 'BUTTON') return;

      const touch = e.changedTouches[0];
      const isBottomHalf = touch.clientY > window.innerHeight * 0.45;
      const isLeftHalf   = touch.clientX < window.innerWidth  * 0.55;
      if (!isBottomHalf || !isLeftHalf) return;

      e.preventDefault();
      this._joystickTouchId = touch.identifier;
      pad.style.left    = `${touch.clientX - 55}px`;
      pad.style.top     = `${touch.clientY - 55}px`;
      pad.style.opacity = '1';
      this.joystickActive = true;
      applyTouch(touch);
    };

    const onTouchMove = (e) => {
      if (!this.enabled || this.mode !== 'joystick' || !this.joystickActive) return;
      // Only follow the specific finger that started the drag — otherwise
      // a second, unrelated finger touching anywhere on screen can hijack
      // the stick's position mid-flight.
      let touch = null;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === this._joystickTouchId) { touch = e.touches[i]; break; }
      }
      if (!touch) return;
      e.preventDefault();
      applyTouch(touch);
    };

    const onTouchEnd = (e) => {
      if (!this.joystickActive) return;
      // Only release when the finger that actually lifted/cancelled is the
      // one steering — an unrelated touch ending elsewhere shouldn't zero
      // out input mid-drag.
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this._joystickTouchId) { releaseStick(); return; }
      }
    };

    window.addEventListener('touchstart',  onTouchStart, { passive: false });
    window.addEventListener('touchmove',   onTouchMove,  { passive: false });
    window.addEventListener('touchend',    onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
  },

  // ─────────────────────────────────────────────────────────────
  //  D-PAD
  // ─────────────────────────────────────────────────────────────
  _buildDpadUI() {
    if (document.getElementById('dpad-container')) return;
    const wrap = document.createElement('div');
    wrap.id = 'dpad-container';

    const dirs = [
      { id: 'dpad-up',    label: '▲', row: 0, dir: 'up'    },
      { id: 'dpad-left',  label: '◀', row: 1, dir: 'left'  },
      { id: 'dpad-down',  label: '▼', row: 2, dir: 'down'  },
      { id: 'dpad-right', label: '▶', row: 1, dir: 'right' },
    ];

    // Build a 3×3 grid
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid; grid-template-columns: 56px 56px 56px; grid-template-rows: 56px 56px 56px; gap:4px;';

    const posMap = { up: '1 / 2 / 2 / 3', left: '2 / 1 / 3 / 2', down: '3 / 2 / 4 / 3', right: '2 / 3 / 3 / 4' };

    dirs.forEach(({ id, label, dir }) => {
      const btn = document.createElement('button');
      btn.id = id;
      btn.className = 'dpad-btn';
      btn.setAttribute('data-ui-block', '');
      btn.textContent = label;
      btn.style.gridArea = posMap[dir];

      const press = (e) => {
        if (!this.enabled || this.mode !== 'dpad') return;
        e.preventDefault();
        this._dpadState[dir] = true;
        btn.classList.add('pressed');
        this._updateDpadInput();
      };
      // Release always runs (no enabled/mode guard) so a button pressed
      // right before a disable/mode-switch can never get stuck "down".
      const release = (e) => {
        e.preventDefault();
        this._dpadState[dir] = false;
        btn.classList.remove('pressed');
        this._updateDpadInput();
      };

      btn.addEventListener('touchstart', press,   { passive: false });
      btn.addEventListener('touchend',   release, { passive: false });
      btn.addEventListener('touchcancel',release, { passive: false });
      btn.addEventListener('mousedown',  press);
      btn.addEventListener('mouseup',    release);
      btn.addEventListener('mouseleave', release);

      grid.appendChild(btn);
    });

    wrap.appendChild(grid);
    document.body.appendChild(wrap);
  },

  _updateDpadInput() {
    const s = this._dpadState;
    this.input.x = s.right ? 1 : s.left  ? -1 : 0;
    this.input.y = s.down  ? 1 : s.up    ? -1 : 0;
  },

  _showDpad() {
    document.getElementById('dpad-container').style.display = 'block';
  },

  // ─────────────────────────────────────────────────────────────
  //  GYROSCOPE
  // ─────────────────────────────────────────────────────────────
  _startGyro() {
    if (this._gyroPermissionRequested) return;
    this._gyroPermissionRequested = true;

    const requestGyro = () => {
      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(state => {
            if (state === 'granted') {
              this._addGyroListener();
            } else {
              // Denied — allow a future retry instead of gyro being
              // permanently dead for the rest of the session (e.g. if the
              // player switches away and back to gyro mode later).
              this._gyroPermissionRequested = false;
            }
          })
          .catch(() => { this._gyroPermissionRequested = false; });
      } else {
        this._addGyroListener();
      }
    };
    // On iOS we need a user gesture first
    window.addEventListener('touchstart', requestGyro, { once: true });
  },

  _addGyroListener() {
    if (this._gyroListenerAdded) return;
    this._gyroListenerAdded = true;
    window.addEventListener('deviceorientation', (e) => {
      this._gyroOrientation = e;
      this._gyroLastUpdate  = performance.now();
    });
  },

  _updateGyroInput() {
    const e = this._gyroOrientation;
    const isStale = !e || (performance.now() - this._gyroLastUpdate) > this.config.gyroStaleMs;
    if (isStale) {
      // No data yet, or the sensor's gone quiet (permission revoked mid-run,
      // screen backgrounded, etc.) — settle to neutral instead of freezing
      // the plane at whatever tilt it last saw.
      this.input.x = 0;
      this.input.y = 0;
      return;
    }

    const dz = this.config.gyroDeadzone;

    // gamma = left/right tilt (-90…90). beta = front/back tilt (-180…180)
    let gx = (e.gamma || 0);
    let gy = ((e.beta  || 0) - 30); // 30° tilt is "neutral" for held phone

    if (Math.abs(gx) < dz) gx = 0;
    if (Math.abs(gy) < dz) gy = 0;

    this.input.x = Math.max(-1, Math.min(1, gx / (45 / this.config.gyroSensX)));
    this.input.y = Math.max(-1, Math.min(1, gy / (30 / this.config.gyroSensY)));
  },

  // ─────────────────────────────────────────────────────────────
  //  COMMON CONTROLS
  // ─────────────────────────────────────────────────────────────
  disable() {
    this.enabled = false;

    const joyContainer  = document.getElementById('joystick-container');
    const dpadContainer = document.getElementById('dpad-container');

    if (joyContainer)  joyContainer.style.display  = 'none';
    if (dpadContainer) dpadContainer.style.display = 'none';

    // Fully reset visuals + state so nothing is left mid-drag when it's
    // shown again (e.g. on restart) — otherwise the knob/pad/d-pad can
    // reappear already offset/opaque/pressed from the moment the game ended.
    this._resetInputState();
  },

  reset() {
    this.enabled     = true;
    this.isGhostMode = false;
    this._resetInputState();
  },

  // ── Per-frame update ─────────────────────────────────────────
  _currentSpeedX: 0,

  update(playerGroup, currentWorldShiftX, delta) {
    if (!this.enabled) return { worldShiftX: currentWorldShiftX, isGroundHit: false, isCrashed: false, targetBank: 0, targetPitch: 0 };

    // Pull live gyro readings if in that mode
    if (this.mode === 'gyro') this._updateGyroInput();

    const scale = delta * 60;
    let nextX   = currentWorldShiftX;

    // Ease toward target speed (joystick/dpad/gyro input is analog already,
    // but this smooths abrupt dpad on/off and gyro jitter too)
    const targetSpeedX = -this.input.x * this.config.moveSpeed;
    const easing = 1 - Math.pow(0.001, delta);
    this._currentSpeedX += (targetSpeedX - this._currentSpeedX) * easing;
    nextX += this._currentSpeedX * scale;

    if (nextX >  this.config.chunkSize) nextX -= this.config.chunkSize;
    if (nextX < -this.config.chunkSize) nextX += this.config.chunkSize;

    const vMove = -this.input.y * this.config.verticalSpeed * scale;
    if (vMove > 0) {
      playerGroup.position.y = Math.min(playerGroup.position.y + vMove, this.config.maxHeight);
    } else if (vMove < 0) {
      playerGroup.position.y += vMove;
    }

    const floor = this.isGhostMode ? this.config.ghostMinHeight : this.config.minHeight;
    if (playerGroup.position.y < floor) playerGroup.position.y = floor;

    const isCrashed = !this.isGhostMode && playerGroup.position.y <= this.config.minHeight;

    return {
      worldShiftX: nextX,
      isGroundHit: isCrashed,
      isCrashed,
      targetBank:  -this.input.x * 0.6,
      targetPitch: -this.input.y * 0.3,
    };
  },

  // Legacy compat
  showJoystick() { this.showControls(); },
};
