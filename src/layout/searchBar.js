import { dom } from '../core/dom.js';

export function renderSearchBar(container, state, { routeName = 'home', show = true } = {}) {
  if (!show || routeName === 'search') {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <section class="search-shell search-shell--icon">
      <button class="search-shell__icon btn btn--ghost" type="button" data-action="go-search" aria-label="البحث">
        <span aria-hidden="true">⌕</span>
      </button>
    </section>
  `;
}
