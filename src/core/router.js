export function parseRoute(hash = location.hash || '#home') {
  const raw = String(hash).replace(/^#/, '');
  const [path, ...rest] = raw.split('/').filter(Boolean);

  if (!path || path === 'home') return { name: 'home' };
  if (path === 'companies') return { name: 'companies' };
  if (path === 'company') return { name: 'company', params: { companyId: rest[0] || '' } };
  if (path === 'offers') return { name: 'offers' };
  if (path === 'tiers') return { name: 'tiers' };
  if (path === 'cart') return { name: 'cart' };
  if (path === 'checkout') return { name: 'checkout' };
  if (path === 'login') return { name: 'login' };
  if (path === 'register') return { name: 'register' };
  if (path === 'customers') return { name: 'customers' };
  if (path === 'invoices') return { name: 'invoices' };
  if (path === 'account') return { name: 'account' };
  return { name: 'home' };
}

export function toHash(routeName, params = {}) {
  if (routeName === 'company') return `#company/${encodeURIComponent(params.companyId || '')}`;
  return `#${routeName}`;
}

export function navigate(routeName, params = {}) {
  const next = toHash(routeName, params);
  if (location.hash === next) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }
  location.hash = next;
}
