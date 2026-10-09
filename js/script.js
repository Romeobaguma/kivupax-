/* ============================================================
   PAIX & MÉDIAS — Script principal
   Charge le contenu depuis les fichiers JSON du dossier /contenu
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initMenu();
  initCounters();
  loadHomeArticles();
  loadHomeVideos();
  loadArticlesPage();
  loadVideosPage();
  loadPhotosPage();
  loadDocumentsPage();
  initLightbox();
});

/* ---------- MENU MOBILE ---------- */
function initMenu() {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }
}

/* ---------- COMPTEURS ANIMÉS ---------- */
function initCounters() {
  const counters = [
    { id: 'statArticles', key: 'articles' },
    { id: 'statVideos', key: 'videos' },
    { id: 'statPhotos', key: 'photos' },
    { id: 'statDocuments', key: 'documents' }
  ];
  if (!document.getElementById('statArticles')) return;

  counters.forEach(c => {
    const el = document.getElementById(c.id);
    if (!el) return;
    fetch(`contenu/${c.key}/index.json`)
      .then(r => r.ok ? r.json() : [])
      .then(data => animateNumber(el, Array.isArray(data) ? data.length : 0))
      .catch(() => animateNumber(el, 0));
  });
}

function animateNumber(el, target) {
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 30));
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = current;
  }, 40);
}

/* ---------- UTILITAIRES ---------- */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function truncate(text, len = 130) {
  if (!text) return '';
  const clean = text.replace(/[#*_>`]/g, '').trim();
  return clean.length > len ? clean.slice(0, len) + '…' : clean;
}

function fetchJSON(path) {
  return fetch(path).then(r => r.ok ? r.json() : []).catch(() => []);
}

/* ---------- CARTE ARTICLE ---------- */
function articleCard(a) {
  return `
    <article class="card">
      <div class="card-media">
        ${a.image ? `<img src="${a.image}" alt="${a.title}" loading="lazy">` : ''}
        ${a.category ? `<span class="card-category">${a.category}</span>` : ''}
      </div>
      <div class="card-body">
        <p class="card-date">${formatDate(a.date)}</p>
        <h3>${a.title}</h3>
        <p>${truncate(a.body)}</p>
        <a href="${a.url || '#'}" class="card-link">Lire l'article →</a>
      </div>
    </article>
  `;
}

/* ---------- CARTE VIDÉO ---------- */
function videoCard(v) {
  return `
    <article class="card">
      <div class="card-media">
        ${v.thumbnail ? `<img src="${v.thumbnail}" alt="${v.title}" loading="lazy">` : ''}
        <div class="video-play"></div>
      </div>
      <div class="card-body">
        <p class="card-date">${formatDate(v.date)}</p>
        <h3>${v.title}</h3>
        <p>${truncate(v.description)}</p>
        <a href="${v.url || '#'}" class="card-link" target="_blank" rel="noopener">Regarder →</a>
      </div>
    </article>
  `;
}

/* ---------- ACCUEIL : ARTICLES ---------- */
function loadHomeArticles() {
  const el = document.getElementById('homeArticles');
  if (!el) return;
  fetchJSON('contenu/articles/index.json').then(data => {
    if (!data.length) {
      el.innerHTML = '<p class="empty-msg">Aucun article publié pour le moment.</p>';
      return;
    }
    el.innerHTML = data.slice(0, 3).map(articleCard).join('');
  });
}

/* ---------- ACCUEIL : VIDÉOS ---------- */
function loadHomeVideos() {
  const el = document.getElementById('homeVideos');
  if (!el) return;
  fetchJSON('contenu/videos/index.json').then(data => {
    if (!data.length) {
      el.innerHTML = '<p class="empty-msg">Aucune vidéo publiée pour le moment.</p>';
      return;
    }
    el.innerHTML = data.slice(0, 3).map(videoCard).join('');
  });
}

/* ---------- PAGE ARTICLES ---------- */
function loadArticlesPage() {
  const el = document.getElementById('liste-articles');
  if (!el) return;

  fetchJSON('contenu/articles/index.json').then(data => {
    if (!data.length) {
      el.innerHTML = '<p class="empty-msg">Aucun article publié pour le moment.</p>';
      return;
    }
    el.innerHTML = data.map(articleCard).join('');

    // Filtres
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;
        const filtered = f === 'all' ? data : data.filter(a =>
          (a.category || '').toLowerCase().includes(f)
        );
        el.innerHTML = filtered.length
          ? filtered.map(articleCard).join('')
          : '<p class="empty-msg">Aucun article dans cette catégorie.</p>';
      });
    });
  });
}

/* ---------- PAGE VIDÉOS ---------- */
function loadVideosPage() {
  const el = document.getElementById('liste-videos');
  if (!el) return;
  fetchJSON('contenu/videos/index.json').then(data => {
    el.innerHTML = data.length
      ? data.map(videoCard).join('')
      : '<p class="empty-msg">Aucune vidéo publiée pour le moment.</p>';
  });
}

/* ---------- PAGE PHOTOS ---------- */
function loadPhotosPage() {
  const el = document.getElementById('liste-photos');
  if (!el) return;
  fetchJSON('contenu/photos/index.json').then(data => {
    if (!data.length) {
      el.innerHTML = '<p class="empty-msg">Aucune photo publiée pour le moment.</p>';
      return;
    }
    el.innerHTML = data.map((p, i) => `
      <div class="photo-item" data-index="${i}">
        <img src="${p.image}" alt="${p.title || ''}" loading="lazy">
        <div class="photo-overlay">
          <p>${p.title || ''}</p>
        </div>
      </div>
    `).join('');
    el._photos = data;
  });
}

/* ---------- LIGHTBOX ---------- */
function initLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  const img = document.getElementById('lightboxImg');
  const cap = document.getElementById('lightboxCaption');
  const close = document.getElementById('lightboxClose');

  document.addEventListener('click', e => {
    const item = e.target.closest('.photo-item');
    if (item) {
      const grid = document.getElementById('liste-photos');
      const data = grid && grid._photos;
      if (!data) return;
      const photo = data[item.dataset.index];
      img.src = photo.image;
      cap.textContent = photo.title || '';
      lb.classList.add('open');
    }
  });

  close.addEventListener('click', () => lb.classList.remove('open'));
  lb.addEventListener('click', e => { if (e.target === lb) lb.classList.remove('open'); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') lb.classList.remove('open');
  });
}

/* ---------- PAGE DOCUMENTS ---------- */
function loadDocumentsPage() {
  const el = document.getElementById('liste-documents');
  if (!el) return;
  fetchJSON('contenu/documents/index.json').then(data => {
    if (!data.length) {
      el.innerHTML = '<p class="empty-msg">Aucun document disponible pour le moment.</p>';
      return;
    }
    el.innerHTML = data.map(d => `
      <div class="doc-item">
        <div class="doc-icon">📄</div>
        <div class="doc-info">
          <h3>${d.title}</h3>
          <p>${d.description || ''} ${d.size ? '— ' + d.size : ''}</p>
        </div>
        <a href="${d.file}" class="doc-download" download>Télécharger</a>
      </div>
    `).join('');
  });
}