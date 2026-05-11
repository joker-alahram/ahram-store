import { dom } from '../core/dom.js';
import { formatMoney } from '../services/invoiceService.js';

export function renderHero(container, state, { mode = 'home' } = {}) {
  const flash = state.runtime.flashState;
  if (mode !== 'home' || !flash?.offer || flash.status !== 'active') {
    container.innerHTML = '';
    return;
  }

  const settings = state.commerce?.catalog?.settingsMap || {};
  const heroImage = flash.offer.image || settings.hero_banner || settings.home_banner_image || settings.main_banner || '';

  container.innerHTML = `
    <section class="hero-shell hero-shell--countdown">
      <div class="hero-shell__copy">
        <span class="hero-kicker">Premium B2B Commerce</span>
        <div class="hero-countdown-panel hero-countdown-panel--dominant">
          <span class="hero-countdown-panel__label">عرض الساعة</span>
          <div class="hero-countdown-panel__value">${dom.escape(flash.countdown || '--:--:--')}</div>
          <div class="hero-countdown-panel__meta">متبقي على انتهاء العرض</div>
        </div>
        <h1>${dom.escape(flash.offer.title)}</h1>
        <p>${dom.escape(flash.offer.description || 'عرض مباشر مخصص للتجارة السريعة')}</p>
        <div class="hero-actions">
          <button class="btn btn--primary" type="button" data-action="go-flash">فتح العرض</button>
          <button class="btn btn--ghost" type="button" data-action="go-offers">استعرض العروض</button>
        </div>
        <div class="hero-metrics">
          <span class="badge">${formatMoney(flash.offer.price)} ج.م</span>
          <span class="badge">${dom.escape(flash.status || 'active')}</span>
        </div>
        <div class="hero-contact-strip">
          <a class="icon-pill hero-contact-strip__item" href="tel:01040880002" aria-label="اتصال">اتصال</a>
          <a class="icon-pill hero-contact-strip__item" href="https://wa.me/201040880002" target="_blank" rel="noopener noreferrer" aria-label="واتساب">واتساب</a>
          <a class="icon-pill hero-contact-strip__item" href="https://www.facebook.com/alahram2014/" target="_blank" rel="noopener noreferrer" aria-label="فيسبوك">فيسبوك</a>
        </div>
      </div>
      <div class="hero-shell__art hero-shell__art--compact">
        ${heroImage ? `<img src="${dom.escape(heroImage)}" alt="${dom.escape(flash.offer.title)}" loading="eager" />` : '<div class="hero-shell__placeholder">عرض الساعة</div>'}
        <div class="hero-shell__art-caption">${dom.escape(flash.offer.title)}</div>
      </div>
    </section>
  `;
}
