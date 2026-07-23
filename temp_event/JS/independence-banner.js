/*
 *  temp_event/JS/independence-banner.js
 *  Independence Day popup — mirrors banner.js structure/quality.
 *  DELETE THIS FILE + its CSS (and the temp_event/ folder) after 22 Aug.
 *  Does not touch any core game file.
 */

const INDEP_STORAGE_KEY = 'paperPlane_banner_independence2026';
const RELEASE_DATE = new Date(2026, 7, 15, 0, 0, 0); // 15 Aug 2026, 00:00
const DAY_MS = 24 * 60 * 60 * 1000;
const PRE_START = new Date(RELEASE_DATE.getTime() - 7 * DAY_MS);  // 8 Aug
const POST_END  = new Date(RELEASE_DATE.getTime() + 7 * DAY_MS);  // 22 Aug

function _formatMs(ms) {
  if (ms <= 0) return '00:00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = n => String(n).padStart(2, '0');
  return d > 0 ? `${pad(d)}d : ${pad(h)}h : ${pad(m)}m : ${pad(s)}s` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function _spawnStars(container, count = 24) {
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'indep-star';
    star.style.cssText = [
      `left:${Math.random() * 100}%`,
      `top:${Math.random() * 100}%`,
      `--dur:${1.2 + Math.random() * 2.5}s`,
      `--delay:${Math.random() * 2.5}s`,
      `width:${1.5 + Math.random() * 3}px`,
      `height:${1.5 + Math.random() * 3}px`,
      `background:${['#fff', '#FF9933', '#138808', '#000080'][Math.floor(Math.random() * 4)]}`,
    ].join(';');
    container.appendChild(star);
  }
}

let _countdownInterval = null;

function buildIndepBanner() {
  const released = Date.now() >= RELEASE_DATE.getTime();

  const overlay = document.createElement('div');
  overlay.id = 'indep-banner-overlay';

  const card = document.createElement('div');
  card.id = 'indep-banner-card';

  const bg = document.createElement('div');
  bg.id = 'indep-banner-bg';

  const particles = document.createElement('div');
  particles.id = 'indep-banner-particles';
  _spawnStars(particles);

  const closeBtn = document.createElement('button');
  closeBtn.id = 'indep-banner-close';
  closeBtn.setAttribute('aria-label', 'Close banner');
  closeBtn.textContent = '✕';

  const content = document.createElement('div');
  content.id = 'indep-banner-content';

  const chakra = document.createElement('div');
  chakra.id = 'indep-banner-chakra';

  const pill = document.createElement('div');
  pill.id = 'indep-banner-pill';
  const flagSVG = `<svg width="16" height="11" viewBox="0 0 16 11" style="vertical-align:-2px;margin-right:4px;">
    <rect width="16" height="3.67" y="0"    fill="#FF9933"/>
    <rect width="16" height="3.67" y="3.67" fill="#FFFFFF"/>
    <rect width="16" height="3.67" y="7.33" fill="#138808"/>
    <circle cx="8" cy="5.5" r="1.2" fill="none" stroke="#000080" stroke-width="0.3"/>
  </svg>`;
  pill.innerHTML = flagSVG + (released ? 'NOW LIVE' : 'COMING SOON');

  const title = document.createElement('div');
  title.id = 'indep-banner-title';
  title.textContent = 'TIRANGA';

  const subtitle = document.createElement('div');
  subtitle.id = 'indep-banner-subtitle';
  subtitle.textContent = released
    ? 'The tricolor map has landed — fly it now!'
    : 'A brand new map skin arrives 15 August';

  const chipsRow = document.createElement('div');
  chipsRow.id = 'indep-banner-chips';
  const chipData = released
  ? [{ icon: '🗺️', main: 'UNLOCKED', label: 'Tiranga Map' }, { icon: '🪁', main: 'NEW', label: 'Chakra FX' }]
    : [{ icon: '📅', main: 'AUG 15', label: 'Release Day' }, { icon: '🔒', main: 'LOCKED', label: 'Tiranga Map' }];
  chipData.forEach(d => {
    const chip = document.createElement('div');
    chip.className = 'indep-chip';
    chip.innerHTML = `<span class="indep-chip-icon">${d.icon}</span>
                       <span class="indep-chip-main">${d.main}</span>
                       <span class="indep-chip-label">${d.label}</span>`;
    chipsRow.appendChild(chip);
  });

  const cta = document.createElement('button');
  cta.id = 'indep-banner-cta';
  cta.textContent = '✈️  PLAY NOW';

  let timerStrip = null;
  if (!released) {
    timerStrip = document.createElement('div');
    timerStrip.id = 'indep-banner-timer';
    const dot = document.createElement('span');
    dot.className = 'indep-timer-dot';
    const label = document.createElement('span');
    label.textContent = 'TIRANGA UNLOCKS IN';
    const countdown = document.createElement('span');
    countdown.id = 'indep-banner-countdown';
    countdown.textContent = _formatMs(RELEASE_DATE - Date.now());
    timerStrip.append(dot, label, countdown);

    _countdownInterval = setInterval(() => {
      const remaining = RELEASE_DATE.getTime() - Date.now();
      countdown.textContent = _formatMs(remaining);
      if (remaining <= 0) clearInterval(_countdownInterval);
    }, 1000);
  }

  const glow = document.createElement('div');
  glow.id = 'indep-banner-glow';

  content.append(chakra, pill, title, subtitle, chipsRow, cta);
  if (timerStrip) content.appendChild(timerStrip);

  card.append(bg, particles, content, glow);

  const cardWrap = document.createElement('div');
  cardWrap.style.cssText = 'position:relative; width:min(860px,100%); flex-shrink:0;';
  cardWrap.appendChild(card);
  cardWrap.appendChild(closeBtn);
  overlay.appendChild(cardWrap);
  document.body.appendChild(overlay);

  function closeBanner() {
    clearInterval(_countdownInterval);
    sessionStorage.setItem(INDEP_STORAGE_KEY, 'seen');
    overlay.classList.add('indep-hiding');
    const onHidden = (e) => {
      if (e.target !== overlay) return;
      overlay.removeEventListener('animationend', onHidden);
      window.removeEventListener('keydown', escClose);
      overlay.remove();
    };
    overlay.addEventListener('animationend', onHidden);
    setTimeout(() => {
      if (overlay.parentNode) {
        window.removeEventListener('keydown', escClose);
        overlay.remove();
      }
    }, 500);
  }

  let _closed = false;
  function safeClose() { if (_closed) return; _closed = true; closeBanner(); }

  closeBtn.addEventListener('click', safeClose);
  cta.addEventListener('click', () => {
    safeClose();
    setTimeout(() => {
      if (overlay.parentNode) overlay.remove();
      const playBtn = document.getElementById('playBtn');
      if (playBtn) playBtn.click();
    }, 380);
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) safeClose(); });

  function escClose(e) {
    if (e.key === 'Escape') { safeClose(); window.removeEventListener('keydown', escClose); }
  }
  window.addEventListener('keydown', escClose);
}

export function initIndependenceBanner() {
  const now = Date.now();
  if (now < PRE_START.getTime() || now > POST_END.getTime()) return;
  if (sessionStorage.getItem(INDEP_STORAGE_KEY)) return;
  setTimeout(() => buildIndepBanner(), 800);
}

// 🔧 DEV CHEAT — REMOVE BEFORE RELEASE (or just delete temp_event/ folder)
// Ctrl+Shift+Alt+O — force-open the banner preview, local:5500 only
export function initIndependenceBannerDevPreview() {
  const _isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const _isLiveServer = _isLocal && window.location.port === '5500';
  if (!_isLiveServer) return;

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyO' && e.ctrlKey && e.shiftKey && e.altKey) {
      e.stopPropagation();
      if (document.getElementById('indep-banner-overlay')) return;
      buildIndepBanner();
    }
  }, true);
}