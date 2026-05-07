import { readConfig } from '../core/config.js';
import { dom } from '../core/dom.js';
import { parseRoute, navigate } from '../core/router.js';
import { createEmitter, createRenderLoop } from '../core/events.js';
import { createStore } from '../state/store.js';
import { createInitialState } from '../state/defaultState.js';
import { computeCartTotals, getSelectedTier, getVisibleCompanies, getVisibleProducts } from '../state/selectors.js';
import { createApiClient } from '../services/apiClient.js';
import { loadCatalog } from '../services/catalogService.js';
import { buildPriceBook, persistSelectedTier, resolveProductUnit, syncCartPrices } from '../services/pricingService.js';
import { addProductToCart, clearCart, computeTotals, hydrateCart, persistCart, recalcCart, removeItem, toggleOfferInCart, updateQty } from '../services/cartService.js';
import { login, logout, registerCustomer } from '../services/authService.js';
import { loadRepCustomers, createCustomer, persistSelectedCustomer } from '../services/customerService.js';
import { computeFlashState, loadOffers } from '../services/offerService.js';
import { validateCheckout, submitOrder } from '../services/orderService.js';
import { buildWhatsAppInvoice, formatMoney, formatStatus, persistInvoices } from '../services/invoiceService.js';
import { appendBehaviorEvent, writeUiEvent } from '../services/analyticsService.js';
import { shellTemplate } from '../layout/shell.js';
import { renderHeader } from '../layout/header.js';
import { renderSearchBar } from '../layout/searchBar.js';
import { renderBanner } from '../layout/banner.js';
import { renderHero } from '../layout/hero.js';
import { renderFooter } from '../layout/footer.js';
import { renderLoginModal, renderCustomerModal, renderProductModal } from '../layout/modals.js';
import { renderDrawer, renderToasts } from '../layout/overlays.js';
import { renderHomePage } from '../pages/homePage.js';
import { renderCompaniesPage, renderCompanyPage } from '../pages/companiesPage.js';
import { renderOffersPage } from '../pages/offersPage.js';
import { renderTiersPage } from '../pages/tiersPage.js';
import { renderCartPage, renderCheckoutPage } from '../pages/cartCheckoutPages.js';
import { renderLoginPage, renderRegisterPage } from '../pages/authPages.js';
import { renderCustomersPage, renderInvoicesPage, renderAccountPage } from '../pages/customerPages.js';
import { storageKeys, saveJSON, loadJSON, removeValue } from '../core/storage.js';

function createInitialData() {
  return createInitialState();
}

const toastTimers = new Map();
let schedulerRef = null;
let searchTypingTimer = null;

let bodyScrollLockY = 0;
let bodyScrollLocked = false;

function lockBodyScroll(shouldLock) {
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.body;
  if (shouldLock && !bodyScrollLocked) {
    bodyScrollLockY = window.scrollY || window.pageYOffset || 0;
    bodyScrollLocked = true;
    body.classList.add('body--lock-scroll');
    body.style.position = 'fixed';
    body.style.top = `-${bodyScrollLockY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';
    return;
  }
  if (!shouldLock && bodyScrollLocked) {
    body.classList.remove('body--lock-scroll');
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    body.style.overflow = '';
    body.style.touchAction = '';
    bodyScrollLocked = false;
    window.requestAnimationFrame(() => window.scrollTo(0, bodyScrollLockY));
  }
}

function syncInteractionLocks(state) {
  lockBodyScroll(Boolean(state.ui.drawerOpen || state.ui.activeModal));
}

function resetSearchState(store) {
  clearTimeout(searchTypingTimer);
  const current = store.getState();
  store.patch({ ui: { ...current.ui, search: '' } });
}

function resetHomeState(store) {
  clearTimeout(searchTypingTimer);
  const current = store.getState();
  store.patch({ ui: { ...current.ui, search: '', accountMenuOpen: false, activeModal: null, drawerOpen: false, selectedProductId: null } });
}


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

function setTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem(storageKeys.theme, JSON.stringify(theme));
}

function closeTransientSurfaces(store, { keepDrawer = false } = {}) {
  const current = store.getState();
  store.patch({
    ui: {
      ...current.ui,
      accountMenuOpen: false,
      activeModal: null,
      selectedProductId: null,
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
  if (options.resetSearch) {
    clearTimeout(searchTypingTimer);
    const current = store.getState();
    store.patch({ ui: { ...current.ui, search: '' } });
  }
  navigate(routeName, params);
  if (routeName === 'home') {
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
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
  const showSearch = true;

  renderHeader(nodes.header, state);
  renderBanner(nodes.banner, state);
  renderHero(nodes.hero, state, { mode: route.name === 'home' ? 'home' : 'none' });
  renderSearchBar(nodes.search, state, { show: showSearch, placeholder: route.name === 'company' ? 'ابحث داخل الشركة' : 'ابحث باسم المنتج أو الشركة أو القسم' });
  renderFooter(nodes.footer, state);
  syncInteractionLocks(state);

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
  const hideContent = ['login', 'register'].includes(route.name);
  nodes.banner.classList.toggle('is-hidden', route !== 'home');
  nodes.search.classList.toggle('is-hidden', false);
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
    if (target.hasAttribute('data-modal') && event.target === target) {
      closeTransientSurfaces(store, { keepDrawer: false });
      schedule('header', 'modals', 'drawer');
      return;
    }

    if (action === 'navigate-home') { resetHomeState(store); return navigateAuthority(store, 'home', {}, { resetSearch: false }); }
    if (action === 'go-companies') return navigateAuthority(store, 'companies');
    if (action === 'go-offers') return navigateAuthority(store, 'offers');
    if (action === 'go-tiers') return navigateAuthority(store, 'tiers');
    if (action === 'go-cart') return navigateAuthority(store, 'cart');
    if (action === 'go-checkout') {
      if (state.auth.session?.userType === 'rep' && !state.auth.selectedCustomer) {
        setPendingFlow(store, { name: 'checkout', resumeRoute: 'checkout', resumeMessage: 'يرجى مراجعة تفاصيل الطلب قبل الإرسال' });
        notify(store, 'warning', 'يجب اختيار العميل أولًا', 'اختر العميل ثم ستنتقل مباشرة إلى مراجعة الطلب');
        closeTransientSurfaces(store, { keepDrawer: false });
        schedule('modals', 'header');
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
    if (action === 'clear-search') { resetSearchState(store); schedule('header', 'banner', 'search', 'hero', 'page'); return; }
    if (action === 'toggle-account-menu') { store.patch({ ui: { ...state.ui, accountMenuOpen: !state.ui.accountMenuOpen, activeModal: null } }); schedule('header', 'modals'); return; }
    if (action === 'open-cart-drawer') { closeTransientSurfaces(store, { keepDrawer: false }); store.patch({ ui: { ...store.getState().ui, drawerOpen: true } }); schedule('drawer', 'header', 'modals'); return; }
    if (action === 'close-cart-drawer') { store.patch({ ui: { ...state.ui, drawerOpen: false } }); schedule('drawer', 'header'); return; }
    if (action === 'open-customer-modal') { closeTransientSurfaces(store, { keepDrawer: false }); store.patch({ ui: { ...store.getState().ui, activeModal: 'customer' } }); schedule('modals', 'header'); return; }
    if (action === 'close-modal') { closeTransientSurfaces(store, { keepDrawer: false }); schedule('modals', 'header'); return; }

    if (action === 'open-company') {
      const companyId = target.getAttribute('data-company-id');
      navigateAuthority(store, 'company', { companyId });
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
        draft.ui.drawerOpen = false;
      }, { action: 'customer-select', dirty: ['page', 'header', 'modals', 'drawer'] });
      persistSelectedCustomer(customer);
      notify(store, 'success', 'تم اختيار العميل', customer.name || '');
      const pendingFlow = store.getState().ui.pendingFlow;
      if (pendingFlow?.name === 'checkout') {
        clearPendingFlow(store);
        notify(store, 'info', 'يرجى مراجعة تفاصيل الطلب قبل الإرسال', '');
        return navigateAuthority(store, 'checkout');
      }
      schedule('page', 'header', 'modals', 'drawer');
      return;
    }

    if (action === 'modal-set-unit') {
      const productId = target.getAttribute('data-product-id');
      const unit = target.getAttribute('data-unit');
      store.update((draft) => {
        draft.commerce.unitPrefs[productId] = unit;
        draft.commerce.cart = syncCartPrices(draft.commerce.cart, draft.commerce.catalog.productIndex, getSelectedTier(draft));
      }, { action: 'modal-set-unit', dirty: ['modals', 'page', 'drawer', 'header'] });
      schedule('modals', 'page', 'drawer', 'header');
      return;
    }

    if (action === 'set-unit') {
      const productId = target.getAttribute('data-product-id');
      const unit = target.getAttribute('data-unit');
      store.update((draft) => { draft.commerce.unitPrefs[productId] = unit; draft.commerce.cart = syncCartPrices(draft.commerce.cart, draft.commerce.catalog.productIndex, getSelectedTier(draft)); }, { action: 'set-unit' });
      schedule('page', 'header', 'drawer', 'modals');
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
      schedule('header', 'banner', 'page', 'drawer', 'modals');
      return;
    }

    if (action === 'toggle-deal' || action === 'toggle-flash') {
      const id = Number(target.getAttribute('data-id'));
      const offers = action === 'toggle-deal' ? state.commerce.catalog.offers.daily : state.commerce.catalog.offers.flash;
      const offer = offers.find((item) => Number(item.id) === id);
      if (!offer) return;
      const result = toggleOfferInCart(state.commerce.cart, offer, action === 'toggle-deal' ? 'deal' : 'flash');
      store.patch({ commerce: { ...state.commerce, cart: result.cart } });
      persistCart(result.cart);
      notify(store, result.added ? 'success' : 'info', result.added ? 'تمت الإضافة' : 'تمت الإزالة', offer.title);
      schedule('header', 'banner', 'page', 'drawer', 'modals');
      return;
    }

    if (action === 'remove-item') {
      const key = target.getAttribute('data-key');
      const next = removeItem(state.commerce.cart, key);
      store.patch({ commerce: { ...state.commerce, cart: next } });
      persistCart(next);
      schedule('header', 'banner', 'page', 'drawer', 'modals');
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
      schedule('header', 'banner', 'page', 'drawer', 'modals');
      return;
    }

    if (action === 'select-tier') {
      const tierName = target.getAttribute('data-tier-name');
      const current = getSelectedTier(state);
      const nextTier = current.tier_name === tierName ? state.commerce.catalog.tiers.find((tier) => tier.is_default) || state.commerce.catalog.tiers[0] : state.commerce.catalog.tiers.find((tier) => tier.tier_name === tierName);
      store.update((draft) => {
        draft.commerce.selectedTier = nextTier?.tier_name || null;
        draft.commerce.priceBook = { tierName: nextTier?.tier_name || null, products: buildPriceBook(Object.values(draft.commerce.catalog.productIndex || {}), draft.commerce.catalog.tiers, nextTier?.tier_name) };
        draft.commerce.cart = syncCartPrices(draft.commerce.cart, draft.commerce.catalog.productIndex, nextTier || getSelectedTier(draft));
      }, { action: 'select-tier', dirty: ['header', 'page', 'drawer', 'hero'] });
      persistSelectedTier(nextTier?.tier_name || null);
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

    if (action === 'refresh-invoices') {
      await loadInvoicesIntoState(store, api);
      schedule('page');
      return;
    }

    if (action === 'logout') {
      logout();
      store.patch({ auth: { ...state.auth, session: null, selectedCustomer: null }, ui: { ...state.ui, accountMenuOpen: false, activeModal: null, pendingFlow: null } });
      notify(store, 'info', 'تم الخروج', '');
      schedule('header', 'banner', 'page', 'drawer', 'modals');
      navigateAuthority(store, 'home');
      return;
    }

    if (action === 'open-product') {
      const productId = target.getAttribute('data-product-id');
      closeTransientSurfaces(store, { keepDrawer: false });
      store.patch({ ui: { ...store.getState().ui, activeModal: 'product', selectedProductId: productId, accountMenuOpen: false, drawerOpen: false } });
      schedule('modals', 'header', 'drawer');
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
      searchTypingTimer = setTimeout(() => schedule('page'), 220);
      return;
    }
    if (target.getAttribute('data-role') === 'product-qty' || target.getAttribute('data-role') === 'modal-product-qty') {
      const cleaned = String(target.value || '').replace(/[^0-9]/g, '');
      if (cleaned !== target.value) target.value = cleaned;
      const productId = target.getAttribute('data-product-id');
      if (productId && cleaned) {
        store.patch({ commerce: { ...state.commerce, qtyPrefs: { ...state.commerce.qtyPrefs, [productId]: Math.max(1, Number(cleaned || 1)) } } }, { silent: true });
      }
      return;
    }
    if (target.getAttribute('data-role') === 'cart-qty') {
      const key = target.getAttribute('data-key');
      const qty = Math.max(1, Number(target.value || 1));
      store.update((draft) => { draft.commerce.cart = updateQty(draft.commerce.cart, key, qty); }, { action: 'cart-qty-update', dirty: ['page', 'drawer', 'header'] });
      persistCart(store.getState().commerce.cart);
      schedule('header', 'banner', 'page', 'drawer', 'modals');
      return;
    }
  });

  document.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.getAttribute('data-role') !== 'product-qty' && target.getAttribute('data-role') !== 'modal-product-qty') return;
    const productId = target.getAttribute('data-product-id');
    const raw = String(target.value || '').replace(/[^0-9]/g, '');
    const qty = Math.max(1, Number(raw || 1));
    store.update((draft) => {
      draft.commerce.qtyPrefs[productId] = qty;
    }, { action: 'qty-update', silent: true });
    saveJSON(storageKeys.qtyPrefs, store.getState().commerce.qtyPrefs);
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
        const session = await login(api, identifier, password);
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
        const session = await registerCustomer(api, payload);
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
          schedule('page', 'header', 'modals', 'drawer');
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
  const session = state.auth.session;
  if (!session) {
    store.update((draft) => { draft.commerce.invoices = []; });
    return;
  }
  const key = session.userType === 'customer' ? 'customer_id' : 'user_id';
  const rows = await api.get('orders', {
    select: 'id,order_number,invoice_number,created_at,total_amount,status,user_type,customer_id,user_id,sales_rep_id,updated_at',
    [key]: `eq.${session.id}`,
    order: 'created_at.desc',
  }).catch(() => []);
  store.update((draft) => { draft.commerce.invoices = Array.isArray(rows) ? rows : []; });
  persistInvoices(Array.isArray(rows) ? rows : []);
}

async function loadCustomersIntoState(store, api, session = null) {
  const state = store.getState();
  const rep = session || state.auth.session;
  if (!rep || rep.userType !== 'rep') {
    store.update((draft) => { draft.commerce.customers = []; });
    return;
  }
  const rows = await loadRepCustomers(api, rep.id);
  store.update((draft) => { draft.commerce.customers = rows; });
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

  try {
    const result = await submitOrder(api, state, tier, totals, state.runtime.invoiceSequence);
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
  }
}

export async function bootstrapApp() {
  const config = readConfig();
  const api = createApiClient(config);
  const store = createStore(createInitialData());
  setTheme(store.getState().ui.theme);

  const app = document.getElementById('app');
  bootstrapShell(app);
  const nodes = getNodes();
  const scheduler = createRenderLoop({
    header: () => renderHeader(nodes.header, store.getState()),
    banner: () => renderBanner(nodes.banner, store.getState()),
    search: () => renderSearchBar(nodes.search, store.getState(), { show: true, placeholder: 'ابحث باسم المنتج أو الشركة أو القسم' }),
    hero: () => renderHero(nodes.hero, store.getState(), { mode: store.getState().app.route.name === 'home' ? 'home' : 'none' }),
    page: () => renderContent(),
    footer: () => renderFooter(nodes.footer, store.getState()),
    drawer: () => { nodes.drawerHost.innerHTML = renderDrawer(store.getState()); syncInteractionLocks(store.getState()); },
    modals: () => {
      const activeProduct = store.getState().ui.activeModal === 'product' && store.getState().ui.selectedProductId ? store.getState().commerce.catalog.productIndex[store.getState().ui.selectedProductId] : null;
      nodes.modalHost.innerHTML = [renderLoginModal(store.getState()), renderCustomerModal(store.getState()), renderProductModal(store.getState(), activeProduct)].join('');
      syncInteractionLocks(store.getState());
    },
    toast: () => nodes.toastHost.innerHTML = renderToasts(store.getState()),
  });

  function renderContent() {
    const state = store.getState();
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
    else html = renderHomePage(state);
    nodes.page.innerHTML = html;
    nodes.modalHost.innerHTML = [renderLoginModal(state), renderCustomerModal(state), renderProductModal(state, state.ui.selectedProductId ? state.commerce.catalog.productIndex[state.ui.selectedProductId] : null)].join('');
    nodes.drawerHost.innerHTML = renderDrawer(state);
    nodes.toastHost.innerHTML = renderToasts(state);
    syncBodyShellHeight();
    applyBodyFlags();
    syncInteractionLocks(state);
  }

  function applyBodyFlags() {
    const route = store.getState().app.route.name;
    nodes.search.classList.toggle('is-hidden', false);
    nodes.hero.classList.toggle('is-hidden', route !== 'home');
    document.body.classList.toggle('body--overlay', ['login', 'register'].includes(route));
  }

  schedulerRef = scheduler;
  store.subscribe((_, meta = {}) => {
    const dirty = Array.isArray(meta.dirty) && meta.dirty.length ? meta.dirty : ['header', 'search', 'hero', 'footer', 'page', 'drawer', 'modals', 'toast'];
    scheduler.schedule(...dirty);
  });

  bindInteractions(store, api, (...keys) => scheduler.schedule(...keys));

  window.addEventListener('hashchange', () => {
    const current = store.getState();
    store.patch({
      app: { ...current.app, route: parseRoute(location.hash) },
      ui: { ...current.ui, accountMenuOpen: false, activeModal: null, drawerOpen: false },
    });
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
  store.update((draft) => { draft.runtime.loading.catalog = true; });
  try {
    const catalog = await loadCatalog(api, store.getState().commerce.selectedTier || null);
    const selectedTier = store.getState().commerce.selectedTier || catalog.tiers.find((tier) => tier.is_default)?.tier_name || catalog.tiers[0]?.tier_name || 'base';
    const currentTier = catalog.tiers.find((tier) => tier.tier_name === selectedTier) || catalog.tiers.find((tier) => tier.is_default) || catalog.tiers[0] || null;
    const priceBook = buildPriceBook(Object.values(catalog.productIndex || {}), catalog.tiers, selectedTier);
    const offers = catalog.offers;
    const productIndex = catalog.productIndex;
    const cart = recalcCart(store.getState().commerce.cart.length ? store.getState().commerce.cart : hydrateCart(), productIndex, currentTier);
    store.patch({
      commerce: {
        ...store.getState().commerce,
        catalog: { ...catalog, offers },
        selectedTier: currentTier?.tier_name || selectedTier || null,
        priceBook,
        cart,
      },
      runtime: { ...store.getState().runtime, loading: { ...store.getState().runtime.loading, catalog: false }, flashState: computeFlashState(offers.flash) },
    });
    persistSelectedTier(currentTier?.tier_name || selectedTier || null);
    persistCart(cart);
    schedule('header', 'banner', 'search', 'hero', 'page', 'footer', 'drawer', 'modals', 'toast');
  } catch (error) {
    console.error(error);
    store.patch({ runtime: { ...store.getState().runtime, loading: { ...store.getState().runtime.loading, catalog: false } } });
    notify(store, 'warning', 'تعذر تحميل البيانات الحية', 'تم تشغيل نسخة محلية مؤقتة');
    scheduler.schedule('header', 'banner', 'search', 'hero', 'page', 'footer', 'drawer', 'modals', 'toast');
  }

  // Hydrate auxiliary data
  const session = store.getState().auth.session;
  if (session?.userType === 'rep') {
    await loadCustomersIntoState(store, api, session);
  }
  await loadInvoicesIntoState(store, api);

  // Initial render
  scheduler.flush();
  store.patch({ app: { ...store.getState().app, ready: true } });
  scheduler.schedule('header', 'banner', 'search', 'hero', 'page', 'footer', 'drawer', 'modals', 'toast');

  setInterval(() => {
    const state = store.getState();
    const offers = state.commerce.catalog.offers.flash || [];
    const flashState = computeFlashState(offers);
    store.patch({ runtime: { ...state.runtime, flashState, flashTick: Date.now() } }, { dirty: ['hero', 'header'] });
    if (state.app.route.name === 'home') scheduler.schedule('hero', 'header');
  }, 1000);

  return { store, api, scheduler };
}
