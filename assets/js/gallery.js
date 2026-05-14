/**
 * REDPULSE FOUNDATION — gallery.js
 * Fetches and renders gallery images from DRF backend
 */

'use strict';

let allImages = []; // store for lightbox
let currentLightboxIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
  loadGallery();
  
  // Wire up filter pills
  document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
    btn.onclick = null; // override inline
    btn.addEventListener('click', function() {
      document.querySelectorAll('.gallery-filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const cat = this.dataset.cat;
      
      document.querySelectorAll('.gallery-item').forEach(item => {
        const show = cat === 'all' || item.dataset.cat === cat;
        item.style.display = show ? '' : 'none';
      });
    });
  });

  // Wire up Lightbox events
  document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev')?.addEventListener('click', e => { 
    e.stopPropagation(); 
    if (allImages.length) openLightbox((currentLightboxIndex - 1 + allImages.length) % allImages.length); 
  });
  document.getElementById('lightbox-next')?.addEventListener('click', e => { 
    e.stopPropagation(); 
    if (allImages.length) openLightbox((currentLightboxIndex + 1) % allImages.length); 
  });
  document.getElementById('lightbox')?.addEventListener('click', function(e){ 
    if(e.target===this) closeLightbox(); 
  });
  
  document.addEventListener('keydown', e => {
    if (!document.getElementById('lightbox')?.classList.contains('open')) return;
    if (e.key === 'ArrowLeft' && allImages.length)  openLightbox((currentLightboxIndex - 1 + allImages.length) % allImages.length);
    if (e.key === 'ArrowRight' && allImages.length) openLightbox((currentLightboxIndex + 1) % allImages.length);
    if (e.key === 'Escape')     closeLightbox();
  });
});

async function loadGallery() {
  const grid = document.getElementById('gallery-masonry');
  if (!grid) return;

  grid.innerHTML = '<div style="text-align:center; width:100%; padding:40px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--crimson)"></i></div>';

  try {
    const data = await API.get('/gallery/');
    const results = data.results || data; 
    
    if (!results || results.length === 0) {
      grid.innerHTML = '<div style="text-align:center; width:100%; padding:40px; color:var(--muted);">No images found in the gallery.</div>';
    } else {
      // Extract unique categories for filter buttons
      updateCategoryFilters(results);
      
      allImages = results;
      grid.innerHTML = results.map((item, index) => renderGalleryItem(item, index)).join('');
      
      // Wire up clicks for the newly rendered items
      document.querySelectorAll('.gallery-item').forEach((item, i) => {
        item.addEventListener('click', () => openLightbox(i));
      });
    }
  } catch (err) {
    console.error('Failed to load gallery:', err);
    grid.innerHTML = '<div style="text-align:center; width:100%; padding:40px; color:var(--muted);">Failed to load gallery. Make sure the backend is running.</div>';
  }
}

function updateCategoryFilters(items) {
  const categories = new Set();
  items.forEach(item => {
    if (item.category_slug) categories.add(item.category_slug);
    else if (item.category) categories.add(item.category);
  });
  
  // We keep 'all' button, and try to match existing buttons to categories, or create them if we wanted to be fully dynamic.
  // The current HTML has predefined buttons. We will just use those and hide them if they have no items.
}

function renderGalleryItem(item, index) {
  const delay = (index % 5) * 100;
  const caption = item.caption || item.title || '';
  const safeCaption = caption.replace(/"/g, '&quot;');
  const cat = item.category_slug || item.category || 'other';
  const imgUrl = item.image; // Assume full URL from DRF

  return `
    <div class="gallery-item reveal delay-${delay}" data-cat="${cat}" data-caption="${safeCaption}">
      <div class="gallery-placeholder" style="height:250px; background-image: url('${imgUrl}'); background-size: cover; background-position: center;">
      </div>
      <div class="gallery-overlay">
        <div class="gallery-caption">${caption}</div>
        <div class="gallery-expand"><i class="fas fa-expand"></i></div>
      </div>
    </div>
  `;
}

function openLightbox(i) {
  currentLightboxIndex = i;
  const item = allImages[i];
  const cap = item.caption || item.title || '';
  const imgUrl = item.image;
  
  document.getElementById('lightbox-caption-inner').textContent = cap;
  document.getElementById('lightbox-caption').textContent = cap;
  
  // Create or update img element
  let imgEl = document.getElementById('lightbox-real-img');
  const placeholder = document.getElementById('lightbox-placeholder');
  
  if (!imgEl) {
    imgEl = document.createElement('img');
    imgEl.id = 'lightbox-real-img';
    imgEl.className = 'lightbox-img';
    placeholder.parentNode.insertBefore(imgEl, placeholder);
  }
  
  imgEl.src = imgUrl;
  imgEl.style.display = 'block';
  placeholder.style.display = 'none';

  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}
