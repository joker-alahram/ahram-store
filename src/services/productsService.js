import { labelForUnit, normalizeText } from './runtimeUtils.js';

function byOrder(a, b) {
  const ai = Number(a ?? 0);
  const bi = Number(b ?? 0);
  return ai - bi;
}

export function buildRuntimeCatalog({ runtimeRows = [], catalogProducts = [], companies = [], tiers = [], settings = {}, daily = [], flash = [] }) {
  const companyMap = new Map(companies.map((company) => [String(company.company_id ?? '').trim(), {
    company_id: String(company.company_id ?? '').trim(),
    company_name: String(company.company_name ?? '').trim(),
    company_logo: company.company_logo || '',
    visible: company.visible !== false,
  }]));

  const productMeta = new Map(catalogProducts.map((row) => [String(row.product_id ?? '').trim(), {
    product_id: String(row.product_id ?? '').trim(),
    product_name: String(row.product_name ?? '').trim(),
    company_id: String(row.company_id ?? '').trim(),
    company_name: companyMap.get(String(row.company_id ?? '').trim())?.company_name || '',
    company_logo: companyMap.get(String(row.company_id ?? '').trim())?.company_logo || '',
    product_image: row.product_image || '',
    visible: row.visible !== false,
    status: String(row.status ?? '').trim(),
  }]));

  const productIndex = new Map();
  for (const row of runtimeRows) {
    const productId = String(row.product_id ?? '').trim();
    if (!productId) continue;
    const meta = productMeta.get(productId) || {};
    const existing = productIndex.get(productId) || {
      product_id: productId,
      product_name: String(row.product_name ?? meta.product_name ?? '').trim(),
      company_id: meta.company_id || '',
      company_name: meta.company_name || '',
      company_logo: meta.company_logo || '',
      product_image: meta.product_image || '',
      visible: meta.visible !== false,
      variants: [],
      units: [],
      tier_names: [],
      bestPrice: null,
      maxQty: 0,
      allow_backorder: false,
    };

    const variant = {
      product_id: productId,
      product_name: String(row.product_name ?? existing.product_name ?? '').trim(),
      unit_code: String(row.unit_code ?? '').trim(),
      tier_name: String(row.tier_name ?? '').trim(),
      final_price: Number(row.final_price ?? 0),
      available_qty: Number(row.available_qty ?? 0),
      reserved_qty: Number(row.reserved_qty ?? 0),
      allow_backorder: row.allow_backorder === true,
      runtime_healthy: row.runtime_healthy === true,
      unit_label: labelForUnit(row.unit_code),
    };

    if (!variant.product_id || !variant.unit_code || !variant.tier_name) continue;
    existing.variants.push(variant);
    if (!existing.units.includes(variant.unit_code)) existing.units.push(variant.unit_code);
    if (!existing.tier_names.includes(variant.tier_name)) existing.tier_names.push(variant.tier_name);
    existing.allow_backorder = existing.allow_backorder || variant.allow_backorder;
    existing.maxQty = Math.max(existing.maxQty, Number(variant.available_qty || 0));
    existing.bestPrice = existing.bestPrice == null ? variant.final_price : Math.min(existing.bestPrice, variant.final_price);
    productIndex.set(productId, existing);
  }

  const products = Array.from(productIndex.values()).map((product) => ({
    ...product,
    variants: product.variants.sort((a, b) => {
      const tierCompare = String(a.tier_name).localeCompare(String(b.tier_name), 'ar');
      if (tierCompare !== 0) return tierCompare;
      return String(a.unit_code).localeCompare(String(b.unit_code), 'ar');
    }),
    units: product.units.sort((a, b) => String(a).localeCompare(String(b), 'ar')),
    tier_names: product.tier_names.sort((a, b) => String(a).localeCompare(String(b), 'ar')),
  }));

  const companyStats = Array.from(new Map(products.map((product) => [product.company_id || product.product_id, {
    company_id: product.company_id || '',
    company_name: product.company_name || 'منتجات بدون شركة',
    company_logo: product.company_logo || '',
    visible: true,
    product_count: 0,
  }])).values());

  for (const product of products) {
    const key = product.company_id || '';
    const entry = companyStats.find((item) => item.company_id === key) || companyStats.find((item) => !item.company_id);
    if (entry) entry.product_count += 1;
  }

  const tierList = tiers.map((tier) => ({
    tier_name: String(tier.tier_name ?? '').trim(),
    display_name: String(tier.display_name ?? tier.tier_name ?? '').trim(),
    min_order: Number(tier.min_order ?? 0),
    is_default: tier.is_default === true,
    id: tier.id || null,
  })).filter((tier) => tier.tier_name);

  return {
    companies: companyStats.sort((a, b) => String(a.company_name).localeCompare(String(b.company_name), 'ar')),
    products,
    productIndex: Object.fromEntries(products.map((product) => [product.product_id, product])),
    tiers: tierList,
    settings,
    offers: {
      daily: Array.isArray(daily) ? daily : [],
      flash: Array.isArray(flash) ? flash : [],
    },
  };
}

export function getDefaultTier(tiers = []) {
  return tiers.find((tier) => tier.is_default) || tiers[0] || null;
}

export function resolveTierProduct(product, tierName) {
  if (!product) return null;
  const selectedTier = tierName || product.tier_names?.[0] || null;
  if (!selectedTier) return null;
  return product.variants.find((variant) => variant.tier_name === selectedTier) || null;
}

export function resolveVisibleProducts(catalog, search = '', tierName = '', companyId = '') {
  const q = normalizeText(search);
  return catalog.products.filter((product) => {
    if (companyId && String(product.company_id) !== String(companyId)) return false;
    const hasTier = !tierName || product.tier_names.includes(tierName);
    if (!hasTier) return false;
    if (!q) return true;
    return [product.product_name, product.product_id, product.company_name, product.company_id].some((value) => normalizeText(value).includes(q));
  });
}

export function groupProductsByCompany(catalog, search = '', tierName = '') {
  const visible = resolveVisibleProducts(catalog, search, tierName);
  const map = new Map();
  for (const company of catalog.companies) map.set(company.company_id || `company:${company.company_name}`, { ...company, products: [] });
  for (const product of visible) {
    const key = product.company_id || `company:${product.company_name || 'empty'}`;
    const entry = map.get(key) || { company_id: product.company_id || '', company_name: product.company_name || 'بدون شركة', company_logo: product.company_logo || '', visible: true, product_count: 0, products: [] };
    entry.products.push(product);
    entry.product_count = entry.products.length;
    map.set(key, entry);
  }
  return Array.from(map.values()).filter((company) => company.products.length > 0).sort((a, b) => String(a.company_name).localeCompare(String(b.company_name), 'ar'));
}
