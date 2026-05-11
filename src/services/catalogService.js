import { normalizeTierName, buildPriceBook } from './pricingService.js';

function sanitizeImageSrc(value) {
  const src = String(value ?? '').trim();

  if (!src) return '';

  return src;
}

function normalizeSpacing(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function unitRank(unit) {
  return { carton: 1, pack: 2, half_pack: 3, piece: 4 }[unit] ?? 99;
}

function normalizeCompany(row) {
  return {
    company_id: normalizeSpacing(row.company_id ?? row.id ?? ''),
    company_name: normalizeSpacing(row.company_name ?? ''),
    company_logo: sanitizeImageSrc(row.company_logo || ''),
    visible: row.visible !== false,
    allow_discount: row.allow_discount !== false,
  };
}

function normalizeTier(row) {
  const canonical = normalizeTierName(row.tier_name);
  return {
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
}

function normalizeOffer(row, kind) {
  return {
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
}

function normalizeRuntimeRow(row) {
  return {
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
    can_buy: row.can_buy === true,
availability_reason: String(row.availability_reason ?? '').trim(),
catalog_visible: row.catalog_visible !== false,
    min_qty: Number(row.min_qty ?? 1),
    display_order: Number(row.display_order ?? 0),
  };
}

function createProductShell(row) {
  return {
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
}

function chooseVariant(variants, selectedTierName) {
  const canonical = normalizeTierName(selectedTierName);

  const buyable = variants.filter(
    (row) =>
      row.can_buy === true &&
      row.unit_active !== false
  );

  if (canonical) {
    const tierMatch =
      buyable.find(
        (row) => normalizeTierName(row.tier_name) === canonical
      ) ||
      variants.find(
        (row) => normalizeTierName(row.tier_name) === canonical
      );

    if (tierMatch) return tierMatch;
  }

  return buyable[0] || variants[0] || null;
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
    unitEntry.display_order = Number.isFinite(unitEntry.display_order) && unitEntry.display_order !== 0
      ? Math.min(unitEntry.display_order, row.display_order)
      : row.display_order;
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

    for (const unitEntry of Array.from(product.unitMap.values()).sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0) || unitRank(a.unit_code) - unitRank(b.unit_code))) {
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
        can_buy: chosen.can_buy === true,
availability_reason: chosen.availability_reason || '',
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

async function sleepFrame() {
  if (typeof requestAnimationFrame === 'function') {
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 0));
}
async function loadPagedRows(api, path, params = {}, pageSize = 500) {
  const rows = [];
  let offset = 0;
  while (true) {
    if (rows.length >= 300) break;
    const page = await api.get(path, { ...params, limit: String(pageSize), offset: String(offset) }).catch(() => []);
    const batch = Array.isArray(page) ? page : [];
    if (!batch.length) break;
    rows.push(...batch);
    offset += batch.length;
    if (batch.length < pageSize) break;
    await sleepFrame();
  }
  return rows;
}

function normalizeTopRows(rows, kind) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({ ...row, kind }));
}

export async function loadHomeCatalog(api) {
  const requests = await Promise.allSettled([
    api.get('companies', { select: 'company_id,company_name,company_logo,visible,allow_discount', visible: 'eq.true', order: 'company_id.asc' }),
    api.get('tiers', { select: 'tier_name,visible_label,min_order,discount_percent,visible,is_active,is_default,discount_carton,discount_pack', order: 'min_order.asc' }),
    api.get('v_app_settings', { select: 'settings,updated_at' }),
    api.get('v_daily_deals', {
  select: 'id,title,description,image,price,stock,can_buy,is_active,sold_count'
}),
    api.get('v_flash_offers', { select: 'id,title,description,image,price,stock,can_buy,is_active,status,start_time,end_time,current_time' }),
  ]);

  const companies = requests[0].status === 'fulfilled' && requests[0].value.length ? requests[0].value : [];
  const tiers = requests[1].status === 'fulfilled' && requests[1].value.length ? requests[1].value : [];
  const settingsPayload = requests[2].status === 'fulfilled' && requests[2].value.length ? requests[2].value[0] : null;
  const daily = requests[3].status === 'fulfilled' && requests[3].value.length ? requests[3].value : [];
  const flash = requests[4].status === 'fulfilled' && requests[4].value.length ? requests[4].value : [];

  const companyList = companies.map(normalizeCompany).filter((row) => row.company_id);
  const tierList = tiers.map(normalizeTier).filter((row) => row.tier_name);
  const settingsMap = settingsPayload && settingsPayload.settings && typeof settingsPayload.settings === 'object' ? settingsPayload.settings : {};
  const settingsList = Object.entries(settingsMap).map(([key, value]) => ({ key, value }));

  return {
    companies: companyList,
    products: [],
    productIndex: {},
    offers: {
      daily: daily.map((row) => normalizeOffer(row, 'daily')).filter((row) => row.id),
      flash: flash.map((row) => normalizeOffer(row, 'flash')).filter((row) => row.id),
    },
    tiers: tierList,
    settings: settingsList,
    settingsMap,
    top: { products: [], companies: [] },
    counters: {
      companies: companyList.length,
      tiers: tierList.length,
      deals: daily.length,
      flash: flash.length,
    },
  };
}

export async function loadCompanyCatalog(api, companyId, selectedTierName = null) {
  const trimmedCompanyId = normalizeSpacing(companyId ?? '');
  if (!trimmedCompanyId) {
    return { companyId: trimmedCompanyId, rows: [], aggregated: new Map(), productIndex: {}, products: [] };
  }

const rows = await loadPagedRows(api, 'v_catalog_products', {
select: `
  company_id,
  company_name,
  company_logo,
  product_id,
  product_name,
  category,
  product_image,
  status,
  visible,
  unit_code,
  tier_name,
  final_price,
  available_qty,
  reserved_qty,
  allow_backorder,
  is_sellable,
  unit_active,
  min_qty,
  display_order,
  can_buy,
  availability_reason,
  catalog_visible
  `,
  company_id: `eq.${trimmedCompanyId}`,
  visible: 'eq.true',
  tier_name: `eq.${normalizeTierName(selectedTierName || 'base')}`,
  order: 'display_order.asc',
}, 120).catch(() => []);
  const aggregated = aggregateRuntimeProducts(rows);
  const productIndex = projectRuntimeProducts(aggregated, selectedTierName);
  const products = Object.values(productIndex).sort((a, b) => {
    const left = Number(a.units?.[a.defaultUnit]?.display_order ?? Number.POSITIVE_INFINITY);
    const right = Number(b.units?.[b.defaultUnit]?.display_order ?? Number.POSITIVE_INFINITY);
    if (left !== right) return left - right;
    return String(a.product_name).localeCompare(String(b.product_name), 'ar');
  });

  return {
    companyId: trimmedCompanyId,
    rows,
    aggregated,
    productIndex,
    products,
    priceBook: buildPriceBook(products, [], selectedTierName),
  };
}
