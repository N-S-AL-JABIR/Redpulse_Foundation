/**
 * REDPULSE FOUNDATION — app.js
 * Core utilities: navbar, API helpers, ripple, nav active link
 * DRF-ready: all API calls use the API object below
 */

'use strict';

/* ── API Configuration ─────────────────────────────────── */
const API = {
  BASE_URL: 'http://127.0.0.1:8000/api/v1',   // Change to your DRF backend URL

  get: async (endpoint, params = {}) => {
    const url = new URL(API.BASE_URL + endpoint, window.location.origin);
    Object.keys(params).forEach(k => url.searchParams.append(k, params[k]));
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...API._authHeaders()
      }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  post: async (endpoint, data = {}) => {

  const isFormData = data instanceof FormData;

  const res = await fetch(API.BASE_URL + endpoint, {
    method: 'POST',

    headers: {
      ...(isFormData ? {} : {
        'Content-Type': 'application/json'
      }),

      ...API._authHeaders()
    },

    body: isFormData
      ? data
      : JSON.stringify(data)
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
},

  patch: async (endpoint, data = {}) => {
    const res = await fetch(API.BASE_URL + endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...API._authHeaders()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  _authHeaders: () => {
    const token = localStorage.getItem('rp_access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
};

/* ── Token Management ──────────────────────────────────── */
const Auth = {
  setTokens: (access, refresh) => {
    localStorage.setItem('rp_access_token', access);
    localStorage.setItem('rp_refresh_token', refresh);
  },
  clearTokens: () => {
    localStorage.removeItem('rp_access_token');
    localStorage.removeItem('rp_refresh_token');
    localStorage.removeItem('rp_user');
  },
  isLoggedIn: () => !!localStorage.getItem('rp_access_token'),
  getUser: () => JSON.parse(localStorage.getItem('rp_user') || 'null'),
  setUser: (user) => localStorage.setItem('rp_user', JSON.stringify(user)),
  logout: () => {
    Auth.clearTokens();
    window.location.href = '/login.html';
  }
};

/* ── Page Loader ───────────────────────────────────────── */
function initPageLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hidden'), 400);
  });
}

/* ── Navbar ────────────────────────────────────────────── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  // Scroll: add .scrolled class
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });
  }

  // Auth Toggle
  if (Auth.isLoggedIn()) {
    // Change Login to Logout
    document.querySelectorAll('a[href="login.html"]').forEach(btn => {
      btn.innerHTML = '<i class="fas fa-sign-out-alt"></i><span>Logout</span>';
      btn.href = 'javascript:void(0)';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        Auth.logout();
      });
    });

    // Change Become Donor/Register to Dashboard
    document.querySelectorAll('a[href="register.html"]').forEach(btn => {
      btn.innerHTML = '<i class="fas fa-user-circle"></i><span>Dashboard</span>';
      const user = Auth.getUser();
      btn.href = user && user.role === 'moderator' ? 'dashboard.html#moderator' : 'dashboard.html';
    });
  }

  // Active link highlight on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  if (sections.length && navLinks.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          navLinks.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id);
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    sections.forEach(s => io.observe(s));
  }
}

/* ── Close Mobile Menu ─────────────────────────────────── */
function closeMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (hamburger) hamburger.classList.remove('open');
  if (mobileMenu) mobileMenu.classList.remove('open');
}

/* ── Scroll Reveal ─────────────────────────────────────── */
function initReveal() {
  const targets = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  if (!targets.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  targets.forEach(t => io.observe(t));
}

/* ── Animated Counters ─────────────────────────────────── */
function initCounters() {
  const counters = document.querySelectorAll('.stat-counter');
  if (!counters.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.target, 10);
      const duration = 2000;
      const step = Math.ceil(target / (duration / 16));
      let current = 0;

      const tick = () => {
        current = Math.min(current + step, target);
        el.textContent = current.toLocaleString();
        if (current < target) requestAnimationFrame(tick);
        else el.classList.add('counter-done');
      };
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => io.observe(c));
}

/* ── Button Ripple Effect ──────────────────────────────── */
function initRipple() {
  document.querySelectorAll('.btn-red, .btn-auth').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      const size = Math.max(rect.width, rect.height);
      ripple.style.cssText = `
        width: ${size}px; height: ${size}px;
        left: ${e.clientX - rect.left - size / 2}px;
        top:  ${e.clientY - rect.top  - size / 2}px;
      `;
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  });
}

/* ── Blood Group Chip Selector ─────────────────────────── */
function initBloodChips() {
  document.querySelectorAll('.blood-group-grid').forEach(grid => {
    grid.querySelectorAll('.blood-chip').forEach(chip => {
      chip.addEventListener('click', function() {
        grid.querySelectorAll('.blood-chip').forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
        // Write to hidden input if present
        const hiddenId = grid.dataset.target;
        if (hiddenId) {
          const hidden = document.getElementById(hiddenId);
          if (hidden) hidden.value = this.dataset.group;
        }
        // Also search nearby hidden inputs
        const parent = grid.closest('form') || grid.parentElement;
        const hidden = parent.querySelector('input[type="hidden"][name="blood_group"]');
        if (hidden) hidden.value = this.dataset.group;
      });
    });
  });
}

/* ── Goal Bar Animation ────────────────────────────────── */
function initGoalBars() {
  document.querySelectorAll('.goal-fill[data-width]').forEach(fill => {
    setTimeout(() => {
      fill.style.width = fill.dataset.width + '%';
    }, 300);
  });
}

/* ── Urgency Tabs ──────────────────────────────────────── */
function initUrgencyTabs() {
  document.querySelectorAll('.urgency-tabs').forEach(tabs => {
    const hiddenInput = tabs.parentElement.querySelector('#urgency-value');
    tabs.querySelectorAll('.urgency-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        tabs.querySelectorAll('.urgency-tab').forEach(t => t.classList.remove('active-tab'));
        this.classList.add('active-tab');
        if (hiddenInput) hiddenInput.value = this.dataset.urgency;
      });
    });
  });
}

/* ── Blood Compatibility Widget ────────────────────────── */
function initCompatGrid() {
  const grid  = document.getElementById('compat-grid');
  const info  = document.getElementById('compat-info');
  if (!grid || !info) return;

  grid.querySelectorAll('.compat-cell').forEach(cell => {
    cell.addEventListener('click', function() {
      grid.querySelectorAll('.compat-cell').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('can-give').textContent    = this.dataset.canGive;
      document.getElementById('can-receive').textContent = this.dataset.canReceive;
      info.style.display = 'block';
    });
  });
}

/* ── Form Submit Handler (DRF-ready) ───────────────────── */
function initForms() {
  document.querySelectorAll('form[data-api-endpoint]').forEach(form => {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const endpoint = this.dataset.apiEndpoint;
      const btn      = this.querySelector('[type="submit"]');
      const origText = btn ? btn.innerHTML : '';

      if (btn) {
        btn.disabled  = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Submitting…</span>';
      }

      try {
        const data = Object.fromEntries(new FormData(this));
        await API.post(endpoint, data);
        showToast('Submitted successfully!', 'success');
        this.reset();
      } catch (err) {
        console.warn('API not connected yet – form submission:', err.message);
        showToast('Form captured. API connection pending.', 'info');
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = origText; }
      }
    });
  });
}

/* ── Toast Notification ────────────────────────────────── */
function showToast(message, type = 'info') {
  const colorMap = {
    success: '#22c55e',
    error:   '#ef4444',
    warning: '#f59e0b',
    info:    '#C0162C'
  };

  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 99999;
    background: #1A1A1E; border: 1px solid ${colorMap[type] || '#444'};
    border-radius: 12px; padding: 14px 20px; max-width: 320px;
    font-family: Inter, sans-serif; font-size: 0.875rem; color: #F9F6F2;
    box-shadow: 0 16px 48px rgba(0,0,0,0.5);
    animation: fade-up 0.3s ease both;
    display: flex; align-items: center; gap: 10px;
  `;
  const iconMap = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  toast.innerHTML = `<span style="color:${colorMap[type]};font-weight:700;">${iconMap[type] || 'ℹ'}</span>${message}`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ── Floating Particles ────────────────────────────────── */
function initParticles(containerId = 'particles-hero') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const count = window.innerWidth < 640 ? 8 : 16;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const size = Math.random() * 10 + 4;
    p.style.cssText = `
      position: absolute;
      width: ${size}px; height: ${size}px;
      border-radius: 50%;
      background: rgba(192,22,44,${Math.random() * 0.15 + 0.05});
      left: ${Math.random() * 100}%;
      top:  ${Math.random() * 100}%;
      animation: particle-float ${Math.random() * 8 + 6}s ${Math.random() * 4}s ease-in-out infinite;
    `;
    container.appendChild(p);
  }
}

/* ── Smooth Scroll for anchor links ────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      closeMenu();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ── Sidebar Dashboard Toggle (mobile) ─────────────────── */
function initDashSidebar() {
  const toggle  = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.dash-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!toggle || !sidebar) return;

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
  });

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}

/* ── Donor Card Generator ──────────────────────────────── */
function initCardGenerator() {
  const themes = {
    crimson:  'linear-gradient(145deg, #1a0005 0%, #3d0010 40%, #8b0000 100%)',
    midnight: 'linear-gradient(145deg, #0d0d1a 0%, #1a1a3e 40%, #16213e 100%)',
    maroon:   'linear-gradient(145deg, #2a0008 0%, #4a0010 40%, #800020 100%)',
    rose:     'linear-gradient(145deg, #3d0018 0%, #6b1530 40%, #c2185b 100%)',
  };

  document.querySelectorAll('.template-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      document.querySelectorAll('.template-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      const inner = document.getElementById('card-inner');
      if (inner) inner.style.background = themes[dot.dataset.theme];
    });
  });

  const cardBloodGrid = document.getElementById('card-blood-grid');
  if (cardBloodGrid) {
    cardBloodGrid.querySelectorAll('.blood-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const previewBg = document.getElementById('preview-blood-group');
        if (previewBg) previewBg.textContent = chip.dataset.group;
      });
    });
  }
}

function updateCard() {
  const name = document.getElementById('card-name')?.value || 'Your Name';
  const msg  = document.getElementById('card-message')?.value || '';
  const pName = document.getElementById('preview-name');
  const pMsg = document.getElementById('preview-message');
  if (pName) pName.textContent = name;
  if (pMsg) pMsg.textContent = msg;
}

function downloadCard() {
  const canvas = document.getElementById('card-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const activeDot = document.querySelector('.template-dot.active');
  const themeName = activeDot ? activeDot.dataset.theme : 'crimson';

  const gradMap = {
    crimson:  [['#1a0005', 0], ['#3d0010', 0.4], ['#8b0000', 1]],
    midnight: [['#0d0d1a', 0], ['#1a1a3e', 0.4], ['#16213e', 1]],
    maroon:   [['#2a0008', 0], ['#4a0010', 0.4], ['#800020', 1]],
    rose:     [['#3d0018', 0], ['#6b1530', 0.4], ['#c2185b', 1]],
  };

  const grad = ctx.createLinearGradient(0, 0, W, H);
  (gradMap[themeName] || gradMap.crimson).forEach(([color, stop]) => grad.addColorStop(stop, color));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.beginPath();
  ctx.arc(W + 60, -60, 260, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(-40, H + 40, 220, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '500 22px "Space Mono", monospace';
  ctx.letterSpacing = '4px';
  ctx.textAlign = 'left';
  ctx.fillText('REDPULSE FOUNDATION · DHAKA, BANGLADESH', 60, 80);

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '48px serif';
  ctx.textAlign = 'center';
  ctx.fillText('♥', W/2, 380);

  const bg = document.getElementById('preview-blood-group')?.textContent || 'A+';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = 'bold 220px "Playfair Display", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(255,80,80,0.4)';
  ctx.shadowBlur = 60;
  ctx.fillText(bg, W/2, 620);
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '500 24px "Space Mono", monospace';
  ctx.fillText('BLOOD GROUP', W/2, 670);

  const name = document.getElementById('preview-name')?.textContent || 'Your Name';
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = 'bold 52px "Playfair Display", Georgia, serif';
  ctx.fillText(name, W/2, 760);

  const message = document.getElementById('preview-message')?.textContent || '';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = 'italic 28px "DM Sans", sans-serif';
  wrapText(ctx, message, W/2, 820, W - 120, 40, 'center');

  ctx.beginPath();
  ctx.moveTo(60, 940);
  ctx.lineTo(W - 60, 940);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '22px "Space Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('♥ ♥ ♥', 60, 990);
  ctx.textAlign = 'center';
  ctx.fillText('redpulsefoundation.org', W/2, 990);
  ctx.textAlign = 'right';
  ctx.fillText('PROUD DONOR', W - 60, 990);

  const link = document.createElement('a');
  link.download = `redpulse-donor-card-${bg.replace(/[^a-z0-9]/gi,'')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('Card downloaded! Share it to inspire others ❤️', 'success');
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, align='left') {
  const words = text.split(' ');
  let line = '';
  ctx.textAlign = align;
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, x, y);
      line = words[i] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

function shareCard() {
  if (navigator.share) {
    navigator.share({
      title: 'I am a Blood Donor – Redpulse Foundation',
      text: `${document.getElementById('preview-name')?.textContent || 'Someone'} is a proud blood donor! Join the movement at redpulsefoundation.org`,
      url: window.location.href,
    });
  } else {
    navigator.clipboard.writeText('I am a proud blood donor with Redpulse Foundation! Join me at redpulsefoundation.org');
    showToast('Link copied to clipboard!', 'success');
  }
}

/* ── Init Ticker ───────────────────────────────────────── */
function initTicker() {
  const ticker = document.getElementById('ticker-inner');
  if (ticker) {
    ticker.innerHTML += ticker.innerHTML;
  }
}

// Make globally available so HTML onclick can reach them
window.updateCard = updateCard;
window.downloadCard = downloadCard;
window.shareCard = shareCard;

/* ── Init All ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initPageLoader();
  initNavbar();
  initReveal();
  initCounters();
  initRipple();
  initBloodChips();
  initGoalBars();
  initUrgencyTabs();
  initCompatGrid();
  initForms();
  initSmoothScroll();
  initDashSidebar();
  initParticles();
  initCardGenerator();
  initTicker();
});
