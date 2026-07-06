/**
 * search.js — Live search and filtering logic
 */

'use strict';

import { debounce, announce } from './utils.js';

export class PluginSearch {
  constructor({ plugins, onResults }) {
    this.allPlugins = plugins;
    this.onResults = onResults;
    this.query = '';
    this.filters = {
      category: 'all',
      type: 'all',
      sdk: 'all',
    };
    this.sort = 'date';

    this._debouncedSearch = debounce(() => this._doSearch(), 200);
  }

  setQuery(query) {
    this.query = query.toLowerCase().trim();
    this._debouncedSearch();
  }

  setFilter(key, value) {
    this.filters[key] = value;
    this._doSearch();
  }

  setSort(sort) {
    this.sort = sort;
    this._doSearch();
  }

  _doSearch() {
    let results = [...this.allPlugins];

    // Text search
    if (this.query) {
      results = results.filter(p => {
        const searchIn = [
          p.name,
          p.description,
          p.description_full || '',
          p.author || '',
          ...(p.tags || []),
          p.category,
        ].join(' ').toLowerCase();
        return searchIn.includes(this.query);
      });
    }

    // Category filter
    if (this.filters.category !== 'all') {
      results = results.filter(p => p.category === this.filters.category);
    }

    // Type filter
    if (this.filters.type !== 'all') {
      results = results.filter(p => (p.type || []).includes(this.filters.type));
    }

    // SDK filter
    if (this.filters.sdk !== 'all') {
      results = results.filter(p => String(p.sdk) === this.filters.sdk);
    }

    // Sort
    results = this._sort(results);

    this.onResults(results, this.query);

    // Announce to screen readers
    const msg = results.length === 0
      ? 'Плагины не найдены'
      : `Найдено плагинов: ${results.length}`;
    announce(msg);
  }

  _sort(plugins) {
    return [...plugins].sort((a, b) => {
      switch (this.sort) {
        case 'name':
          return a.name.localeCompare(b.name, 'ru');
        case 'name_desc':
          return b.name.localeCompare(a.name, 'ru');
        case 'version':
          return this._compareVersions(b.version, a.version);
        case 'sdk':
          return parseFloat(b.sdk) - parseFloat(a.sdk);
        case 'date':
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });
  }

  _compareVersions(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const diff = (pa[i] || 0) - (pb[i] || 0);
      if (diff !== 0) return diff;
    }
    return 0;
  }

  reset() {
    this.query = '';
    this.filters = { category: 'all', type: 'all', sdk: 'all' };
    this.sort = 'date';
    this._doSearch();
  }
}
