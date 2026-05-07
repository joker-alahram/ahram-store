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
  const tierName = state.commerce.selectedTier || state.commerce.catalog.tiers.find((tier) => tier.is_default)?.tier_name || 'base';
  return state.commerce.catalog.tiers.find((tier) => tier.tier_name === tierName) || {
    tier_name: tierName,
    visible_label: tierName,
    min_order: 0,
    discount_percent: 0,
  };
}

export function getSessionLabel(state) {
  const s = state.auth.session;
  if (!s) return 'دخول';
  return s.name || s.username || s.phone || 'حسابي';
}

export function getActiveCustomer(state) {
  return state.auth.selectedCustomer || null;
}

export function getVisibleCompanies(state) {
  const q = normalize(state.ui.search);
  return (state.commerce.catalog.companies || []).filter((company) => {
    if (!q) return true;
    return normalize(company.company_name).includes(q) || normalize(company.company_id).includes(q);
  });
}

export function getVisibleProducts(state, companyId = null) {
  const q = normalize(state.ui.search);
  const indexed = Object.values(state.commerce.catalog.productIndex || {});
  const products = indexed.length ? indexed : (state.commerce.catalog.products || []);
  return products.filter((product) => {
    if (companyId && String(product.company_id) !== String(companyId)) return false;
    if (!q) return true;
    return normalize(product.product_name).includes(q)
      || normalize(product.product_id).includes(q)
      || normalize(product.company_name).includes(q)
      || normalize(product.company_id).includes(q);
  });
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
  return String(value ?? '').toLowerCase().trim();
}
