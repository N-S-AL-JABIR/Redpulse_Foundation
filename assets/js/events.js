/**
 * REDPULSE FOUNDATION — events.js
 * Fetches and renders events from DRF backend
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  loadEvents();

  // Wire up filter pills
  document.querySelectorAll('.filter-pill').forEach(btn => {
    // Override inline onclick
    btn.onclick = null;
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const cat = this.dataset.cat;
      
      document.querySelectorAll('.event-item').forEach(item => {
        item.style.display = (cat === 'all' || item.dataset.cat === cat) ? '' : 'none';
      });
    });
  });
  
  // Modal handlers
  document.getElementById('event-modal').addEventListener('click', function(e){
    if(e.target===this){this.classList.remove('open');document.body.style.overflow='';}
  });
  document.getElementById('event-modal-close')?.addEventListener('click', () => {
    document.getElementById('event-modal').classList.remove('open');
    document.body.style.overflow = '';
  });
});

async function loadEvents() {
  const grid = document.getElementById('events-grid');
  if (!grid) return;

  grid.innerHTML = '<div style="text-align:center; width:100%; padding:40px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--crimson)"></i></div>';

  try {
    const data = await API.get('/events/');
    const results = data.results || data; 
    
    if (!results || results.length === 0) {
      grid.innerHTML = '<div style="text-align:center; width:100%; padding:40px; color:var(--muted);">No upcoming events at the moment.</div>';
    } else {
      grid.innerHTML = results.map((e, index) => renderEventCard(e, index)).join('');
      wireEventDetailButtons();
    }

  } catch (err) {
    console.error('Failed to load events:', err);
    grid.innerHTML = '<div style="text-align:center; width:100%; padding:40px; color:var(--muted);">Failed to load events. Make sure the backend is running.</div>';
  }
}

function renderEventCard(event, index) {
  const delay = (index % 3) * 100;
  
  // Map DRF event_type to UI category
  let uiCat = 'camp';
  let badgeLabel = 'Blood Camp';
  let iconClass = 'fa-droplet';
  let gradientClass = '';
  let badgeClass = 'rgba(192,22,44,.25)';
  let badgeTextColor = 'var(--crimson-glow)';
  let borderClass = 'rgba(192,22,44,.3)';
  
  if (event.event_type === 'awareness') {
      uiCat = 'awareness';
      badgeLabel = 'Awareness';
      iconClass = 'fa-bullhorn';
      gradientClass = 'background:linear-gradient(135deg,#0a1a00,#1a3d00,#2e6b00);';
      badgeClass = 'rgba(34,197,94,.15)';
      badgeTextColor = '#4ade80';
      borderClass = 'rgba(34,197,94,.3)';
  } else if (event.event_type === 'workshop') {
      uiCat = 'seminar';
      badgeLabel = 'Seminar';
      iconClass = 'fa-chalkboard-teacher';
      gradientClass = 'background:linear-gradient(135deg,#0a001a,#1a003d,#2e006b);';
      badgeClass = 'rgba(139,92,246,.15)';
      badgeTextColor = '#a78bfa';
      borderClass = 'rgba(139,92,246,.3)';
  }

  const startDate = new Date(event.start_datetime);
  const day = startDate.getDate().toString().padStart(2, '0');
  const month = startDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const timeStr = startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  const fullDateStr = startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  // Escape quotes
  const safeDesc = (event.description || '').replace(/"/g, '&quot;');
  
  return `
    <div class="col-lg-4 col-md-6 reveal delay-${delay} event-item" data-cat="${uiCat}">
      <div class="event-card-full" data-title="${event.title}" data-date="${fullDateStr}" data-time="${timeStr}" data-venue="${event.venue}, ${event.area}" data-type="${badgeLabel}" data-desc="${safeDesc}">
        <div class="event-card-img" style="${gradientClass}">
          <i class="fas ${iconClass} event-icon-big" style="color:${borderClass};"></i>
          <div class="event-type-badge" style="background:${badgeClass};color:${badgeTextColor};border:1px solid ${borderClass};">${badgeLabel}</div>
          <div class="event-date-float"><div class="day">${day}</div><div class="mon">${month}</div></div>
        </div>
        <div class="event-card-body">
          <div class="event-card-title">${event.title}</div>
          <div class="event-meta-row">
            <div class="event-meta-item"><i class="fas fa-clock"></i>${timeStr}</div>
            <div class="event-meta-item"><i class="fas fa-location-dot"></i>${event.venue}</div>
          </div>
          <div class="event-card-desc">${event.short_description || (event.description || '').substring(0, 100) + '...'}</div>
          <button class="btn-event-detail event-detail-btn" style="${badgeLabel === 'Awareness' ? 'background:#22c55e;' : badgeLabel === 'Seminar' ? 'background:#7c3aed;' : ''}">
            <i class="fas fa-info-circle"></i>View Details
          </button>
        </div>
      </div>
    </div>
  `;
}

function wireEventDetailButtons() {
  document.querySelectorAll('.event-detail-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const card = this.closest('[data-title]');
      if (!card) return;
      document.getElementById('modal-event-title').textContent = card.dataset.title  || '';
      document.getElementById('modal-event-date').textContent  = card.dataset.date   || '';
      document.getElementById('modal-event-time').textContent  = card.dataset.time   || '';
      document.getElementById('modal-event-venue').textContent = card.dataset.venue  || '';
      document.getElementById('modal-event-type').textContent  = card.dataset.type   || '';
      document.getElementById('modal-event-desc').textContent  = card.dataset.desc   || '';
      document.getElementById('event-modal').classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });
}
