import { readConfig } from '../core/config.js';
import { dom } from '../core/dom.js';
import { parseRoute, navigate } from '../core/router.js';
import { createEmitter, createRenderLoop } from '../core/events.js';
import { createStore } from '../state/store.js';
import { createInitialState } from '../state/defaultState.js';
import { computeCartTotals, getSelectedTier } from '../state/selectors.js';
import { createApiClient } from '../services/apiClient.js';
import { loadHomeCatalog, loadCompanyCatalog, aggregateRuntimeProducts, projectRuntimeProducts } from '../services/catalogService.js';
import { buildPriceBook, persistSelectedTier, resolveProductUnit, syncCartPrices, normalizeTierName } from '../services/pricingService.js';
import { addProductToCart, clearCart, computeTotals, hydrateCart, persistCart, recalcCart, removeItem, toggleOfferInCart, updateQty } from '../services/cartService.js';
import { login, logout, registerCustomer, normalizeUserType, normalizeSessionRecord } from '../services/authService.js';
import { loadRepCustomers, createCustomer, persistSelectedCustomer } from '../services/customerService.js';
import { computeFlashState } from '../services/offerService.js';
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
import { renderCartPage, renderCheckoutPage } from '../pages/cartCheckoutPages.js';
import { renderLoginPage, renderRegisterPage } from '../pages/authPages.js';
import { renderCustomersPage, renderInvoicesPage, renderAccountPage } from '../pages/customerPages.js';
import { storageKeys, saveJSON, loadJSON, removeValue, purgeLegacyStorage } from '../core/storage.js';

function createInitialData() {
  return createInitialState();
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

function setTheme(theme) {
  const next = THEME_NAMES.has(theme) ? theme : DEFAULT_THEME;
  document.body.dataset.theme = next;
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
  const state = store.getState();
  const cachedRows = state.runtime.companyRowsCache?.[trimmed];
  if (Array.isArray(cachedRows) && cachedRows.length > 0) return;
  const requestToken = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  companyHydrationTokens.set(trimmed, requestToken);
  store.update((draft) => {
    draft.runtime.loading.company = trimmed;
    draft.runtime.companyErrors[trimmed] = null;
  }, { dirty: ['page'] });
  try {
    const companyCatalog = await loadCompanyCatalog(api, trimmed, store.getState().commerce.selectedTier || null);
    if (companyHydrationTokens.get(trimmed) !== requestToken) return;
    const rows = Array.isArray(companyCatalog.rows) ? companyCatalog.rows : [];
    if (!rows.length && !(Array.isArray(cachedRows) && cachedRows.length > 0)) {
      store.update((draft) => {
        draft.runtime.loading.company = null;
        draft.runtime.companyErrors[trimmed] = null;
      }, { dirty: ['page'] });
      return;
    }
    store.update((draft) => {
      if (rows.length > 0) {
        draft.runtime.companyRowsCache[trimmed] = rows;
      }
      const rebuilt = rebuildLoadedCompanyCatalog({ getState: () => draft });
      draft.commerce.catalog.productIndex = rebuilt.productIndex;
      draft.commerce.catalog.products = rebuilt.products;
      draft.commerce.priceBook = rebuilt.priceBook;
      draft.runtime.loading.company = null;
      draft.runtime.companyErrors[trimmed] = null;
      draft.commerce.cart = syncCartPrices(draft.commerce.cart, draft.commerce.catalog.productIndex);
    }, { dirty: ['page', 'drawer', 'modals', 'header'] });
    const cache = loadJSON(storageKeys.companyRowsCache, {});
    if (rows.length > 0) {
      saveJSON(storageKeys.companyRowsCache, { ...(cache && typeof cache === 'object' ? cache : {}), [trimmed]: rows });
    }
    persistCart(store.getState().commerce.cart);
  } catch (error) {
    if (companyHydrationTokens.get(trimmed) !== requestToken) return;
    const cache = loadJSON(storageKeys.companyRowsCache, {});
    const fallbackRows = cache && typeof cache === 'object' && Array.isArray(cache[trimmed]) ? cache[trimmed] : [];
    if (fallbackRows.length) {
      store.update((draft) => {
        draft.runtime.companyRowsCache[trimmed] = fallbackRows;
        const rebuilt = rebuildLoadedCompanyCatalog({ getState: () => draft });
        draft.commerce.catalog.productIndex = rebuilt.productIndex;
        draft.commerce.catalog.products = rebuilt.products;
        draft.commerce.priceBook = rebuilt.priceBook;
        draft.runtime.loading.company = null;
        draft.runtime.companyErrors[trimmed] = null;
        draft.commerce.cart = syncCartPrices(draft.commerce.cart, draft.commerce.catalog.productIndex);
      }, { dirty: ['page', 'drawer', 'modals', 'header'] });
      persistCart(store.getState().commerce.cart);
      return;
    }
    store.update((draft) => {
      draft.runtime.loading.company = null;
      draft.runtime.companyErrors[trimmed] = null;
    }, { dirty: ['page'] });
    return;
  }
}

function bootstrapShell(root) {
  root.innerHTML = shellTemplate();
}

function getNodes() {
  return {
    header: dom.q('#appHeader'),
    search: dom.q('#appSearch'),
    banner: dom.q('#appBanner'),
    theme: dom.q('#appTheme'),
    hero: dom.q('#appHero'),
    page: dom.q('#appPage'),
    footer: dom.q('#appFooter'),
    drawerHost: dom.q('#appDrawerHost'),
    modalHost: dom.q('#appModalHost'),
    toastHost: dom.q('#appToastHost'),
  };
}

function renderPage(state, nodes) {
  const route = state.app.route;
  const tier = getSelectedTier(state);

  renderHeader(nodes.header, state);
  renderBanner(nodes.banner, state);
  renderThemeSwitcher(nodes.theme, state);
  renderHero(nodes.hero, state, { mode: route.name === 'home' ? 'home' : 'none' });
  renderSearchBar(nodes.search, state, { routeName: route.name, show: false });
  renderFooter(nodes.footer, state);

  let pageHtml = '';
  switch (route.name) {
    case 'home': pageHtml = renderHomePage(state); break;
    case 'companies': pageHtml = renderCompaniesPage(state); break;
    case 'company': pageHtml = renderCompanyPage(state); break;
    case 'offers': pageHtml = renderOffersPage(state); break;
    case 'tiers': pageHtml = renderTiersPage(state); break;
    case 'cart': pageHtml = renderCartPage(state); break;
    case 'checkout': pageHtml = renderCheckoutPage(state); break;
    case 'login': pageHtml = renderLoginPage(state); break;
    case 'register': pageHtml = renderRegisterPage(state); break;
    case 'customers': pageHtml = renderCustomersPage(state); break;
    case 'invoices': pageHtml = renderInvoicesPage(state); break;
    case 'account': pageHtml = renderAccountPage(state); break;
    case 'search': pageHtml = renderSearchPage(state); break;
    default: pageHtml = renderHomePage(state); break;
  }
  nodes.page.innerHTML = pageHtml;

  const activeProduct = state.ui.activeProduct ? state.commerce.catalog.productIndex[state.ui.activeProduct] : null;
  nodes.modalHost.innerHTML = [renderLoginModal(state), renderCustomerModal(state), renderProductModal(state, activeProduct)].join('');
  nodes.drawerHost.innerHTML = renderDrawer(state);
  nodes.toastHost.innerHTML = renderToasts(state);

  applyShellVisibility(route, nodes);
  syncBodyShellHeight();
}

function applyShellVisibility(route, nodes) {
  nodes.banner.classList.toggle('is-hidden', false);
  nodes.search.classList.toggle('is-hidden', true);
  nodes.hero.classList.toggle('is-hidden', route.name !== 'home');
  nodes.footer.classList.toggle('is-hidden', false);
}

function syncBodyShellHeight() {
  const footer = dom.q('#appFooter');
  const height = footer ? Math.ceil(footer.getBoundingClientRect().height || 0) : 0;
  document.documentElement.style.setProperty('--footer-height', `${height}px`);
}

function bindInteractions(store, api, schedule) {
  document.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-action], [data-modal], [data-close]');
    if (!target) return;
    const action = target.getAttribute('data-action');
    const state = store.getState();
    const tier = getSelectedTier(state);

    if (action === 'navigate-home') return navigateAuthority(store, 'home');
    if (action === 'go-companies') return navigateAuthority(store, 'companies');
    if (action === 'go-offers') return navigateAuthority(store, 'offers');
    if (action === 'go-tiers') return navigateAuthority(store, 'tiers');
    if (action === 'go-search') return navigateAuthority(store, 'search');
    if (action === 'go-back') { if (history.length > 1) history.back(); else navigateAuthority(store, 'home'); return; }
    if (action === 'go-cart') { store.patch({ ui: { ...store.getState().ui, drawerOpen: false } }); schedule('drawer', 'header', 'page'); return; }
    if (action === 'go-checkout') {
      if (state.auth.session?.userType === 'rep' && !state.auth.selectedCustomer) {
        setPendingFlow(store, { name: 'checkout', resumeRoute: 'checkout', resumeMessage: 'يرجى مراجعة تفاصيل الطلب قبل الإرسال' });
        notify(store, 'warning', 'يجب اختيار العميل أولًا', 'اختر العميل ثم ستنتقل مباشرة إلى مراجعة الطلب');
        return navigateAuthority(store, 'customers');
      }
      return navigateAuthority(store, 'checkout');
    }
    if (action === 'go-login') return navigateAuthority(store, 'login');
    if (action === 'go-register') return navigateAuthority(store, 'register');
    if (action === 'go-customers') return navigateAuthority(store, 'customers');
    if (action === 'go-invoices') return navigateAuthority(store, 'invoices');
    if (action === 'go-account') return navigateAuthority(store, 'account');
    if (action === 'go-flash') return navigateAuthority(store, 'offers');
    if (action === 'clear-search') { store.patch({ ui: { ...state.ui, search: '' } }); clearTimeout(searchTypingTimer); schedule('header', 'theme', 'banner', 'hero', 'page', 'search'); return; }
    if (action === 'set-theme') {
      const nextTheme = String(target.getAttribute('data-theme') || '').trim();
      if (!THEME_NAMES.has(nextTheme)) return;
      store.patch({ ui: { ...state.ui, theme: nextTheme } });
      saveJSON(storageKeys.theme, nextTheme);
      setTheme(nextTheme);
      scheduler.schedule('theme', 'header', 'banner', 'search', 'hero', 'page', 'footer');
      return;
    }
    if (action === 'toggle-account-menu') { store.patch({ ui: { ...state.ui, accountMenuOpen: !state.ui.accountMenuOpen, activeModal: null } }); schedule('header', 'modals'); return; }
    if (action === 'open-cart-drawer') { closeTransientSurfaces(store, { keepDrawer: false }); store.patch({ ui: { ...store.getState().ui, drawerOpen: true } }); schedule('drawer', 'header', 'modals'); return; }
    if (action === 'close-cart-drawer') { store.patch({ ui: { ...state.ui, drawerOpen: false } }); schedule('drawer'); return; }
    if (action === 'open-customer-modal') { closeTransientSurfaces(store, { keepDrawer: false }); store.patch({ ui: { ...store.getState().ui, activeModal: 'customer' } }); schedule('modals', 'header'); return; }
    if (action === 'close-modal') { store.patch({ ui: { ...state.ui, activeModal: null, selectedInvoiceId: null } }); schedule('modals'); return; }

    if (action === 'open-company') {
      const companyId = target.getAttribute('data-company-id');
      navigateAuthority(store, 'company', { companyId });
      void ensureCompanyCatalogLoaded(store, api, companyId);
      return;
    }

    if (action === 'select-customer') {
      const customerId = target.getAttribute('data-customer-id');
      const customer = (state.commerce.customers || []).find((item) => String(item.id) === String(customerId));
      if (!customer) return;
      store.update((draft) => {
        draft.auth.selectedCustomer = customer;
        draft.ui.activeModal = null;
        draft.ui.accountMenuOpen = false;
      }, { action: 'customer-select', dirty: ['page', 'header', 'modals'] });
      persistSelectedCustomer(customer);
      notify(store, 'success', 'تم اختيار العميل', customer.name || '');
      const pendingFlow = store.getState().ui.pendingFlow;
      if (pendingFlow?.name === 'checkout') {
        clearPendingFlow(store);
        notify(store, 'info', 'يرجى مراجعة تفاصيل الطلب قبل الإرسال', '');
        return navigateAuthority(store, 'checkout');
      }
      schedule('page', 'header', 'modals');
      return;
    }

    if (action === 'set-unit') {
      const productId = target.getAttribute('data-product-id');
      const unit = target.getAttribute('data-unit');
      store.update((draft) => { draft.commerce.unitPrefs[productId] = unit; draft.commerce.cart = syncCartPrices(draft.commerce.cart, draft.commerce.catalog.productIndex); }, { action: 'set-unit' });
      schedule('page', 'header', 'drawer');
      return;
    }

    if (action === 'toggle-product') {
      const productId = target.getAttribute('data-product-id');
      const product = state.commerce.catalog.productIndex[productId];
      if (!product) return;
      const quantity = Number(document.querySelector(`[data-role="product-qty"][data-product-id="${CSS.escape(productId)}"]`)?.value || state.commerce.qtyPrefs[productId] || 1);
      const result = addProductToCart(state.commerce.cart, product, tier, state.commerce.unitPrefs[productId], quantity);
      store.update((draft) => {
        draft.commerce.cart = result.cart;
        draft.commerce.qtyPrefs[productId] = Math.max(1, Number(quantity || 1));
      }, { action: 'cart-toggle' });
      persistCart(result.cart);
      notify(store, result.added ? 'success' : 'info', result.added ? 'تمت الإضافة' : 'تمت الإزالة', product.product_name);
      appendBehaviorEvent(result.added ? 'cart.add' : 'cart.remove', { productId });
      schedule('header', 'banner', 'page', 'drawer');
      return;
    }

    if (action === 'toggle-deal' || action === 'toggle-flash') {
      const id = Number(target.getAttribute('data-id'));
      const offers = action === 'toggle-deal' ? state.commerce.catalog.offers.daily : state.commerce.catalog.offers.flash;
      const offer = offers.find((item) => Number(item.id) === id);
      if (!offer) return;
      if (action === 'toggle-flash' && String(offer.runtime_status || offer.status || '').trim().toLowerCase() !== 'active') {
        notify(store, 'warning', 'انتهى العرض', 'لا يمكن الشراء بعد انتهاء الوقت');
        return;
      }
      const result = toggleOfferInCart(state.commerce.cart, offer, action === 'toggle-deal' ? 'deal' : 'flash');
      if (result.reason === 'OFFER_EXPIRED') {
        notify(store, 'warning', 'انتهى العرض', 'لا يمكن الشراء بعد انتهاء الوقت');
        return;
      }
      store.patch({ commerce: { ...state.commerce, cart: result.cart } });
      persistCart(result.cart);
      notify(store, result.added ? 'success' : 'info', result.added ? 'تمت الإضافة' : 'تمت الإزالة', offer.title);
      schedule('header', 'banner', 'page', 'drawer');
      return;
    }

    if (action === 'remove-item') {
      const key = target.getAttribute('data-key');
      const next = removeItem(state.commerce.cart, key);
      store.patch({ commerce: { ...state.commerce, cart: next } });
      persistCart(next);
      schedule('header', 'banner', 'page', 'drawer');
      return;
    }

    if (action === 'qty-up' || action === 'qty-down') {
      const key = target.getAttribute('data-key');
      const delta = action === 'qty-up' ? 1 : -1;
      const item = state.commerce.cart.find((row) => row.key === key);
      if (!item) return;
      const next = updateQty(state.commerce.cart, key, Number(item.qty || 1) + delta);
      store.patch({ commerce: { ...state.commerce, cart: next } });
      persistCart(next);
      schedule('header', 'banner', 'page', 'drawer');
      return;
    }

    if (action === 'product-qty-up' || action === 'product-qty-down') {
      const productId = target.getAttribute('data-product-id');
      const delta = action === 'product-qty-up' ? 1 : -1;
      const currentQty = Number(state.commerce.qtyPrefs[productId] || findCartProductItem(state.commerce.cart, productId)?.qty || 1);
      const nextQty = Math.max(1, currentQty + delta);
      const item = findCartProductItem(state.commerce.cart, productId);
      if (item) {
        const nextCart = updateQty(state.commerce.cart, item.key, nextQty);
        store.update((draft) => {
          draft.commerce.cart = nextCart;
          draft.commerce.qtyPrefs[productId] = nextQty;
        }, { action: 'product-qty-sync', dirty: ['page', 'drawer', 'header', 'modals'] });
        persistCart(nextCart);
      } else {
        store.update((draft) => {
          draft.commerce.qtyPrefs[productId] = nextQty;
        }, { action: 'product-qty-pref', silent: true });
      }
      schedule('page', 'drawer', 'header', 'modals');
      return;
    }

    if (action === 'select-tier') {
      const tierName = normalizeTierName(target.getAttribute('data-tier-name'));
      const current = getSelectedTier(state);
      const nextTier = normalizeTierName(current.tier_name) === tierName ? state.commerce.catalog.tiers.find((tier) => tier.is_default) || state.commerce.catalog.tiers[0] : state.commerce.catalog.tiers.find((tier) => normalizeTierName(tier.tier_name) === tierName);
      const selectedTier = normalizeTierName(nextTier?.tier_name || null) || null;
      const currentState = store.getState();
      const homeCatalog = await loadHomeCatalog(api, selectedTier);
      const rebuilt = rebuildLoadedCompanyCatalog({ getState: () => ({ ...currentState, commerce: { ...currentState.commerce, catalog: { ...homeCatalog, productIndex: homeCatalog.productIndex, products: homeCatalog.products } }, runtime: currentState.runtime }) }, selectedTier);
      const refreshedCart = recalcCart(currentState.commerce.cart, rebuilt.productIndex);
      store.update((draft) => {
        draft.commerce.selectedTier = selectedTier;
        draft.commerce.catalog = { ...draft.commerce.catalog, ...homeCatalog, top: homeCatalog.top, catalogProducts: homeCatalog.catalogProducts || [] };
        draft.commerce.catalog.productIndex = rebuilt.productIndex;
        draft.commerce.catalog.products = rebuilt.products;
        draft.commerce.priceBook = rebuilt.priceBook;
        draft.commerce.cart = refreshedCart;
      }, { action: 'select-tier', dirty: ['header', 'page', 'drawer', 'hero'] });
      persistSelectedTier(selectedTier);
      persistCart(refreshedCart);
      notify(store, 'success', 'تمت الشريحة', nextTier?.visible_label || 'الشريحة الرئيسية');
      schedule('header', 'banner', 'page', 'drawer', 'hero');
      return;
    }

    if (action === 'submit-checkout') {
      const validation = validateCheckout(store.getState(), getSelectedTier(store.getState()), computeCartTotals(store.getState()));
      if (!validation.ok) {
        if (validation.code === 'NO_SESSION') {
          setPendingFlow(store, { name: 'checkout', resumeRoute: 'checkout', resumeMessage: 'يرجى مراجعة تفاصيل الطلب قبل الإرسال' });
          notify(store, 'warning', 'يجب تسجيل الدخول أولًا', 'سجل الدخول ثم ستعود مباشرة إلى إتمام الطلب');
          navigateAuthority(store, 'login');
          return;
        }
        if (validation.code === 'NO_CUSTOMER') {
          setPendingFlow(store, { name: 'checkout', resumeRoute: 'checkout', resumeMessage: 'يرجى مراجعة تفاصيل الطلب قبل الإرسال' });
          notify(store, 'warning', 'يجب اختيار العميل أولًا', 'اختر العميل ثم ستعود مباشرة إلى إتمام الطلب');
          navigateAuthority(store, 'customers');
          return;
        }
        notify(store, 'warning', 'تعذر الإرسال', validation.message);
        return;
      }
      const next = await performCheckout(store, api, schedule);
      if (next) schedule('header', 'banner', 'page', 'drawer', 'modals');
      return;
    }

    if (action === 'refresh-catalog') {
      notify(store, 'info', 'جارٍ التحديث', 'تم إيقاف زر الإصلاح اليدوي');
      return;
    }

    if (action === 'refresh-invoices') {
      await loadInvoicesIntoState(store, api);
      schedule('page');
      return;
    }

    if (action === 'logout') {
      logout();
      persistSelectedCustomer(null);
      store.patch({ auth: { ...state.auth, session: null, selectedCustomer: null }, ui: { ...state.ui, accountMenuOpen: false, activeModal: null, selectedInvoiceId: null, pendingFlow: null } });
      notify(store, 'info', 'تم الخروج', '');
      schedule('header', 'banner', 'page', 'drawer');
      navigateAuthority(store, 'home');
      return;
    }

    if (action === 'open-product') {
      const productId = target.getAttribute('data-product-id');
      closeTransientSurfaces(store, { keepDrawer: false });
      store.patch({ ui: { ...store.getState().ui, activeModal: 'product', selectedProductId: productId } });
      schedule('modals');
      return;
    }

    if (action === 'view-invoice') {
      const invoiceId = target.getAttribute('data-invoice-id');
      const invoice = (store.getState().commerce.invoices || []).find((item) => String(item.id) === String(invoiceId));
      if (!invoice) return;
      let items = store.getState().commerce.invoiceItemsById?.[String(invoiceId)] || [];
      if (!items.length) {
        items = await api.get('order_items', {
          select: 'id,order_id,product_id,type,qty,price,unit,created_at',
          order_id: `eq.${invoiceId}`,
          order: 'created_at.asc',
        }).catch(() => []);
        items = Array.isArray(items) ? items : [];
        const names = new Map(Object.values(store.getState().commerce.catalog.productIndex || {}).map((row) => [String(row.product_id), row.product_name || '']));
        items = items.map((item) => ({
          ...item,
          title: item.title || names.get(String(item.product_id)) || item.product_id,
        }));
      }
      store.update((draft) => {
        draft.ui.activeModal = 'invoice';
        draft.ui.selectedInvoiceId = invoiceId;
        if (!draft.commerce.invoiceItemsById) draft.commerce.invoiceItemsById = {};
        draft.commerce.invoiceItemsById[String(invoiceId)] = items;
      }, { dirty: ['modals'] });
      schedule('modals');
      return;
    }

    if (action === 'open-offer') {
      navigateAuthority(store, 'offers');
      return;
    }

    if (action === 'toast-action') {
      return;
    }

    if (action === 'navigate-back-home') {
      return navigateAuthority(store, 'home');
    }
  });

  document.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const state = store.getState();
    if (target.id === 'searchInput') {
      store.patch({ ui: { ...state.ui, search: target.value } }, { silent: true });
      appendBehaviorEvent('search.query', { query: target.value.slice(0, 64) });
      clearTimeout(searchTypingTimer);
      searchTypingTimer = setTimeout(() => schedule('page', 'search'), SEARCH_DEBOUNCE_MS);
      return;
    }
    if (target.getAttribute('data-role') === 'product-qty') {
      const cleaned = String(target.value || '').replace(/[^0-9]/g, '');
      if (cleaned !== target.value) target.value = cleaned;
      return;
    }
    if (target.getAttribute('data-role') === 'cart-qty') {
      const key = target.getAttribute('data-key');
      const qty = Math.max(1, Number(target.value || 1));
      store.update((draft) => { draft.commerce.cart = updateQty(draft.commerce.cart, key, qty); }, { action: 'cart-qty-update', dirty: ['page', 'drawer', 'header'] });
      persistCart(store.getState().commerce.cart);
      schedule('header', 'banner', 'page', 'drawer');
      return;
    }
  });

  document.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.getAttribute('data-role') !== 'product-qty') return;
    const productId = target.getAttribute('data-product-id');
    const raw = String(target.value || '').replace(/[^0-9]/g, '');
    const qty = Math.max(1, Number(raw || 1));
    store.update((draft) => {
      draft.commerce.qtyPrefs[productId] = qty;
    }, { action: 'qty-update', silent: true });
  });

  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const formType = form.getAttribute('data-form');
    if (!formType) return;
    event.preventDefault();

    if (formType === 'login') {
      const identifier = String(form.identifier?.value || '').trim();
      const password = String(form.password?.value || '').trim();
      if (!identifier || !password) {
        notify(store, 'warning', 'بيانات ناقصة', 'أدخل بيانات الدخول كاملة');
        return;
      }
      try {
        const pendingFlow = store.getState().ui.pendingFlow;
        const session = normalizeSessionRecord(await login(api, identifier, password));
        store.patch({ auth: { ...store.getState().auth, session, selectedCustomer: null }, ui: { ...store.getState().ui, activeModal: null, accountMenuOpen: false } });
        saveJSON(storageKeys.session, session);
        persistSelectedCustomer(null);
        notify(store, 'success', 'تم الدخول', session.name || session.username || '');
        if (session.userType === 'rep') {
          await loadCustomersIntoState(store, api, session);
        }
        await loadInvoicesIntoState(store, api);
        if (pendingFlow?.name === 'checkout' && session.userType === 'rep') {
          setPendingFlow(store, pendingFlow);
          notify(store, 'info', 'يجب اختيار العميل أولًا', 'اختر العميل ثم ستعود مباشرة إلى إتمام الطلب');
          navigateAuthority(store, 'customers');
        } else if (pendingFlow?.name === 'checkout') {
          clearPendingFlow(store);
          notify(store, 'info', 'يرجى مراجعة تفاصيل الطلب قبل الإرسال', '');
          navigateAuthority(store, 'checkout');
        } else {
          clearPendingFlow(store);
          navigateAuthority(store, 'home');
        }
        schedule('header', 'banner', 'page', 'drawer', 'search', 'hero');
      } catch (error) {
        notify(store, 'error', 'يرجى التحقق من اسم المستخدم وكلمة المرور', '');
      }
      return;
    }

    if (formType === 'register') {
      const payload = {
        name: String(form.name?.value || '').trim(),
        phone: String(form.phone?.value || '').trim(),
        password: String(form.password?.value || '').trim(),
        address: String(form.address?.value || '').trim(),
        business_name: String(form.businessName?.value || '').trim(),
        location: String(form.location?.value || '').trim(),
      };
      if (payload.name.split(/\s+/).filter(Boolean).length < 2) return notify(store, 'warning', 'الاسم غير مكتمل', 'اكتب الاسم بالكامل');
      if (!/^01\d{9}$/.test(payload.phone)) return notify(store, 'warning', 'رقم الهاتف غير صحيح', '');
      if (payload.password.length < 4) return notify(store, 'warning', 'كلمة المرور قصيرة', '');
      if (!payload.address) return notify(store, 'warning', 'العنوان مطلوب', '');
      try {
        const pendingFlow = store.getState().ui.pendingFlow;
        const session = normalizeSessionRecord(await registerCustomer(api, payload));
        store.patch({ auth: { ...store.getState().auth, session, selectedCustomer: null }, ui: { ...store.getState().ui, activeModal: null } });
        persistSelectedCustomer(null);
        notify(store, 'success', 'تم التسجيل', session.name || '');
        if (pendingFlow?.name === 'checkout') {
          clearPendingFlow(store);
          notify(store, 'info', 'يرجى مراجعة تفاصيل الطلب قبل الإرسال', '');
          navigateAuthority(store, 'checkout');
        } else {
          clearPendingFlow(store);
          navigateAuthority(store, 'home');
        }
        schedule('header', 'banner', 'page', 'drawer', 'search', 'hero');
      } catch (error) {
        notify(store, 'error', error.message === 'DUPLICATE_PHONE' ? 'الرقم مسجل بالفعل' : 'تعذر التسجيل');
      }
      return;
    }

    if (formType === 'customer-create') {
      const session = store.getState().auth.session;
      if (!session || session.userType !== 'rep') return notify(store, 'warning', 'المندوب فقط', '');
      const payload = {
        name: String(form.name?.value || '').trim(),
        phone: String(form.phone?.value || '').trim() || null,
        address: String(form.address?.value || '').trim() || null,
        customer_type: 'rep',
        sales_rep_id: session.id,
        created_by: session.id,
        created_by_rep_id: session.id,
        is_active: true,
      };
      if (!payload.name) return notify(store, 'warning', 'اسم العميل مطلوب', '');
      try {
        const customer = await createCustomer(api, payload);
        store.update((draft) => {
          draft.commerce.customers = [customer, ...(draft.commerce.customers || [])];
          draft.auth.selectedCustomer = customer;
          draft.ui.activeModal = null;
          draft.ui.accountMenuOpen = false;
        });
        persistSelectedCustomer(customer);
        notify(store, 'success', 'تمت الإضافة', customer.name || '');
        const pendingFlow = store.getState().ui.pendingFlow;
        if (pendingFlow?.name === 'checkout') {
          clearPendingFlow(store);
          notify(store, 'info', 'يرجى مراجعة تفاصيل الطلب قبل الإرسال', '');
          navigateAuthority(store, 'checkout');
        } else {
          schedule('page', 'header', 'modals');
        }
      } catch {
        notify(store, 'error', 'تعذر إضافة العميل', '');
      }
      return;
    }
  });
}

async function loadInvoicesIntoState(store, api) {
  const state = store.getState();
  const session = normalizeSessionRecord(state.auth.session);
  if (!session) {
    store.update((draft) => { draft.commerce.invoices = []; draft.runtime.loading.invoices = false; });
    return;
  }

  let rows = [];
  if (normalizeUserType(session.userType) === 'rep') {
    const customers = state.commerce.customers?.length ? state.commerce.customers : await loadRepCustomers(api, session.id).catch(() => []);
    const customerIds = Array.from(new Set((customers || []).map((customer) => String(customer.id || '').trim()).filter(Boolean)));
    const filters = [`sales_rep_id.eq.${session.id}`, `rep_id.eq.${session.id}`];
    if (customerIds.length) filters.push(`customer_id.in.(${customerIds.join(',')})`);
    rows = await api.get('orders', {
      select: 'id,order_number,invoice_number,created_at,total_amount,status,user_type,customer_id,user_id,sales_rep_id,rep_id,updated_at',
      or: `(${filters.join(',')})`,
      order: 'created_at.desc',
    }).catch(() => []);

    const customerNames = new Map((customers || []).map((customer) => [String(customer.id), customer.name || customer.phone || '']));
    rows = Array.isArray(rows) ? rows.map((row) => ({
      ...row,
      customer_name: customerNames.get(String(row.customer_id)) || row.customer_name || '',
    })) : [];
  } else {
    rows = await api.get('orders', {
      select: 'id,order_number,invoice_number,created_at,total_amount,status,user_type,customer_id,user_id,sales_rep_id,rep_id,updated_at',
      or: `(customer_id.eq.${session.id},user_id.eq.${session.id})`,
      order: 'created_at.desc',
    }).catch(() => []);
    rows = Array.isArray(rows) ? rows.map((row) => ({ ...row, customer_name: session.name || session.username || '' })) : [];
  }

  store.update((draft) => { draft.commerce.invoices = rows; draft.runtime.loading.invoices = false; });
  persistInvoices(rows);
}

async function loadCustomersIntoState(store, api, session = null) {
  const state = store.getState();
  const rep = session || state.auth.session;
  if (!rep || rep.userType !== 'rep') {
    store.update((draft) => { draft.commerce.customers = []; draft.runtime.loading.customers = false; });
    return;
  }
  const rows = await loadRepCustomers(api, rep.id);
  store.update((draft) => { draft.commerce.customers = rows; draft.runtime.loading.customers = false; });
}

async function performCheckout(store, api, schedule) {
  const state = store.getState();
  const tier = getSelectedTier(state);
  const totals = computeCartTotals(state);
  const validation = validateCheckout(state, tier, totals);
  if (!validation.ok) {
    notify(store, 'warning', 'تعذر الإرسال', validation.message);
    return false;
  }

  setCheckoutBusy(store, true);
  try {
    const result = await submitOrder(api, state, tier, totals);
    const invoice = {
      id: result.order.id,
      order_number: result.order.order_number,
      invoice_number: result.order.invoice_number,
      created_at: result.order.created_at || new Date().toISOString(),
      total_amount: result.order.total_amount,
      status: result.order.status,
      user_type: result.order.user_type,
      customer_id: result.order.customer_id,
      user_id: result.order.user_id,
      sales_rep_id: result.order.sales_rep_id,
      customer_name: result.customer?.name || state.auth.selectedCustomer?.name || state.auth.session?.name || '',
    };
    const whatsappUrl = buildWhatsAppInvoice({
      order: result.order,
      items: state.commerce.cart,
      session: state.auth.session,
      customer: result.customer,
      tierLabel: tier.visible_label || tier.tier_name,
      supportWhatsapp: api.config.supportWhatsapp,
    });
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    store.update((draft) => {
      draft.commerce.cart = [];
      draft.commerce.invoices = [invoice, ...(draft.commerce.invoices || [])];
      draft.ui.drawerOpen = false;
      draft.ui.activeModal = null;
      draft.ui.accountMenuOpen = false;
      draft.ui.pendingFlow = null;
    });
    clearCart();
    persistInvoices([invoice, ...(state.commerce.invoices || [])]);
    notify(store, 'success', 'تم إرسال الطلب', `فاتورة ${invoice.order_number || invoice.invoice_number || invoice.id}`);
    appendBehaviorEvent('checkout.submit', { orderId: invoice.id, total: totals.grand });
    schedule('header', 'banner', 'page', 'drawer');
    navigateAuthority(store, 'invoices');
    return true;
  } catch (error) {
    console.error(error);
    notify(store, 'error', 'فشل إرسال الطلب', '');
    return false;
  } finally {
    setCheckoutBusy(store, false);
  }
}

export async function bootstrapApp() {
  const config = readConfig();
  const api = createApiClient(config);
  const store = createStore(createInitialData());
  setTheme(store.getState().ui.theme);

  const bootState = store.getState();
  const bootId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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

  function renderContent() {
    const state = store.getState();
    const phase = state.runtime?.lifecycle?.phase || RUNTIME_PHASES.BOOTING;
    const focusSnapshot = state.app.route.name === 'search' ? captureSearchFocus() : null;
    const booting = !isRuntimeInteractive(state);
    if (booting) {
      const message = phase === RUNTIME_PHASES.FAILED
        ? (state.app.lastError || state.runtime?.lifecycle?.error || 'تعذر تهيئة النظام')
        : 'جارٍ تهيئة البيانات…';
      nodes.page.innerHTML = `<section class="page-section"><div class="empty-state">${message}</div></section>`;
      nodes.modalHost.innerHTML = '';
      nodes.drawerHost.innerHTML = '';
      nodes.toastHost.innerHTML = '';
      nodes.theme.innerHTML = '';
      setTheme(state.ui.theme);
      syncBodyShellHeight();
      applyBodyFlags();
      return;
    }
    const route = state.app.route.name;
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
    else if (route === 'account') html = renderAccountPage(state);
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

  // Initial route
  store.patch({ app: { ...store.getState().app, route: parseRoute(location.hash || '#home') } });

  // Hydrate catalog and dependent runtime
  store.update((draft) => {
    draft.runtime.loading.catalog = true;
    draft.runtime.loading.session = false;
    draft.runtime.loading.authority = false;
    draft.runtime.loading.pricing = false;
    draft.runtime.lifecycle.sessionRestored = true;
    draft.runtime.lifecycle.authorityResolved = true;
  });
  renderContent();
  purgeLegacyStorage();
  setRuntimePhase(store, RUNTIME_PHASES.HYDRATING_RUNTIME, {
    catalogReady: false,
    offersReady: false,
    flashOffersReady: false,
    companiesReady: false,
    pricingReady: false,
    cartSynced: false,
  });
  try {
    const cachedCatalog = loadJSON(storageKeys.catalog, null);
    const liveCatalog = await loadHomeCatalog(api, store.getState().commerce.selectedTier || null).catch(() => null);
    const catalog = mergeCatalogSnapshots(cachedCatalog, liveCatalog);
    const selectedTier = normalizeTierName(store.getState().commerce.selectedTier) || normalizeTierName(catalog.tiers?.find((tier) => tier.is_default)?.tier_name) || normalizeTierName(catalog.tiers?.[0]?.tier_name) || 'base';
    const cart = hydrateCart();
    const flashState = computeFlashState((catalog.offers && catalog.offers.flash) || []);
    store.patch({
      commerce: {
        ...store.getState().commerce,
        catalog: { ...createEmptyCatalog(), ...catalog, offers: catalog.offers || { daily: [], flash: [] } },
        selectedTier,
        priceBook: { tierName: selectedTier, products: {} },
        cart,
      },
      runtime: { ...store.getState().runtime, loading: { ...store.getState().runtime.loading, catalog: false, pricing: true }, flashState },
      app: { ...store.getState().app, lastError: null },
    });
    setRuntimePhase(store, RUNTIME_PHASES.SYNCING_CART, {
      catalogReady: true,
      offersReady: true,
      flashOffersReady: true,
      companiesReady: true,
      pricingReady: true,
    });
    const runtimeProducts = store.getState().commerce.catalog.productIndex || {};
    const reconciledCart = Object.keys(runtimeProducts).length ? recalcCart(cart, runtimeProducts) : cart;
    store.patch({ commerce: { ...store.getState().commerce, cart: reconciledCart } }, { silent: true });
    setRuntimeLifecycle(store, { cartSynced: true });
    persistSelectedTier(selectedTier);
    persistCart(reconciledCart);
    saveJSON(storageKeys.catalog, { ...catalog, offers: catalog.offers || { daily: [], flash: [] } });
    scheduler.schedule('page', 'toast');
  } catch (error) {
    console.error(error);
    const cachedCatalog = loadJSON(storageKeys.catalog, null);
    const fallbackCatalog = mergeCatalogSnapshots(cachedCatalog, null);
    const selectedTier = normalizeTierName(store.getState().commerce.selectedTier) || normalizeTierName(fallbackCatalog.tiers?.find((tier) => tier.is_default)?.tier_name) || normalizeTierName(fallbackCatalog.tiers?.[0]?.tier_name) || 'base';
    const cart = hydrateCart();
    const flashState = computeFlashState((fallbackCatalog.offers && fallbackCatalog.offers.flash) || []);
    store.patch({
      commerce: {
        ...store.getState().commerce,
        catalog: { ...createEmptyCatalog(), ...fallbackCatalog, offers: fallbackCatalog.offers || { daily: [], flash: [] } },
        selectedTier,
        priceBook: { tierName: selectedTier, products: {} },
        cart,
      },
      runtime: { ...store.getState().runtime, loading: { ...store.getState().runtime.loading, catalog: false, pricing: true }, flashState },
      app: { ...store.getState().app, lastError: null },
    });
    setRuntimePhase(store, RUNTIME_PHASES.SYNCING_CART, {
      catalogReady: true,
      offersReady: true,
      flashOffersReady: true,
      companiesReady: true,
      pricingReady: true,
    });
    const runtimeProducts = store.getState().commerce.catalog.productIndex || {};
    const reconciledCart = Object.keys(runtimeProducts).length ? recalcCart(cart, runtimeProducts) : cart;
    store.patch({ commerce: { ...store.getState().commerce, cart: reconciledCart } }, { silent: true });
    setRuntimeLifecycle(store, { cartSynced: true });
    persistSelectedTier(selectedTier);
    persistCart(reconciledCart);
    saveJSON(storageKeys.catalog, { ...fallbackCatalog, offers: fallbackCatalog.offers || { daily: [], flash: [] } });
    scheduler.schedule('page', 'toast');
  }

  // Hydrate auxiliary data
  const session = store.getState().auth.session;
  if (session?.userType === 'rep') {
    store.update((draft) => { draft.runtime.loading.customers = true; });
    await loadCustomersIntoState(store, api, session);
  }
  store.update((draft) => { draft.runtime.loading.invoices = true; });
  await loadInvoicesIntoState(store, api);

  // Initial render
  const initialRoute = store.getState().app.route;
  if (initialRoute.name === 'company' && initialRoute.params?.companyId) {
    await ensureCompanyCatalogLoaded(store, api, initialRoute.params.companyId);
  }
  setRuntimePhase(store, RUNTIME_PHASES.READY, { locked: false, catalogReady: true, offersReady: true, flashOffersReady: true, companiesReady: true, pricingReady: true, cartSynced: true });
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

  setInterval(() => {
    const state = store.getState();
    const offers = state.commerce.catalog.offers.flash || [];
    const flashState = computeFlashState(offers);
    store.patch({ runtime: { ...state.runtime, flashState, flashTick: Date.now() } }, { dirty: ['hero', 'header'] });
    if (state.app.route.name === 'home') scheduler.schedule('hero', 'header');
  }, 1000);

  return { store, api, scheduler };
}
