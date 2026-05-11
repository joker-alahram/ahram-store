function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

export function renderSearchBar(container, state = {}, { routeName = 'home', show = false } = {}) {
  if (!container) return;
  const visible = Boolean(show || routeName === 'search' || routeName === 'home');
  container.innerHTML = `
    <div class="search-shell ${visible ? '' : 'is-hidden'}" aria-hidden="${visible ? 'false' : 'true'}">
      <div class="search-shell__inner">
        <input id="headerSearchInput" data-role="search-input" type="search" placeholder="ابحث باسم المنتج أو الشركة أو القسم" value="${escapeHtml(state.ui?.search || '')}" autocomplete="off" spellcheck="false" />
      </div>
    </div>
  `;
}
