/**
 * REDPULSE FOUNDATION — donor-profile.js
 * Handles fetching and displaying the authenticated donor's profile
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    fetchDonorProfile();
});

async function fetchDonorProfile() {
    try {
        const response = await API.get('/donors/profile/');
        if (response.status === 'success' && response.data) {
            populateProfile(response.data);
        }
    } catch (error) {
        console.error('Failed to load donor profile:', error);
        if (error.message && error.message.includes('not found')) {
            showToast('Donor profile not found. Please create one.', 'warning');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            showToast('Failed to load profile data', 'error');
        }
    }
}

function populateProfile(data) {
    // Basic Info
    setText('profile-name', data.full_name || 'N/A');
    setText('profile-blood-ring', data.blood_group || 'N/A');
    setText('sc-name', data.full_name || 'N/A');
    setText('sc-blood', data.blood_group || 'N/A');

    // Location & Uni
    const locationStr = [data.area, data.city].filter(Boolean).join(', ') || 'Unknown Location';
    const uniStr = data.university_name || 'Unknown University';
    const locUniEl = document.getElementById('profile-location-uni');
    if (locUniEl) {
        locUniEl.innerHTML = `<i class="fas fa-graduation-cap" style="color:var(--crimson-glow);margin-right:5px;"></i>${uniStr} &middot; ${locationStr}`;
    }

    // Stats
    setText('profile-total-donations', data.total_donations || '0');
    // Using total_donations as a placeholder for lives saved for now (1 unit can save up to 3 lives)
    setText('profile-lives-saved', ((data.total_donations || 0) * 3));

    if (data.created_at) {
        const joinDate = new Date(data.created_at);
        const diffTime = Math.abs(new Date() - joinDate);
        const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
        const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
        let sinceStr = 'Recently';
        if (diffYears > 0) sinceStr = `${diffYears} yrs`;
        else if (diffMonths > 0) sinceStr = `${diffMonths} mos`;
        setText('profile-member-since', sinceStr);
    }

    // Availability
    const isAvailable = data.availability_status === 'available';
    const toggle = document.getElementById('profile-availability-toggle');
    if (toggle) toggle.checked = isAvailable;
    setText('profile-availability-text', isAvailable ? 'Available' : 'Unavailable');

    // Badges
    const badgeContainer = document.getElementById('profile-badges-container');
    if (badgeContainer) {
        badgeContainer.innerHTML = '';
        if (data.is_eligible) {
            badgeContainer.innerHTML += `<span class="elig-badge elig-ok"><i class="fas fa-check-circle"></i>Eligible to Donate</span>`;
        } else {
            badgeContainer.innerHTML += `<span class="elig-badge elig-red"><i class="fas fa-clock"></i>On Cooldown</span>`;
        }
        
        // Always verified since they have a profile
        badgeContainer.innerHTML += `<span class="elig-badge elig-blue"><i class="fas fa-certificate"></i>Verified Donor</span>`;
        
        if (data.total_donations >= 5) {
            badgeContainer.innerHTML += `<span class="elig-badge elig-red"><i class="fas fa-award"></i>Blood Hero</span>`;
        }
    }

    // About Text
    let aboutText = `${data.full_name} is a dedicated voluntary blood donor based in ${locationStr}. `;
    if (data.total_donations > 0) {
        aboutText += `They have been part of the Redpulse network, donating ${data.total_donations} times and helping save lives.`;
    } else {
        aboutText += `They are a new member of the Redpulse network, ready to help save lives.`;
    }
    setText('profile-about-text', aboutText);

    // About details
    const aboutLocEl = document.getElementById('about-location');
    if (aboutLocEl) aboutLocEl.innerHTML = `<i class="fas fa-map-marker-alt" style="color:var(--crimson-glow);"></i>${locationStr}`;
    
    const aboutUniEl = document.getElementById('about-uni');
    if (aboutUniEl) aboutUniEl.innerHTML = `<i class="fas fa-graduation-cap" style="color:var(--crimson-glow);"></i>${uniStr}`;
    
    const aboutBloodEl = document.getElementById('about-blood');
    if (aboutBloodEl) aboutBloodEl.innerHTML = `<i class="fas fa-droplet" style="color:var(--crimson-glow);"></i>${data.blood_group} Blood Group`;

    // Eligibility Ring & Info
    const fill = document.getElementById('countdown-ring-fill');
    const daysEl = document.getElementById('countdown-days');
    const textEl = document.getElementById('countdown-text');
    const statusEl = document.getElementById('countdown-status');
    const lastDateEl = document.getElementById('countdown-last-donation');
    
    // Format last donation date
    const lastDateStr = data.last_donation_date ? new Date(data.last_donation_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never';
    
    if (data.is_eligible) {
        if (fill) fill.style.strokeDashoffset = '0'; // 100% full (327 max length roughly)
        if (daysEl) {
            if (!data.last_donation_date) {
                daysEl.textContent = '0';
                textEl.textContent = 'days since';
            } else {
                // Calculate days since last donation
                const diffTime = Math.abs(new Date() - new Date(data.last_donation_date));
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                daysEl.textContent = diffDays;
                textEl.textContent = 'days since';
            }
        }
        if (statusEl) {
            statusEl.className = 'elig-badge elig-ok';
            statusEl.innerHTML = '<i class="fas fa-check-circle"></i>Ready to Donate!';
        }
        if (lastDateEl) {
            lastDateEl.innerHTML = `Last donation: ${lastDateStr}<br/>You're fully eligible to donate again.`;
        }
    } else {
        const daysLeft = data.days_until_eligible || 0;
        const totalCooldown = 120; // Males 90, Females 120. Using 120 as safe default for UI offset
        const offset = Math.max(0, 327 * (daysLeft / totalCooldown));
        if (fill) fill.style.strokeDashoffset = offset;
        
        if (daysEl) daysEl.textContent = daysLeft;
        if (textEl) textEl.textContent = 'days to go';
        
        if (statusEl) {
            statusEl.className = 'elig-badge elig-red';
            statusEl.innerHTML = '<i class="fas fa-clock"></i>On Cooldown';
        }
        if (lastDateEl) {
            const nextDateStr = data.cooldown_end_date ? new Date(data.cooldown_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown';
            lastDateEl.innerHTML = `Last donation: ${lastDateStr}<br/>Eligible again on: ${nextDateStr}.`;
        }
    }
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// Ensure this matches the onclick in the HTML
window.toggleAvailability = async function(checkbox) {
    const isAvailable = checkbox.checked;
    const statusText = isAvailable ? 'available' : 'unavailable';
    const originalState = !isAvailable;
    
    try {
        const response = await API.patch('/donors/profile/', {
            availability_status: statusText
        });
        
        if (response.status === 'success') {
            showToast(`Status updated to ${statusText}.`, 'success');
            setText('profile-availability-text', isAvailable ? 'Available' : 'Unavailable');
        } else {
            throw new Error('Failed');
        }
    } catch (err) {
        console.error('Failed to update availability:', err);
        showToast('Failed to update status.', 'error');
        checkbox.checked = originalState; // Revert visually
        setText('profile-availability-text', originalState ? 'Available' : 'Unavailable');
    }
};
