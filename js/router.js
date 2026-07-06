/**
 * router.js — Lightweight SPA-style navigation helper
 * (Used for param-based routing within GitHub Pages)
 */

'use strict';

export class Router {
  constructor() {
    this._routes = new Map();
    this._notFound = null;
    this._current = null;

    window.addEventListener('popstate', () => this._handle());
  }

  on(pattern, handler) {
    this._routes.set(pattern, handler);
    return this;
  }

  notFound(handler) {
    this._notFound = handler;
    return this;
  }

  navigate(path, replace = false) {
    if (replace) {
      history.replaceState(null, '', path);
    } else {
      history.pushState(null, '', path);
    }
    this._handle();
  }

  start() {
    this._handle();
  }

  _handle() {
    const path = location.pathname.replace(/\/$/, '') || '/';
    const search = location.search;

    for (const [pattern, handler] of this._routes) {
      const match = this._match(pattern, path);
      if (match) {
        this._current = { pattern, path, params: match, search };
        handler({ params: match, search: new URLSearchParams(search) });
        return;
      }
    }

    if (this._notFound) {
      this._notFound({ path, search: new URLSearchParams(search) });
    }
  }

  _match(pattern, path) {
    if (pattern === path) return {};
    if (pattern === '*') return {};

    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  }

  get currentRoute() {
    return this._current;
  }
}

/* ─── URL UTILITIES ─── */
export function getQueryParam(name) {
  return new URLSearchParams(location.search).get(name);
}

export function setQueryParam(name, value, replace = false) {
  const url = new URL(location.href);
  if (value === null || value === undefined || value === '') {
    url.searchParams.delete(name);
  } else {
    url.searchParams.set(name, value);
  }
  if (replace) {
    history.replaceState(null, '', url);
  } else {
    history.pushState(null, '', url);
  }
}

export function buildPluginUrl(pluginId) {
  return `plugin.html?id=${encodeURIComponent(pluginId)}`;
}

export function buildCatalogUrl(params = {}) {
  const url = new URL('index.html', location.href);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  return url.pathname + url.search;
}
