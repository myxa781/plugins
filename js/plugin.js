/**
 * plugin.js — Plugin detail page
 */

'use strict';

import {
  fetchPlugins,
  getPluginById,
  $, $$,
  formatDate,
  formatDateShort,
  escapeHTML,
  copyToClipboard,
  showSnackbar,
  icons,
  categoryLabels,
  typeLabels,
  categoryIcons,
} from './utils.js';

import { Gallery } from './gallery.js';
import { initTheme, initScrollBehavior, initScrollTop, initNavDrawer, setActiveNav } from './theme.js';

/* ─── INIT ─── */
async function init() {
  initTheme();
  initScrollBehavior();
  initScrollTop();
  initNavDrawer();
  setActiveNav('plugin');

  // Get plugin id from URL
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  if (!id) {
    showNotFound('Идентификатор плагина не указан');
    hideLoading();
    return;
  }

  // Load plugins data
  const plugins = await fetchPlugins();
  const plugin = getPluginById(plugins, id);

  hideLoading();

  if (!plugin) {
    showNotFound(`Плагин «${escapeHTML(id)}» не найден`);
    return;
  }

  renderPlugin(plugin, plugins);
}

function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.add('hidden');
    setTimeout(() => loading.remove(), 400);
  }
}

/* ─── RENDER PLUGIN PAGE ─── */
function renderPlugin(plugin, allPlugins) {
  const container = document.getElementById('plugin-content');
  if (!container) return;

  // Update <title> and meta
  document.title = `${plugin.name} — Murglar Plugins`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = plugin.description;

  const hasHifi = plugin.type?.includes('hifi');
  const isBeta  = plugin.beta;

  // Build type badges
  const typeBadges = (plugin.type || []).map(t =>
    `<span class="badge badge-secondary">${typeLabels[t] || escapeHTML(t)}</span>`
  ).join('');

  container.innerHTML = `
    <!-- BREADCRUMB -->
    <nav class="breadcrumb" aria-label="Навигация">
      <span class="breadcrumb-item">
        <a href="index.html" class="breadcrumb-link">Каталог</a>
      </span>
      <span class="breadcrumb-sep" aria-hidden="true">›</span>
      <span class="breadcrumb-item">
        <a href="index.html?category=${encodeURIComponent(plugin.category)}" class="breadcrumb-link">
          ${categoryLabels[plugin.category] || escapeHTML(plugin.category)}
        </a>
      </span>
      <span class="breadcrumb-sep" aria-hidden="true">›</span>
      <span class="breadcrumb-item" aria-current="page">${escapeHTML(plugin.name)}</span>
    </nav>

    <!-- HERO CARD -->
    <div class="plugin-hero-card">
      <img
        class="plugin-hero-icon"
        src="${escapeHTML(plugin.icon || '')}"
        alt="${escapeHTML(plugin.name)}"
        width="96" height="96"
        onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2296%22 height=%2296%22><rect width=%2296%22 height=%2296%22 rx=%2220%22 fill=%22%237C4DFF%22/><text x=%2248%22 y=%2262%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2240%22 font-weight=%22bold%22 font-family=%22system-ui%22>${(plugin.name || '?')[0].toUpperCase()}</text></svg>'"
      >
      <div class="plugin-hero-info">
        <h1 class="plugin-hero-name">${escapeHTML(plugin.name)}</h1>
        <div class="plugin-hero-badges">
          <span class="badge badge-primary">v${escapeHTML(plugin.version)}</span>
          <span class="badge badge-secondary">SDK ${escapeHTML(String(plugin.sdk))}</span>
          ${typeBadges}
          ${hasHifi ? '<span class="badge badge-hifi">HiFi / Lossless</span>' : ''}
          ${isBeta  ? '<span class="badge badge-beta">Beta</span>' : ''}
          ${plugin.featured ? `<span class="badge badge-primary">${icons.star} Рекомендован</span>` : ''}
        </div>
        <p class="plugin-hero-desc">${escapeHTML(plugin.description)}</p>
        <div class="plugin-hero-actions" id="hero-actions"></div>
      </div>
    </div>

    <!-- MAIN CONTENT GRID -->
    <div id="plugin-sections"></div>
  `;

  // Render action buttons
  renderActions(plugin, document.getElementById('hero-actions'));

  // Render sections
  const sections = document.getElementById('plugin-sections');
  sections.appendChild(renderGallerySection(plugin));
  sections.appendChild(renderDescriptionSection(plugin));
  sections.appendChild(renderDownloadSection(plugin));
  sections.appendChild(renderCompatSection(plugin));
  sections.appendChild(renderChangelogSection(plugin));

  // Render related
  const related = getRelated(plugin, allPlugins);
  if (related.length > 0) {
    sections.appendChild(renderRelatedSection(related));
  }

  // Animate in
  container.classList.add('page-transition-enter');
}

/* ─── ACTION BUTTONS ─── */
function renderActions(plugin, container) {
  const btns = [];

  if (plugin.apk?.url) {
    btns.push(`
      <a href="${escapeHTML(plugin.apk.url)}" class="btn btn-filled" download>
        ${icons.android} Скачать APK
      </a>
    `);
  }

  if (plugin.jar?.url) {
    btns.push(`
      <a href="${escapeHTML(plugin.jar.url)}" class="btn btn-tonal" download>
        ${icons.download} Скачать JAR
      </a>
    `);
  }

  if (plugin.github) {
    btns.push(`
      <a href="${escapeHTML(plugin.github)}" class="btn btn-outlined" target="_blank" rel="noopener">
        ${icons.github} GitHub ${icons.external}
      </a>
    `);
  }

  if (plugin.telegram) {
    btns.push(`
      <a href="${escapeHTML(plugin.telegram)}" class="btn btn-outlined" target="_blank" rel="noopener">
        ${icons.telegram} Telegram
      </a>
    `);
  }

  container.innerHTML = btns.join('');
}

/* ─── GALLERY SECTION ─── */
function renderGallerySection(plugin) {
  const section = document.createElement('div');
  section.className = 'plugin-section';

  section.innerHTML = `
    <h2 class="plugin-section-title">
      <span class="plugin-section-title-icon">🖼️</span>
      Скриншоты
    </h2>
    <div id="gallery-container"></div>
  `;

  // Init gallery after appending to DOM
  requestAnimationFrame(() => {
    const container = document.getElementById('gallery-container');
    if (container) {
      const gallery = new Gallery(plugin.screenshots || []);
      gallery.render(container);
    }
  });

  return section;
}

/* ─── DESCRIPTION SECTION ─── */
function renderDescriptionSection(plugin) {
  const section = document.createElement('div');
  section.className = 'plugin-section';

  const fullDesc = plugin.description_full || plugin.description;
  const tags = (plugin.tags || []).map(t =>
    `<span class="tag">#${escapeHTML(t)}</span>`
  ).join('');

  section.innerHTML = `
    <h2 class="plugin-section-title">
      <span class="plugin-section-title-icon">📝</span>
      Описание
    </h2>
    <p class="body-large" style="color:var(--m3-on-surface-variant);line-height:1.8;margin-bottom:20px">
      ${escapeHTML(fullDesc)}
    </p>
    ${tags ? `
    <div>
      <p class="label-medium" style="color:var(--m3-on-surface-variant);margin-bottom:8px">Теги</p>
      <div class="tags-list">${tags}</div>
    </div>` : ''}
  `;

  return section;
}

/* ─── DOWNLOAD SECTION ─── */
function renderDownloadSection(plugin) {
  const section = document.createElement('div');
  section.className = 'plugin-section';

  const apkCard = plugin.apk ? buildDownloadCard({
    type: 'apk',
    title: 'Android APK',
    subtitle: 'Установка через Android',
    icon: '🤖',
    iconClass: 'apk',
    url: plugin.apk.url,
    size: plugin.apk.size,
    sha256: plugin.apk.sha256,
    date: plugin.date,
    downloadLabel: 'Скачать APK',
  }) : '';

  const jarCard = plugin.jar ? buildDownloadCard({
    type: 'jar',
    title: 'JAR Plugin',
    subtitle: 'Установка на ПК',
    icon: '☕',
    iconClass: 'jar',
    url: plugin.jar.url,
    size: plugin.jar.size,
    sha256: plugin.jar.sha256,
    date: plugin.date,
    downloadLabel: 'Скачать JAR',
  }) : '';

  section.innerHTML = `
    <h2 class="plugin-section-title">
      <span class="plugin-section-title-icon">📦</span>
      Загрузка
    </h2>
    <div class="download-grid">
      ${apkCard}
      ${jarCard}
    </div>
  `;

  // Bind copy buttons
  requestAnimationFrame(() => {
    section.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.copy;
        if (text) copyToClipboard(text);
      });
    });
  });

  return section;
}

function buildDownloadCard({ type, title, subtitle, icon, iconClass, url, size, sha256, date, downloadLabel }) {
  const shortSha = sha256 ? sha256.substring(0, 16) + '…' : '—';

  return `
    <div class="download-card">
      <div class="download-card-header">
        <div class="download-card-icon ${iconClass}">${icon}</div>
        <div>
          <div class="download-card-title">${title}</div>
          <div class="download-card-subtitle">${subtitle}</div>
        </div>
      </div>
      <div class="download-meta">
        <div class="download-meta-row">
          <span class="download-meta-key">Размер</span>
          <span class="download-meta-val">${escapeHTML(size || '—')}</span>
        </div>
        <div class="download-meta-row">
          <span class="download-meta-key">Дата</span>
          <span class="download-meta-val">${formatDate(date)}</span>
        </div>
        ${sha256 ? `
        <div class="download-meta-row">
          <span class="download-meta-key">SHA256</span>
          <span class="download-meta-val download-sha" title="${escapeHTML(sha256)}">
            <span class="copy-btn" data-copy="${escapeHTML(sha256)}" title="Скопировать SHA256">
              ${icons.copy} ${escapeHTML(shortSha)}
            </span>
          </span>
        </div>` : ''}
      </div>
      <a href="${escapeHTML(url)}" class="btn btn-filled" download style="width:100%;justify-content:center">
        ${icons.download} ${downloadLabel}
      </a>
    </div>
  `;
}

/* ─── COMPATIBILITY SECTION ─── */
function renderCompatSection(plugin) {
  const section = document.createElement('div');
  section.className = 'plugin-section';

  const compat = plugin.compatibility || {};

  section.innerHTML = `
    <h2 class="plugin-section-title">
      <span class="plugin-section-title-icon">⚙️</span>
      Совместимость
    </h2>
    <div class="compat-grid">
      <div class="compat-item">
        <div class="compat-icon">🎵</div>
        <div class="compat-info">
          <div class="compat-label">Murglar минимум</div>
          <div class="compat-value">${escapeHTML(compat.murglar_min || '—')}</div>
        </div>
      </div>
      <div class="compat-item">
        <div class="compat-icon">🤖</div>
        <div class="compat-info">
          <div class="compat-label">Android минимум</div>
          <div class="compat-value">${escapeHTML(compat.android_min || '—')} (API ${escapeHTML(String(compat.android_min_api || '—'))})</div>
        </div>
      </div>
      <div class="compat-item">
        <div class="compat-icon">📱</div>
        <div class="compat-info">
          <div class="compat-label">SDK плагина</div>
          <div class="compat-value">${escapeHTML(String(plugin.sdk || '—'))}</div>
        </div>
      </div>
      <div class="compat-item">
        <div class="compat-icon">${categoryIcons[plugin.category] || '🎵'}</div>
        <div class="compat-info">
          <div class="compat-label">Категория</div>
          <div class="compat-value">${categoryLabels[plugin.category] || escapeHTML(plugin.category)}</div>
        </div>
      </div>
    </div>
  `;

  return section;
}

/* ─── CHANGELOG SECTION ─── */
function renderChangelogSection(plugin) {
  const section = document.createElement('div');
  section.className = 'plugin-section';

  const changelog = plugin.changelog || [];

  const items = changelog.map((entry, i) => `
    <div class="changelog-item">
      <div class="changelog-dot">
        <div class="changelog-dot-inner"></div>
      </div>
      <div class="changelog-body">
        <div class="changelog-version">v${escapeHTML(entry.version)}</div>
        <div class="changelog-date">${formatDate(entry.date)}</div>
        <div class="changelog-changes">
          ${(entry.changes || []).map(c =>
            `<div class="changelog-change">${escapeHTML(c)}</div>`
          ).join('')}
        </div>
      </div>
    </div>
  `).join('');

  section.innerHTML = `
    <h2 class="plugin-section-title">
      <span class="plugin-section-title-icon">📋</span>
      История изменений
    </h2>
    <div class="changelog-list">
      ${items || '<p class="body-medium" style="color:var(--m3-on-surface-variant)">История изменений недоступна.</p>'}
    </div>
  `;

  return section;
}

/* ─── RELATED PLUGINS ─── */
function getRelated(plugin, allPlugins) {
  return allPlugins
    .filter(p => p.id !== plugin.id && p.category === plugin.category)
    .slice(0, 3);
}

function renderRelatedSection(related) {
  const section = document.createElement('div');
  section.className = 'plugin-section';

  const cards = related.map(p => `
    <a href="plugin.html?id=${encodeURIComponent(p.id)}" class="related-card" style="
      display:flex;align-items:center;gap:12px;padding:12px;
      background:var(--m3-surface-container-high);border-radius:var(--m3-shape-md);
      text-decoration:none;border:1px solid var(--m3-outline-variant);
      transition:border-color .15s ease;
    " onmouseover="this.style.borderColor='var(--m3-primary)'" onmouseout="this.style.borderColor='var(--m3-outline-variant)'">
      <img src="${escapeHTML(p.icon || '')}" alt="${escapeHTML(p.name)}" width="48" height="48"
        style="border-radius:12px;object-fit:cover;flex-shrink:0"
        onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22><rect width=%2248%22 height=%2248%22 rx=%2210%22 fill=%22%237C4DFF%22/><text x=%2224%22 y=%2232%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2220%22 font-weight=%22bold%22 font-family=%22system-ui%22>${(p.name || '?')[0].toUpperCase()}</text></svg>'"
      >
      <div style="min-width:0">
        <div style="font-size:.875rem;font-weight:600;color:var(--m3-on-surface);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHTML(p.name)}</div>
        <div style="font-size:.75rem;color:var(--m3-on-surface-variant)">v${escapeHTML(p.version)} · SDK ${escapeHTML(String(p.sdk))}</div>
      </div>
      <div style="margin-left:auto;color:var(--m3-primary);flex-shrink:0">${icons.arrow_right}</div>
    </a>
  `).join('');

  section.innerHTML = `
    <h2 class="plugin-section-title">
      <span class="plugin-section-title-icon">🔗</span>
      Похожие плагины
    </h2>
    <div style="display:flex;flex-direction:column;gap:8px">${cards}</div>
  `;

  return section;
}

/* ─── NOT FOUND ─── */
function showNotFound(message) {
  const container = document.getElementById('plugin-content');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align:center;padding:80px 24px">
      <div style="font-size:64px;margin-bottom:24px">🔌</div>
      <h1 class="headline-medium" style="margin-bottom:12px">Плагин не найден</h1>
      <p class="body-medium" style="color:var(--m3-on-surface-variant);max-width:360px;margin:0 auto 32px">${message}</p>
      <a href="index.html" class="btn btn-filled">
        ${icons.arrow_left_sm} Вернуться в каталог
      </a>
    </div>
  `;
}

/* ─── START ─── */
document.addEventListener('DOMContentLoaded', init);
