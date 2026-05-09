import { readConfig } from '../core/config.js';
import { parseRoute, navigate } from '../core/router.js';
import { createEventBus } from '../core/events.js';
import { storageGet, storageSet } from '../core/storage.js';
import { createStore } from '../state/store.js';
import { createApiClient } from '../services/apiClient.js';
import { normalizeProducts, groupByCompany, buildProductIndex } from '../services/catalogService.js';
import { createAuthService } from '../services/authService.js';
import { createCustomerService } from '../services/customerService.js';
import { createCartService } from '../services/cartService.js';
import { createOrderService } from '../services/orderService.js';
import { createOfferService } from '../services/offerService.js';
import { createAnalyticsService } from '../services/analyticsService.js';
import { renderApp } from '../ui/render.js';
import { dom } from '../core/dom.js';
import { ROLES } from '../contracts/runtime.js';

const STORAGE_THEME = 'ahram-b2b-runtime:theme';

export async function bootstrapApp() {
  const config = readConfig();
  const api = createApiClient(config);
  const bus = createEventBus();
  const store = createStore(config);
  const root = document.getElementById('app');

  const eventLog = (event_type, payload = {}) => {
    const state = store.getState();
    const item = {
      event_type,
      actor_id: payload.actor_id || state.auth.user?.id || null,
      actor_type: payload.actor_type || state.auth.user?.user_type || state.auth.role,
      session_id: payload.session_id || state.auth.session?.session_id || null,
      timestamp: new Date().toISOString(),
      payload: payload.payload || {},
      source: 'ui',
      runtime_context: {
        route: state.ui.route,
        theme: state.ui.theme,
        cart_count: state.cart.items.length
      }
    };
    store.setState((current) => ({
      data: { uiEvents: [...current.data.uiEvents, item].slice(-200) }
    }), { action: event_type });
    return item;
  };

  const auth = createAuthService(store, eventLog);
  const customers = createCustomerService(store, eventLog);
  const cart = createCartService(store, eventLog);
  const orders = createOrderService(store, cart, eventLog);
  const offers = createOfferService(store, eventLog);
  const analytics = createAnalyticsService(store);

  async function hydrate() {
    const bootstrap = await api.bootstrap();
    const data = {
      ...bootstrap,
      products: normalizeProducts(bootstrap.products || []),
      companies: groupByCompany(bootstrap.products || []),
      productsIndex: buildProductIndex(bootstrap.products || [])
    };

    store.setState((current) => ({
      app: { ready: true, online: true, config },
      data: {
        ...current.data,
        ...data
      },
      ui: {
        ...current.ui,
        theme: current.ui.theme || storageGet(STORAGE_THEME, config.theme || 'dark'),
        route: parseRoute().path || 'home'
      }
    }), { action: 'hydrate' });

    const state = store.getState();
    const session = state.auth.session;
    if (session?.expires_at && new Date(session.expires_at).getTime() < Date.now()) {
      auth.logout();
    }

    cart.reconcilePricing();
  }

  function syncTheme() {
    const theme = store.getState().ui.theme || 'dark';
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    storageSet(STORAGE_THEME, theme);
  }

  function openModal(modal) {
    store.setState((current) => ({ ui: { ...current.ui, modal } }), { action: 'open_modal' });
  }

  function closeModal() {
    store.setState((current) => ({ ui: { ...current.ui, modal: null } }), { action: 'close_modal' });
  }

  function setRoute(route) {
    store.setState((current) => ({ ui: { ...current.ui, route } }), { action: 'route' });
  }

  function render() {
    if (!root) return;
    root.innerHTML = renderApp(store.getState(), { analytics });
    syncTheme();
  }

  function visibleProductById(productId) {
    const state = store.getState();
    const selected = state.data.productsIndex?.find((p) => p.product_id === productId);
    if (selected) return selected;
    return state.data.products.find((row) => row.product_id === productId) || null;
  }

  function resolveOffer(kind, id) {
    const state = store.getState();
    const list = kind === 'daily' ? state.data.dailyDeals : state.data.flashOffers;
    return list.find((offer) => String(offer.id) === String(id)) || null;
  }

  function routeGuard(route) {
    const role = store.getState().auth.role || ROLES.GUEST;
    if (route === 'login' && role !== ROLES.GUEST) return 'account';
    if (route === 'customers' && ![ROLES.ADMIN, ROLES.SALES_REP].includes(role)) return role === ROLES.GUEST ? 'login' : 'home';
    if (route === 'reps' && role !== ROLES.ADMIN) return role === ROLES.GUEST ? 'login' : 'home';
    if (route === 'analytics' && ![ROLES.ADMIN, ROLES.SALES_REP].includes(role)) return role === ROLES.GUEST ? 'login' : 'home';
    if (route === 'checkout' && role === ROLES.GUEST) return 'login';
    return route;
  }

  window.addEventListener('hashchange', () => {
    const { path } = parseRoute();
    const next = routeGuard(path);
    if (next !== path) navigate(next);
    setRoute(next);
  });

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const state = store.getState();

    try {
      if (action === 'go') {
        const next = routeGuard(button.dataset.route);
        navigate(next);
        setRoute(next);
        return;
      }
      if (action === 'select-tier') {
        const tier = button.dataset.tierName;
        store.setState((current) => ({
          ui: { ...current.ui, selectedTier: current.ui.selectedTier === tier ? 'base' : tier, visibleCount: 12 }
        }), { action: 'select_tier' });
        cart.reconcilePricing();
        return;
      }
      if (action === 'select-company') {
        const company = button.dataset.companyId;
        store.setState((current) => ({
          ui: { ...current.ui, selectedCompany: current.ui.selectedCompany === company ? 'all' : company, visibleCount: 12 }
        }), { action: 'select_company' });
        eventLog('company_open', { payload: { company_id: company } });
        return;
      }
      if (action === 'load-more') {
        store.setState((current) => ({ ui: { ...current.ui, visibleCount: current.ui.visibleCount + 12 } }), { action: 'load_more' });
        return;
      }
      if (action === 'clear-search') {
        store.setState((current) => ({ ui: { ...current.ui, search: '', visibleCount: 12 } }), { action: 'clear_search' });
        return;
      }
      if (action === 'toggle-theme') {
        const nextTheme = state.ui.theme === 'dark' ? 'light' : 'dark';
        store.setState((current) => ({ ui: { ...current.ui, theme: nextTheme } }), { action: 'toggle_theme' });
        syncTheme();
        return;
      }
      if (action === 'logout') {
        auth.logout();
        navigate('home');
        setRoute('home');
        return;
      }
      if (action === 'open-product') {
        const product = visibleProductById(button.dataset.productId);
        if (product) openModal({ type: 'product', product });
        return;
      }
      if (action === 'close-modal') {
        closeModal();
        return;
      }
      if (action === 'add-product') {
        const article = button.closest('[data-product-id]');
        const productId = button.dataset.productId;
        const unitCode = button.dataset.unitCode;
        const tierName = button.dataset.tierName;
        const product = state.data.products.find((row) => row.product_id === productId && row.unit_code === unitCode && row.tier_name === tierName) || state.data.products.find((row) => row.product_id === productId);
        if (!product) return;
        const qtyInput = article?.querySelector('[data-role="cart-qty"]');
        const qty = Math.max(1, Number(qtyInput?.value || 1));
        cart.addProduct(product, qty);
        return;
      }
      if (action === 'set-cart-qty') {
        const key = button.dataset.productKey;
        const delta = Number(button.dataset.delta || 0);
        const item = state.cart.items.find((row) => row.key === key);
        if (item) {
          cart.setQuantity(key, item.quantity + delta);
        } else {
          const card = button.closest('[data-product-id]');
          if (card) {
            const input = card.querySelector('[data-role="cart-qty"]');
            const next = Math.max(1, Number(input?.value || 1) + delta);
            if (input) input.value = String(next);
          }
        }
        return;
      }
      if (action === 'remove-cart-item') {
        cart.remove(button.dataset.productKey);
        return;
      }
      if (action === 'clear-cart') {
        cart.clear();
        return;
      }
      if (action === 'add-offer') {
        const kind = button.dataset.offerKind;
        const offer = resolveOffer(kind, button.dataset.offerId);
        if (offer) {
          cart.addOffer(offer, kind);
        }
        return;
      }
      if (action === 'open-order') {
        const order = orders.get(button.dataset.orderId);
        if (order) openModal({ type: 'order', order });
        return;
      }
      if (action === 'send-whatsapp') {
        const order = orders.get(button.dataset.orderId);
        if (!order) return;
        const msg = orders.whatsappMessage(order);
        const wa = `https://wa.me/${config.supportWhatsapp}?text=${encodeURIComponent(msg)}`;
        window.open(wa, '_blank', 'noopener,noreferrer');
        eventLog('whatsapp_send', { payload: { order_id: order.id } });
        return;
      }
      if (action === 'submit-checkout') {
        const order = orders.createFromCart();
        openModal({ type: 'order', order });
        navigate('orders');
        setRoute('orders');
        return;
      }
      if (action === 'select-customer') {
        store.setState((current) => ({ cart: { ...current.cart, customer_id: button.dataset.customerId } }), { action: 'select_customer' });
        return;
      }
    } catch (error) {
      console.error(error);
      eventLog('representative_action', { payload: { error: error.code || error.message } });
      store.setState((current) => ({ runtime: { ...current.runtime, diagnostics: { ...current.runtime.diagnostics, hasConsoleError: true } } }), { action: 'error' });
    }
  });

  document.addEventListener('input', (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const action = input.dataset.action;
    if (action === 'search') {
      store.setState((current) => ({ ui: { ...current.ui, search: input.value, visibleCount: 12 } }), { action: 'search' });
      eventLog('search', { payload: { query: input.value } });
      return;
    }
    if (input.dataset.role === 'cart-qty') {
      const key = input.dataset.productKey;
      const value = Math.max(1, Number(input.value || 1));
      const item = store.getState().cart.items.find((row) => row.key === key);
      if (item) {
        cart.setQuantity(key, value);
      } else {
        input.value = String(value);
      }
      return;
    }
  });

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const formName = form.dataset.form;
    event.preventDefault();
    try {
      if (formName === 'login') {
        const data = new FormData(form);
        auth.login(String(data.get('identity') || ''), String(data.get('password') || ''));
        navigate('home');
        setRoute('home');
        return;
      }
      if (formName === 'customer-create') {
        const data = new FormData(form);
        const customer = customers.create({
          name: String(data.get('name') || '').trim(),
          phone: String(data.get('phone') || '').trim(),
          location: String(data.get('location') || '').trim()
        });
        form.reset();
        if (customer) {
          store.setState((current) => ({ cart: { ...current.cart, customer_id: customer.id } }), { action: 'select_customer' });
        }
        return;
      }
    } catch (error) {
      console.error(error);
      eventLog('representative_action', { payload: { error: error.code || error.message } });
    }
  });

  store.subscribe(() => {
    render();
  });

  await hydrate();
  const initialRoute = routeGuard(parseRoute().path || 'home');
  navigate(initialRoute);
  setRoute(initialRoute);
  render();

  window.__B2B_APP__ = {
    getState: () => store.getState(),
    services: { auth, customers, cart, orders, offers, analytics },
    navigate,
    eventLog
  };
}
