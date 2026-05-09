const ROLE_ALIASES = {
  rep: 'sales_rep',
  salesrep: 'sales_rep',
  sales_rep: 'sales_rep',
  salesperson: 'sales_rep',
  customer: 'customer',
  admin: 'admin',
};

export function pick(row, keys, fallback = '') {
  if (!row || !keys) return fallback;
  const list = Array.isArray(keys) ? keys : [keys];
  for (const key of list) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return fallback;
}

export function asText(value, fallback = '') {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

export function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function asBool(value, fallback = false) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return fallback;
  return ['true', 't', '1', 'yes', 'y', 'on', 'active'].includes(normalized);
}

export function parseJSONMaybe(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function normalizeRole(value) {
  const key = String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
  return ROLE_ALIASES[key] || key || 'customer';
}

export function roleLabel(role) {
  const normalized = normalizeRole(role);
  return {
    admin: 'أدمن',
    sales_rep: 'مندوب',
    customer: 'عميل',
  }[normalized] || normalized;
}

export function generateSessionToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `sess_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

export function sessionExpiry(days = 30) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function normalizeSettingsRows(rows = []) {
  const map = {};
  const list = Array.isArray(rows) ? rows : [];
  for (const row of list) {
    const rawSettings = parseJSONMaybe(pick(row, ['settings', 'value', 'data']), null);
    if (rawSettings && typeof rawSettings === 'object' && !Array.isArray(rawSettings)) {
      Object.assign(map, rawSettings);
    }
    const key = asText(pick(row, ['key', 'setting_key', 'name']));
    const value = pick(row, ['value', 'setting_value', 'settings'], null);
    if (key) map[key] = typeof value === 'string' ? value : JSON.stringify(value ?? '');
    if (row && typeof row === 'object') {
      for (const [entryKey, entryValue] of Object.entries(row)) {
        if (entryKey === 'settings' || entryKey === 'value') continue;
        if (entryValue !== undefined && entryValue !== null && typeof entryValue !== 'object') {
          if (!(entryKey in map)) map[entryKey] = entryValue;
        }
      }
    }
  }
  return map;
}

export function normalizeTierRow(row = {}) {
  return {
    id: asText(pick(row, ['id'], '')),
    tier_name: asText(pick(row, ['tier_name', 'name'])),
    display_name: asText(pick(row, ['display_name', 'visible_label', 'label', 'tier_name']), ''),
    min_order: asNumber(pick(row, ['min_order', 'minimum_order', 'minOrder']), 0),
    is_default: asBool(pick(row, ['is_default', 'default_tier'], false)),
    is_visible: asBool(pick(row, ['is_visible', 'visible'], true)),
    raw: row,
  };
}

export function normalizeAuthUserRow(row = {}) {
  const role = normalizeRole(pick(row, ['user_type', 'userType', 'role'], 'customer'));
  const password = pick(row, ['password_hash', 'password'], '');
  return {
    id: asText(pick(row, ['id', 'user_id'], '')),
    user_type: role,
    userType: role === 'sales_rep' ? 'rep' : role,
    role,
    name: asText(pick(row, ['name', 'full_name']), ''),
    phone: asText(pick(row, ['phone', 'mobile']), ''),
    username: asText(pick(row, ['username', 'login_name']), ''),
    login_code: asText(pick(row, ['login_code', 'code']), ''),
    password,
    default_tier_name: asText(pick(row, ['default_tier_name', 'tier_name']), 'base'),
    is_active: asBool(pick(row, ['is_active', 'active'], true), true),
    is_blocked: asBool(pick(row, ['is_blocked', 'blocked'], false), false),
    blocked_reason: asText(pick(row, ['blocked_reason'], ''), ''),
    raw: row,
  };
}

export function normalizeCustomerRow(row = {}) {
  const role = normalizeRole(pick(row, ['customer_type', 'user_type', 'role'], 'customer'));
  return {
    id: asText(pick(row, ['id', 'customer_id'], '')),
    name: asText(pick(row, ['name', 'customer_name'], '')),
    phone: asText(pick(row, ['phone', 'mobile'], '')),
    username: asText(pick(row, ['username', 'login_code'], '')),
    customer_type: role === 'sales_rep' ? 'rep_customer' : (role === 'customer' ? 'direct' : asText(pick(row, ['customer_type'], 'direct'), 'direct')),
    sales_rep_id: pick(row, ['sales_rep_id', 'rep_id'], null) || null,
    is_active: asBool(pick(row, ['is_active', 'active'], true), true),
    is_blocked: asBool(pick(row, ['is_blocked', 'blocked'], false), false),
    address: asText(pick(row, ['address'], ''), ''),
    location: asText(pick(row, ['location'], ''), ''),
    created_at: pick(row, ['created_at'], null) || null,
    raw: row,
  };
}

export function normalizeSalesRepRow(row = {}) {
  return {
    id: asText(pick(row, ['id', 'rep_id'], '')),
    name: asText(pick(row, ['name', 'rep_name'], '')),
    phone: asText(pick(row, ['phone', 'mobile'], '')),
    region: asText(pick(row, ['region'], ''), ''),
    username: asText(pick(row, ['username', 'login_code'], '')),
    login_code: asText(pick(row, ['login_code', 'rep_code', 'username'], '')),
    password: asText(pick(row, ['password'], ''), ''),
    default_tier_name: asText(pick(row, ['default_tier_name', 'tier_name'], 'base'), 'base'),
    is_active: asBool(pick(row, ['is_active', 'active'], true), true),
    is_blocked: asBool(pick(row, ['is_blocked', 'blocked'], false), false),
    blocked_reason: asText(pick(row, ['blocked_reason'], ''), ''),
    raw: row,
  };
}

export function normalizeRuntimeProductRow(row = {}) {
  const unitCode = asText(pick(row, ['unit_code', 'unit', 'unitCode'], ''), '');
  const finalPrice = asNumber(pick(row, ['final_price', 'price', 'unit_price'], 0), 0);
  const availableQty = asNumber(pick(row, ['available_qty', 'available_quantity', 'stock_qty', 'inventory_qty'], 0), 0);
  const reservedQty = asNumber(pick(row, ['reserved_qty', 'reserved_quantity'], 0), 0);
  const minimumSellQty = asNumber(pick(row, ['minimum_sell_qty', 'min_sell_qty', 'minimum_quantity'], 1), 1) || 1;
  const tierName = asText(pick(row, ['tier_name'], ''), '');
  const isSellable = row.is_sellable !== undefined
    ? asBool(row.is_sellable, true)
    : (row.runtime_healthy === false ? false : (finalPrice > 0 || availableQty > 0 || asBool(row.allow_backorder, false)));

  return {
    product_id: asText(pick(row, ['product_id', 'id'], '')),
    product_name: asText(pick(row, ['product_name', 'name'], '')),
    company_id: asText(pick(row, ['company_id'], '')),
    company_name: asText(pick(row, ['company_name'], '')),
    company_logo: asText(pick(row, ['company_logo'], '')),
    category_id: asText(pick(row, ['category_id'], '')),
    category_name: asText(pick(row, ['category_name', 'category'], '')),
    product_image: asText(pick(row, ['product_image', 'image', 'image_url', 'thumbnail'], ''), ''),
    unit_code: unitCode,
    tier_name: tierName,
    final_price: finalPrice,
    available_qty: availableQty,
    reserved_qty: reservedQty,
    allow_backorder: asBool(pick(row, ['allow_backorder'], false), false),
    runtime_healthy: row.runtime_healthy !== undefined ? asBool(row.runtime_healthy, true) : true,
    minimum_sell_qty: minimumSellQty,
    is_sellable: isSellable,
    status: asText(pick(row, ['status'], 'active'), 'active'),
    raw: row,
  };
}

export function mergeCatalogProducts(runtimeRows = [], enrichmentRows = []) {
  const enrichmentById = new Map();
  for (const row of enrichmentRows || []) {
    const productId = asText(pick(row, ['product_id', 'id'], ''));
    if (!productId) continue;
    enrichmentById.set(productId, row);
  }

  const groups = new Map();
  for (const row of runtimeRows || []) {
    const normalized = normalizeRuntimeProductRow(row);
    if (!normalized.product_id) continue;
    const group = groups.get(normalized.product_id) || {
      product_id: normalized.product_id,
      product_name: normalized.product_name,
      company_id: normalized.company_id,
      company_name: normalized.company_name,
      company_logo: normalized.company_logo,
      category_id: normalized.category_id,
      category_name: normalized.category_name,
      product_image: normalized.product_image,
      status: normalized.status,
      runtime_healthy: normalized.runtime_healthy,
      units: [],
      sellable_units: [],
      defaultUnit: null,
    };

    const enrichment = enrichmentById.get(normalized.product_id) || {};
    group.product_name = group.product_name || asText(pick(enrichment, ['product_name', 'name'], ''), '');
    group.company_id = group.company_id || asText(pick(enrichment, ['company_id'], ''), '');
    group.company_name = group.company_name || asText(pick(enrichment, ['company_name'], ''), '');
    group.company_logo = group.company_logo || asText(pick(enrichment, ['company_logo'], ''), '');
    group.category_id = group.category_id || asText(pick(enrichment, ['category_id'], ''), '');
    group.category_name = group.category_name || asText(pick(enrichment, ['category_name', 'category'], ''), '');
    group.product_image = group.product_image || asText(pick(enrichment, ['product_image', 'image', 'image_url', 'thumbnail'], ''), '');

    const existingUnit = group.units.find((item) => String(item.unit_code) === String(normalized.unit_code));
    const unitEntry = {
      unit_code: normalized.unit_code || 'piece',
      tier_name: normalized.tier_name || 'base',
      final_price: normalized.final_price,
      available_qty: normalized.available_qty,
      reserved_qty: normalized.reserved_qty,
      minimum_sell_qty: normalized.minimum_sell_qty,
      is_sellable: normalized.is_sellable,
      allow_backorder: normalized.allow_backorder,
    };

    if (existingUnit) {
      Object.assign(existingUnit, unitEntry);
    } else {
      group.units.push(unitEntry);
    }

    if (!group.defaultUnit) group.defaultUnit = unitEntry.unit_code;
    if (unitEntry.is_sellable && unitEntry.final_price > 0 && !group.sellable_units.includes(unitEntry.unit_code)) {
      group.sellable_units.push(unitEntry.unit_code);
    }
    groups.set(normalized.product_id, group);
  }

  const products = Array.from(groups.values()).map((product) => {
    const sellableUnits = product.units
      .filter((unit) => unit.is_sellable && Number(unit.final_price) > 0)
      .sort((a, b) => unitRank(a.unit_code) - unitRank(b.unit_code));
    const allUnits = [...product.units].sort((a, b) => unitRank(a.unit_code) - unitRank(b.unit_code));
    return {
      ...product,
      units: allUnits,
      sellable_units: sellableUnits.length ? sellableUnits.map((unit) => unit.unit_code) : allUnits.map((unit) => unit.unit_code),
      defaultUnit: sellableUnits[0]?.unit_code || allUnits[0]?.unit_code || 'carton',
      max_available_qty: allUnits.reduce((max, unit) => Math.max(max, Number(unit.available_qty || 0)), 0),
      best_final_price: sellableUnits.reduce((min, unit) => (min === null ? Number(unit.final_price) : Math.min(min, Number(unit.final_price))), null),
    };
  }).filter((product) => product.product_id && product.sellable_units.length);

  const productIndex = Object.fromEntries(products.map((product) => [product.product_id, product]));
  const companies = Array.from(new Map(products.map((product) => [product.company_id || product.company_name, {
    company_id: product.company_id || product.company_name,
    company_name: product.company_name || product.company_id || '',
    company_logo: product.company_logo || '',
  }])).values()).filter((company) => company.company_id || company.company_name);

  return { products, productIndex, companies };
}

export function normalizeOfferRow(row = {}, kind = 'daily') {
  return {
    id: asText(pick(row, ['id', 'offer_id'], '')),
    kind,
    title: asText(pick(row, ['title', 'name'], '')),
    description: asText(pick(row, ['description', 'details'], ''), ''),
    image: asText(pick(row, ['image', 'offer_image', 'photo'], ''), ''),
    price: asNumber(pick(row, ['price', 'offer_price'], 0), 0),
    stock: asNumber(pick(row, ['stock', 'available_qty'], 0), 0),
    sold_count: asNumber(pick(row, ['sold_count'], 0), 0),
    can_buy: row.can_buy !== undefined ? asBool(row.can_buy, true) : true,
    status: asText(pick(row, ['status'], kind === 'flash' ? 'pending' : 'active'), kind === 'flash' ? 'pending' : 'active'),
    start_time: pick(row, ['start_time'], null) || null,
    end_time: pick(row, ['end_time'], null) || null,
    current_time: pick(row, ['current_time'], null) || null,
    raw: row,
  };
}

export function normalizeOrderRow(row = {}) {
  return {
    id: asText(pick(row, ['id', 'order_id'], '')),
    order_number: asText(pick(row, ['order_number', 'invoice_number'], '')),
    customer_id: asText(pick(row, ['customer_id'], '')),
    sales_rep_id: pick(row, ['sales_rep_id', 'rep_id'], null) || null,
    status: asText(pick(row, ['status'], 'submitted'), 'submitted'),
    payment_status: asText(pick(row, ['payment_status'], 'unpaid'), 'unpaid'),
    currency: asText(pick(row, ['currency'], 'EGP'), 'EGP'),
    subtotal: asNumber(pick(row, ['subtotal', 'products_total'], 0), 0),
    discount_total: asNumber(pick(row, ['discount_total', 'deals_total'], 0), 0),
    grand_total: asNumber(pick(row, ['grand_total', 'total_amount'], 0), 0),
    created_at: pick(row, ['created_at'], null) || null,
    updated_at: pick(row, ['updated_at'], null) || null,
    user_type: asText(pick(row, ['user_type'], ''), ''),
    raw: row,
  };
}

export function normalizeOrderItemRow(row = {}) {
  return {
    id: asText(pick(row, ['id', 'order_item_id'], '')),
    order_id: asText(pick(row, ['order_id'], '')),
    product_id: asText(pick(row, ['product_id'], '')),
    unit_code: asText(pick(row, ['unit_code', 'unit'], 'piece'), 'piece'),
    quantity: asNumber(pick(row, ['quantity', 'qty'], 1), 1) || 1,
    unit_price: asNumber(pick(row, ['unit_price', 'price'], 0), 0),
    line_total: asNumber(pick(row, ['line_total', 'total'], 0), 0),
    product_name_snapshot: asText(pick(row, ['product_name_snapshot', 'name_snapshot', 'product_name'], ''), ''),
    tier_snapshot: pick(row, ['tier_snapshot'], null),
    pricing_snapshot: parseJSONMaybe(pick(row, ['pricing_snapshot'], null), null),
    raw: row,
  };
}

export function unitRank(unit) {
  return { carton: 1, pack: 2, half_pack: 3, piece: 4 }[String(unit || '').trim()] ?? 99;
}

export function moneyNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : fallback;
}
