import { normalizeTierName } from './pricingService.js';

function sanitizeImageSrc(value) {
  const src = String(value ?? '').trim();
  if (!src) return '';
  if (/^data:image\//i.test(src)) return '';
  return src;
}

function normalizeSpacing(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
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
    status: row.status || (kind === 'flash' ? 'pending' : 'active'),
  };
}

function normalizeRuntimeRow(row) {
  const unitCode = normalizeSpacing(row.unit_code ?? '');
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
    unit_code: unitCode,
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
}

function unitRank(unit) {
  return { carton: 1, pack: 2, half_pack: 3, piece: 4 }[unit] ?? 99;
}

function chooseTierRows(rows, selectedTierName) {
  if (!Array.isArray(rows) || !rows.length) return [];
  const cleanSelectedTier = normalizeTierName(selectedTierName);
  if (cleanSelectedTier) {
    const selected = rows.filter((row) => normalizeTierName(row.tier_name) === cleanSelectedTier);
    if (selected.length) return selected;
  }
  const activeRows = rows.filter((row) => row.runtime_healthy !== false && row.is_sellable !== false && row.unit_active !== false);
  if (activeRows.length) return activeRows;
  return rows;
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
    tier_name: row.tier_name || null,
    runtime_healthy: true,
    units: {},
    unitOrder: [],
    sellable_units: [],
    defaultUnit: null,
  };
}

function ingestRuntimeRows(target, rows) {
  for (const rawRow of rows) {
    const row = normalizeRuntimeRow(rawRow);
    if (!row.product_id || !row.unit_code) continue;
    const current = target.get(row.product_id) || createProductShell(row);

    const unitRecord = {
      unit_code: row.unit_code,
      final_price: row.final_price,
      available_qty: row.available_qty,
      reserved_qty: row.reserved_qty,
      allow_backorder: row.allow_backorder,
      runtime_healthy: row.runtime_healthy,
      is_sellable: row.is_sellable,
      unit_active: row.unit_active,
      min_qty: row.min_qty,
      display_order: row.display_order,
      tier_name: row.tier_name,
    };

    current.product_name = current.product_name || row.product_name;
    current.company_id = current.company_id || row.company_id;
    current.company_name = current.company_name || row.company_name;
    current.company_logo = current.company_logo || row.company_logo;
    current.category = current.category || row.category;
    current.product_image = current.product_image || row.product_image;
    current.status = current.status || row.status;
    current.visible = current.visible !== false && row.visible !== false;
    current.tier_name = current.tier_name || row.tier_name || null;
    current.runtime_healthy = current.runtime_healthy !== false && row.runtime_healthy !== false;

    current.units[row.unit_code] = unitRecord;
    if (!current.unitOrder.includes(row.unit_code)) current.unitOrder.push(row.unit_code);
    if (row.runtime_healthy !== false && row.is_sellable !== false && row.unit_active !== false && row.final_price > 0) {
      if (!current.sellable_units.includes(row.unit_code)) current.sellable_units.push(row.unit_code);
    }

    const currentDefault = current.defaultUnit ? current.units[current.defaultUnit] : null;
    const isBetterDefault = !current.defaultUnit
      || Number(row.display_order ?? Number.POSITIVE_INFINITY) < Number(currentDefault?.display_order ?? Number.POSITIVE_INFINITY)
      || (Number(row.display_order ?? Number.POSITIVE_INFINITY) === Number(currentDefault?.display_order ?? Number.POSITIVE_INFINITY) && row.unit_code === 'carton');
    if (isBetterDefault && row.runtime_healthy !== false && row.is_sellable !== false && row.unit_active !== false && row.final_price > 0) {
      current.defaultUnit = row.unit_code;
    }

    target.set(row.product_id, current);
  }
}

function buildIndexFromRows(rows, selectedTierName) {
  const grouped = new Map();
  const filtered = chooseTierRows(rows, selectedTierName);
  const normalized = filtered.map(normalizeRuntimeRow).sort((a, b) => {
    const left = String(a.product_id).localeCompare(String(b.product_id), 'en');
    if (left !== 0) return left;
    const unitDiff = unitRank(a.unit_code) - unitRank(b.unit_code);
    if (unitDiff !== 0) return unitDiff;
    return String(a.unit_code).localeCompare(String(b.unit_code), 'en');
  });
  ingestRuntimeRows(grouped, normalized);
  return Object.fromEntries(grouped.entries());
}

function settleTierSelection(tiers, selectedTierName) {
  const canonical = normalizeTierName(selectedTierName);
  if (canonical) {
    const match = tiers.find((tier) => normalizeTierName(tier.tier_name) === canonical);
    if (match) return match.tier_name;
  }
  const defaultTier = tiers.find((tier) => tier.is_default);
  return defaultTier ? defaultTier.tier_name : (tiers[0]?.tier_name || 'base');
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

export async function loadCatalog(api, selectedTierName = null) {
  const requests = await Promise.allSettled([
    api.get('companies', { select: 'company_id,company_name,company_logo,visible,allow_discount', visible: 'eq.true', order: 'company_id.asc' }),
    api.get('v_daily_deals', { select: '*', order: 'id.desc' }),
    api.get('v_flash_offers', { select: '*', order: 'start_time.desc' }),
    api.get('tiers', { select: 'tier_name,visible_label,min_order,discount_percent,visible,is_active,is_default,discount_carton,discount_pack', order: 'min_order.asc' }),
    api.get('app_settings', { select: 'key,value,updated_at,visible', visible: 'eq.true', order: 'updated_at.desc' }),
    api.get('v_top_products', { select: '*' }),
    api.get('v_top_companies', { select: '*' }),
  ]);

  const companies = requests[0].status === 'fulfilled' && requests[0].value.length ? requests[0].value : [];
  const daily = requests[1].status === 'fulfilled' && requests[1].value.length ? requests[1].value : [];
  const flash = requests[2].status === 'fulfilled' && requests[2].value.length ? requests[2].value : [];
  const tiers = requests[3].status === 'fulfilled' && requests[3].value.length ? requests[3].value : [];
  const settings = requests[4].status === 'fulfilled' && requests[4].value.length ? requests[4].value : [];
  const topProducts = requests[5].status === 'fulfilled' && requests[5].value.length ? requests[5].value : [];
  const topCompanies = requests[6].status === 'fulfilled' && requests[6].value.length ? requests[6].value : [];

  const companyList = companies.map(normalizeCompany).filter((row) => row.company_id);
  const tierList = tiers.map(normalizeTier).filter((row) => row.tier_name);
  const resolvedTier = settleTierSelection(tierList, selectedTierName);

  const runtimeRows = await loadPagedRows(api, 'v_runtime_products_full', { select: '*', order: 'product_id.asc,unit_code.asc' }, 500);
  const productIndex = buildIndexFromRows(runtimeRows, resolvedTier);
  const products = Object.values(productIndex).sort((a, b) => {
    const left = Number(a.units?.[a.defaultUnit]?.display_order ?? Number.POSITIVE_INFINITY);
    const right = Number(b.units?.[b.defaultUnit]?.display_order ?? Number.POSITIVE_INFINITY);
    if (left !== right) return left - right;
    return String(a.product_name).localeCompare(String(b.product_name), 'ar');
  });

  return {
    companies: companyList,
    products,
    tiers: tierList,
    settings,
    offers: {
      daily: daily.map((row) => normalizeOffer(row, 'daily')).filter((row) => row.id),
      flash: flash.map((row) => normalizeOffer(row, 'flash')).filter((row) => row.id),
    },
    top: {
      products: normalizeTopRows(topProducts, 'product'),
      companies: normalizeTopRows(topCompanies, 'company'),
    },
    settingsMap: Object.fromEntries((settings || []).map((row) => [String(row.key), row.value])),
    productIndex,
    resolvedTier,
  };
}
