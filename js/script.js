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

function initMenu() {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');
  if (toggle && nav) toggle.addEventListener('click', () => nav.classList.toggle('open'));
}

function initCounters() {
  const map = {
    statArticles: 'contenu/articles.json',
    statVideos: 'contenu/videos.json',
    statPhotos: 'contenu/photos.json',
    statDocuments: 'contenu/documents.json'
  };
  Object.entries(map).forEach(([id, path]) => {
    const el = document.getElementById(id);
    if (!el) return;
    fetch(path).then(r => r.ok ? r.json() : {}).then(data => {
      const key = Object.keys(data)[0];
      const arr = data[key] || [];
      animateNumber(el, arr.length);
    }).catch(() => animateNumber(el, 0));
  });
}

function animateNumber(el, target) {
  let n = 0;
  const step = Math.max(1, Math.ceil(target / 30));
  const t = setInterval(() => {
    n += step;
    if (n >= target) { n = target; clearInterval(t); }
    el.textContent = n;
  }, 40);
}

function formatDate(s) {
  if (!s) return '';
  return new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function truncate(t, len = 130) {
  if (!t) return '';
  const c = t.replace(/[#*_>`]/g, '').trim();
  return c.length > len ? c.slice(0, len) + '…' : c;
}

function fetchJSON(path) {
  return fetch(path).then(r => r.ok ? r.json() : {}).catch(() => ({}));
}

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

function loadHomeArticles() {
  const el = document.getElementById('homeArticles');
  if (!el) return;
  fetchJSON('contenu/articles.json').then(d => {
    const arr = d.articles || [];
    el.innerHTML = arr.length ? arr.slice(0, 3).map(articleCard).join('') : '<p class="empty-msg">Aucun article publié pour le moment.</p>';
  });
}

function loadHomeVideos() {
  const el = document.getElementById('homeVideos');
  if (!el) return;
  fetchJSON('contenu/videos.json').then(d => {
    const arr = d.videos || [];
    el.innerHTML = arr.length ? arr.slice(0, 3).map(videoCard).join('') : '<p class="empty-msg">Aucune vidéo publiée pour le moment.</p>';
  });
}

function loadArticlesPage() {
  const el = document.getElementById('liste-articles');
  if (!el) return;
  fetchJSON('contenu/articles.json').then(d => {
    const arr = d.articles || [];
    if (!arr.length) { el.innerHTML = '<p class="empty-msg">Aucun article publié pour le moment.</p>'; return; }
    el.innerHTML = arr.map(articleCard).join('');
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;
        const filtered = f === 'all' ? arr : arr.filter(a => (a.category || '').toLowerCase().includes(f));
        el.innerHTML = filtered.length ? filtered.map(articleCard).join('') : '<p class="empty-msg">Aucun article dans cette catégorie.</p>';
      });
    });
  });
}

function loadVideosPage() {
  const el = document.getElementById('liste-videos');
  if (!el) return;
  fetchJSON('contenu/videos.json').then(d => {
    const arr = d.videos || [];
    el.innerHTML = arr.length ? arr.map(videoCard).join('') : '<p class="empty-msg">Aucune vidéo publiée pour le moment.</p>';
  });
}

function loadPhotosPage() {
  const el = document.getElementById('liste-photos');
  if (!el) return;
  fetchJSON('contenu/photos.json').then(d => {
    const arr = d.photos || [];
    if (!arr.length) { el.innerHTML = '<p class="empty-msg">Aucune photo publiée pour le moment.</p>'; return; }
    el.innerHTML = arr.map((p, i) => `
      <div class="photo-item" data-index="${i}">
        <img src="${p.image}" alt="${p.title || ''}" loading="lazy">
        <div class="photo-overlay"><p>${p.title || ''}</p></div>
      </div>
    `).join('');
    el._photos = arr;
  });
}

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
  document.addEventListener('keydown', e => { if (e.key === 'Escape') lb.classList.remove('open'); });
}

function loadDocumentsPage() {
  const el = document.getElementById('liste-documents');
  if (!el) return;
  fetchJSON('contenu/documents.json').then(d => {
    const arr = d.documents || [];
    if (!arr.length) { el.innerHTML = '<p class="empty-msg">Aucun document disponible pour le moment.</p>'; return; }
    el.innerHTML = arr.map(doc => `
      <div class="doc-item">
        <div class="doc-icon">📄</div>
        <div class="doc-info">
          <h3>${doc.title}</h3>
          <p>${doc.description || ''} ${doc.size ? '— ' + doc.size : ''}</p>
        </div>
        <a href="${doc.file}" class="doc-download" download>Télécharger</a>
      </div>
    `).join('');
  });
}
