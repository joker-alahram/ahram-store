import { dom } from '../core/dom.js';
import { formatMoney } from '../services/invoiceService.js';

export function renderHero(container, state, { mode = 'home' } = {}) {
  const flash = state.runtime.flashState;
  if (mode !== 'home' || !flash?.offer) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <section class="hero-shell">
      <div class="hero-shell__copy">
        <span class="hero-kicker">Premium B2B Commerce</span>
        <h1>${dom.escape(flash.offer.title)}</h1>
        <p>${dom.escape(flash.offer.description || 'عرض مباشر مخصص للتجارة السريعة')}</p>
        <div class="hero-actions">
          <button class="btn btn--primary" type="button" data-action="go-flash">فتح العرض</button>
          <button class="btn btn--ghost" type="button" data-action="go-offers">استعرض العروض</button>
        </div>
        <div class="hero-metrics">
          <span class="badge">${formatMoney(flash.offer.price)} ج.م</span>
          <span class="badge">متبقي ${dom.escape(flash.countdown || '--:--:--')}</span>
        </div>
      </div>
      <div class="hero-shell__art">
        ${flash.offer.image ? `<img src="${dom.escape(flash.offer.image)}" alt="${dom.escape(flash.offer.title)}" loading="eager" />` : '<div class="hero-shell__placeholder">عرض الساعة</div>'}
      </div>
    </section>
  `;
}
