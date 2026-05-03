/* search.runtime.js — static search surface ownership */

let searchRuntimeBound = false;

function syncSearchSurface() {
  if (!els.headerSearchInput) return;
  els.headerSearchInput.value = state.search || '';
}

function clearSearch() {
  if (state.search) {
    state.search = '';
  }
  syncSearchSurface();
  renderApp();
}

function setSearch(value) {
  const next = String(value || '');
  if (state.search === next) {
    syncSearchSurface();
    return;
  }
  state.search = next;
  syncSearchSurface();
  if (next.length >= 2) {
    recordUiEvent('search.query', { query: next.slice(0, 64) });
  }
  renderApp();
}

function initSearchRuntime() {
  if (searchRuntimeBound) {
    syncSearchSurface();
    return;
  }
  searchRuntimeBound = true;

  const input = els.headerSearchInput;
  if (input) {
    input.addEventListener('input', (event) => {
      setSearch(event.target.value);
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && input.value) {
        event.preventDefault();
        clearSearch();
      }
    });
  }

  syncSearchSurface();
}
