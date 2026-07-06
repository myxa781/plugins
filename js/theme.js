/**
 * theme.js — Theme management (dark only, with system detection)
 */

'use strict';

import { storage } from './utils.js';

const STORAGE_KEY = 'murglar-theme';

export function initTheme() {
  // Dark theme only — Murglar brand is dark-first
  // But we respect user preference and store it
  document.documentElement.setAttribute('data-theme', 'dark');
}

export function initScrollBehavior() {
  const nav = document.querySelector('.nav');
  const scrollTopBtn = document.getElementById('scroll-top');

  if (!nav && !scrollTopBtn) return;

  const onScroll = () => {
    const scrolled = window.scrollY > 40;
    nav?.classList.toggle('scrolled', scrolled);

    if (scrollTopBtn) {
      scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // init state
}

export function initScrollTop() {
  const btn = document.getElementById('scroll-top');
  if (!btn) return;

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

export function initNavDrawer() {
  const menuBtn = document.getElementById('nav-menu-btn');
  const drawer = document.getElementById('nav-drawer');
  const overlay = document.getElementById('nav-drawer-overlay');

  if (!menuBtn || !drawer || !overlay) return;

  const open = () => {
    drawer.classList.add('open');
    overlay.classList.add('open');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  menuBtn.addEventListener('click', () => {
    drawer.classList.contains('open') ? close() : open();
  });

  overlay.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) close();
  });

  // Close on nav link click
  drawer.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', close);
  });
}

export function setActiveNav(pageName) {
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    const isActive =
      (pageName === 'index' && (href === 'index.html' || href === '.' || href === './')) ||
      (pageName === 'about' && href.includes('about')) ||
      href.includes(pageName);
    link.classList.toggle('active', isActive);
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}
