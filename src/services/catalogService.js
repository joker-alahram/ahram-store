import { normalizeTierName, buildPriceBook } from './pricingService.js';

function markPerf(name) {
  if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
    try { performance.mark(name); } catch { /* noop */ }
  }
}

function measurePerf(name, startMark, endMark) {
  if (typeof performance !== 'undefined' && typeof performance.measure === 'function') {
    try {
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name);
      const latest = entries[entries.length - 1];
      if (latest) console.info(`[perf] ${name}: ${latest.duration.toFixed(2)}ms`);
    } catch { /* noop */ }
  }
}

function sanitizeImageSrc(value) {
  const src = String(value ?? '').trim();
  return src || '';
}

function normalizeSpacing(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function unitRank(unit) {
  return { carton: 1, pack: 2, half_pack: 3, piece: 4 }[unit] ?? 99;
}

const RESOLVED_VIEW_CACHE = new Map();

function buildResolutionKey(candidates, params = {}, pageSize = 160, selectVariants = []) {
  return JSON.stringify({
    candidates: Array.isArray(candidates) ? candidates : [],
    params: Object.entries(params || {}).sort(([left], [right]) => String(left).localeCompare(String(right))),
    pageSize,
    selectVariants: Array.isArray(selectVariants) ? selectVariants : [],
  });
}

const CATALOG_SELECT_VARIANTS = [
  'product_id,product_name,company_id,company_name,company_logo,product_image,status,visible,unit_code,tier_name,final_price,can_buy',
  'product_id,product_name,company_id,company_name,company_logo,product_image,status,visible,unit_code,tier_name,final_price',
  'product_id,product_name,company_id,company_name,product_image,status,visible,unit_code,tier_name,final_price',
  '*',
];

function createProgressiveSelectOptions(params = {}, extra = []) {
  const selectVariants = Array.isArray(extra) && extra.length ? extra : CATALOG_SELECT_VARIANTS;
  return selectVariants.map((select) => ({ ...params, select }));
}

async function loadRowsWithProgressiveSelects(api, candidates, params = {}, pageSize = 160, selectVariants = CATALOG_SELECT_VARIANTS) {
  const cacheKey = buildResolutionKey(candidates, params, pageSize, selectVariants);
  let lastError = null;
  for (const variant of createProgressiveSelectOptions(params, selectVariants)) {
    try {
      const rows = await loadRowsWithFallback(api, candidates, variant, pageSize, cacheKey);
      if (Array.isArray(rows) && rows.length) return rows.filter(Boolean);
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return [];
}

function normalizeCompany(row) {
  const result = {
    company_id: normalizeSpacing(row.company_id ?? row.id ?? ''),
    company_name: normalizeSpacing(row.company_name ?? ''),
    company_logo: sanitizeImageSrc(row.company_logo || ''),
    visible: row.visible !== false,
    allow_discount: row.allow_discount !== false,
  };
  return result;
}

function normalizeTier(row) {
  const canonical = normalizeTierName(row.tier_name);
  const result = {
    tier_name: canonical,
    visible_label: normalizeSpacing(row.visible_label ?? row.tier_name ?? ''),
    min_order: Number(row.min_order ?? 0),
    discount_percent: Number(row.discount_percent ?? 0),
    visible: row.visible !== false,
    is_active: row.is_active !== false,
    is_default: row.is_default === true,
    discount_carton: row.discount_carton !== false,
    discount_pack: row.discount_pack !== false,
  };
  return result;
}

function normalizeOffer(row, kind) {
  const result = {
    ...row,
    kind,
    id: row.id,
    title: normalizeSpacing(row.title ?? ''),
    description: normalizeSpacing(row.description ?? ''),
    image: sanitizeImageSrc(row.image || ''),
    price: Number(row.price ?? 0),
    stock: Number(row.stock ?? 0),
    can_buy: row.can_buy !== false && row.is_active !== false && (kind === 'daily' ? Number(row.stock ?? 0) > 0 : true),
    status: row.status || (kind === 'flash' ? 'scheduled' : 'active'),
  };
  return result;
}

function normalizeRuntimeRow(row) {
  const result = {
    product_id: normalizeSpacing(row.product_id ?? ''),
    product_name: normalizeSpacing(row.product_name ?? ''),
    company_id: normalizeSpacing(row.company_id ?? ''),
    company_name: normalizeSpacing(row.company_name ?? ''),
    company_logo: sanitizeImageSrc(row.company_logo || ''),
    category: normalizeSpacing(row.category ?? ''),
    product_image: sanitizeImageSrc(row.product_image || ''),
    status: normalizeSpacing(row.status ?? '') || 'active',
    visible: row.visible !== false,
    unit_code: normalizeSpacing(row.unit_code ?? ''),
    tier_name: normalizeTierName(row.tier_name),
    final_price: Number(row.final_price ?? 0),
    available_qty: Number(row.available_qty ?? 0),
    reserved_qty: Number(row.reserved_qty ?? 0),
    allow_backorder: row.allow_backorder === true,
    runtime_healthy: row.runtime_healthy !== false,
    is_sellable: row.is_sellable !== false,
    unit_active: row.unit_active !== false,
    min_qty: Number(row.min_qty ?? 1),
    display_order: Number(row.display_order ?? 0),
  };
  return result;
}

function normalizeCatalogRow(row) {
  const result = {
    product_id: normalizeSpacing(row.product_id ?? ''),
    product_name: normalizeSpacing(row.product_name ?? ''),
    company_id: normalizeSpacing(row.company_id ?? ''),
    company_name: normalizeSpacing(row.company_name ?? ''),
    company_logo: sanitizeImageSrc(row.company_logo || ''),
    category: normalizeSpacing(row.category ?? ''),
    product_image: sanitizeImageSrc(row.product_image || ''),
    status: normalizeSpacing(row.status ?? '') || 'active',
    visible: row.visible !== false,
    unit_code: normalizeSpacing(row.unit_code ?? ''),
    tier_name: normalizeTierName(row.tier_name),
    final_price: Number(row.final_price ?? 0),
    available_qty: Number(row.available_qty ?? 0),
    reserved_qty: Number(row.reserved_qty ?? 0),
    allow_backorder: row.allow_backorder === true,
    runtime_healthy: row.can_buy !== false,
    is_sellable: row.can_buy !== false,
    unit_active: row.unit_active !== false,
    min_qty: Number(row.min_qty ?? 1),
    display_order: Number(row.display_order ?? 0),
    can_buy: row.can_buy !== false,
    availability_reason: row.availability_reason || null,
  };
  return result;
}

function createProductShell(row) {
  const result = {
    product_id: row.product_id,
    product_name: row.product_name,
    company_id: row.company_id,
    company_name: row.company_name,
    company_logo: row.company_logo,
    category: row.category,
    product_image: row.product_image,
    status: row.status,
    visible: row.visible,
    runtime_healthy: true,
    unitMap: new Map(),
  };
  return result;
}

function chooseVariant(variants, selectedTierName) {
  const canonical = normalizeTierName(selectedTierName);
  let activeFallback = null;
  let tierFallback = null;
  let anyFallback = null;
  for (const row of Array.isArray(variants) ? variants : []) {
    if (!row) continue;
    if (!anyFallback) anyFallback = row;
    const isActive = row.runtime_healthy !== false && row.is_sellable !== false && row.unit_active !== false && row.final_price > 0;
    if (canonical && normalizeTierName(row.tier_name) === canonical && !tierFallback) tierFallback = row;
    if (isActive && !activeFallback) activeFallback = row;
  }
  return tierFallback || activeFallback || anyFallback || null;
}

function chooseCatalogVariant(variants, selectedTierName) {
  const canonical = normalizeTierName(selectedTierName);
  let activeFallback = null;
  let tierFallback = null;
  let anyFallback = null;
  for (const row of Array.isArray(variants) ? variants : []) {
    if (!row) continue;
    if (!anyFallback) anyFallback = row;
    const isActive = row.can_buy !== false && Number(row.final_price ?? 0) > 0 && row.unit_active !== false;
    if (canonical && normalizeTierName(row.tier_name) === canonical && !tierFallback) tierFallback = row;
    if (isActive && !activeFallback) activeFallback = row;
  }
  return tierFallback || activeFallback || anyFallback || null;
}

function sortUnitEntries(product) {
  return Array.from(product?.unitMap?.values?.() || []).sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0) || unitRank(a.unit_code) - unitRank(b.unit_code));
}

function sortProjectedProducts(productIndex) {
  return Object.values(productIndex || {})
    .filter((row) => row?.visible !== false)
    .sort((a, b) => {
      const left = Number(a.units?.[a.defaultUnit]?.display_order ?? Number.POSITIVE_INFINITY);
      const right = Number(b.units?.[b.defaultUnit]?.display_order ?? Number.POSITIVE_INFINITY);
      if (left !== right) return left - right;
      return String(a.product_name).localeCompare(String(b.product_name), 'ar');
    });
}

export function projectRuntimeCatalogRows(rows, selectedTierName, tiers = []) {
  const aggregated = aggregateCatalogProducts(rows);
  const productIndex = projectCatalogProducts(aggregated, selectedTierName);
  const products = sortProjectedProducts(productIndex);
  return {
    aggregated,
    productIndex,
    products,
    priceBook: buildPriceBook(products, tiers, selectedTierName),
  };
}

export function aggregateRuntimeProducts(rows) {
  const products = new Map();
  for (const rawRow of Array.isArray(rows) ? rows : []) {
    const row = normalizeRuntimeRow(rawRow);
    if (!row.product_id || !row.unit_code) continue;
    const current = products.get(row.product_id) || createProductShell(row);

    current.product_name = current.product_name || row.product_name;
    current.company_id = current.company_id || row.company_id;
    current.company_name = current.company_name || row.company_name;
    current.company_logo = current.company_logo || row.company_logo;
    current.category = current.category || row.category;
    current.product_image = current.product_image || row.product_image;
    current.status = current.status || row.status;
    current.visible = current.visible !== false && row.visible !== false;
    current.runtime_healthy = current.runtime_healthy !== false && row.runtime_healthy !== false;

    const unitEntry = current.unitMap.get(row.unit_code) || { unit_code: row.unit_code, variants: [] };
    unitEntry.variants.push(row);
    unitEntry.display_order = Number.isFinite(unitEntry.display_order) && unitEntry.display_order !== 0 ? Math.min(unitEntry.display_order, row.display_order) : row.display_order;
    current.unitMap.set(row.unit_code, unitEntry);
    products.set(row.product_id, current);
  }
  return products;
}

export function projectRuntimeProducts(aggregatedProducts, selectedTierName) {
  const projected = new Map();
  for (const product of aggregatedProducts instanceof Map ? aggregatedProducts.values() : Object.values(aggregatedProducts || {})) {
    const units = {};
    const sellable = [];
    const unitOrder = [];
    let defaultUnit = null;

    for (const unitEntry of sortUnitEntries(product)) {
      const chosen = chooseVariant(unitEntry.variants, selectedTierName);
      if (!chosen) continue;
      const unitRecord = {
        unit_code: unitEntry.unit_code,
        final_price: Number(chosen.final_price ?? 0),
        available_qty: Number(chosen.available_qty ?? 0),
        reserved_qty: Number(chosen.reserved_qty ?? 0),
        allow_backorder: chosen.allow_backorder === true,
        runtime_healthy: chosen.runtime_healthy !== false,
        is_sellable: chosen.is_sellable !== false,
        unit_active: chosen.unit_active !== false,
        min_qty: Number(chosen.min_qty ?? 1),
        display_order: Number(chosen.display_order ?? 0),
        tier_name: normalizeTierName(chosen.tier_name),
        variants: unitEntry.variants,
      };
      units[unitEntry.unit_code] = unitRecord;
      unitOrder.push(unitEntry.unit_code);
      if (unitRecord.runtime_healthy !== false && unitRecord.is_sellable !== false && unitRecord.unit_active !== false && unitRecord.final_price > 0) {
        sellable.push(unitEntry.unit_code);
        if (!defaultUnit) defaultUnit = unitEntry.unit_code;
      }
    }

    if (!Object.keys(units).length) continue;

    projected.set(product.product_id, {
      product_id: product.product_id,
      product_name: product.product_name,
      company_id: product.company_id,
      company_name: product.company_name,
      company_logo: product.company_logo,
      category: product.category,
      product_image: product.product_image,
      status: product.status,
      visible: product.visible,
      tier_name: normalizeTierName(selectedTierName) || null,
      runtime_healthy: product.runtime_healthy !== false,
      units,
      unitOrder,
      sellable_units: sellable,
      defaultUnit: defaultUnit || sellable[0] || unitOrder[0] || null,
    });
  }
  return Object.fromEntries(projected.entries());
}

function aggregateCatalogProducts(rows) {
  const products = new Map();
  for (const rawRow of Array.isArray(rows) ? rows : []) {
    const row = normalizeCatalogRow(rawRow);
    if (!row.product_id || !row.unit_code) continue;
    const current = products.get(row.product_id) || createProductShell(row);

    current.product_name = current.product_name || row.product_name;
    current.company_id = current.company_id || row.company_id;
    current.company_name = current.company_name || row.company_name;
    current.company_logo = current.company_logo || row.company_logo;
    current.category = current.category || row.category;
    current.product_image = current.product_image || row.product_image;
    current.status = current.status || row.status;
    current.visible = current.visible !== false && row.visible !== false;

    const unitEntry = current.unitMap.get(row.unit_code) || { unit_code: row.unit_code, variants: [] };
    unitEntry.variants.push(row);
    unitEntry.display_order = Number.isFinite(unitEntry.display_order) && unitEntry.display_order !== 0 ? Math.min(unitEntry.display_order, row.display_order) : row.display_order;
    current.unitMap.set(row.unit_code, unitEntry);
    products.set(row.product_id, current);
  }
  return products;
}

function projectCatalogProducts(aggregatedProducts, selectedTierName) {
  const projected = new Map();
  for (const product of aggregatedProducts instanceof Map ? aggregatedProducts.values() : Object.values(aggregatedProducts || {})) {
    const units = {};
    const sellable = [];
    const unitOrder = [];
    let defaultUnit = null;
    let availabilityReason = null;
    let canBuy = false;

    for (const unitEntry of sortUnitEntries(product)) {
      const chosen = chooseCatalogVariant(unitEntry.variants, selectedTierName);
      if (!chosen) continue;
      const unitRecord = {
        unit_code: unitEntry.unit_code,
        final_price: Number(chosen.final_price ?? 0),
        available_qty: Number(chosen.available_qty ?? 0),
        reserved_qty: Number(chosen.reserved_qty ?? 0),
        allow_backorder: chosen.allow_backorder === true,
        runtime_healthy: chosen.can_buy !== false,
        is_sellable: chosen.can_buy !== false,
        unit_active: chosen.unit_active !== false,
        min_qty: Number(chosen.min_qty ?? 1),
        display_order: Number(chosen.display_order ?? 0),
        tier_name: normalizeTierName(chosen.tier_name),
        variants: unitEntry.variants,
        can_buy: chosen.can_buy !== false,
        availability_reason: chosen.availability_reason || null,
      };
      units[unitEntry.unit_code] = unitRecord;
      unitOrder.push(unitEntry.unit_code);
      if (unitRecord.runtime_healthy !== false && unitRecord.is_sellable !== false && unitRecord.unit_active !== false && unitRecord.final_price > 0) {
        sellable.push(unitEntry.unit_code);
        canBuy = true;
        if (!defaultUnit) defaultUnit = unitEntry.unit_code;
      }
      if (!availabilityReason && unitRecord.availability_reason) availabilityReason = unitRecord.availability_reason;
    }

    if (!Object.keys(units).length) continue;

    projected.set(product.product_id, {
      product_id: product.product_id,
      product_name: product.product_name,
      company_id: product.company_id,
      company_name: product.company_name,
      company_logo: product.company_logo,
      category: product.category,
      product_image: product.product_image,
      status: product.status,
      visible: product.visible,
      tier_name: normalizeTierName(selectedTierName) || null,
      runtime_healthy: canBuy,
      can_buy: canBuy,
      availability_reason: availabilityReason || (canBuy ? null : 'missing_price'),
      units,
      unitOrder,
      sellable_units: sellable,
      defaultUnit: defaultUnit || sellable[0] || unitOrder[0] || null,
    });
  }
  return Object.fromEntries(projected.entries());
}

async function sleepFrame() {
  if (typeof requestAnimationFrame === 'function') {
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function loadPagedRowsVariant(api, path, params = {}, pageSize = 160) {
  const rows = [];
  let offset = 0;
  const requestParams = { ...params };
  while (true) {
    if (rows.length >= 300) break;
    const page = await api.get(path, { ...requestParams, limit: String(pageSize), offset: String(offset) });
    const batch = Array.isArray(page) ? page : [];
    if (!batch.length) break;
    rows.push(...batch.filter(Boolean));
    offset += batch.length;
    if (batch.length < pageSize) break;
    await sleepFrame();
  }
  return rows.filter(Boolean);
}

function buildLoadStrategies(params = {}) {
  const clean = { ...params };
  const select = String(clean.select || '*').trim() || '*';
  const strategies = [
    { ...clean, select },
    { ...clean, select, order: undefined },
    { ...clean, select: '*' },
    { ...clean, select: '*', order: undefined },
  ];
  const seen = new Set();
  return strategies.filter((candidate) => {
    const key = JSON.stringify(Object.entries(candidate).filter(([, value]) => value !== undefined));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function loadPagedRows(api, path, params = {}, pageSize = 160) {
  let lastError = null;
  for (const strategy of buildLoadStrategies(params)) {
    try {
      return await loadPagedRowsVariant(api, path, strategy, pageSize);
    } catch (error) {
      lastError = error;
      const status = Number(error?.status || 0);
      if (status && status !== 400 && status !== 406) {
        throw error;
      }
    }
  }
  if (lastError) throw lastError;
  return [];
}

async function loadRowsWithFallback(api, candidates, params = {}, pageSize = 160, cacheKey = '') {
  let lastError = null;
  const cachedPath = cacheKey ? RESOLVED_VIEW_CACHE.get(cacheKey) : null;
  const orderedCandidates = [];
  if (cachedPath && Array.isArray(candidates) && candidates.includes(cachedPath)) {
    orderedCandidates.push(cachedPath);
  }
  for (const path of Array.isArray(candidates) ? candidates : []) {
    if (!orderedCandidates.includes(path)) orderedCandidates.push(path);
  }

  for (const path of orderedCandidates) {
    try {
      const rows = await loadPagedRows(api, path, params, pageSize);
      if (Array.isArray(rows) && rows.length) {
        if (cacheKey) RESOLVED_VIEW_CACHE.set(cacheKey, path);
        return rows.filter(Boolean);
      }
    } catch (error) {
      lastError = error;
      if (cacheKey && RESOLVED_VIEW_CACHE.get(cacheKey) === path) {
        RESOLVED_VIEW_CACHE.delete(cacheKey);
      }
    }
  }
  if (lastError) throw lastError;
  return [];
}

function normalizeTopRows(rows, kind) {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row) => Boolean(row))
    .map((row) => ({ ...row, kind }))
    .filter((row) => {
      if (kind === 'company') return Boolean(row.company_id);
      return Boolean(row.product_id);
    });
}

function isMeaningfulCatalog(snapshot) {
  return Boolean(snapshot)
    && (
      (Array.isArray(snapshot.products) && snapshot.products.length > 0)
      || (Array.isArray(snapshot.companies) && snapshot.companies.length > 0)
      || (Array.isArray(snapshot.tiers) && snapshot.tiers.length > 0)
      || (snapshot.offers && ((snapshot.offers.daily || []).length > 0 || (snapshot.offers.flash || []).length > 0))
    );
}

export async function loadHomeCatalog(api, selectedTierName = null, options = {}) {
  markPerf('catalog:home:start');
  const includeTop = options?.includeTop !== false;
  const criticalOnly = options?.criticalOnly === true;
  const companiesRequest = api.get('companies', { select: 'company_id,company_name,company_logo,visible,allow_discount', order: 'company_id.asc' });
  const tiersRequest = api.get('tiers', { select: 'tier_name,visible_label,min_order,discount_percent,visible,is_active,is_default,discount_carton,discount_pack', order: 'min_order.asc' });
  const settingsRequest = criticalOnly ? Promise.resolve([]) : api.get('v_app_settings', { select: 'settings,updated_at' });
  const dailyRequest = criticalOnly ? Promise.resolve([]) : api.get('v_daily_deals', { select: 'id,title,description,image,price,stock,can_buy,is_active,sold_count' });
  const flashRequest = criticalOnly ? Promise.resolve([]) : api.get('v_flash_offers_runtime', { select: '*' });
  const catalogRowsRequest = loadRowsWithProgressiveSelects(api, ['v_catalog_products', 'v_runtime_products_safe', 'v_runtime_products_mobile'], {
    order: 'product_id.asc,unit_code.asc',
  }, 160, [
    'product_id,product_name,company_id,company_name,company_logo,product_image,status,visible,unit_code,tier_name,final_price,can_buy',
    'product_id,product_name,company_id,company_name,company_logo,product_image,status,visible,unit_code,tier_name,final_price',
    'product_id,product_name,company_id,company_name,product_image,status,visible,unit_code,tier_name,final_price',
    '*',
  ]);

  const topProductsRequest = includeTop && !criticalOnly
    ? api.get('v_top_products', { select: 'product_id,product_name,total_qty,total_sales', order: 'total_qty.desc' }).catch(() => [])
    : Promise.resolve([]);
  const topCompaniesRequest = includeTop && !criticalOnly
    ? api.get('v_top_companies', { select: 'company_id,company_name,total_sales,total_items', order: 'total_sales.desc' }).catch(() => [])
    : Promise.resolve([]);

  const [requests, catalogRows, topProducts, topCompanies] = await Promise.all([
    Promise.allSettled([companiesRequest, tiersRequest, settingsRequest, dailyRequest, flashRequest]),
    catalogRowsRequest.catch(() => []),
    topProductsRequest,
    topCompaniesRequest,
  ]);

  const companies = requests[0].status === 'fulfilled' && Array.isArray(requests[0].value) && requests[0].value.length ? requests[0].value : [];
  const tiers = requests[1].status === 'fulfilled' && Array.isArray(requests[1].value) && requests[1].value.length ? requests[1].value : [];
  const settingsPayload = requests[2].status === 'fulfilled' && Array.isArray(requests[2].value) && requests[2].value.length ? requests[2].value[0] : null;
  const daily = requests[3].status === 'fulfilled' && Array.isArray(requests[3].value) && requests[3].value.length ? requests[3].value : [];
  const flash = requests[4].status === 'fulfilled' && Array.isArray(requests[4].value) && requests[4].value.length ? requests[4].value : [];

  const safeCatalogRows = Array.isArray(catalogRows) ? catalogRows : [];
  const companyList = companies.map(normalizeCompany).filter((row) => row.company_id);
  const tierList = tiers.map(normalizeTier).filter((row) => row.tier_name);
  const settingsMap = settingsPayload && settingsPayload.settings && typeof settingsPayload.settings === 'object' ? settingsPayload.settings : {};
  const settingsList = Object.entries(settingsMap).map(([key, value]) => ({ key, value }));
  const projectedCatalog = projectRuntimeCatalogRows(safeCatalogRows, selectedTierName, tierList);

  const result = {
    companies: companyList,
    products: projectedCatalog.products,
    productIndex: projectedCatalog.productIndex,
    catalogProducts: safeCatalogRows,
    offers: {
      daily: criticalOnly ? [] : daily.map((row) => normalizeOffer(row, 'daily')).filter((row) => row.id),
      flash: criticalOnly ? [] : flash.map((row) => normalizeOffer(row, 'flash')).filter((row) => row.id),
    },
    tiers: tierList,
    settings: criticalOnly ? [] : settingsList,
    settingsMap: criticalOnly ? {} : settingsMap,
    top: {
      products: includeTop && !criticalOnly ? normalizeTopRows(topProducts, 'product') : [],
      companies: includeTop && !criticalOnly ? normalizeTopRows(topCompanies, 'company') : [],
    },
    counters: {
      companies: companyList.length,
      tiers: tierList.length,
      deals: criticalOnly ? 0 : daily.length,
      flash: criticalOnly ? 0 : flash.length,
    },
  };
  markPerf('catalog:home:end');
  measurePerf('catalog:home', 'catalog:home:start', 'catalog:home:end');
  return result;
}

export async function loadTopSections(api) {
  markPerf('catalog:top:start');
  const [topProducts, topCompanies] = await Promise.all([
    api.get('v_top_products', { select: 'product_id,product_name,total_qty,total_sales', order: 'total_qty.desc' }).catch(() => []),
    api.get('v_top_companies', { select: 'company_id,company_name,total_sales,total_items', order: 'total_sales.desc' }).catch(() => []),
  ]);
  const result = {
    top: {
      products: normalizeTopRows(topProducts, 'product'),
      companies: normalizeTopRows(topCompanies, 'company'),
    },
  };
  markPerf('catalog:top:end');
  measurePerf('catalog:top', 'catalog:top:start', 'catalog:top:end');
  return result;
}


export async function loadHomeSupplementary(api, options = {}) {
  markPerf('catalog:home:supplementary:start');
  const includeTop = options?.includeTop !== false;
  const [settings, daily, flash, topProducts, topCompanies] = await Promise.allSettled([
    api.get('v_app_settings', { select: 'settings,updated_at' }),
    api.get('v_daily_deals', { select: 'id,title,description,image,price,stock,can_buy,is_active,sold_count' }),
    api.get('v_flash_offers_runtime', { select: '*' }),
    includeTop ? api.get('v_top_products', { select: 'product_id,product_name,total_qty,total_sales', order: 'total_qty.desc' }).catch(() => []) : Promise.resolve([]),
    includeTop ? api.get('v_top_companies', { select: 'company_id,company_name,total_sales,total_items', order: 'total_sales.desc' }).catch(() => []) : Promise.resolve([]),
  ]);

  const settingsPayload = settings.status === 'fulfilled' && Array.isArray(settings.value) && settings.value.length ? settings.value[0] : null;
  const settingsMap = settingsPayload && settingsPayload.settings && typeof settingsPayload.settings === 'object' ? settingsPayload.settings : {};
  const dailyRows = daily.status === 'fulfilled' && Array.isArray(daily.value) ? daily.value : [];
  const flashRows = flash.status === 'fulfilled' && Array.isArray(flash.value) ? flash.value : [];
  const result = {
    settings: Object.entries(settingsMap).map(([key, value]) => ({ key, value })),
    settingsMap,
    offers: {
      daily: dailyRows.map((row) => normalizeOffer(row, 'daily')).filter((row) => row.id),
      flash: flashRows.map((row) => normalizeOffer(row, 'flash')).filter((row) => row.id),
    },
    top: {
      products: includeTop ? normalizeTopRows(topProducts.status === 'fulfilled' && Array.isArray(topProducts.value) ? topProducts.value : [], 'product') : [],
      companies: includeTop ? normalizeTopRows(topCompanies.status === 'fulfilled' && Array.isArray(topCompanies.value) ? topCompanies.value : [], 'company') : [],
    },
    counters: {
      deals: dailyRows.length,
      flash: flashRows.length,
    },
  };
  markPerf('catalog:home:supplementary:end');
  measurePerf('catalog:home:supplementary', 'catalog:home:supplementary:start', 'catalog:home:supplementary:end');
  return result;
}

export async function loadCompanyCatalog(api, companyId, selectedTierName = null) {
  markPerf('catalog:company:start');
  const trimmedCompanyId = normalizeSpacing(companyId ?? '');
  if (!trimmedCompanyId) {
    return { companyId: trimmedCompanyId, rows: [], aggregated: new Map(), productIndex: {}, products: [] };
  }

  const rows = await loadRowsWithProgressiveSelects(api, ['v_catalog_products', 'v_runtime_products_safe', 'v_runtime_products_mobile', 'v_runtime_products_full'], {
    company_id: `eq.${trimmedCompanyId}`,
    order: 'product_id.asc,unit_code.asc',
  }, 72, [
    'product_id,product_name,company_id,company_name,company_logo,product_image,status,visible,unit_code,tier_name,final_price,can_buy',
    'product_id,product_name,company_id,company_name,product_image,status,visible,unit_code,tier_name,final_price,can_buy',
    'product_id,product_name,company_id,company_name,product_image,status,visible,unit_code,tier_name,final_price',
    '*',
  ]).catch(() => []);

  const projectedCatalog = projectRuntimeCatalogRows(rows, selectedTierName, []);

  const result = {
    companyId: trimmedCompanyId,
    rows,
    aggregated: projectedCatalog.aggregated,
    productIndex: projectedCatalog.productIndex,
    products: projectedCatalog.products,
    priceBook: projectedCatalog.priceBook,
  };
  markPerf('catalog:company:end');
  measurePerf('catalog:company', 'catalog:company:start', 'catalog:company:end');
  return result;
}

export { isMeaningfulCatalog };
