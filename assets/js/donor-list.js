/**
 * REDPULSE FOUNDATION — donor-list.js
 * Fetches and renders donors from DRF backend
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  loadDonors();

  // Wire up search and filters
  const searchInput = document.getElementById('donor-search');
  const searchBtn = document.querySelector('.search-bar button');
  const bloodGroupFilter = document.getElementById('filter-blood-group');
  const areaFilter = document.getElementById('filter-area');
  const universityFilter = document.getElementById('filter-university');
  
  if (searchBtn) searchBtn.addEventListener('click', () => loadDonors());
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') loadDonors();
    });
  }
  
  if (bloodGroupFilter) bloodGroupFilter.addEventListener('change', () => loadDonors());
  if (areaFilter) areaFilter.addEventListener('change', () => loadDonors());
  if (universityFilter) universityFilter.addEventListener('change', () => loadDonors());
});

async function loadDonors(page = 1) {
  const grid = document.getElementById('donors-grid');
  const countDisplay = document.getElementById('donor-count');
  const noDonorsMsg = document.getElementById('no-donors-msg');
  
  if (!grid) return;

  grid.innerHTML = '<div style="text-align:center; width:100%; padding:40px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--crimson)"></i></div>';
  
  const search = document.getElementById('donor-search')?.value || '';
  const bloodGroup = document.getElementById('filter-blood-group')?.value || '';
  const area = document.getElementById('filter-area')?.value || '';
  const university = document.getElementById('filter-university')?.value || '';
  
  const params = {
    page: page
  };
  
  // Note: search in DRF filters uses `search=` for SearchFilter, and specific fields for DjangoFilterBackend
  if (search) params.search = search;
  // Make sure to match the exact characters (e.g. A- vs A−) depending on backend
  if (bloodGroup) params.blood_group = bloodGroup.replace('−', '-'); 
  if (area) params.area = area;
  if (university) params.university__name = university; // Might need to just send `university` if that's the filter field

  try {
    const data = await API.get('/donors/search/', params);
    
    // DRF StandardResultsSetPagination returns { count, next, previous, results: [...] }
    const results = data.results || data; 
    
    if (countDisplay) {
        countDisplay.textContent = `${data.count || results.length} donors found`;
    }

    if (!results || results.length === 0) {
      grid.innerHTML = '';
      if (noDonorsMsg) noDonorsMsg.style.display = 'block';
    } else {
      if (noDonorsMsg) noDonorsMsg.style.display = 'none';
      grid.innerHTML = results.map((d, index) => renderDonorCard(d, index)).join('');
    }

  } catch (err) {
    console.error('Failed to load donors:', err);
    grid.innerHTML = '<div style="text-align:center; width:100%; padding:40px; color:var(--muted);">Failed to load donors. Make sure the backend is running.</div>';
  }
}

function renderDonorCard(donor, index) {
  const delay = (index % 3) * 100;
  
  // Calculate eligibility badge
  let badgeHtml = '';
  if (donor.is_eligible) {
      badgeHtml = `<div class="eligibility-badge elig-available"><i class="fas fa-circle" style="font-size:.45rem;"></i>Available</div>`;
  } else {
      const daysLeft = donor.days_until_eligible || 0;
      badgeHtml = `<div class="eligibility-badge elig-recovery"><i class="fas fa-clock" style="font-size:.7rem;"></i>Recovery (${daysLeft} days left)</div>`;
  }
  
  let lastDonatedStr = 'Never donated';
  if (donor.last_donation_date) {
      const diffTime = Math.abs(new Date() - new Date(donor.last_donation_date));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) {
          lastDonatedStr = `Last donated: ${diffDays} days ago`;
      } else {
          lastDonatedStr = `Last donated: ${Math.floor(diffDays/30)} months ago`;
      }
  }

  // The template variables
  const name = donor.full_name || 'Anonymous';
  const initial = name.charAt(0).toUpperCase();
  const location = [donor.area, donor.city].filter(Boolean).join(', ') || 'Dhaka';
  const uni = donor.university_name || 'Not specified';
  const bloodGroup = donor.blood_group || '?';

  return `
    <div class="donor-card reveal delay-${delay}" data-name="${name.toLowerCase()}" data-bg="${bloodGroup}" data-area="${donor.area || ''}" data-uni="${uni}">
      <div class="donor-card-banner">
        <div class="donor-card-banner-pattern"></div>
        <div class="donor-card-avatar">${initial}</div>
        <div class="donor-card-bg-badge">${bloodGroup}</div>
      </div>
      <div class="donor-card-body">
        <div class="donor-card-name">${name}</div>
        <div class="donor-card-meta">
          <span><i class="fas fa-location-dot"></i>${location}</span>
          <span><i class="fas fa-calendar-check"></i>${lastDonatedStr}</span>
        </div>
        ${badgeHtml}
        <div class="donor-card-footer">
          <div class="donor-card-uni"><i class="fas fa-graduation-cap"></i>${uni}</div>
          <button class="btn-contact-mod" onclick="openContactModal('${name.replace(/'/g, "\\'")}','${bloodGroup}')">
            <i class="fas fa-comment-medical"></i>Contact Mod
          </button>
        </div>
      </div>
    </div>
  `;
}
