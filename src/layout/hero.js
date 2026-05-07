import { dom } from '../core/dom.js';
import { formatMoney } from '../services/invoiceService.js';

export function renderHero(container, state, { mode = 'home' } = {}) {
  const flash = state.runtime.flashState;
  if (mode !== 'home' || !flash?.offer) {
    container.innerHTML = '';
    return;
  }

  const settings = state.commerce?.catalog?.settingsMap || {};
  const bannerImage = settings.banner_image || settings.home_banner_image || settings.hero_banner || settings.main_banner || settings.company_banner || '';
  const heroImage = bannerImage || flash.offer.image || '';
  const heroStatusLabel = flash.status === 'active' ? 'عرض الساعة المباشر' : flash.status === 'pending' ? 'العرض قادم' : 'العرض منتهي';

  container.innerHTML = `
    <section class="hero-shell hero-shell--countdown">
      <div class="hero-shell__copy">
        <span class="hero-kicker">Premium B2B Commerce</span>
        <h1>${dom.escape(flash.offer.title)}</h1>
        <div class="hero-countdown-panel">
          <span class="hero-countdown-panel__label">${dom.escape(heroStatusLabel)}</span>
          <div class="hero-countdown-panel__value">${dom.escape(flash.countdown || '--:--:--')}</div>
          <div class="hero-countdown-panel__meta">متبقي على انتهاء العرض</div>
        </div>
        <p>${dom.escape(flash.offer.description || 'عرض مباشر مخصص للتجارة السريعة')}</p>
        <div class="hero-actions">
          <button class="btn btn--primary" type="button" data-action="go-flash">فتح العرض</button>
          <button class="btn btn--ghost" type="button" data-action="go-offers">استعرض العروض</button>
        </div>
        <div class="hero-metrics">
          <span class="badge">${formatMoney(flash.offer.price)} ج.م</span>
          <span class="badge">${dom.escape(flash.status || 'active')}</span>
        </div>
      </div>
      <div class="hero-shell__art">
        ${heroImage ? `<img src="${dom.escape(heroImage)}" alt="${dom.escape(flash.offer.title)}" loading="eager" />` : '<div class="hero-shell__placeholder">عرض الساعة</div>'}
        <div class="hero-shell__art-caption">${dom.escape(flash.offer.title)}</div>
      </div>
    </section>
  `;
}
