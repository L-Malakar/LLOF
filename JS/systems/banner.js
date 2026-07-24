/**
 * ═══════════════════════════════════════════════════════════════
 *  banner.js — Event Banner System
 *
 *  HOW TO EDIT FOR A NEW EVENT:
 *  1. Update BANNER_CONFIG below with your event details.
 *  2. Update the CSS variables in banner.css :root for colours.
 *  3. Change BANNER_STORAGE_KEY to a new unique string so the
 *     banner shows again for returning users.
 * ═══════════════════════════════════════════════════════════════
 */

// ── Storage key — change this for each new event ─────────────
//    Example: 'paperPlane_banner_halloween2025'
const BANNER_STORAGE_KEY = 'paperPlane_banner_summersale';

// ── Event configuration — EDIT THIS BLOCK for each new event ─
// The event now recurs every year automatically: July 1 – July 31.
// A "coming soon" banner shows for the 7 days before it starts,
// and an "event ended" banner shows for the 7 days after it ends.
// Nothing here needs to be touched year to year.
const EVENT_MONTH      = 6;   // 0-indexed → July
const EVENT_START_DAY  = 1;
const EVENT_END_DAY    = 31;
const PRE_WINDOW_DAYS  = 7;   // show "coming soon" banner this many days before start
const POST_WINDOW_DAYS = 7;   // show "ended" banner this many days after end

const DAY_MS = 24 * 60 * 60 * 1000;

/** Build this year's event window dates from the config above. */
function _buildEventDates(year) {
  const start = new Date(year, EVENT_MONTH, EVENT_START_DAY, 0, 0, 0);
  const end   = new Date(year, EVENT_MONTH, EVENT_END_DAY, 23, 59, 59);
  return {
    preStart:  new Date(start.getTime() - PRE_WINDOW_DAYS * DAY_MS),
    start,
    end,
    postEnd:   new Date(end.getTime() + POST_WINDOW_DAYS * DAY_MS),
  };
}

// ── Determine current phase ───────────────────────────────────
// Recomputed fresh every call so it keeps working year after year
// with zero manual date edits.
import { getDevPhaseOverride } from '../utils/utils.js';

export const getEventPhase = () => {
  const override = getDevPhaseOverride('summer');
  if (override !== 'auto') return override;

  const now = Date.now();
  const dates = _buildEventDates(new Date(now).getFullYear());

  if (now < dates.preStart.getTime())  return 'none';   // more than a week before — no banner, normal prices
  if (now < dates.start.getTime())     return 'pre';    // within the week before — "coming soon"
  if (now <= dates.end.getTime())      return 'active'; // event live — discounts + 2x coins
  if (now <= dates.postEnd.getTime())  return 'post';   // within the week after — "event ended"
  return 'none';                                         // more than a week after — no banner, normal prices
};

// Dates for the CURRENT phase, used for countdown timers below
const _eventDates = _buildEventDates(new Date().getFullYear());
const EVENT_PHASE = getEventPhase();

// ── Per-phase banner config ───────────────────────────────────
const BANNER_CONFIGS = {
  pre: {
    eventLabel:   '🏖️ COMING SOON',
    title:        'SUMMER SALE',
    subtitle:     'A massive event is about to begin — get ready!',
    deals:        [
      { icon: '🗺️', discount: '50% OFF', label: 'All Maps — Soon'   },
      { icon: '✈️', discount: '25% OFF', label: 'All Planes — Soon'  },
      { icon: '⭐', discount: '2× COINS', label: 'Normal Until Jul 1' },
    ],
    ctaText:      '✈️  PLAY NOW',
    countdownEnd: _eventDates.start.toISOString(),
    timerLabel:   'EVENT STARTS IN',
  },
  active: {
    eventLabel:   '🎉 LIMITED TIME EVENT',
    title:        'SUMMER SALE',
    subtitle:     'Biggest discounts of the year — fly for less',
    deals:        [
      { icon: '🗺️', discount: '50% OFF', label: 'All Maps'      },
      { icon: '✈️', discount: '25% OFF', label: 'All Planes'    },
      { icon: '⭐', discount: '2× COINS', label: 'This Weekend' },
    ],
    ctaText:      '✈️  PLAY NOW',
    countdownEnd: _eventDates.end.toISOString(),
    timerLabel:   'SALE ENDS IN',
  },
  post: {
    eventLabel:   '🏁 EVENT ENDED',
    title:        'SUMMER SALE',
    subtitle:     'The event has ended. Thanks for flying with us!',
    deals:        [
      { icon: '🗺️', discount: 'NORMAL',  label: 'All Maps'   },
      { icon: '✈️', discount: 'NORMAL',  label: 'All Planes' },
      { icon: '⭐', discount: '1× COINS', label: 'Standard'  },
    ],
    ctaText:      '✈️  PLAY NOW',
    countdownEnd: null,
    timerLabel:   '',
  },
  // Shown only when the button is opened manually outside the event window
  none: {
    eventLabel:   '📅 NO EVENT ACTIVE',
    title:        'SUMMER SALE',
    subtitle:     'Nothing running right now — check back July 1st!',
    deals:        [
      { icon: '🗺️', discount: 'NORMAL',  label: 'All Maps'   },
      { icon: '✈️', discount: 'NORMAL',  label: 'All Planes' },
      { icon: '⭐', discount: '1× COINS', label: 'Standard'  },
    ],
    ctaText:      '✈️  PLAY NOW',
    countdownEnd: null,
    timerLabel:   '',
  },
};

const BANNER_CONFIG = BANNER_CONFIGS[EVENT_PHASE];

// ─────────────────────────────────────────────────────────────
//  Internal — no need to edit below this line
// ─────────────────────────────────────────────────────────────

let _countdownInterval = null;

/** Format milliseconds remaining as  DD : HH : MM : SS */
function _formatMs(ms) {
  if (ms <= 0) return '00:00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const d  = Math.floor(totalSec / 86400);
  const h  = Math.floor((totalSec % 86400) / 3600);
  const m  = Math.floor((totalSec % 3600)  / 60);
  const s  = totalSec % 60;
  const pad = n => String(n).padStart(2, '0');
  return d > 0
    ? `${pad(d)}d : ${pad(h)}h : ${pad(m)}m : ${pad(s)}s`
    : `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** Spawn random twinkling star elements inside the particle container */
function _spawnStars(container, count = 28) {
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'banner-star';
    star.style.cssText = [
      `left:${Math.random() * 100}%`,
      `top:${Math.random() * 100}%`,
      `--dur:${1.2 + Math.random() * 2.5}s`,
      `--delay:${Math.random() * 2.5}s`,
      `width:${1.5 + Math.random() * 3}px`,
      `height:${1.5 + Math.random() * 3}px`,
      `background:${['#fff','#ffcc00','#00cfff','#ff6b00'][Math.floor(Math.random()*4)]}`,
    ].join(';');
    container.appendChild(star);
  }
}

/** Build the full banner DOM and inject it into <body> */
function _buildBanner(cfg = BANNER_CONFIG) {
  // ── Overlay backdrop ────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'event-banner-overlay';

  // ── Card (16:9) ─────────────────────────────────────────────
  const card = document.createElement('div');
  card.id = 'event-banner-card';

  // Animated gradient background
  const bgGrad = document.createElement('div');
  bgGrad.id = 'banner-bg-gradient';

  // Particle stars
  const particles = document.createElement('div');
  particles.id = 'banner-particles';
  _spawnStars(particles);

  // Decorative stripe
  const stripe = document.createElement('div');
  stripe.id = 'banner-stripe';

  // Bottom rainbow glow bar
  const bottomGlow = document.createElement('div');
  bottomGlow.id = 'banner-bottom-glow';

  // ── Close button ─────────────────────────────────────────────
  const closeBtn = document.createElement('button');
  closeBtn.id = 'banner-close-btn';
  closeBtn.setAttribute('aria-label', 'Close banner');
  closeBtn.textContent = '✕';

  // ── Content wrapper ──────────────────────────────────────────
  const content = document.createElement('div');
  content.id = 'banner-content';

  // Event label pill
  const pill = document.createElement('div');
  pill.id = 'banner-event-label';
  pill.innerHTML = `<span class="banner-label-icon">${cfg.eventLabel.split(' ')[0]}</span>
                    ${cfg.eventLabel.split(' ').slice(1).join(' ')}`;

  // Title
  const title = document.createElement('div');
  title.id = 'banner-title';
  title.textContent = cfg.title;

  // Subtitle
  const subtitle = document.createElement('div');
  subtitle.id = 'banner-subtitle';
  subtitle.textContent = cfg.subtitle;

  // Deals row
  const dealsRow = document.createElement('div');
  dealsRow.id = 'banner-deals';
  cfg.deals.forEach(deal => {
    const chip = document.createElement('div');
    chip.className = 'banner-deal-chip';
    chip.innerHTML = `
      <span class="chip-icon">${deal.icon}</span>
      <span class="chip-discount">${deal.discount}</span>
      <span class="chip-label">${deal.label}</span>`;
    dealsRow.appendChild(chip);
  });

  // Divider
  const divider = document.createElement('div');
  divider.id = 'banner-divider';

  // CTA button
  const ctaBtn = document.createElement('button');
  ctaBtn.id = 'banner-cta-btn';
  ctaBtn.textContent = cfg.ctaText;
  ctaBtn._startsGame = true;

  // Timer strip
  let timerStrip = null;
  if (cfg.countdownEnd) {
    timerStrip = document.createElement('div');
    timerStrip.id = 'banner-timer-strip';

    const dot = document.createElement('span');
    dot.className = 'timer-dot';

    const timerLabel = document.createElement('span');
    timerLabel.textContent = cfg.timerLabel;

    const countdown = document.createElement('span');
    countdown.id = 'banner-countdown';
    countdown.textContent = _formatMs(new Date(cfg.countdownEnd) - Date.now());

    timerStrip.append(dot, timerLabel, countdown);

    // Start ticking
    const endTime = new Date(cfg.countdownEnd).getTime();
    _countdownInterval = setInterval(() => {
      const remaining = endTime - Date.now();
      countdown.textContent = _formatMs(remaining);
      if (remaining <= 0) clearInterval(_countdownInterval);
    }, 1000);
  }

  // Version tag
  const versionTag = document.createElement('div');
  versionTag.textContent = 'L. Malakar v-2.26.7';
  versionTag.style.cssText = 'font-family:var(--banner-font-body); font-size:clamp(7px,1vw,11px); color:rgba(255,255,255,0.25); letter-spacing:2px; text-transform:uppercase; margin-top:2px;';

  // ── Assemble content ─────────────────────────────────────────
  content.append(pill, title, subtitle, dealsRow, divider, ctaBtn);
  if (timerStrip) content.appendChild(timerStrip);
  content.appendChild(versionTag);

  // ── Assemble card ────────────────────────────────────────────
  // closeBtn must be OUTSIDE the card — card has overflow:hidden which kills click events
  card.append(bgGrad, particles, stripe, content, bottomGlow);

  const cardWrap = document.createElement('div');
  cardWrap.style.cssText = 'position:relative; width:min(860px,100%); flex-shrink:0;';
  cardWrap.appendChild(card);
  cardWrap.appendChild(closeBtn);
  overlay.appendChild(cardWrap);
  document.body.appendChild(overlay);

  // ── Close logic ───────────────────────────────────────────────
  function closeBanner() {
    clearInterval(_countdownInterval);
    sessionStorage.setItem(BANNER_STORAGE_KEY, 'seen');
    overlay.classList.add('banner-hiding');

    // Single animationend handler — guard by target AND only fire once
    const onHidden = (e) => {
      if (e.target !== overlay) return;
      overlay.removeEventListener('animationend', onHidden);
      window.removeEventListener('keydown', escClose);
      overlay.remove();
    };
    overlay.addEventListener('animationend', onHidden);

    // Hard fallback — remove after 500ms even if animationend never fires
    setTimeout(() => {
      if (overlay.parentNode) {
        window.removeEventListener('keydown', escClose);
        overlay.remove();
      }
    }, 500);
  }

  let _closed = false;
  function safeClose() {
    if (_closed) return;
    _closed = true;
    closeBanner();
  }
  closeBtn.addEventListener('click', safeClose);
  ctaBtn.addEventListener('click', () => {
    safeClose();
    setTimeout(() => {
      // Force-remove overlay in case animationend never fired
      if (overlay.parentNode) overlay.remove();
      const playBtn = document.getElementById('playBtn');
      if (playBtn) playBtn.click();
    }, 380);
  });

  // Close on backdrop click (outside the card)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) safeClose();
  });

  // Close on Escape key
  function escClose(e) {
    if (e.key === 'Escape') {
      safeClose();
      window.removeEventListener('keydown', escClose);
    }
  }
  window.addEventListener('keydown', escClose);
}

/**
 * Call this once after the page loads.
 * Shows the banner only once per page load (sessionStorage).
 * To force it every single page load, remove the sessionStorage check.
 */
export function initBanner() {
  // Auto-popup on page load only during the pre/active/post windows —
  // not during the 11 'none' months of the year.
  if (EVENT_PHASE === 'none') return;

  // Only show once per browser session (clears when tab is closed)
  if (sessionStorage.getItem(BANNER_STORAGE_KEY)) return;

  // Small delay so the game canvas has time to paint first
  setTimeout(() => _buildBanner(), 600);
}

/**
 * Call this from the EVENT button. Unlike initBanner(), this always
 * opens the banner — regardless of the sessionStorage 'seen' flag and
 * regardless of phase (shows the "no event active" card outside the
 * event window). Phase is recomputed fresh so it's never stale.
 */
export function openEventBanner() {
  // Don't stack a second banner if one is already open
  if (document.getElementById('event-banner-overlay')) return;

  const freshPhase = getEventPhase();
  _buildBanner(BANNER_CONFIGS[freshPhase]);
}