import { dom } from '../core/dom.js';
import { computeCartTotals } from '../state/selectors.js';
import { formatMoney } from '../services/invoiceService.js';

export function renderSearchBar(container, state, { show = true, placeholder = 'ابحث باسم المنتج أو الشركة أو القسم' } = {}) {
  if (!show) {
    container.innerHTML = '';
    return;
  }

  const totals = computeCartTotals(state);
  container.innerHTML = `
    <section class="search-shell">
      <div class="search-shell__row">
        <button class="search-shell__cart" type="button" data-action="open-cart-drawer" aria-label="فتح السلة">
          <span class="search-shell__cart-value">${dom.escape(formatMoney(totals.grand))}</span>
        </button>
        <div class="search-shell__input-wrap">
          <input id="searchInput" type="search" placeholder="${dom.escape(placeholder)}" value="${dom.escape(state.ui.search)}" autocomplete="off" />
          <button class="icon-btn search-shell__clear" type="button" data-action="clear-search" aria-label="مسح البحث">×</button>
        </div>
      </div>
    </section>
  `;
}
