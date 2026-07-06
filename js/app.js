/**
 * app.js — Murglar Plugins catalog main page
 */

'use strict';

import {
  fetchPlugins,
  $, $$,
  formatDateShort,
  highlight,
  escapeHTML,
  copyToClipboard,
  showSnackbar,
  icons,
  categoryLabels,
  typeLabels,
  categoryIcons,
  setParams,
  getParams,
  generateIconDataURL,
} from './utils.js';

import { PluginSearch } from './search.js';
import { initTheme, initScrollBehavior, initScrollTop, initNavDrawer, setActiveNav } from './theme.js';

/* ─── INIT ─── */
let allPlugins = [];
let searchEngine = null;
let currentQuery = '';

async function init() {
  initTheme();
  initScrollBehavior();
  initScrollTop();
  initNavDrawer();
  setActiveNav('index');

  // Load plugins
  allPlugins = await fetchPlugins();

  // Hide loading
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.add('hidden');
    setTimeout(() => loading.remove(), 400);
  }

  if (allPlugins.length === 0) {
    showError();
    return;
  }

  // Update stats
  updateStats();

  // Build filter chips from data
  buildFilters();

  // Init search engine
  searchEngine = new PluginSearch({
    plugins: allPlugins,
    onResults: renderResults,
  });

  // Bind UI
  bindSearchInput();
  bindSortSelect();

  // Restore state from URL params
  const params = getParams();
  if (params.q) {
    const searchInput = $('#search-input');
    if (searchInput) {
      searchInput.value = params.q;
      toggleClearBtn(params.q);
    }
    searchEngine.setQuery(params.q);
  } else {
    searchEngine.setQuery('');
  }

  if (params.sort) {
    searchEngine.setSort(params.sort);
    const sortSel = $('#sort-select');
    if (sortSel) sortSel.value = params.sort;
  }

  // Page transition
  document.querySelector('.catalog-section')?.classList.add('page-transition-enter');
}

/* ─── STATS ─── */
function updateStats() {
  const statPlugins = $('#stat-plugins');
  const statSdk = $('#stat-sdk');
  const statSources = $('#stat-sources');

  if (statPlugins) statPlugins.textContent = allPlugins.length;

  const maxSdk = Math.max(...allPlugins.map(p => parseFloat(p.sdk) || 0));
  if (statSdk) statSdk.textContent = maxSdk || '7.0';

  const categories = new Set(allPlugins.map(p => p.category));
  if (statSources) statSources.textContent = categories.size;
}

/* ─── FILTERS ─── */
function buildFilters() {
  const catRow = $('#chips-category');
  const typeRow = $('#chips-type');
  const sdkRow = $('#chips-sdk');

  if (catRow) {
    // Collect categories present in data
    const cats = ['all', ...new Set(allPlugins.map(p => p.category))];
    catRow.innerHTML = '';
    cats.forEach(cat => {
      const chip = document.createElement('button');
      chip.className = 'chip chip-filter' + (cat === 'all' ? ' active' : '');
      chip.dataset.category = cat;
      chip.setAttribute('role', 'radio');
      chip.setAttribute('aria-checked', cat === 'all' ? 'true' : 'false');
      chip.textContent = cat === 'all'
        ? 'Все'
        : `${categoryIcons[cat] || ''} ${categoryLabels[cat] || cat}`;
      chip.addEventListener('click', () => selectCategory(cat));
      catRow.appendChild(chip);
    });
  }

  if (typeRow) {
    const types = ['all', 'stream', 'download'];
    typeRow.innerHTML = '';
    types.forEach(type => {
      const chip = document.createElement('button');
      chip.className = 'chip chip-filter' + (type === 'all' ? ' active' : '');
      chip.dataset.type = type;
      chip.setAttribute('role', 'radio');
      chip.setAttribute('aria-checked', type === 'all' ? 'true' : 'false');
      chip.textContent = type === 'all' ? 'Все типы' : typeLabels[type] || type;
      chip.addEventListener('click', () => selectType(type));
      typeRow.appendChild(chip);
    });
  }

  if (sdkRow) {
    const sdks = ['all', ...new Set(allPlugins.map(p => String(p.sdk)))].sort((a,b)=>{
      if(a==='all') return -1;
      if(b==='all') return 1;
      return parseFloat(b)-parseFloat(a);
    });

    sdkRow.innerHTML='';

    sdks.forEach(sdk=>{
      const chip=document.createElement('button');
      chip.className='chip chip-filter'+(sdk==='all'?' active':'');
      chip.dataset.sdk=sdk;
      chip.setAttribute('role','radio');
      chip.setAttribute('aria-checked', sdk==='all'?'true':'false');
      chip.textContent=sdk==='all'?'Все SDK':'SDK '+sdk;
      chip.addEventListener('click',()=>selectSdk(sdk));
      sdkRow.appendChild(chip);
    });
  }
}

function selectCategory(cat) {
  $$('#chips-category .chip').forEach(c => {
    const active = c.dataset.category === cat;
    c.classList.toggle('active', active);
    c.setAttribute('aria-checked', active ? 'true' : 'false');
  });
  searchEngine?.setFilter('category', cat);
}

function selectType(type) {
  $$('#chips-type .chip').forEach(c => {
    const active = c.dataset.type === type;
    c.classList.toggle('active', active);
    c.setAttribute('aria-checked', active ? 'true' : 'false');
  });
  searchEngine?.setFilter('type', type);
}

function selectSdk(sdk) {
  $$('#chips-sdk .chip').forEach(c=>{
    const active=c.dataset.sdk===sdk;
    c.classList.toggle('active',active);
    c.setAttribute('aria-checked', active?'true':'false');
  });
  searchEngine?.setFilter('sdk', sdk);
}

/* ─── SEARCH INPUT ─── */
function bindSearchInput() {
  const input = $('#search-input');
  const clearBtn = $('#search-clear');

  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value;
    currentQuery = q;
    toggleClearBtn(q);
    searchEngine?.setQuery(q);
    setParams({ q: q || null }, true);
  });

  clearBtn?.addEventListener('click', () => {
    input.value = '';
    currentQuery = '';
    toggleClearBtn('');
    searchEngine?.setQuery('');
    setParams({ q: null }, true);
    input.focus();
  });

  // Enter key — do nothing (live search)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      currentQuery = '';
      toggleClearBtn('');
      searchEngine?.setQuery('');
    }
  });
}

function toggleClearBtn(value) {
  const clearBtn = $('#search-clear');
  clearBtn?.classList.toggle('visible', !!value);
}

function bindSortSelect() {
  const sel = $('#sort-select');
  if (!sel) return;

  sel.addEventListener('change', () => {
    searchEngine?.setSort(sel.value);
    setParams({ sort: sel.value }, true);
  });
}

/* ─── RENDER RESULTS ─── */
function renderResults(plugins, query) {
  const grid = $('#plugins-grid');
  const countEl = $('#results-count');
  const sectionCount = $('#section-count');

  if (!grid) return;

  // Update count
  const text = plugins.length === 0
    ? 'Ничего не найдено'
    : query
      ? `Найдено: ${plugins.length}`
      : '';

  if (countEl) countEl.textContent = text;
  if (sectionCount) sectionCount.textContent = `${plugins.length} плагин${pluralize(plugins.length, '', 'а', 'ов')}`;

  if (plugins.length === 0) {
    grid.innerHTML = renderEmpty(query);
    return;
  }

  grid.innerHTML = '';
  const fragment = document.createDocumentFragment();

  plugins.forEach(plugin => {
    const card = createPluginCard(plugin, query);
    fragment.appendChild(card);
  });

  grid.appendChild(fragment);
}

function pluralize(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

function renderEmpty(query) {
  return `
    <div class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3 class="empty-title headline-small">Ничего не найдено</h3>
      <p class="empty-desc body-medium">
        ${query
          ? `По запросу «${escapeHTML(query)}» плагины не найдены. Попробуйте другой запрос или сбросьте фильтры.`
          : 'Нет плагинов, соответствующих выбранным фильтрам.'}
      </p>
    </div>
  `;
}

/* ─── PLUGIN CARD ─── */
function createPluginCard(plugin, query = '') {
  const card = document.createElement('article');
  card.className = 'plugin-card' + (plugin.featured ? ' featured' : '');
  card.setAttribute('role', 'article');
  card.setAttribute('aria-label', `Плагин ${plugin.name}`);

  const hasApk = plugin.apk?.url;
  const hasJar = plugin.jar?.url;
  const hasHifi = plugin.type?.includes('hifi');
  const isBeta = plugin.beta;

  // Highlighted name and description
  const hlName = query ? highlight(plugin.name, query) : escapeHTML(plugin.name);
  const hlDesc = query ? highlight(plugin.description, query) : escapeHTML(plugin.description);

  card.innerHTML = `
    <div class="plugin-card-header">
      <div class="plugin-icon-wrap">
        <img
          class="plugin-icon"
          src="${escapeHTML(plugin.icon || '')}"
          alt="${escapeHTML(plugin.name)} иконка"
          width="64" height="64"
          loading="lazy"
          onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22><rect width=%2264%22 height=%2264%22 rx=%2214%22 fill=%22%237C4DFF%22/><text x=%2232%22 y=%2240%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2226%22 font-weight=%22bold%22 font-family=%22system-ui%22>${(plugin.name || '?')[0].toUpperCase()}</text></svg>'"
        >
        ${plugin.featured ? `<div class="plugin-featured-badge" title="Рекомендован">${icons.star}</div>` : ''}
      </div>
      <div class="plugin-card-info">
        <div class="plugin-card-name" title="${escapeHTML(plugin.name)}">${hlName}</div>
        <div class="plugin-card-badges">
          <span class="badge badge-primary">v${escapeHTML(plugin.version)}</span>
          <span class="badge badge-secondary">SDK ${escapeHTML(String(plugin.sdk))}</span>
          ${hasHifi ? '<span class="badge badge-hifi">HiFi</span>' : ''}
          ${isBeta ? '<span class="badge badge-beta">Beta</span>' : ''}
        </div>
      </div>
    </div>

    <div class="plugin-card-meta">
      <div class="meta-item">
        <span class="meta-icon">${icons.calendar}</span>
        <span>${formatDateShort(plugin.date)}</span>
      </div>
      ${plugin.apk?.size ? `
      <div class="meta-item">
        <span class="meta-icon">${icons.package}</span>
        <span>${escapeHTML(plugin.apk.size)}</span>
      </div>` : ''}
      <div class="meta-item">
        <span>${categoryIcons[plugin.category] || '🎵'} ${categoryLabels[plugin.category] || escapeHTML(plugin.category)}</span>
      </div>
    </div>

    <p class="plugin-card-desc">${hlDesc}</p>

    <div class="plugin-card-actions">
      ${hasApk ? `
        <a href="${escapeHTML(plugin.apk.url)}" class="btn btn-filled btn-sm" download title="Скачать APK">
          ${icons.download} APK
        </a>` : ''}
      ${hasJar ? `
        <a href="${escapeHTML(plugin.jar.url)}" class="btn btn-tonal btn-sm" download title="Скачать JAR">
          ${icons.download} JAR
        </a>` : ''}
      ${plugin.github ? `
        <a href="${escapeHTML(plugin.github)}" class="btn btn-outlined btn-sm" target="_blank" rel="noopener" title="GitHub">
          ${icons.github}
        </a>` : ''}
      <a href="plugin.html?id=${encodeURIComponent(plugin.id)}" class="btn btn-text btn-sm btn-more">
        Подробнее ${icons.arrow_right}
      </a>
    </div>
  `;

  // Click on card body opens plugin page
  card.addEventListener('click', (e) => {
    if (e.target.closest('a') || e.target.closest('button')) return;
    window.location.href = `plugin.html?id=${encodeURIComponent(plugin.id)}`;
  });

  return card;
}

/* ─── ERROR STATE ─── */
function showError() {
  const grid = $('#plugins-grid');
  if (grid) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3 class="empty-title headline-small">Ошибка загрузки</h3>
        <p class="empty-desc body-medium">Не удалось загрузить список плагинов. Проверьте подключение к интернету.</p>
        <button class="btn btn-filled" onclick="location.reload()" style="margin-top:24px">Повторить</button>
      </div>
    `;
  }
}

/* ─── START ─── */
document.addEventListener('DOMContentLoaded', init);
