/**
 * gallery.js — Lightbox gallery with keyboard and swipe support
 */

'use strict';

export class Gallery {
  constructor(images) {
    this.images = images;
    this.current = 0;
    this.lightbox = null;
    this.img = null;
    this.counter = null;
    this._touchStartX = 0;
    this._touchStartY = 0;
    this._bound = {};
  }

  render(container) {
    container.innerHTML = '';
    if (!this.images || this.images.length === 0) {
      container.innerHTML = '<p style="color:var(--m3-on-surface-variant);font-size:.875rem">Скриншоты недоступны</p>';
      return;
    }

    const strip = document.createElement('div');
    strip.className = 'gallery-strip';
    strip.setAttribute('role', 'list');

    this.images.forEach((src, idx) => {
      const thumb = document.createElement('img');
      thumb.className = 'gallery-thumb';
      thumb.src = src;
      thumb.alt = `Скриншот ${idx + 1}`;
      thumb.loading = 'lazy';
      thumb.setAttribute('role', 'listitem');
      thumb.setAttribute('tabindex', '0');
      thumb.setAttribute('aria-label', `Открыть скриншот ${idx + 1} из ${this.images.length}`);

      thumb.addEventListener('click', () => this.open(idx));
      thumb.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.open(idx);
        }
      });

      // Fallback on error
      thumb.addEventListener('error', () => {
        thumb.style.background = 'var(--m3-surface-container-highest)';
        thumb.style.opacity = '.4';
      });

      strip.appendChild(thumb);
    });

    container.appendChild(strip);
    this._ensureLightbox();
  }

  _ensureLightbox() {
    if (document.getElementById('lightbox')) {
      this.lightbox = document.getElementById('lightbox');
      this.img = document.getElementById('lightbox-img');
      this.counter = document.getElementById('lightbox-counter');
      return;
    }

    const lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Просмотр скриншота');
    lb.innerHTML = `
      <div class="lightbox-content">
        <img id="lightbox-img" class="lightbox-img" src="" alt="Скриншот">
        <button class="lightbox-nav lightbox-nav-prev" id="lb-prev" aria-label="Предыдущий">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button class="lightbox-nav lightbox-nav-next" id="lb-next" aria-label="Следующий">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <div class="lightbox-counter" id="lightbox-counter"></div>
      </div>
      <button class="lightbox-close" id="lb-close" aria-label="Закрыть">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;
    document.body.appendChild(lb);

    this.lightbox = lb;
    this.img = document.getElementById('lightbox-img');
    this.counter = document.getElementById('lightbox-counter');

    // Events
    document.getElementById('lb-close').addEventListener('click', () => this.close());
    document.getElementById('lb-prev').addEventListener('click', (e) => { e.stopPropagation(); this.prev(); });
    document.getElementById('lb-next').addEventListener('click', (e) => { e.stopPropagation(); this.next(); });

    // Click outside
    lb.addEventListener('click', (e) => {
      if (e.target === lb) this.close();
    });

    // Keyboard
    this._bound.keydown = (e) => {
      if (!this.lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    };
    document.addEventListener('keydown', this._bound.keydown);

    // Touch/swipe
    lb.addEventListener('touchstart', (e) => {
      this._touchStartX = e.touches[0].clientX;
      this._touchStartY = e.touches[0].clientY;
    }, { passive: true });

    lb.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - this._touchStartX;
      const dy = e.changedTouches[0].clientY - this._touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        dx < 0 ? this.next() : this.prev();
      }
    }, { passive: true });
  }

  open(index) {
    this.current = index;
    this._update();
    this.lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    this.img.focus();
  }

  close() {
    this.lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  prev() {
    this.current = (this.current - 1 + this.images.length) % this.images.length;
    this._update();
  }

  next() {
    this.current = (this.current + 1) % this.images.length;
    this._update();
  }

  _update() {
    if (!this.img || !this.images.length) return;
    const src = this.images[this.current];
    this.img.style.opacity = '0';
    setTimeout(() => {
      this.img.src = src;
      this.img.alt = `Скриншот ${this.current + 1} из ${this.images.length}`;
      this.img.style.opacity = '1';
      this.img.style.transition = 'opacity .2s ease';
    }, 100);

    if (this.counter) {
      this.counter.textContent = `${this.current + 1} / ${this.images.length}`;
    }

    // Hide nav if only one image
    const prevBtn = document.getElementById('lb-prev');
    const nextBtn = document.getElementById('lb-next');
    const single = this.images.length <= 1;
    if (prevBtn) prevBtn.hidden = single;
    if (nextBtn) nextBtn.hidden = single;
  }

  destroy() {
    if (this._bound.keydown) {
      document.removeEventListener('keydown', this._bound.keydown);
    }
    const lb = document.getElementById('lightbox');
    if (lb) lb.remove();
  }
}
