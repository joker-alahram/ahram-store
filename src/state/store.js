import { DEMO } from '../contracts.js';

const KEYS = {
  session: 'db_first_session',
  cart: 'db_first_cart',
  tier: 'db_first_tier',
  selectedCustomer: 'db_first_customer',
};

const storage = typeof localStorage !== 'undefined' ? localStorage : null;

export function loadJSON(key, fallback) {
  if (!storage) return fallback;
  try { return JSON.parse(storage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

export function saveJSON(key, value) {
  if (!storage) return;
  storage.setItem(key, JSON.stringify(value));
}

function hashRoute() {
  const raw = (location.hash || '#/').replace(/^#/, '');
  const parts = raw.split('/').filter(Boolean);
  return parts.length ? `/${parts.join('/')}` : '/';
}

export const store = {
  route: hashRoute(),
  session: loadJSON(KEYS.session, null) || null,
  cart: loadJSON(KEYS.cart, []),
  selectedTier: loadJSON(KEYS.tier, 'base'),
  selectedCustomer: loadJSON(KEYS.selectedCustomer, null),
  data: {
    settings: DEMO.settings,
    users: DEMO.users,
    tiers: DEMO.tiers,
    products: DEMO.products,
    customers: DEMO.customers,
    orders: DEMO.orders,
    repSales: [],
    health: [{ status: 'healthy', runtime_healthy: true }],
    dailyDeals: [],
    flashOffers: [],
  },
  ui: {
    search: '',
    mode: 'live',
    toast: null,
  },
};

export function setSession(session) {
  store.session = session;
  if (session) saveJSON(KEYS.session, session); else localStorage.removeItem(KEYS.session);
}

export function setCart(cart) {
  store.cart = cart;
  saveJSON(KEYS.cart, cart);
}

export function setTier(tier) {
  store.selectedTier = tier;
  saveJSON(KEYS.tier, tier);
}

export function setSelectedCustomer(customer) {
  store.selectedCustomer = customer;
  saveJSON(KEYS.selectedCustomer, customer);
}

export function resetSession() {
  if (storage) storage.removeItem(KEYS.session);
  store.session = null;
}
