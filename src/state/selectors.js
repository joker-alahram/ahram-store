import { normalizeTierName } from '../services/pricingService.js';

let visibleCompaniesCache = { source: null, query: '', result: [] };
let visibleProductsCache = { source: null, query: '', companyId: null, result: [] };

export function computeCartTotals(state) {
  const lines = state.commerce.cart || [];
  const totals = lines.reduce((acc, item) => {
    const amount = Number(item.price || 0) * Number(item.qty || 0);
    acc.grand += amount;
    if (item.type === 'product') acc.products += amount;
    if (item.type === 'deal') acc.deals += amount;
    if (item.type === 'flash') acc.flash += amount;
    return acc;
  }, { grand: 0, products: 0, deals: 0, flash: 0 });

  return {
    ...totals,
    count: lines.reduce((n, item) => n + Number(item.qty || 0), 0),
  };
}

export function getSelectedTier(state) {
  const catalogTiers = state.commerce.catalog.tiers || [];
  const requested = normalizeTierName(state.commerce.selectedTier);
  if (requested) {
    const match = catalogTiers.find((tier) => normalizeTierName(tier.tier_name) === requested);
    if (match) return match;
  }
  const defaultTier = catalogTiers.find((tier) => tier.is_default);
  return defaultTier || catalogTiers[0] || {
    tier_name: requested || 'base',
    visible_label: requested || 'base',
    min_order: 0,
    discount_percent: 0,
  };
}

export function getSessionLabel(state) {
  const s = state.auth.session;
  if (!s) return 'دخول';
  return s.name || s.username || s.phone || 'حسابي';
}

export function hasOperationalDashboard(state) {
  const user = state?.governance?.systemUser;
  const capabilities = Array.isArray(state?.governance?.capabilities) ? state.governance.capabilities : [];
  return Boolean(user?.id || user?.phone || user?.username || capabilities.length);
}

export function getActiveCustomer(state) {
  return state.auth.selectedCustomer || null;
}

export function getVisibleCompanies(state) {
  const source = state.commerce.catalog.companies || [];
  const q = normalize(state.ui.search);
  if (visibleCompaniesCache.source === source && visibleCompaniesCache.query === q) return visibleCompaniesCache.result;
  const result = source.filter((company) => {
    if (!q) return true;
    return normalize(company.company_name).includes(q) || normalize(company.company_id).includes(q);
  });
  visibleCompaniesCache = { source, query: q, result };
  return result;
}

export function getVisibleProducts(state, companyId = null) {
  const source = state.commerce.catalog.productIndex || {};
  const q = normalize(state.ui.search);
  if (visibleProductsCache.source === source && visibleProductsCache.query === q && String(visibleProductsCache.companyId ?? '') === String(companyId ?? '')) {
    return visibleProductsCache.result;
  }
  const products = Object.values(source);
  const result = products.filter((product) => {
    if (companyId && String(product.company_id) !== String(companyId)) return false;
    if (!q) return true;
    return normalize(product.product_name).includes(q)
      || normalize(product.product_id).includes(q)
      || normalize(product.company_name).includes(q)
      || normalize(product.company_id).includes(q);
  });
  visibleProductsCache = { source, query: q, companyId, result };
  return result;
}

export function getVisibleDailyDeals(state) {
  const q = normalize(state.ui.search);
  return (state.commerce.catalog.offers.daily || []).filter((item) => !q || normalize(item.title).includes(q) || normalize(item.description).includes(q));
}

export function getVisibleFlashOffers(state) {
  const q = normalize(state.ui.search);
  return (state.commerce.catalog.offers.flash || []).filter((item) => !q || normalize(item.title).includes(q) || normalize(item.description).includes(q));
}

export function normalize(value) {
  return String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}
