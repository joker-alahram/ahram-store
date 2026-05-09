import { demoData } from './demoData.js';
import {
  mergeCatalogProducts,
  normalizeOfferRow,
  normalizeSettingsRows,
  normalizeTierRow,
  pick,
  asText,
} from './contractUtils.js';

function readSettingsObject(settingsRows) {
  const map = normalizeSettingsRows(settingsRows);
  const firstRow = Array.isArray(settingsRows) ? settingsRows[0] : null;
  const rawSettings = firstRow ? pick(firstRow, ['settings', 'value'], null) : null;
  if (typeof rawSettings === 'string') {
    try {
      const parsed = JSON.parse(rawSettings);
      return { ...parsed, ...map };
    } catch {
      return map;
    }
  }
  if (rawSettings && typeof rawSettings === 'object') return { ...rawSettings, ...map };
  return map;
}

async function fetchRows(api, path, params, fallback = []) {
  try {
    const rows = await api.get(path, params);
    return Array.isArray(rows) ? rows : fallback;
  } catch {
    return fallback;
  }
}

export async function loadCatalog(api, selectedTierName = null) {
  const tierRows = await fetchRows(api, 'v_visible_tiers', { select: '*', order: 'min_order.asc' }, demoData.visibleTiers);
  const tiers = tierRows.map(normalizeTierRow).filter((row) => row.tier_name);
  const defaultTier = tiers.find((tier) => tier.is_default)?.tier_name || tiers[0]?.tier_name || 'base';
  const activeTierName = selectedTierName || defaultTier;

  const [settingsRows, runtimeRows, enrichmentRows, dailyRows, flashRows, healthRows] = await Promise.all([
    fetchRows(api, 'v_app_settings', { select: '*', limit: '50' }, demoData.appSettings),
    fetchRows(api, 'v_runtime_products', { select: '*', tier_name: `eq.${activeTierName}`, order: 'company_id.asc,product_name.asc,unit_code.asc' }, demoData.runtimeProducts),
    fetchRows(api, 'products_with_category', { select: '*', order: 'company_id.asc,product_name.asc' }, demoData.productsWithCategory),
    fetchRows(api, 'daily_deals', { select: '*', order: 'id.desc' }, demoData.dailyDeals),
    fetchRows(api, 'flash_offers', { select: '*', order: 'start_time.desc' }, demoData.flashOffers),
    fetchRows(api, 'v_runtime_commerce_health', { select: '*' }, demoData.runtimeCommerceHealth),
  ]);

  let runtime = runtimeRows;
  if (!runtime.length && activeTierName !== defaultTier) {
    runtime = await fetchRows(api, 'v_runtime_products', { select: '*', tier_name: `eq.${defaultTier}`, order: 'company_id.asc,product_name.asc,unit_code.asc' }, demoData.runtimeProducts);
  }
  if (!runtime.length) runtime = demoData.runtimeProducts;

  const grouped = mergeCatalogProducts(runtime, enrichmentRows.length ? enrichmentRows : demoData.productsWithCategory);
  const settings = readSettingsObject(settingsRows.length ? settingsRows : demoData.appSettings);
  const daily = (dailyRows.length ? dailyRows : demoData.dailyDeals).map((row) => normalizeOfferRow(row, 'daily')).filter((row) => row.id);
  const flash = (flashRows.length ? flashRows : demoData.flashOffers).map((row) => normalizeOfferRow(row, 'flash')).filter((row) => row.id);
  const health = Array.isArray(healthRows) && healthRows.length ? healthRows : demoData.runtimeCommerceHealth;

  return {
    companies: grouped.companies,
    products: grouped.products,
    tiers: tiers.length ? tiers : demoData.visibleTiers.map(normalizeTierRow),
    settingsRows,
    settings,
    offers: { daily, flash },
    top: { products: [], companies: [] },
    health,
    productIndex: grouped.productIndex,
    settingsMap: settings,
  };
}
