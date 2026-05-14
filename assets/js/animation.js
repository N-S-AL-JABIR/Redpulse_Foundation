/**
 * REDPULSE FOUNDATION — animation.js
 * Gallery lightbox, donor list filtering, events modal,
 * university carousel, scroll animations
 */
'use strict';

/* ── Gallery Lightbox ──────────────────────────────────── */
function initGalleryLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  const lightboxImg  = document.getElementById('lightbox-img');
  const lightboxCap  = document.getElementById('lightbox-caption');
  const items        = document.querySelectorAll('.gallery-item');
  let current        = 0;

  function open(index) {
    current = index;
    const item = items[index];
    const img  = item.querySelector('img');
    const cap  = item.dataset.caption || '';
    if (lightboxImg) {
      lightboxImg.src = img ? img.src : '';
    }
    if (lightboxCap) lightboxCap.textContent = cap;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function next() { open((current + 1) % items.length); }
  function prev() { open((current - 1 + items.length) % items.length); }

  items.forEach((item, i) => {
    item.addEventListener('click', () => open(i));
  });

  document.getElementById('lightbox-close')?.addEventListener('click', close);
  document.getElementById('lightbox-next')?.addEventListener('click', (e) => { e.stopPropagation(); next(); });
  document.getElementById('lightbox-prev')?.addEventListener('click', (e) => { e.stopPropagation(); prev(); });
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'Escape')     close();
  });
}

/* ── Gallery Category Filter ───────────────────────────── */
function initGalleryFilter() {
  const filters = document.querySelectorAll('.gallery-filter-btn');
  const items   = document.querySelectorAll('.gallery-item');
  if (!filters.length) return;

  filters.forEach(btn => {
    btn.addEventListener('click', function() {
      filters.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const cat = this.dataset.cat;

      items.forEach(item => {
        const show = cat === 'all' || item.dataset.cat === cat;
        item.style.opacity   = '0';
        item.style.transform = 'scale(0.95)';
        setTimeout(() => {
          item.style.display = show ? '' : 'none';
          if (show) {
            requestAnimationFrame(() => {
              item.style.opacity   = '1';
              item.style.transform = 'scale(1)';
            });
          }
        }, 200);
      });
    });
  });
}

/* ── Donor List Filter ─────────────────────────────────── */
function initDonorFilter() {
  const searchInput = document.getElementById('donor-search');
  const bgFilter    = document.getElementById('filter-blood-group');
  const areaFilter  = document.getElementById('filter-area');
  const uniFilter   = document.getElementById('filter-university');
  const cards       = document.querySelectorAll('.donor-card');

  function applyFilter() {
    const search = (searchInput?.value || '').toLowerCase();
    const bg     = bgFilter?.value   || '';
    const area   = areaFilter?.value || '';
    const uni    = uniFilter?.value  || '';

    let visible = 0;
    cards.forEach(card => {
      const name     = (card.dataset.name  || '').toLowerCase();
      const cardBg   = card.dataset.bg    || '';
      const cardArea = card.dataset.area  || '';
      const cardUni  = card.dataset.uni   || '';

      const match =
        (!search || name.includes(search)) &&
        (!bg     || cardBg === bg)         &&
        (!area   || cardArea === area)     &&
        (!uni    || cardUni === uni);

      card.style.display = match ? '' : 'none';
      if (match) visible++;
    });

    const noResult = document.getElementById('no-donors-msg');
    if (noResult) noResult.style.display = visible ? 'none' : 'block';
    const countEl = document.getElementById('donor-count');
    if (countEl) countEl.textContent = visible + ' donors found';
  }

  searchInput?.addEventListener('input',  applyFilter);
  bgFilter?.addEventListener('change',    applyFilter);
  areaFilter?.addEventListener('change',  applyFilter);
  uniFilter?.addEventListener('change',   applyFilter);

  // Mobile filter toggle
  const filterToggle  = document.getElementById('filter-toggle');
  const filterSidebar = document.getElementById('filter-sidebar');
  filterToggle?.addEventListener('click', () => {
    filterSidebar?.classList.toggle('open');
  });
}

/* ── University Carousel ───────────────────────────────── */
function initUniCarousel() {
  const track = document.getElementById('uni-track');
  if (!track) return;

  let pos    = 0;
  let paused = false;

  function animate() {
    if (!paused) {
      pos -= 0.5;
      const total = track.scrollWidth / 2;
      if (Math.abs(pos) >= total) pos = 0;
      track.style.transform = `translateX(${pos}px)`;
    }
    requestAnimationFrame(animate);
  }
  animate();

  track.addEventListener('mouseenter', () => paused = true);
  track.addEventListener('mouseleave', () => paused = false);
}

/* ── Events Modal ──────────────────────────────────────── */
function initEventModal() {
  const modal   = document.getElementById('event-modal');
  if (!modal)   return;
  const closeBtn = document.getElementById('event-modal-close');

  document.querySelectorAll('.event-detail-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const card = this.closest('.event-card-full');
      if (!card) return;

      modal.querySelector('#modal-event-title').textContent  = card.dataset.title  || '';
      modal.querySelector('#modal-event-date').textContent   = card.dataset.date   || '';
      modal.querySelector('#modal-event-time').textContent   = card.dataset.time   || '';
      modal.querySelector('#modal-event-venue').textContent  = card.dataset.venue  || '';
      modal.querySelector('#modal-event-desc').textContent   = card.dataset.desc   || '';
      modal.querySelector('#modal-event-type').textContent   = card.dataset.type   || '';

      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

/* ── Contact Form (DRF-ready) ──────────────────────────── */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = this.querySelector('[type="submit"]');
    const orig = btn?.innerHTML;
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Sending…</span>'; }

    const data = Object.fromEntries(new FormData(this));

    try {
      /* DRF: POST /api/contact/ */
      await API.post('/contact/', data);
      showToast('Message sent! We will reply shortly.', 'success');
      this.reset();
    } catch (err) {
      console.warn('Contact API pending:', err.message);
      showToast('Message received. API connection pending.', 'info');
      this.reset();
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = orig; }
    }
  });
}

/* ── Init ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initGalleryLightbox();
  initGalleryFilter();
  initDonorFilter();
  initUniCarousel();
  initEventModal();
  initContactForm();
});
