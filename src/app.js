import { CONFIG, ROUTES } from './config.js';
import { store, setCart, setTier, setSelectedCustomer, setSession, resetSession } from './state/store.js';
import { repo } from './api/repositories.js';
import { login, logout, restoreSession } from './services/auth.js';
import { buildWhatsAppInvoice, whatsappLink } from './services/invoice.js';
import { shell } from './components/layout.js';
import { loginScreen } from './screens/login.js';
import { storeScreen } from './screens/store.js';
import { cartScreen } from './screens/cart.js';
import { ordersScreen } from './screens/orders.js';
import { adminScreen } from './screens/admin.js';
import { repDashboardScreen, repCustomersScreen } from './screens/rep.js';
import { profileScreen } from './screens/profile.js';
import { clear } from './utils/dom.js';

const app = document.getElementById('app');
let state = {
  session: store.session,
  settings: store.data.settings,
  tiers: store.data.tiers,
  products: store.data.products,
  customers: store.data.customers,
  orders: store.data.orders,
  salesReps: [],
  repSales: [],
  health: store.data.health,
  dailyDeals: [],
  flashOffers: [],
  search: '',
  selectedProduct: null,
  error: '',
  demoHint: '',
};

function routeFromHash() {
  const raw = (location.hash || '#/').replace(/^#/, '');
  const parts = raw.split('/').filter(Boolean);
  if (!parts.length) return '/';
  return `/${parts.join('/')}`;
}

function navigate(path) {
  location.hash = `#${path}`;
}

function currentRole() {
  return state.session?.user?.user_type || state.session?.data?.user?.user_type || 'guest';
}

function addToCart(product) {
  const existing = store.cart.find(item => String(item.product_id) === String(product.product_id));
  if (existing) {
    setCart(store.cart.map(item => String(item.product_id) === String(product.product_id) ? { ...item, quantity: Number(item.quantity || 1) + 1 } : item));
  } else {
    setCart([...store.cart, { ...product, quantity: 1 }]);
  }
  render();
}

function updateQty(productId, quantity) {
  setCart(store.cart.map(item => String(item.product_id) === String(productId) ? { ...item, quantity } : item));
  render();
}

function removeFromCart(productId) {
  setCart(store.cart.filter(item => String(item.product_id) !== String(productId)));
  render();
}

async function submitLogin(formData) {
  state.error = '';
  render();
  try {
    const result = await login(formData.get('login'), formData.get('password'));
    state.session = result.session || result;
    setSession(state.session);
    await loadData();
    navigate(ROUTES.home);
  } catch (err) {
    state.error = err.code || err.message || 'Login failed';
  }
  render();
}

async function doLogout() {
  await logout();
  state.session = null;
  resetSession();
  render();
  navigate(ROUTES.login);
}

async function loadData() {
  try { state.settings = await repo.settings(); } catch {}
  try { state.tiers = await repo.tiers(); } catch {}
  try { state.products = await repo.products(); } catch {}
  try { state.customers = await repo.customers(); } catch {}
  try { state.orders = await repo.orders(state.session?.user?.id || ''); } catch {}
  try { state.salesReps = await repo.salesReps(); } catch {}
  try { state.repSales = await repo.repSales(state.session?.user?.id || ''); } catch {}
  try { state.health = await repo.health(); } catch {}
  try { state.dailyDeals = await repo.dailyDeals(); } catch {}
  try { state.flashOffers = await repo.flashOffers(); } catch {}
}

async function checkout() {
  const payload = {
    customer_id: state.session?.user?.user_type === 'customer' ? state.session.user.id : store.selectedCustomer?.id || null,
    sales_rep_id: state.session?.user?.user_type === 'sales_rep' ? state.session.user.id : null,
    tier_name: store.selectedTier,
    payment_method: 'COD',
    payment_status: 'unpaid',
    currency: CONFIG.defaultCurrency,
    items: store.cart.map(item => ({
      product_id: item.product_id,
      unit_code: item.unit_code,
      quantity: Number(item.quantity || 1),
      // snapshot fields should be resolved server-side; client only forwards selected item references.
    })),
  };
  try {
    const result = await repo.createOrder(payload, crypto.randomUUID());
    setCart([]);
    state.orders = [result, ...state.orders];
    navigate(ROUTES.orders);
  } catch (err) {
    state.error = err.code || err.message || 'Order submission failed';
  }
  render();
}

async function shareWhatsApp(textOrUrl) {
  const text = String(textOrUrl || '');
  if (text.startsWith('https://wa.me/')) {
    window.open(text, '_blank', 'noopener,noreferrer');
    return;
  }
  const url = whatsappLink(text);
  window.open(url, '_blank', 'noopener,noreferrer');
}

async function openProduct(product) {
  state.selectedProduct = product;
  render();
}

async function createCustomer() {
  alert('Route stub: POST /customers via contract layer. Use backend route when connected.');
}

async function createOrderShortcut() {
  navigate(ROUTES.cart);
}

function routeContent(route) {
  const role = currentRole();
  if (route === ROUTES.login) {
    return loginScreen({ onSubmit: submitLogin, error: state.error, demoHint: 'Demo login is available when backend is not connected.' });
  }

  if (!state.session) {
    navigate(ROUTES.login);
    return loginScreen({ onSubmit: submitLogin, error: state.error, demoHint: 'Session required.' });
  }

  if (route === ROUTES.admin && role === 'admin') {
    return adminScreen({ health: state.health, products: state.products, tiers: state.tiers, customers: state.customers, salesReps: state.salesReps, orders: state.orders });
  }

  if (route === ROUTES.repDashboard && role === 'sales_rep') {
    return repDashboardScreen({ repSales: state.repSales, customers: state.customers.filter(c => String(c.sales_rep_id || '') === String(state.session.user.id)) });
  }

  if (route === ROUTES.repCustomers && role === 'sales_rep') {
    return repCustomersScreen({ customers: state.customers.filter(c => String(c.sales_rep_id || '') === String(state.session.user.id)), onCreate: createCustomer });
  }

  if (route === ROUTES.profile) {
    return profileScreen({ session: state.session });
  }

  if (route === ROUTES.cart) {
    return cartScreen({ cart: store.cart, onRemove: removeFromCart, onQty: updateQty, onCheckout: checkout });
  }

  if (route === ROUTES.orders || route === ROUTES.myOrders || route === ROUTES.adminOrders || route.startsWith('/orders')) {
    return ordersScreen({ orders: state.orders, onOpen: (order) => alert(JSON.stringify(order, null, 2)), onShareWhatsApp: shareWhatsApp });
  }

  return storeScreen({
    products: state.products,
    tiers: state.tiers,
    settings: state.settings,
    search: state.search,
    selectedTier: store.selectedTier,
    cart: store.cart,
    onAdd: addToCart,
    onOpen: openProduct,
    onTierChange: setTier,
    onCheckout: () => navigate(ROUTES.cart),
    onShareInvoice: shareWhatsApp,
    selectedProduct: state.selectedProduct,
  });
}

function render() {
  const route = routeFromHash();
  state.search = state.search || '';
  clear(app);
  const content = routeContent(route);
  app.append(shell({
    session: state.session,
    route,
    content,
    cartCount: store.cart.length,
    bannerImage: state.settings?.[0]?.settings?.banner_image || state.settings?.[0]?.banner_image || '',
    searchValue: state.search,
    onNavigate: navigate,
    onLogout: doLogout,
    onSearch: (q) => { state.search = q; if (route === ROUTES.home || route === '/') render(); },
    onCreateOrder: createOrderShortcut,
  }));
  // patch store screen search if needed by rerendering when route is home
  if (route === ROUTES.home || route === '/') {
    const input = document.querySelector('.search');
    if (input) input.value = state.search;
  }
}

window.addEventListener('hashchange', render);
window.addEventListener('storage', (e) => {
  if (e.key === 'db_first_session') state.session = store.session = JSON.parse(e.newValue || 'null');
  if (e.key === 'db_first_cart') store.cart = JSON.parse(e.newValue || '[]');
  render();
});

async function boot() {
  try {
    const restored = await restoreSession();
    if (restored?.user) state.session = restored;
    else if (store.session) state.session = store.session;
  } catch {}
  try { await loadData(); } catch {}
  state.demoHint = 'Connected fallback ready.';
  if (!location.hash) location.hash = `#${state.session ? ROUTES.home : ROUTES.login}`;
  render();
}

boot();
