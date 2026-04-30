/* ============================================================
   NAV SCROLL & MOBILE MENU
   ============================================================ */
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);

  // Active nav link
  document.querySelectorAll('.nav-links a').forEach(link => {
    const sectionId = link.getAttribute('href').replace('#','');
    const section = document.getElementById(sectionId);
    if (!section) return;
    const rect = section.getBoundingClientRect();
    link.classList.toggle('active', rect.top <= 100 && rect.bottom > 100);
  });
});

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});

function closeMenu() {
  hamburger.classList.remove('open');
  mobileMenu.classList.remove('open');
}

/* ============================================================
   SCROLL REVEAL
   ============================================================ */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ============================================================
   COUNTER ANIMATION
   ============================================================ */
function animateCounter(el, target, duration = 2000) {
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 4);
    el.textContent = Math.floor(ease * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target.toLocaleString();
  };
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      animateCounter(el, parseInt(el.dataset.target), 2200);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-counter').forEach(el => counterObserver.observe(el));

/* ============================================================
   GOAL BARS
   ============================================================ */
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.goal-fill').forEach(bar => {
        setTimeout(() => {
          bar.style.width = bar.dataset.width + '%';
        }, 200);
      });
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.blood-need-card').forEach(card => barObserver.observe(card));

/* ============================================================
   BLOOD GROUP CHIPS
   ============================================================ */
function initBloodChips(gridId, hiddenId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.querySelectorAll('.blood-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      grid.querySelectorAll('.blood-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      if (hiddenId) document.getElementById(hiddenId).value = chip.dataset.group;
    });
  });
}

initBloodChips('blood-group-grid', 'selected-blood-group');
initBloodChips('req-blood-group-grid', 'req-selected-blood-group');
initBloodChips('card-blood-grid', null);

document.querySelectorAll('#card-blood-grid .blood-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.getElementById('preview-blood-group').textContent = chip.dataset.group;
  });
});

/* ============================================================
   URGENCY TABS
   ============================================================ */
document.querySelectorAll('.urgency-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.urgency-tab').forEach(t => t.classList.remove('active-tab'));
    tab.classList.add('active-tab');
    document.getElementById('urgency-value').value = tab.dataset.urgency;
  });
});

/* ============================================================
   DONOR CARD GENERATOR
   ============================================================ */
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
    document.getElementById('card-inner').style.background = themes[dot.dataset.theme];
  });
});

function updateCard() {
  const name = document.getElementById('card-name').value || 'Your Name';
  const msg  = document.getElementById('card-message').value || '';
  document.getElementById('preview-name').textContent = name;
  document.getElementById('preview-message').textContent = msg;
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function downloadCard() {
  const canvas = document.getElementById('card-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const activeDot = document.querySelector('.template-dot.active');
  const themeName = activeDot ? activeDot.dataset.theme : 'crimson';

  // Background gradient
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

  // Decorative circle top-right
  ctx.beginPath();
  ctx.arc(W + 60, -60, 260, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fill();

  // Decorative circle bottom-left
  ctx.beginPath();
  ctx.arc(-40, H + 40, 220, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fill();

  // Org label
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '500 22px "Space Mono", monospace';
  ctx.letterSpacing = '4px';
  ctx.textAlign = 'left';
  ctx.fillText('REDPULSE FOUNDATION · DHAKA, BANGLADESH', 60, 80);

  // Drop icon (SVG path for blood drop – drawn as circle+triangle approximation)
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '48px serif';
  ctx.textAlign = 'center';
  ctx.fillText('♥', W/2, 380);

  // Blood group
  const bg = document.getElementById('preview-blood-group').textContent;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = 'bold 220px "Playfair Display", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(255,80,80,0.4)';
  ctx.shadowBlur = 60;
  ctx.fillText(bg, W/2, 620);
  ctx.shadowBlur = 0;

  // "Blood Group" label
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '500 24px "Space Mono", monospace';
  ctx.fillText('BLOOD GROUP', W/2, 670);

  // Donor name
  const name = document.getElementById('preview-name').textContent;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = 'bold 52px "Playfair Display", Georgia, serif';
  ctx.fillText(name, W/2, 760);

  // Message (word-wrap)
  const message = document.getElementById('preview-message').textContent;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = 'italic 28px "DM Sans", sans-serif';
  wrapText(ctx, message, W/2, 820, W - 120, 40, 'center');

  // Divider
  ctx.beginPath();
  ctx.moveTo(60, 940);
  ctx.lineTo(W - 60, 940);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '22px "Space Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('♥ ♥ ♥', 60, 990);
  ctx.textAlign = 'center';
  ctx.fillText('redpulsefoundation.org', W/2, 990);
  ctx.textAlign = 'right';
  ctx.fillText('PROUD DONOR', W - 60, 990);

  // Download
  const link = document.createElement('a');
  link.download = `redpulse-donor-card-${bg.replace(/[^a-z0-9]/gi,'')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('Card downloaded! Share it to inspire others ❤️');
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
      text: `${document.getElementById('preview-name').textContent} is a proud blood donor! Join the movement at redpulsefoundation.org`,
      url: window.location.href,
    });
  } else {
    navigator.clipboard.writeText('I am a proud blood donor with Redpulse Foundation! Join me at redpulsefoundation.org');
    showToast('Link copied to clipboard!');
  }
}

/* ============================================================
   COMPATIBILITY WIDGET
   ============================================================ */
document.querySelectorAll('.compat-cell').forEach(cell => {
  cell.addEventListener('click', () => {
    document.querySelectorAll('.compat-cell').forEach(c => c.classList.remove('highlighted'));
    cell.classList.add('highlighted');
    document.getElementById('can-give').textContent = cell.dataset.canGive;
    document.getElementById('can-receive').textContent = cell.dataset.canReceive;
    document.getElementById('compat-info').style.display = 'block';
  });
});

/* ============================================================
   FORM SUBMISSION (DRF READY)
   ============================================================ */
function handleFormSubmit(form, successMsg) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Submitting...</span>';
    btn.disabled = true;

    // DRF integration: collect FormData and POST to API endpoint
    const endpoint = form.dataset.apiEndpoint;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      /* WHEN DRF IS READY — uncomment this:
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'), // Django CSRF
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Server error');
      */

      // Simulated success delay for demo
      await new Promise(r => setTimeout(r, 1200));
      showToast(successMsg);
      form.reset();
      document.querySelectorAll('.blood-chip').forEach(c => c.classList.remove('selected'));
    } catch (err) {
      showToast('Something went wrong. Please try again.');
    } finally {
      btn.innerHTML = original;
      btn.disabled = false;
    }
  });
}

// Helper for Django CSRF (DRF ready)
function getCookie(name) {
  let value = `; ${document.cookie}`;
  let parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

handleFormSubmit(document.getElementById('donor-form'), 'Registration successful! Welcome to Redpulse ❤️');
handleFormSubmit(document.getElementById('request-form'), 'Blood request submitted! We\'ll contact you within minutes.');
handleFormSubmit(document.getElementById('contact-form'), 'Message sent! We\'ll get back to you soon.');

/* ============================================================
   SMOOTH ACTIVE LINK HIGHLIGHTING ON CLICK
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ============================================================
   TICKER DUPLICATE (ensure seamless loop)
   ============================================================ */
(function() {
  const ticker = document.getElementById('ticker-inner');
  if (ticker) {
    ticker.innerHTML += ticker.innerHTML;
  }
})();