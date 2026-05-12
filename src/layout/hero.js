import { dom } from '../core/dom.js';
import { formatMoney } from '../services/invoiceService.js';

export function renderHero(container, state, { mode = 'home' } = {}) {
  const flash = state.runtime.flashState;
  const offer = flash?.offer;
  const isActive = mode === 'home' && flash?.status === 'active' && offer?.runtime_status === 'active';
  if (!isActive) {
    container.innerHTML = '';
    return;
  }

  const heroImage = offer.image || '';
  const fallback = String(offer.title || 'عرض مباشر').trim().slice(0, 1) || '•';

  container.innerHTML = `
    <section class="hero-shell hero-shell--flash">
      <div class="hero-shell__countdown">
        <span class="hero-kicker">تجارة وتوزيع B2B</span>
        <div class="hero-countdown-panel hero-countdown-panel--dominant">
          <span class="hero-countdown-panel__label">عرض الساعة</span>
          <div class="hero-countdown-panel__value">${dom.escape(flash.countdown || '--:--:--')}</div>
          <div class="hero-countdown-panel__meta">متبقي على انتهاء العرض</div>
        </div>
      </div>
      <div class="hero-shell__details">
        <div class="hero-shell__thumb">
          ${heroImage ? `<img src="${dom.escape(heroImage)}" alt="${dom.escape(offer.title)}" loading="eager" />` : `<div class="hero-shell__thumb-fallback">${dom.escape(fallback)}</div>`}
        </div>
        <div class="hero-shell__text">
          <h1>${dom.escape(offer.title)}</h1>
          <p>${dom.escape(offer.description || 'عرض مباشر مخصص للتجارة السريعة')}</p>
          <div class="hero-metrics">
            <span class="badge">${formatMoney(offer.price)} ج.م</span>
            <span class="badge">active</span>
          </div>
          <div class="hero-actions hero-actions--compact">
            <button class="btn btn--primary" type="button" data-action="go-flash">فتح العرض</button>
            <button class="btn btn--ghost" type="button" data-action="go-offers">استعرض العروض</button>
          </div>
        </div>
      </div>
    </section>
  `;
}
