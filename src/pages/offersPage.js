import { offerCard } from '../components/cards.js';
import { getVisibleDailyDeals, getVisibleFlashOffers } from '../state/selectors.js';

export function renderOffersPage(state) {
  const daily = getVisibleDailyDeals(state);
  const flash = getVisibleFlashOffers(state);

  return `
    <div class="page-stack">
      <section class="page-section">
        <div class="page-section__head"><div><h2>صفقة اليوم</h2></div></div>
        <div class="offer-grid">${daily.map((offer) => offerCard(offer, 'deal', state.commerce.cart.some((item) => item.key === `deal:${offer.id}:single`))).join('') || '<div class="empty-state">لا توجد صفقات</div>'}</div>
      </section>
      <section class="page-section">
        <div class="page-section__head"><div><h2>عرض الساعة</h2></div></div>
        <div class="offer-grid">${flash.map((offer) => offerCard(offer, 'flash', state.commerce.cart.some((item) => item.key === `flash:${offer.id}:single`))).join('') || '<div class="empty-state">لا توجد عروض ساعة</div>'}</div>
      </section>
    </div>
  `;
}
