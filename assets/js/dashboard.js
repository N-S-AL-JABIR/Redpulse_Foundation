/**
 * REDPULSE FOUNDATION — dashboard.js
 * Donor Dashboard + Moderator Dashboard logic
 * DRF endpoints (all GET/PATCH calls below are DRF-ready)
 */
'use strict';

/* ── Eligibility Ring ──────────────────────────────────── */
function initEligibilityRing() {
  const circle   = document.querySelector('.ring-fill');
  const ringLabel = document.querySelector('.ring-label');
  if (!circle || !ringLabel) return;

  const lastDonation = localStorage.getItem('rp_last_donation');
  const WAIT_DAYS    = 90;

  let daysSince = WAIT_DAYS + 1; // default eligible
  if (lastDonation) {
    const diff  = Date.now() - new Date(lastDonation).getTime();
    daysSince   = Math.floor(diff / 86400000);
  }

  const daysLeft    = Math.max(0, WAIT_DAYS - daysSince);
  const pct         = Math.min(daysSince / WAIT_DAYS, 1);
  const r           = 44;
  const circumference = 2 * Math.PI * r;
  const offset      = circumference * (1 - pct);

  circle.setAttribute('stroke-dasharray', circumference);

  setTimeout(() => {
    circle.setAttribute('stroke-dashoffset', offset);
  }, 400);

  if (daysLeft === 0) {
    ringLabel.textContent = 'Ready!';
    circle.style.stroke   = '#22c55e';
    const sub = document.querySelector('.ring-sub');
    if (sub) sub.textContent = 'You can donate now';
  } else {
    ringLabel.textContent = daysLeft;
    const sub = document.querySelector('.ring-sub');
    if (sub) sub.textContent = `days remaining`;
  }
}

/* ── Profile Completion Bar ────────────────────────────── */
function initProfileCompletion() {
  const bar = document.getElementById('completion-bar');
  const pct = document.getElementById('completion-pct');
  if (!bar) return;

  const user   = Auth?.getUser?.() || {};
  const fields = ['name', 'phone', 'blood_group', 'university', 'area', 'photo'];
  const filled = fields.filter(f => !!user[f]).length;
  const score  = Math.round((filled / fields.length) * 100);

  setTimeout(() => {
    bar.style.width = score + '%';
    if (pct) pct.textContent = score + '%';
  }, 500);
}

/* ── Load Donor Dashboard Data (DRF-ready) ─────────────── */
async function loadDonorDashboard() {
  try {
    /* DRF endpoint: GET /api/dashboard/donor/
       Returns: { name, blood_group, last_donation, donations: [...], events: [...] } */
    const data = await API.get('/dashboard/donor/');
    renderDonorData(data);
  } catch (err) {
    console.warn('Dashboard API pending – using demo data');
    renderDonorData(DEMO_DONOR_DATA);
  }
}

const DEMO_DONOR_DATA = {
  name: 'Sabbir Ahmed',
  blood_group: 'O+',
  last_donation: '2026-02-10',
  total_donations: 7,
  lives_saved: 7,
  donation_history: [
    { date: '2026-02-10', hospital: 'DMCH, Shahbag',      units: 1, status: 'verified' },
    { date: '2025-10-15', hospital: 'Square Hospital',     units: 1, status: 'verified' },
    { date: '2025-07-02', hospital: 'BIRDEM, Shahbag',     units: 1, status: 'verified' },
    { date: '2025-03-19', hospital: 'Ibn Sina Hospital',   units: 1, status: 'verified' },
  ]
};

function renderDonorData(data) {
  // Name
  document.querySelectorAll('.donor-name').forEach(el => el.textContent = data.full_name);
  // Blood group
  document.querySelectorAll('.donor-bg').forEach(el => el.textContent  = data.blood_group);
  // Total donations
  const totalEl = document.getElementById('total-donations-val');
  if (totalEl) totalEl.textContent = data.total_donations || 0;

  // Donation history table
  const tbody = document.getElementById('donation-history-body');
  if (tbody && data.donation_history) {
    tbody.innerHTML = data.donation_history.map(d => `
      <tr>
        <td>${formatDate(d.date)}</td>
        <td>${d.hospital}</td>
        <td>${d.units} unit${d.units > 1 ? 's' : ''}</td>
        <td><span class="badge badge-green"><i class="fas fa-check"></i>${d.status}</span></td>
      </tr>
    `).join('');
  }

  // Store last donation for ring
  if (data.last_donation) {
    localStorage.setItem('rp_last_donation', data.last_donation);
    initEligibilityRing();
  }
}

/* ── Load Moderator Dashboard Data (DRF-ready) ─────────── */
async function loadModDashboard() {
  try {
    /* DRF endpoint: GET /api/dashboard/moderator/
       Returns: { requests: [...], stats: {...} } */
    const data = await API.get('/dashboard/moderator/');
    renderModData(data);
  } catch (err) {
    console.warn('Mod Dashboard API pending – using demo data');
    renderModData(DEMO_MOD_DATA);
  }
}

const DEMO_MOD_DATA = {
  stats: { pending: 5, active_donors: 284, emergency: 2, today_requests: 12 },
  requests: [
    { id: 1, patient: 'Fatima Begum', blood_group: 'O-', hospital: 'DMCH',        urgency: 'critical', status: 'pending',  time: '10 min ago' },
    { id: 2, patient: 'Rahim Uddin',  blood_group: 'AB+', hospital: 'Square',     urgency: 'urgent',   status: 'assigned', time: '25 min ago' },
    { id: 3, patient: 'Sara Akter',   blood_group: 'B+',  hospital: 'BIRDEM',     urgency: 'routine',  status: 'pending',  time: '1 hr ago'   },
    { id: 4, patient: 'Karim Hossain',blood_group: 'A+',  hospital: 'Ibn Sina',   urgency: 'urgent',   status: 'fulfilled',time: '2 hrs ago'  },
    { id: 5, patient: 'Nasrin Islam', blood_group: 'O+',  hospital: 'Anwer Khan', urgency: 'routine',  status: 'pending',  time: '3 hrs ago'  },
  ]
};

function renderModData(data) {
  // Stats
  if (data.stats) {
    setValue('pending-count',  data.stats.pending);
    setValue('active-donors',  data.stats.active_donors);
    setValue('emergency-count',data.stats.emergency);
    setValue('today-requests', data.stats.today_requests);
  }
  // Requests table
  const tbody = document.getElementById('requests-tbody');
  if (tbody && data.requests) {
    tbody.innerHTML = data.requests.map(r => `
      <tr>
        <td>#${String(r.id).padStart(4,'0')}</td>
        <td>${r.patient}</td>
        <td><span class="badge badge-red" style="font-weight:700;">${r.blood_group}</span></td>
        <td>${r.hospital}</td>
        <td><span class="badge ${urgencyClass(r.urgency)}">${urgencyIcon(r.urgency)} ${r.urgency}</span></td>
        <td><span class="badge ${statusClass(r.status)}">${r.status}</span></td>
        <td style="color:var(--muted);font-size:0.78rem;">${r.time}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn-sm btn-sm-red" onclick="assignRequest(${r.id})"><i class="fas fa-user-check"></i></button>
            <button class="btn-sm btn-sm-ghost" onclick="viewRequest(${r.id})"><i class="fas fa-eye"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }
}

function urgencyClass(u) {
  return { critical:'badge-red', urgent:'badge-yellow', routine:'badge-blue' }[u] || 'badge-muted';
}
function urgencyIcon(u) {
  return { critical:'🔴', urgent:'🟠', routine:'🟡' }[u] || '';
}
function statusClass(s) {
  return { pending:'badge-yellow', assigned:'badge-blue', fulfilled:'badge-green' }[s] || 'badge-muted';
}

function assignRequest(id) {
  showToast(`Request #${String(id).padStart(4,'0')} assigned. API pending.`, 'info');
}
function viewRequest(id) {
  showToast(`Viewing request #${String(id).padStart(4,'0')}`, 'info');
}

/* ── Notifications Toggle ──────────────────────────────── */
function initNotifDropdown() {
  const btn  = document.getElementById('notif-btn');
  const menu = document.getElementById('notif-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });
  document.addEventListener('click', () => menu.classList.remove('open'));
}

/* ── Edit Profile Modal ────────────────────────────────── */
function openEditProfile() {
  const modal = document.getElementById('edit-profile-modal');
  if (modal) modal.classList.add('open');
}

function closeEditProfile() {
  const modal = document.getElementById('edit-profile-modal');
  if (modal) modal.classList.remove('open');
}

/* ── Toggle Availability ───────────────────────────────── */
function toggleAvailability(toggle) {
  const available = toggle.checked;
  showToast(`Status set to ${available ? 'Available' : 'Unavailable'}`, 'success');
  /* DRF: PATCH /api/donors/me/ { available: available } */
}

/* ── Helpers ───────────────────────────────────────────── */
function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val ?? '--';
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

/* ── Init ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initEligibilityRing();
  initProfileCompletion();
  initNotifDropdown();

  // Load correct dashboard
  if (document.getElementById('donor-dash'))   loadDonorDashboard();
  if (document.getElementById('mod-dash'))     loadModDashboard();
});
