import { dom } from '../core/dom.js';

export function renderSearchBar(container, state, { show = true, placeholder = 'ابحث باسم المنتج أو الشركة' } = {}) {
  if (!show) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <section class="search-shell">
      <div class="search-shell__contact">
        <a href="tel:01040880002" class="icon-pill" aria-label="اتصال مباشر">اتصال</a>
        <a href="https://wa.me/201040880002" target="_blank" rel="noopener noreferrer" class="icon-pill" aria-label="واتساب">واتساب</a>
      </div>
      <div class="search-shell__row">
        <input id="searchInput" type="search" placeholder="${dom.escape(placeholder)}" value="${dom.escape(state.ui.search)}" autocomplete="off" />
        <button class="icon-btn" type="button" data-action="clear-search">×</button>
      </div>
    </section>
  `;
}
