import { readConfig } from '../core/config.js';
import { dom } from '../core/dom.js';
import { parseRoute, navigate } from '../core/router.js';
import { createEmitter, createRenderLoop } from '../core/events.js';
import { createStore } from '../state/store.js';
import { createInitialState } from '../state/defaultState.js';
import { computeCartTotals, getSelectedTier } from '../state/selectors.js';
import { createApiClient } from '../services/apiClient.js';
import { loadHomeCatalog, loadHomeSupplementary, loadTopSections, loadCompanyCatalog, aggregateRuntimeProducts, projectRuntimeProducts, projectRuntimeCatalogRows } from '../services/catalogService.js';
import { buildPriceBook, persistSelectedTier, resolveProductUnit, syncCartPrices, normalizeTierName } from '../services/pricingService.js';
import { addProductToCart, clearCart, computeTotals, hydrateCart, persistCart, recalcCart, removeItem, toggleOfferInCart, updateQty } from '../services/cartService.js';
import { login, logout, registerCustomer, normalizeUserType, normalizeSessionRecord } from '../services/authService.js';
import { loadRepCustomers, createCustomer, persistSelectedCustomer } from '../services/customerService.js';
import { buildOwnershipScope, normalizeOwnershipRow, resolveScopedOrderQuery } from './ownershipResolver.js';
import { loadGovernanceProjection } from '../services/governanceService.js';
import { computeFlashState, isOfferActive } from '../services/offerService.js';
import { validateCheckout, submitOrder } from '../services/orderService.js';
import { buildWhatsAppInvoice, formatMoney, formatStatus, persistInvoices } from '../services/invoiceService.js';
import { appendBehaviorEvent, writeUiEvent } from '../services/analyticsService.js';
import { shellTemplate } from '../layout/shell.js';
import { renderHeader } from '../layout/header.js';
import { renderSearchBar } from '../layout/searchBar.js';
import { renderBanner } from '../layout/banner.js';
import { renderThemeSwitcher, AVAILABLE_THEMES } from '../layout/themeSwitcher.js';
import { renderHero } from '../layout/hero.js';
import { renderFooter } from '../layout/footer.js';
import { renderLoginModal, renderCustomerModal, renderProductModal, renderInvoiceModal } from '../layout/modals.js';
import { renderDrawer, renderToasts } from '../layout/overlays.js';
import { renderHomePage } from '../pages/homePage.js';
import { renderSearchPage } from '../pages/searchPage.js';
import { renderCompaniesPage, renderCompanyPage } from '../pages/companiesPage.js';
import { renderOffersPage } from '../pages/offersPage.js';
import { renderTiersPage } from '../pages/tiersPage.js';
import { renderCartPage, renderCheckoutPage, renderInvoicePage } from '../pages/cartCheckoutPages.js';
import { renderLoginPage, renderRegisterPage } from '../pages/authPages.js';
import { renderCustomersPage, renderInvoicesPage, renderAccountPage } from '../pages/customerPages.js';
import { renderDashboardPage } from '../pages/dashboardPage.js';
import { storageKeys, saveJSON, loadJSON, removeValue, purgeLegacyStorage } from '../core/storage.js';

function createInitialData() {
  return createInitialState();
}

function bootstrapShell(app) {
  if (!app) return null;
  app.innerHTML = shellTemplate();
  return app;
}

function getNodes() {
  return {
    header: dom.q('#appHeader'),
    theme: dom.q('#appTheme'),
    banner: dom.q('#appBanner'),
    search: dom.q('#appSearch'),
    hero: dom.q('#appHero'),
    page: dom.q('#appPage'),
    footer: dom.q('#appFooter'),
    drawerHost: dom.q('#appDrawerHost'),
    modalHost: dom.q('#appModalHost'),
    toastHost: dom.q('#appToastHost'),
  };
}

function createEmptyCatalog() {
  return {
    companies: [],
    products: [],
    productIndex: {},
    offers: { daily: [], flash: [] },
    tiers: [],
    settings: [],
    settingsMap: {},
    top: { products: [], companies: [] },
    counters: { companies: 0, tiers: 0, deals: 0, flash: 0 },
    catalogProducts: [],
    invoiceItemsById: {},
  };
}

const SEARCH_DEBOUNCE_MS = 900;

const INITIAL_GOVERNANCE_STATE = {
  systemUser: null,
  capabilities: [],
  workflowTransitions: [],
  loaded: false,
  loading: false,
  failed: false,
};

const RUNTIME_PHASES = {
  BOOTING: 'booting',
  RESTORING_SESSION: 'restoring_session',
  RESOLVING_AUTHORITY: 'resolving_authority',
  HYDRATING_RUNTIME: 'hydrating_runtime',
  SYNCING_CART: 'syncing_cart',
  READY: 'runtime_ready',
  FAILED: 'runtime_failed',
};

const companyHydrationTokens = new Map();
const companyCatalogRequests = new Map();
let checkoutSubmitLock = false;
let hydrationSessionVersion = 0;

function createHydrationSession() {
  hydrationSessionVersion += 1;
  return hydrationSessionVersion;
}

function isHydrationSessionActive(token) {
  return token === hydrationSessionVersion;
}

function getRouteSnapshot(route = null) {
  const resolved = route || parseRoute(location.hash || '#home');
  const params = resolved?.params && typeof resolved.params === 'object'
    ? Object.entries(resolved.params)
        .sort(([left], [right]) => String(left).localeCompare(String(right)))
        .map(([key, value]) => `${key}:${String(value ?? '')}`)
        .join('&')
    : '';
  return `${resolved?.name || 'home'}|${params}`;
}

function captureRuntimeScope(store) {
  const state = store.getState();
  return {
    session: hydrationSessionVersion,
    route: getRouteSnapshot(state.app?.route),
  };
}

function isRuntimeScopeActive(scope) {
  if (!scope || !isHydrationSessionActive(scope.session)) return false;
  return scope.route === getRouteSnapshot(parseRoute(location.hash || '#home'));
}

function captureGovernanceScope(store) {
  const state = store.getState();
  const session = normalizeSessionRecord(state.auth.session);
  return {
    session: hydrationSessionVersion,
    route: getRouteSnapshot(state.app?.route),
    identity: String(session?.phone || session?.username || session?.id || '').trim(),
  };
}

function isGovernanceScopeActive(scope, store) {
  if (!scope || !isHydrationSessionActive(scope.session)) return false;
  if (scope.route !== getRouteSnapshot(parseRoute(location.hash || '#home'))) return false;
  const session = normalizeSessionRecord(store.getState().auth.session);
  const identity = String(session?.phone || session?.username || session?.id || '').trim();
  return scope.identity === identity;
}

async function hydrateGovernanceRuntime(store, api, scope = captureGovernanceScope(store)) {
  const current = store.getState();
  const currentGovernance = current.governance || INITIAL_GOVERNANCE_STATE;
  store.patch({
    governance: { ...currentGovernance, loading: true, failed: false },
    runtime: { ...current.runtime, loading: { ...current.runtime.loading, governance: true } },
  }, { silent: true });
  try {
    const projection = await loadGovernanceProjection(api, current.auth.session);
    if (!isGovernanceScopeActive(scope, store)) return;
    const { workflowStates: _workflowStates, ...governanceProjection } = projection || {};
    store.patch({
      governance: { ...INITIAL_GOVERNANCE_STATE, ...governanceProjection, loading: false, failed: false },
      runtime: { ...store.getState().runtime, loading: { ...store.getState().runtime.loading, governance: false } },
    }, { silent: true });
  } catch (error) {
    if (!isGovernanceScopeActive(scope, store)) return;
    store.patch({
      governance: { ...INITIAL_GOVERNANCE_STATE, loading: false, failed: true },
      runtime: { ...store.getState().runtime, loading: { ...store.getState().runtime.loading, governance: false } },
    }, { silent: true });
  }
}

function resetGovernanceRuntime(store) {
  store.patch({
    governance: { ...INITIAL_GOVERNANCE_STATE },
    runtime: { ...store.getState().runtime, loading: { ...store.getState().runtime.loading, governance: false } },
  }, { silent: true });
}

function markPerf(name) {
  if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
    try { performance.mark(name); } catch { /* noop */ }
  }
}

function measurePerf(name, startMark, endMark) {
  if (typeof performance !== 'undefined' && typeof performance.measure === 'function') {
    try {
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name);
      const latest = entries[entries.length - 1];
      if (latest) console.info(`[perf] ${name}: ${latest.duration.toFixed(2)}ms`);
    } catch { /* noop */ }
  }
}

async function yieldToPaint() {
  if (typeof requestAnimationFrame === 'function') {
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function yieldToIdle() {
  if (typeof requestIdleCallback === 'function') {
    await new Promise((resolve) => requestIdleCallback(() => resolve(), { timeout: 50 }));
    return;
  }
  await yieldToPaint();
}

function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function isNonEmptyObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0;
}

function cloneCatalogSnapshot(catalog) {
  const safe = catalog && typeof catalog === 'object' ? catalog : {};
  return {
    ...createEmptyCatalog(),
    ...safe,
    offers: {
      daily: Array.isArray(safe.offers?.daily) ? safe.offers.daily : [],
      flash: Array.isArray(safe.offers?.flash) ? safe.offers.flash : [],
    },
    top: {
      products: Array.isArray(safe.top?.products) ? safe.top.products : [],
      companies: Array.isArray(safe.top?.companies) ? safe.top.companies : [],
    },
  };
}

function compactCatalogForStorage(catalog) {
  const safe = catalog && typeof catalog === 'object' ? catalog : {};
  return {
    companies: Array.isArray(safe.companies) ? safe.companies : [],
    tiers: Array.isArray(safe.tiers) ? safe.tiers : [],
    offers: {
      daily: Array.isArray(safe.offers?.daily) ? safe.offers.daily : [],
      flash: Array.isArray(safe.offers?.flash) ? safe.offers.flash : [],
    },
    settings: Array.isArray(safe.settings) ? safe.settings : [],
    settingsMap: isNonEmptyObject(safe.settingsMap) ? safe.settingsMap : {},
    top: {
      products: Array.isArray(safe.top?.products) ? safe.top.products : [],
      companies: Array.isArray(safe.top?.companies) ? safe.top.companies : [],
    },
    counters: {
      companies: Array.isArray(safe.companies) ? safe.companies.length : 0,
      tiers: Array.isArray(safe.tiers) ? safe.tiers.length : 0,
      deals: Array.isArray(safe.offers?.daily) ? safe.offers.daily.length : 0,
      flash: Array.isArray(safe.offers?.flash) ? safe.offers.flash.length : 0,
    },
  };
}

function mergeCatalogSnapshots(cachedCatalog, liveCatalog) {
  const cached = cloneCatalogSnapshot(cachedCatalog);
  const live = cloneCatalogSnapshot(liveCatalog);
  const mergedCompanies = isNonEmptyArray(live.companies) ? live.companies : cached.companies;
  const mergedProducts = isNonEmptyArray(live.products) ? live.products : cached.products;
  const mergedProductIndex = isNonEmptyObject(live.productIndex) ? live.productIndex : cached.productIndex;
  const mergedDaily = isNonEmptyArray(live.offers.daily) ? live.offers.daily : cached.offers.daily;
  const mergedFlash = isNonEmptyArray(live.offers.flash) ? live.offers.flash : cached.offers.flash;
  const mergedTiers = isNonEmptyArray(live.tiers) ? live.tiers : cached.tiers;
  const mergedSettings = isNonEmptyArray(live.settings) ? live.settings : cached.settings;
  const mergedSettingsMap = isNonEmptyObject(live.settingsMap) ? live.settingsMap : cached.settingsMap;
  const mergedTopProducts = isNonEmptyArray(live.top.products) ? live.top.products : cached.top.products;
  const mergedTopCompanies = isNonEmptyArray(live.top.companies) ? live.top.companies : cached.top.companies;
  const mergedCatalogProducts = isNonEmptyArray(live.catalogProducts) ? live.catalogProducts : cached.catalogProducts;

  return {
    companies: mergedCompanies,
    products: mergedProducts,
    productIndex: mergedProductIndex,
    offers: { daily: mergedDaily, flash: mergedFlash },
    tiers: mergedTiers,
    settings: mergedSettings,
    settingsMap: mergedSettingsMap,
    top: { products: mergedTopProducts, companies: mergedTopCompanies },
    counters: {
      companies: mergedCompanies.length,
      tiers: mergedTiers.length,
      deals: mergedDaily.length,
      flash: mergedFlash.length,
    },
    catalogProducts: mergedCatalogProducts,
    invoiceItemsById: {},
  };
}

function catalogHasMeaningfulData(catalog) {
  return Boolean(catalog)
    && (
      isNonEmptyArray(catalog.products)
      || isNonEmptyArray(catalog.companies)
      || isNonEmptyArray(catalog.tiers)
      || isNonEmptyArray(catalog.catalogProducts)
      || isNonEmptyArray(catalog.top?.products)
      || isNonEmptyArray(catalog.top?.companies)
      || isNonEmptyArray(catalog.settings)
      || isNonEmptyArray(catalog.offers?.daily)
      || isNonEmptyArray(catalog.offers?.flash)
    );
}

function isRuntimeInteractive(state) {
  return [RUNTIME_PHASES.READY, RUNTIME_PHASES.FAILED].includes(state?.runtime?.lifecycle?.phase);
}

function setRuntimeLifecycle(store, patch) {
  const current = store.getState();
  store.patch({
    runtime: {
      ...current.runtime,
      lifecycle: {
        ...current.runtime.lifecycle,
        ...patch,
      },
    },
  }, { silent: true });
}

function setRuntimePhase(store, phase, extras = {}) {
  const current = store.getState();
  store.patch({
    runtime: {
      ...current.runtime,
      lifecycle: {
        ...current.runtime.lifecycle,
        phase,
        ...extras,
      },
    },
  }, { silent: true });
}

function findCartProductItem(cart, productId) {
  return (cart || []).find((item) => item.type === 'product' && String(item.id) === String(productId));
}

function captureSearchFocus() {
  const active = document.activeElement;
  if (!active) return null;
  if (active.id === 'searchInput' || active.classList?.contains('searchbar-input')) {
    return {
      id: active.id || (active.classList?.contains('searchbar-input') ? 'searchInput' : null),
      selectionStart: Number.isInteger(active.selectionStart) ? active.selectionStart : null,
      selectionEnd: Number.isInteger(active.selectionEnd) ? active.selectionEnd : null,
      value: active.value,
    };
  }
  return null;
}

function restoreSearchFocus(snapshot) {
  if (!snapshot?.id) return;
  const input = document.getElementById(snapshot.id);
  if (!input) return;
  try {
    input.focus({ preventScroll: true });
    if (Number.isInteger(snapshot.selectionStart) && Number.isInteger(snapshot.selectionEnd) && typeof input.setSelectionRange === 'function') {
      input.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd);
    }
  } catch {
    // ignore focus restoration failures
  }
}

const toastTimers = new Map();
let schedulerRef = null;
let searchTypingTimer = null;

function notify(store, type, title, message, options = {}) {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
  const queue = store.getState().ui.toastQueue.slice();
  queue.push({ id, type, title, message, icon: options.icon || { success: '✓', warning: '!', error: '×', info: 'i' }[type] || '•', action: options.action || null });
  while (queue.length > 4) queue.shift();
  store.patch({ ui: { ...store.getState().ui, toastQueue: queue } });
  if (schedulerRef) schedulerRef.schedule('toast');
  const duration = Math.max(1800, Number(options.duration || 3400));
  clearTimeout(toastTimers.get(id));
  toastTimers.set(id, setTimeout(() => {
    const next = store.getState().ui.toastQueue.filter((item) => item.id !== id);
    store.patch({ ui: { ...store.getState().ui, toastQueue: next } });
    if (schedulerRef) schedulerRef.schedule('toast');
    toastTimers.delete(id);
  }, duration));
}

const DEFAULT_THEME = 'premium-dark';
const THEME_NAMES = new Set([DEFAULT_THEME, ...AVAILABLE_THEMES.map((theme) => theme.name)]);
const RUNTIME_MODES = Object.freeze({
  browser: 'browser',
  pwa: 'pwa',
});
const THEME_COLOR_META = document.querySelector('meta[name="theme-color"]');
const THEME_COLORS = {
  'premium-dark': '#0d2b6b',
  'orange-theme': '#ff8a1f',
  'sky-blue-theme': '#2b8cff',
  'white-theme': '#2d6cdf',
  'green-yellow-theme': '#86d73a',
  'amazon-inspired-theme': '#ff9900',
  'vip-light-theme': '#c89a3a',
};
const PWA_THEME_COLOR = '#1d4ed8';

function detectRuntimeMode() {
  const standalone = typeof window.matchMedia === 'function'
    ? window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches
    : false;
  const iosStandalone = Boolean(window.navigator?.standalone);
  return (standalone || iosStandalone) ? RUNTIME_MODES.pwa : RUNTIME_MODES.browser;
}

function syncThemeColor(theme, runtimeMode = getRuntimeMode()) {
  if (!THEME_COLOR_META) return;
  const next = runtimeMode === RUNTIME_MODES.pwa ? PWA_THEME_COLOR : (THEME_COLORS[theme] || THEME_COLORS[DEFAULT_THEME]);
  THEME_COLOR_META.setAttribute('content', next);
}

function getRuntimeMode() {
  return document.body?.dataset?.runtimeMode || RUNTIME_MODES.browser;
}

function applyRuntimeMode(runtimeMode, theme = DEFAULT_THEME) {
  const nextMode = runtimeMode === RUNTIME_MODES.pwa ? RUNTIME_MODES.pwa : RUNTIME_MODES.browser;
  document.documentElement.dataset.runtimeMode = nextMode;
  document.body.dataset.runtimeMode = nextMode;
  document.body.classList.toggle('runtime-pwa', nextMode === RUNTIME_MODES.pwa);
  document.body.classList.toggle('runtime-browser', nextMode !== RUNTIME_MODES.pwa);
  syncThemeColor(theme, nextMode);
}

function setTheme(theme) {
  const next = THEME_NAMES.has(theme) ? theme : DEFAULT_THEME;
  document.body.dataset.theme = next;
  syncThemeColor(next);
}

function closeTransientSurfaces(store, { keepDrawer = false } = {}) {
  const current = store.getState();
  store.patch({
    ui: {
      ...current.ui,
      accountMenuOpen: false,
      activeModal: null,
      selectedInvoiceId: null,
      drawerOpen: keepDrawer ? current.ui.drawerOpen : false,
    },
  });
}

function setPendingFlow(store, flow = null) {
  const current = store.getState();
  store.patch({ ui: { ...current.ui, pendingFlow: flow } });
}

function clearPendingFlow(store) {
  setPendingFlow(store, null);
}

function navigateAuthority(store, routeName, params = {}, options = {}) {
  closeTransientSurfaces(store, { keepDrawer: Boolean(options.keepDrawer) });
  navigate(routeName, params);
}

function setCheckoutBusy(store, value) {
  const current = store.getState();
  store.patch({ ui: { ...current.ui, checkoutBusy: Boolean(value) } });
}


function sortProjectedCatalogProducts(productIndex) {
  return Object.values(productIndex || {})
    .filter((row) => row?.visible !== false)
    .sort((a, b) => {
      const left = Number(a.units?.[a.defaultUnit]?.display_order ?? Number.POSITIVE_INFINITY);
      const right = Number(b.units?.[b.defaultUnit]?.display_order ?? Number.POSITIVE_INFINITY);
      if (left !== right) return left - right;
      return String(a.product_name).localeCompare(String(b.product_name), 'ar');
    });
}

function buildRuntimeCatalogProjectionFromCache(state, selectedTier) {
  const safeTier = normalizeTierName(selectedTier);
  const tiers = Array.isArray(state?.commerce?.catalog?.tiers) ? state.commerce.catalog.tiers : [];
  const baseRows = Array.isArray(state?.commerce?.catalog?.catalogProducts) ? state.commerce.catalog.catalogProducts : [];
  const baseProjection = projectRuntimeCatalogRows(baseRows, safeTier, tiers);
  const nextIndex = { ...(baseProjection.productIndex || {}) };
  const caches = state?.runtime?.companyRowsCache || {};
  for (const rows of Object.values(caches)) {
    if (!Array.isArray(rows) || !rows.length) continue;
    const projected = projectRuntimeCatalogRows(rows, safeTier, tiers);
    Object.assign(nextIndex, projected.productIndex);
  }
  const products = sortProjectedCatalogProducts(nextIndex);
  return {
    productIndex: nextIndex,
    products,
    priceBook: buildPriceBook(products, tiers, safeTier),
  };
}

function rebuildLoadedCompanyCatalog(store, selectedTierOverride = null) {
  const state = store.getState();
  const selectedTier = normalizeTierName(selectedTierOverride ?? state.commerce.selectedTier);
  const caches = state.runtime.companyRowsCache || {};
  const nextIndex = { ...(state.commerce.catalog.productIndex || {}) };
  for (const rows of Object.values(caches)) {
    const aggregated = aggregateRuntimeProducts(rows);
    const projected = projectRuntimeProducts(aggregated, selectedTier);
    Object.assign(nextIndex, projected);
  }
  const products = Object.values(nextIndex).sort((a, b) => {
    const left = Number(a.units?.[a.defaultUnit]?.display_order ?? Number.POSITIVE_INFINITY);
    const right = Number(b.units?.[b.defaultUnit]?.display_order ?? Number.POSITIVE_INFINITY);
    if (left !== right) return left - right;
    return String(a.product_name).localeCompare(String(b.product_name), 'ar');
  });
  return { productIndex: nextIndex, products, priceBook: buildPriceBook(products, state.commerce.catalog.tiers || [], selectedTier) };
}

async function ensureCompanyCatalogLoaded(store, api, companyId) {
  const trimmed = String(companyId ?? '').trim();
  if (!trimmed) return;
  const existing = companyCatalogRequests.get(trimmed);
  if (existing) return existing;

  const request = (async () => {
    const requestToken = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const hydrationToken = hydrationSessionVersion;
    const scope = captureRuntimeScope(store);
    companyHydrationTokens.set(trimmed, requestToken);
    store.update((draft) => {
      draft.runtime.loading.company = trimmed;
      draft.runtime.companyErrors[trimmed] = null;
      draft.runtime.lifecycle.companyProductsLoading = true;
      draft.runtime.lifecycle.companyProductsReady = false;
      draft.runtime.lifecycle.companyProductsFailed = false;
    }, { dirty: ['page'] });

    const cachedRows = Array.isArray(store.getState().runtime.companyRowsCache?.[trimmed]) ? store.getState().runtime.companyRowsCache?.[trimmed] : [];
    if (isHydrationSessionActive(hydrationToken) && isRuntimeScopeActive(scope) && Array.isArray(cachedRows) && cachedRows.length > 0) {
      store.update((draft) => {
        if (!isRuntimeScopeActive(scope)) return false;
        const rebuilt = rebuildLoadedCompanyCatalog({ getState: () => draft });
        draft.commerce.catalog.productIndex = rebuilt.productIndex;
        draft.commerce.catalog.products = rebuilt.products;
        draft.commerce.priceBook = rebuilt.priceBook;
        draft.runtime.lifecycle.companyProductsReady = true;
        draft.runtime.lifecycle.companyProductsLoading = false;
        draft.runtime.lifecycle.companyProductsFailed = false;
        draft.runtime.companyErrors[trimmed] = null;
        draft.commerce.cart = syncCartPrices(draft.commerce.cart, draft.commerce.catalog.productIndex);
      }, { dirty: ['page', 'drawer', 'modals', 'header'] });
      if (isRuntimeScopeActive(scope)) persistCart(store.getState().commerce.cart);
      return;
    }

    try {
      const companyCatalog = await loadCompanyCatalog(api, trimmed, store.getState().commerce.selectedTier || null);
      if (companyHydrationTokens.get(trimmed) !== requestToken || !isHydrationSessionActive(hydrationToken) || !isRuntimeScopeActive(scope)) return;
      const rows = Array.isArray(companyCatalog.rows) ? companyCatalog.rows : [];
      if (rows.length > 0) {
        store.update((draft) => {
          if (!isRuntimeScopeActive(scope)) return false;
          draft.runtime.companyRowsCache[trimmed] = rows.slice(0, 180);
          const rebuilt = rebuildLoadedCompanyCatalog({ getState: () => draft });
          draft.commerce.catalog.productIndex = rebuilt.productIndex;
          draft.commerce.catalog.products = rebuilt.products;
          draft.commerce.priceBook = rebuilt.priceBook;
          draft.runtime.companyErrors[trimmed] = null;
          draft.runtime.loading.company = null;
          draft.runtime.lifecycle.companyProductsReady = true;
          draft.runtime.lifecycle.companyProductsLoading = false;
          draft.runtime.lifecycle.companyProductsFailed = false;
          draft.commerce.cart = syncCartPrices(draft.commerce.cart, draft.commerce.catalog.productIndex);
        }, { dirty: ['page', 'drawer', 'modals', 'header'] });
        if (isRuntimeScopeActive(scope)) persistCart(store.getState().commerce.cart);
        return;
      }

      store.update((draft) => {
        if (!isRuntimeScopeActive(scope)) return false;
        draft.runtime.loading.company = null;
        draft.runtime.companyErrors[trimmed] = null;
        draft.runtime.lifecycle.companyProductsReady = Boolean(cachedRows && cachedRows.length > 0);
        draft.runtime.lifecycle.companyProductsLoading = false;
        draft.runtime.lifecycle.companyProductsFailed = false;
      }, { dirty: ['page'] });
      return;
    } catch (error) {
      if (companyHydrationTokens.get(trimmed) !== requestToken || !isHydrationSessionActive(hydrationToken) || !isRuntimeScopeActive(scope)) return;
      const fallbackRows = Array.isArray(store.getState().runtime.companyRowsCache?.[trimmed]) ? store.getState().runtime.companyRowsCache?.[trimmed] : [];
      if (isHydrationSessionActive(hydrationToken) && isRuntimeScopeActive(scope) && fallbackRows.length) {
        store.update((draft) => {
          if (!isRuntimeScopeActive(scope)) return false;
          draft.runtime.companyRowsCache[trimmed] = fallbackRows.slice(0, 180);
          const rebuilt = rebuildLoadedCompanyCatalog({ getState: () => draft });
          draft.commerce.catalog.productIndex = rebuilt.productIndex;
          draft.commerce.catalog.products = rebuilt.products;
          draft.commerce.priceBook = rebuilt.priceBook;
          draft.runtime.loading.company = null;
          draft.runtime.companyErrors[trimmed] = null;
          draft.runtime.lifecycle.companyProductsReady = true;
          draft.runtime.lifecycle.companyProductsLoading = false;
          draft.runtime.lifecycle.companyProductsFailed = false;
          draft.commerce.cart = syncCartPrices(draft.commerce.cart, draft.commerce.catalog.productIndex);
        }, { dirty: ['page', 'drawer', 'modals', 'header'] });
        if (isRuntimeScopeActive(scope)) persistCart(store.getState().commerce.cart);
        return;
      }

      store.update((draft) => {
        if (!isRuntimeScopeActive(scope)) return false;
        draft.runtime.loading.company = null;
        draft.runtime.companyErrors[trimmed] = error?.message || 'تعذر تحميل منتجات الشركة';
        draft.runtime.lifecycle.companyProductsReady = false;
        draft.runtime.lifecycle.companyProductsLoading = false;
        draft.runtime.lifecycle.companyProductsFailed = true;
      }, { dirty: ['page'] });
    } finally {
      companyCatalogRequests.delete(trimmed);
    }
  })();

  companyCatalogRequests.set(trimmed, request);
  return request;
}


async function loadInvoicesIntoState(store, api) {
  const state = store.getState();
  const session = normalizeSessionRecord(state.auth.session);
  if (!session) {
    store.update((draft) => { draft.commerce.invoices = []; draft.runtime.loading.invoices = false; });
    return;
  }

  try {
    let rows = [];
    const customerList = session.userType === 'rep' ? (state.commerce.customers?.length ? state.commerce.customers : await loadRepCustomers(api, session).catch(() => [])) : [];
    const customerIds = Array.from(new Set((customerList || []).map((customer) => String(customer.id || '').trim()).filter(Boolean)));
    const resolved = resolveScopedOrderQuery(session, { customerIds });

    if (resolved.primary) {
      rows = await api.get('orders', resolved.primary).catch(() => []);
      if ((!Array.isArray(rows) || !rows.length) && resolved.legacy) {
        rows = await api.get('orders', resolved.legacy).catch(() => []);
      }
    }

    const customerNames = new Map((customerList || []).map((customer) => [String(customer.id), customer.name || customer.phone || '']));
    rows = Array.isArray(rows) ? rows.map((row) => normalizeOwnershipRow({
      ...row,
      customer_name: customerNames.get(String(row.customer_id)) || row.customer_name || session.name || session.username || '',
    })) : [];

    store.update((draft) => { draft.commerce.invoices = rows; draft.runtime.loading.invoices = false; });
    persistInvoices(rows);
  } catch (error) {
    console.error(error);
    store.update((draft) => { draft.runtime.loading.invoices = false; });
  }
}

async function loadCustomersIntoState(store, api, session = null) {
  const state = store.getState();
  const rep = session || state.auth.session;
  if (!rep || rep.userType !== 'rep') {
    store.update((draft) => { draft.commerce.customers = []; draft.runtime.loading.customers = false; });
    return;
  }
  try {
    const rows = await loadRepCustomers(api, rep);
    store.update((draft) => { draft.commerce.customers = rows; draft.runtime.loading.customers = false; });
  } catch (error) {
    console.error(error);
    store.update((draft) => { draft.runtime.loading.customers = false; });
  }
}

export async function bootstrapApp() {
  const config = readConfig();
  const api = createApiClient(config);
  const store = createStore(createInitialData());
  const runtimeMode = detectRuntimeMode();
  applyRuntimeMode(runtimeMode, store.getState().ui.theme);
  setTheme(store.getState().ui.theme);
  store.patch({ ui: { ...store.getState().ui, runtimeMode } }, { silent: true });

  const bootState = store.getState();
  const bootId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  markPerf('boot:start');
  setRuntimePhase(store, RUNTIME_PHASES.RESTORING_SESSION, { bootId, locked: true, error: null, sessionRestored: false, authorityResolved: false, pricingReady: false, cartSynced: false });
  const authoritativeSession = normalizeSessionRecord(bootState.auth.session);
  const authoritativeCustomer = authoritativeSession?.userType === 'rep' ? bootState.auth.selectedCustomer : null;
  store.patch({ auth: { ...bootState.auth, session: authoritativeSession, selectedCustomer: authoritativeCustomer } });
  setRuntimePhase(store, RUNTIME_PHASES.RESOLVING_AUTHORITY, { sessionRestored: true, authorityResolved: true });

  const app = document.getElementById('app');
  bootstrapShell(app);
  const nodes = getNodes();
  const scheduler = createRenderLoop({
    header: () => { if (!isRuntimeInteractive(store.getState())) return; return renderHeader(nodes.header, store.getState()); },
    theme: () => { if (!isRuntimeInteractive(store.getState())) return; nodes.theme.innerHTML = renderThemeSwitcher(store.getState()); setTheme(store.getState().ui.theme); },
    banner: () => { if (!isRuntimeInteractive(store.getState())) return; return renderBanner(nodes.banner, store.getState()); },
    search: () => { if (!isRuntimeInteractive(store.getState())) return; return renderSearchBar(nodes.search, store.getState(), { routeName: store.getState().app.route.name, show: false }); },
    hero: () => { if (!isRuntimeInteractive(store.getState())) return; return renderHero(nodes.hero, store.getState(), { mode: store.getState().app.route.name === 'home' ? 'home' : 'none' }); },
    page: () => renderContent(),
    footer: () => { if (!isRuntimeInteractive(store.getState())) return; return renderFooter(nodes.footer, store.getState()); },
    drawer: () => { if (!isRuntimeInteractive(store.getState())) return; nodes.drawerHost.innerHTML = renderDrawer(store.getState()); },
    modals: () => {
      if (!isRuntimeInteractive(store.getState())) return;
      const activeProduct = store.getState().ui.activeModal === 'product' && store.getState().ui.selectedProductId ? store.getState().commerce.catalog.productIndex[store.getState().ui.selectedProductId] : null;
      nodes.modalHost.innerHTML = [renderLoginModal(store.getState()), renderCustomerModal(store.getState()), renderProductModal(store.getState(), activeProduct), renderInvoiceModal(store.getState())].join('');
    },
    toast: () => { if (!isRuntimeInteractive(store.getState())) return; nodes.toastHost.innerHTML = renderToasts(store.getState()); },
  });


  function getBootProgress(phase) {
    switch (phase) {
      case RUNTIME_PHASES.RESTORING_SESSION: return 18;
      case RUNTIME_PHASES.RESOLVING_AUTHORITY: return 34;
      case RUNTIME_PHASES.HYDRATING_RUNTIME: return 58;
      case RUNTIME_PHASES.SYNCING_CART: return 82;
      case RUNTIME_PHASES.READY: return 100;
      case RUNTIME_PHASES.FAILED: return 100;
      default: return 10;
    }
  }

  function renderBootScreen(state) {
    const phase = state.runtime?.lifecycle?.phase || RUNTIME_PHASES.BOOTING;
    const progress = getBootProgress(phase);
    const message = phase === RUNTIME_PHASES.FAILED
      ? (state.app.lastError || state.runtime?.lifecycle?.error || 'تعذر تهيئة النظام')
      : 'جارى الاتصال بالنظام';
    const subtitle = phase === RUNTIME_PHASES.SYNCING_CART
      ? 'جارٍ مزامنة السلة والأسعار'
      : phase === RUNTIME_PHASES.HYDRATING_RUNTIME
        ? 'جارٍ تحميل الشركات والمنتجات'
        : phase === RUNTIME_PHASES.RESOLVING_AUTHORITY
          ? 'جارٍ التحقق من الصلاحيات'
          : 'يتم تجهيز الواجهة التشغيلية';
    return `
      <section class="boot-screen" aria-busy="true" aria-live="polite">
        <div class="boot-screen__card">
          <div class="boot-screen__brand">
            <span class="boot-screen__logo" aria-hidden="true">◆</span>
            <div>
              <strong>Ahram Co.</strong>
              <p>Trade & Distribution</p>
            </div>
          </div>
          <div class="boot-screen__progress" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
            <span style="width:${progress}%"></span>
          </div>
          <div class="boot-screen__message">${dom.escape(message)}</div>
          <div class="boot-screen__subtitle">${dom.escape(subtitle)}</div>
        </div>
      </section>
    `;
  }

  function renderContent() {
    const state = store.getState();
    const phase = state.runtime?.lifecycle?.phase || RUNTIME_PHASES.BOOTING;
    const route = state.app.route.name || 'home';
    const focusSnapshot = route === 'search' ? captureSearchFocus() : null;
    const booting = !isRuntimeInteractive(state);
    const renderStart = `render:${route}:start`;
    const renderEnd = `render:${route}:end`;
    markPerf(renderStart);
    if (booting) {
      nodes.page.innerHTML = renderBootScreen(state);
      nodes.modalHost.innerHTML = '';
      nodes.drawerHost.innerHTML = '';
      nodes.toastHost.innerHTML = '';
      nodes.theme.innerHTML = '';
      setTheme(state.ui.theme);
      syncBodyShellHeight();
      applyBodyFlags();
      markPerf(renderEnd);
      measurePerf(`render:${route}`, renderStart, renderEnd);
      return;
    }
    let html = '';
    if (route === 'home') html = renderHomePage(state);
    else if (route === 'companies') html = renderCompaniesPage(state);
    else if (route === 'company') html = renderCompanyPage(state);
    else if (route === 'offers') html = renderOffersPage(state);
    else if (route === 'tiers') html = renderTiersPage(state);
    else if (route === 'cart') html = renderCartPage(state);
    else if (route === 'checkout') html = renderCheckoutPage(state);
    else if (route === 'login') html = renderLoginPage(state);
    else if (route === 'register') html = renderRegisterPage(state);
    else if (route === 'customers') html = renderCustomersPage(state);
    else if (route === 'invoices') html = renderInvoicesPage(state);
    else if (route === 'invoice') html = renderInvoicePage(state);
    else if (route === 'account') html = renderAccountPage(state);
    else if (route === 'dashboard') html = renderDashboardPage(state);
    else if (route === 'search') html = renderSearchPage(state);
    else html = renderHomePage(state);
    nodes.page.innerHTML = html;
    nodes.modalHost.innerHTML = [renderLoginModal(state), renderCustomerModal(state), renderProductModal(state, state.ui.selectedProductId ? state.commerce.catalog.productIndex[state.ui.selectedProductId] : null)].join('');
    nodes.drawerHost.innerHTML = renderDrawer(state);
    nodes.toastHost.innerHTML = renderToasts(state);
    nodes.theme.innerHTML = renderThemeSwitcher(state);
    setTheme(state.ui.theme);
    syncBodyShellHeight();
    applyBodyFlags();
    if (focusSnapshot) restoreSearchFocus(focusSnapshot);
    markPerf(renderEnd);
    measurePerf(`render:${route}`, renderStart, renderEnd);
  }

  function applyBodyFlags() {
    const state = store.getState();
    const route = state.app.route.name;
    const drawerOpen = Boolean(state.ui.drawerOpen);
    const modalOpen = Boolean(state.ui.activeModal);
    const checkoutRoute = route === 'checkout';
    nodes.search.classList.toggle('is-hidden', true);
    nodes.theme.classList.toggle('is-hidden', route !== 'home' || checkoutRoute);
    nodes.hero.classList.toggle('is-hidden', route !== 'home' || checkoutRoute);
    nodes.banner.classList.toggle('is-hidden', false);
    nodes.footer.classList.toggle('is-hidden', checkoutRoute);
    document.body.classList.toggle('body--overlay', ['login', 'register'].includes(route));
    document.body.classList.toggle('body--checkout', checkoutRoute);
    document.body.classList.toggle('body--drawer-open', drawerOpen);
    document.body.classList.toggle('body--modal-open', modalOpen);
  }

  schedulerRef = scheduler;
  store.subscribe((_, meta = {}) => {
    const dirty = Array.isArray(meta.dirty) && meta.dirty.length ? meta.dirty : ['header', 'theme', 'search', 'hero', 'footer', 'page', 'drawer', 'modals', 'toast'];
    scheduler.schedule(...dirty);
  });

  bindInteractions(store, api, (...keys) => scheduler.schedule(...keys));

  window.addEventListener('hashchange', () => {
    createHydrationSession();
    const current = store.getState();
    const nextRoute = parseRoute(location.hash);
    store.patch({
      app: { ...current.app, route: nextRoute },
      ui: { ...current.ui, accountMenuOpen: false, activeModal: null, drawerOpen: false },
    });
    if (nextRoute.name === 'company' && nextRoute.params?.companyId) {
      void ensureCompanyCatalogLoaded(store, api, nextRoute.params.companyId);
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      store.patch({ ui: { ...store.getState().ui, drawerOpen: false, activeModal: null, accountMenuOpen: false } });
      scheduler.schedule('drawer', 'modals', 'header');
    }
  });

  window.addEventListener('resize', () => syncBodyShellHeight(), { passive: true });

  const runtimeModeQuery = typeof window.matchMedia === 'function' ? window.matchMedia('(display-mode: standalone)') : null;
  if (runtimeModeQuery) {
    const syncRuntimeMode = () => {
      const nextMode = detectRuntimeMode();
      const currentTheme = store.getState().ui.theme;
      store.patch({ ui: { ...store.getState().ui, runtimeMode: nextMode } }, { silent: true });
      applyRuntimeMode(nextMode, currentTheme);
      setTheme(currentTheme);
    };
    if (typeof runtimeModeQuery.addEventListener === 'function') runtimeModeQuery.addEventListener('change', syncRuntimeMode);
    else if (typeof runtimeModeQuery.addListener === 'function') runtimeModeQuery.addListener(syncRuntimeMode);
    syncRuntimeMode();
  }

  // Initial route
  createHydrationSession();
  store.patch({ app: { ...store.getState().app, route: parseRoute(location.hash || '#home') } });

  // Hydrate catalog and dependent runtime
  store.update((draft) => {
    draft.runtime.loading.catalog = true;
    draft.runtime.loading.session = false;
    draft.runtime.loading.authority = false;
    draft.runtime.loading.pricing = false;
    draft.runtime.lifecycle.sessionRestored = true;
    draft.runtime.lifecycle.authorityResolved = true;
    if (draft.app.route.name === 'company' && draft.app.route.params?.companyId) {
      draft.runtime.loading.company = String(draft.app.route.params.companyId);
      draft.runtime.lifecycle.companyProductsLoading = true;
      draft.runtime.lifecycle.companyProductsReady = false;
      draft.runtime.lifecycle.companyProductsFailed = false;
    }
  });
  renderContent();
  markPerf('boot:shell:rendered');
  await yieldToPaint();
  measurePerf('boot:shell', 'boot:start', 'boot:shell:rendered');
  void (async () => {
    try { purgeLegacyStorage(); } catch { /* noop */ }
  })();
  setRuntimePhase(store, RUNTIME_PHASES.HYDRATING_RUNTIME, {
    catalogReady: false,
    offersReady: false,
    flashOffersReady: false,
    companiesReady: false,
    pricingReady: false,
    cartSynced: false,
  });
  markPerf('boot:catalog:start');
  const cachedCatalog = loadJSON(storageKeys.catalog, null);
  const initialCatalog = mergeCatalogSnapshots(cachedCatalog, null);
  const initialTier = normalizeTierName(store.getState().commerce.selectedTier) || normalizeTierName(initialCatalog.tiers?.find((tier) => tier.is_default)?.tier_name) || normalizeTierName(initialCatalog.tiers?.[0]?.tier_name) || 'base';
  const initialCart = hydrateCart();
  const initialFlashState = computeFlashState((initialCatalog.offers && initialCatalog.offers.flash) || []);
  store.patch({
    commerce: {
      ...store.getState().commerce,
      catalog: { ...createEmptyCatalog(), ...initialCatalog, offers: initialCatalog.offers || { daily: [], flash: [] } },
      selectedTier: initialTier,
      priceBook: { tierName: initialTier, products: {} },
      cart: initialCart,
    },
    runtime: { ...store.getState().runtime, loading: { ...store.getState().runtime.loading, catalog: false, pricing: false }, flashState: initialFlashState },
    app: { ...store.getState().app, lastError: null },
  });
  setRuntimePhase(store, RUNTIME_PHASES.READY, {
    locked: false,
    catalogReady: Boolean(catalogHasMeaningfulData(initialCatalog)),
    offersReady: Boolean(initialCatalog.offers?.daily?.length || initialCatalog.offers?.flash?.length),
    flashOffersReady: Boolean(initialCatalog.offers?.flash?.length),
    companiesReady: Boolean(initialCatalog.companies?.length),
    pricingReady: Boolean(initialCatalog.products?.length),
    cartSynced: false,
    companyProductsReady: Boolean(store.getState().runtime.lifecycle?.companyProductsReady),
    companyProductsLoading: false,
    companyProductsFailed: Boolean(store.getState().runtime.lifecycle?.companyProductsFailed),
  });
  store.update((draft) => {
    draft.runtime.loading.catalog = false;
    draft.runtime.loading.company = null;
    draft.runtime.loading.customers = false;
    draft.runtime.loading.invoices = false;
    draft.runtime.loading.pricing = false;
    draft.runtime.loading.session = false;
    draft.runtime.loading.authority = false;
  }, { silent: true });
  scheduler.flush();
  store.patch({ app: { ...store.getState().app, ready: true } });
  scheduler.schedule('header', 'theme', 'banner', 'search', 'hero', 'page', 'footer', 'drawer', 'modals', 'toast');
  markPerf('boot:ready');
  void (async () => {
    await yieldToIdle();
    if (!isHydrationSessionActive(bootHydrationSession) || !isRuntimeScopeActive(bootScope)) return;
    await hydrateGovernanceRuntime(store, api, bootScope);
  })();

  const initialRoute = store.getState().app.route;
  if (initialRoute.name === 'company' && initialRoute.params?.companyId) {
    void ensureCompanyCatalogLoaded(store, api, initialRoute.params.companyId);
  }

  const bootTier = initialTier;
  const bootHydrationSession = hydrationSessionVersion;
  const bootScope = captureRuntimeScope(store);
  void (async () => {
    markPerf('boot:catalog:critical:start');
    try {
      const liveCatalog = await loadHomeCatalog(api, bootTier, { includeTop: false, criticalOnly: true }).catch(() => null);
      if (!liveCatalog || !isHydrationSessionActive(bootHydrationSession) || !isRuntimeScopeActive(bootScope)) {
        markPerf('boot:catalog:critical:failed');
        return;
      }
      const currentTier = normalizeTierName(store.getState().commerce.selectedTier) || bootTier;
      if (!isRuntimeScopeActive(bootScope) || currentTier !== bootTier) {
        markPerf('boot:catalog:critical:skipped');
        return;
      }
      const mergedCatalog = mergeCatalogSnapshots(cachedCatalog, liveCatalog);
      if (!isRuntimeScopeActive(bootScope)) return;
      const flashState = computeFlashState((mergedCatalog.offers && mergedCatalog.offers.flash) || []);
      const runtimeProducts = mergedCatalog.productIndex || {};
      const cart = store.getState().commerce.cart || [];
      const reconciledCart = Object.keys(runtimeProducts).length ? recalcCart(cart, runtimeProducts) : cart;
      store.patch({
        commerce: {
          ...store.getState().commerce,
          catalog: { ...createEmptyCatalog(), ...mergedCatalog, offers: mergedCatalog.offers || { daily: [], flash: [] } },
          selectedTier: bootTier,
          priceBook: { tierName: bootTier, products: {} },
          cart: reconciledCart,
        },
        runtime: { ...store.getState().runtime, flashState },
      }, { silent: true });
      setRuntimeLifecycle(store, {
        catalogReady: true,
        offersReady: Boolean(mergedCatalog.offers?.daily?.length || mergedCatalog.offers?.flash?.length),
        flashOffersReady: Boolean(mergedCatalog.offers?.flash?.length),
        companiesReady: Boolean(mergedCatalog.companies?.length),
        pricingReady: Boolean(mergedCatalog.products?.length),
        cartSynced: true,
      });
      setRuntimePhase(store, RUNTIME_PHASES.READY, {
        locked: false,
        catalogReady: true,
        offersReady: Boolean(mergedCatalog.offers?.daily?.length || mergedCatalog.offers?.flash?.length),
        flashOffersReady: Boolean(mergedCatalog.offers?.flash?.length),
        companiesReady: Boolean(mergedCatalog.companies?.length),
        pricingReady: Boolean(mergedCatalog.products?.length),
        cartSynced: true,
        companyProductsReady: Boolean(store.getState().runtime.lifecycle?.companyProductsReady),
        companyProductsLoading: false,
        companyProductsFailed: Boolean(store.getState().runtime.lifecycle?.companyProductsFailed),
      });
      persistSelectedTier(bootTier);
      persistCart(reconciledCart);
      if (catalogHasMeaningfulData(mergedCatalog)) {
        saveJSON(storageKeys.catalog, compactCatalogForStorage(mergedCatalog));
      }
      scheduler.schedule('page', 'hero', 'header', 'toast');
      markPerf('boot:catalog:critical:success');
      measurePerf('boot:catalog:critical', 'boot:catalog:critical:start', 'boot:catalog:critical:success');
    } catch (error) {
      console.error(error);
      markPerf('boot:catalog:critical:failed');
      measurePerf('boot:catalog:critical', 'boot:catalog:critical:start', 'boot:catalog:critical:failed');
    }
  })();

  void (async () => {
    await yieldToIdle();
    if (!isHydrationSessionActive(bootHydrationSession) || !isRuntimeScopeActive(bootScope)) return;
    markPerf('boot:catalog:supplementary:start');
    try {
      const supplementary = await loadHomeSupplementary(api, { includeTop: true }).catch(() => null);
      if (!supplementary || !isHydrationSessionActive(bootHydrationSession) || !isRuntimeScopeActive(bootScope)) {
        markPerf('boot:catalog:supplementary:failed');
        return;
      }
      const currentCatalog = cloneCatalogSnapshot(store.getState().commerce.catalog);
      const mergedCatalog = mergeCatalogSnapshots(currentCatalog, supplementary);
      if (!isRuntimeScopeActive(bootScope)) return;
      const flashState = computeFlashState((mergedCatalog.offers && mergedCatalog.offers.flash) || []);
      store.patch({
        commerce: {
          ...store.getState().commerce,
          catalog: { ...createEmptyCatalog(), ...mergedCatalog, offers: mergedCatalog.offers || { daily: [], flash: [] } },
        },
        runtime: { ...store.getState().runtime, flashState },
      }, { silent: true });
      setRuntimeLifecycle(store, {
        offersReady: true,
        flashOffersReady: true,
        companiesReady: true,
        pricingReady: true,
      });
      setRuntimePhase(store, RUNTIME_PHASES.READY, {
        locked: false,
        catalogReady: true,
        offersReady: true,
        flashOffersReady: true,
        companiesReady: true,
        pricingReady: true,
        cartSynced: true,
        companyProductsReady: Boolean(store.getState().runtime.lifecycle?.companyProductsReady),
        companyProductsLoading: false,
        companyProductsFailed: Boolean(store.getState().runtime.lifecycle?.companyProductsFailed),
      });
      scheduler.schedule('page', 'hero', 'header', 'toast');
      markPerf('boot:catalog:supplementary:success');
      measurePerf('boot:catalog:supplementary', 'boot:catalog:supplementary:start', 'boot:catalog:supplementary:success');
    } catch (error) {
      console.error(error);
      markPerf('boot:catalog:supplementary:failed');
      measurePerf('boot:catalog:supplementary', 'boot:catalog:supplementary:start', 'boot:catalog:supplementary:failed');
    }
  })();

  // Hydrate auxiliary data without blocking first paint
  void (async () => {
    await yieldToIdle();
    if (!isHydrationSessionActive(bootHydrationSession) || !isRuntimeScopeActive(bootScope)) return;
    try {
      const session = store.getState().auth.session;
      if (session?.userType === 'rep') {
        if (!isRuntimeScopeActive(bootScope)) return;
        store.update((draft) => { draft.runtime.loading.customers = true; });
        await loadCustomersIntoState(store, api, session);
      }
      if (!isRuntimeScopeActive(bootScope)) return;
      store.update((draft) => { draft.runtime.loading.invoices = true; });
      await loadInvoicesIntoState(store, api);
      scheduler.schedule('page', 'toast');
    } catch (error) {
      console.error(error);
    } finally {
      store.update((draft) => {
        draft.runtime.loading.customers = false;
        draft.runtime.loading.invoices = false;
      }, { silent: true });
      if (isRuntimeScopeActive(bootScope)) scheduler.schedule('page');
    }
  })();

  measurePerf('boot:startup', 'boot:start', 'boot:ready');

  setInterval(() => {
    const state = store.getState();
    const offers = state.commerce.catalog.offers.flash || [];
    const flashState = computeFlashState(offers);
    store.patch({ runtime: { ...state.runtime, flashState, flashTick: Date.now() } }, { dirty: ['hero', 'header'] });
    if (state.app.route.name === 'home') scheduler.schedule('hero', 'header');
  }, 1000);

  return { store, api, scheduler };
}
