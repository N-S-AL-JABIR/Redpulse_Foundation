/**
 * REDPULSE FOUNDATION — donor-card.js
 * Social Donor Card Generator with html2canvas download
 * DRF endpoint (future): GET /api/donors/me/ for pre-fill
 */
'use strict';

const CARD_THEMES = {
  crimson:  'linear-gradient(145deg,#1a0005 0%,#3d0010 40%,#8b0000 100%)',
  midnight: 'linear-gradient(145deg,#0a0a1a 0%,#141430 40%,#1a1a3e 100%)',
  maroon:   'linear-gradient(145deg,#1a0008 0%,#4a0015 40%,#800020 100%)',
  rose:     'linear-gradient(145deg,#1a0010 0%,#6b1530 40%,#c2185b 100%)'
};

let currentTheme = 'crimson';
let currentBloodGroup = 'B+';

/* ── Update Preview Card ───────────────────────────────── */
function updateCard() {
  const name    = document.getElementById('card-name')?.value  || 'Your Name';
  const msg     = document.getElementById('card-message')?.value || '';
  const phone   = document.getElementById('card-phone')?.value  || '';

  const previewName  = document.getElementById('preview-name');
  const previewMsg   = document.getElementById('preview-message');
  const previewBG    = document.getElementById('preview-blood-group');
  const previewPhone = document.getElementById('preview-phone');
  const cardInner    = document.getElementById('card-inner');

  if (previewName)  previewName.textContent  = name || 'Your Name';
  if (previewMsg)   previewMsg.textContent   = msg;
  if (previewBG)    previewBG.textContent    = currentBloodGroup;
  if (previewPhone && phone) previewPhone.textContent = phone;
  if (cardInner)    cardInner.style.background = CARD_THEMES[currentTheme];
}

/* ── Theme Selector ────────────────────────────────────── */
function initThemeSelector() {
  document.querySelectorAll('.template-dot').forEach(dot => {
    dot.addEventListener('click', function() {
      document.querySelectorAll('.template-dot').forEach(d => d.classList.remove('active'));
      this.classList.add('active');
      currentTheme = this.dataset.theme;
      updateCard();
    });
  });
}

/* ── Blood Group for Card ──────────────────────────────── */
function initCardBloodChips() {
  const grid = document.getElementById('card-blood-grid');
  if (!grid) return;
  grid.querySelectorAll('.blood-chip').forEach(chip => {
    chip.addEventListener('click', function() {
      grid.querySelectorAll('.blood-chip').forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');
      currentBloodGroup = this.dataset.group;
      updateCard();
    });
  });
}

/* ── Download Card ─────────────────────────────────────── */
async function downloadCard() {
  const card = document.getElementById('donor-card-preview');
  if (!card) return;

  const btn = document.getElementById('download-btn');
  if (btn) {
    btn.disabled  = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Generating…</span>';
  }

  try {
    if (typeof html2canvas === 'undefined') {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    }

    const canvas = await html2canvas(card, {
      backgroundColor: null,
      scale: 3,
      useCORS: true,
      logging: false
    });

    const name = document.getElementById('card-name')?.value?.replace(/\s+/g, '_') || 'donor';
    const link = document.createElement('a');
    link.download = `redpulse_donor_${name}.png`;
    link.href     = canvas.toDataURL('image/png');
    link.click();

    showToast('Card downloaded successfully!', 'success');
  } catch (err) {
    console.error('Download error:', err);
    showToast('Download failed. Please try again.', 'error');
  } finally {
    if (btn) {
      btn.disabled  = false;
      btn.innerHTML = '<i class="fas fa-download"></i><span>Download Card</span>';
    }
  }
}

/* ── Share Card ────────────────────────────────────────── */
async function shareCard() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'I am a proud blood donor — Redpulse Foundation',
        text:  'Join me and save lives. Register as a blood donor at Redpulse Foundation.',
        url:   window.location.origin
      });
    } catch (_) {}
  } else {
    const url = window.location.origin;
    navigator.clipboard?.writeText(url);
    showToast('Link copied to clipboard!', 'info');
  }
}

/* ── Lazy-load Script ──────────────────────────────────── */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/* ── Pre-fill from logged-in user (DRF-ready) ──────────── */
async function prefillFromProfile() {
  const user = Auth?.getUser?.();
  if (!user) return;
  const nameEl  = document.getElementById('card-name');
  const phoneEl = document.getElementById('card-phone');
  if (nameEl  && user.name)        { nameEl.value  = user.name; }
  if (phoneEl && user.blood_group) {
    currentBloodGroup = user.blood_group;
    document.querySelectorAll('#card-blood-grid .blood-chip').forEach(c => {
      c.classList.toggle('selected', c.dataset.group === currentBloodGroup);
    });
  }
  updateCard();
}

/* ── Init ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initThemeSelector();
  initCardBloodChips();
  updateCard();
  prefillFromProfile();

  // Wire oninput on name/message if present
  ['card-name', 'card-message', 'card-phone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateCard);
  });
});
