const ROUTE_ALIASES = {
  admin: 'admin',
  dashboard: 'admin',
  'rep/dashboard': 'rep-dashboard',
  'rep/customers': 'rep-customers',
  'rep/performance': 'rep-performance',
  'rep/orders': 'rep-orders',
  'my-orders': 'my-orders',
  orders: 'invoices',
  profile: 'account',
  account: 'account',
  companies: 'companies',
  company: 'company',
  offers: 'offers',
  tiers: 'tiers',
  cart: 'cart',
  checkout: 'checkout',
  login: 'login',
  register: 'register',
  customers: 'customers',
  invoices: 'invoices',
  home: 'home',
};

export function parseRoute(hash = (typeof location !== 'undefined' ? location.hash : '#home')) {
  const raw = String(hash || '#home').replace(/^#/, '');
  const [path = 'home', ...rest] = raw.split('/').filter(Boolean);
  const composite = rest.length ? `${path}/${rest[0]}` : path;
  const normalized = ROUTE_ALIASES[composite] || ROUTE_ALIASES[path] || composite || 'home';

  if (normalized === 'home') return { name: 'home', params: {} };
  if (normalized === 'companies') return { name: 'companies', params: {} };
  if (normalized === 'company') return { name: 'company', params: { companyId: rest[0] || '' } };
  if (normalized === 'offers') return { name: 'offers', params: {} };
  if (normalized === 'tiers') return { name: 'tiers', params: {} };
  if (normalized === 'cart') return { name: 'cart', params: {} };
  if (normalized === 'checkout') return { name: 'checkout', params: {} };
  if (normalized === 'login') return { name: 'login', params: {} };
  if (normalized === 'register') return { name: 'register', params: {} };
  if (normalized === 'customers') return { name: 'customers', params: {} };
  if (normalized === 'invoices') return { name: 'invoices', params: {} };
  if (normalized === 'account') return { name: 'account', params: {} };
  if (normalized === 'admin') return { name: 'admin', params: {} };
  if (normalized === 'rep-dashboard') return { name: 'rep-dashboard', params: {} };
  if (normalized === 'rep-customers') return { name: 'rep-customers', params: {} };
  if (normalized === 'rep-performance') return { name: 'rep-performance', params: {} };
  if (normalized === 'rep-orders') return { name: 'rep-orders', params: {} };
  if (normalized === 'my-orders') return { name: 'my-orders', params: {} };
  return { name: 'home', params: {} };
}

export function toHash(routeName, params = {}) {
  if (routeName === 'company') return `#company/${encodeURIComponent(params.companyId || '')}`;
  return `#${routeName}`;
}

export function navigate(routeName, params = {}) {
  if (typeof location === 'undefined' || typeof window === 'undefined') return;
  const next = toHash(routeName, params);
  if (location.hash === next) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }
  location.hash = next;
}
