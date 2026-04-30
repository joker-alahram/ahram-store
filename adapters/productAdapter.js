function rowProductId(row) {
  return String(row?.product_id ?? row?.recommended_product_id ?? row?.item_id ?? row?.id ?? '').trim();
}
function rowScore(row) {
  const keys = ['score', 'weight', 'rank', 'popularity', 'views', 'count', 'total_sales'];
  for (const key of keys) {
    const value = Number(row?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
}
function uniqueByProductId(rows = []) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const id = String(row?.product_id || row?.productId || row?.id || '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(row);
  }
  return out;
}
function bumpViewCounts(productIds = []) {
  const next = { ...(state.viewCounts || {}) };
  let changed = false;
  productIds.forEach((id) => {
    const key = String(id || '').trim();
    if (!key) return;
    next[key] = Number(next[key] || 0) + 1;
    changed = true;
  });
  if (changed) {
    state.viewCounts = next;
    saveJSON('b2b_view_counts', state.viewCounts || {});
  }
}
function productById(id) {
  return state.products.find((row) => String(row.product_id) === String(id)) || null;
}
function scoreProduct(product) {
  const productId = String(product?.product_id || '');
  const companyId = String(product?.company_id || '');
  const viewCount = Number(state.viewCounts?.[productId] || 0);
  const cartAffinity = state.cart.some((item) => String(product?.company_id || '') && String(companyName(product?.company_id)).trim() === String(item.company || '').trim()) ? 1 : 0;
  const recommendationSignal = Number((state.customerRecommendations || []).find((row) => rowProductId(row) === productId) ? 2 : 0);
  const popularitySignal = Number((state.productPopularity || []).find((row) => rowProductId(row) === productId) ? 1 : 0);
  const tierBonus = getSelectedTierObject() ? 0.35 : 0;
  const companyBonus = state.viewCounts?.[`company:${companyId}`] ? 0.5 : 0;
  return (viewCount * 2) + recommendationSignal + popularitySignal + cartAffinity * 3 + tierBonus + companyBonus;
}
function extractRowsFromSource(rows = []) {
  return rows
    .map((row) => {
      const id = rowProductId(row);
      return id ? { row, id, score: rowScore(row) } : null;
    })
    .filter(Boolean);
}
function resolveProductList(sourceRows = [], limit = 8) {
  const candidates = extractRowsFromSource(sourceRows)
    .filter((item) => productById(item.id))
    .sort((a, b) => (b.score - a.score) || compareNatural(productById(a.id)?.product_name, productById(b.id)?.product_name))
    .map((item) => productById(item.id));
  return uniqueByProductId(candidates).slice(0, limit);
}
function fallbackRecommendedProducts(limit = 8) {
  const cartCompanyIds = new Set(state.cart.map((item) => {
    const product = productById(item.id);
    return product?.company_id ? String(product.company_id) : '';
  }).filter(Boolean));

  const ranked = [...state.products].map((product) => ({
    product,
    score: scoreProduct(product),
  })).sort((a, b) => (b.score - a.score) || compareNatural(a.product.product_name, b.product.product_name));

  const related = ranked.filter(({ product }) => cartCompanyIds.size ? cartCompanyIds.has(String(product.company_id)) : true).map((item) => item.product);
  const rest = ranked.map((item) => item.product);
  return uniqueByProductId([...related, ...rest]).slice(0, limit);
}
function getHeroProducts(limit = 4) {
  const fromRecommendations = resolveProductList(state.customerRecommendations, limit);
  if (fromRecommendations.length) return fromRecommendations;
  const fromPopularity = resolveProductList(state.productPopularity, limit);
  if (fromPopularity.length) return fromPopularity;
  return fallbackRecommendedProducts(limit);
}
function getPopularProducts(limit = 8) {
  const fromPopularity = resolveProductList(state.topProducts.length ? state.topProducts : state.productPopularity, limit);
  return fromPopularity.length ? fromPopularity : fallbackRecommendedProducts(limit);
}
function getRecommendedProducts(limit = 8) {
  const fromCustomer = resolveProductList(state.customerRecommendations, limit);
  if (fromCustomer.length) return fromCustomer;
  return fallbackRecommendedProducts(limit);
}
function getFrequentlyViewedProducts(limit = 8) {
  const counts = Object.entries(state.viewCounts || {})
    .filter(([key]) => !String(key).startsWith('company:'))
    .map(([productId, count]) => ({ product: productById(productId), score: Number(count || 0) }))
    .filter((item) => item.product)
    .sort((a, b) => (b.score - a.score) || compareNatural(a.product.product_name, b.product.product_name))
    .map((item) => item.product);
  return uniqueByProductId(counts).slice(0, limit);
}
function getCartAffinityProducts(limit = 8) {
  const companyIds = new Set(state.cart.map((item) => productById(item.id)?.company_id).filter(Boolean).map(String));
  const matches = state.products.filter((product) => companyIds.has(String(product.company_id)));
  const ranked = matches.length ? matches : fallbackRecommendedProducts(limit);
  return uniqueByProductId(ranked).slice(0, limit);
}
