function normalizeCompany(row) {
  return {
    company_id: String(row.company_id ?? row.id ?? '').trim(),
    company_name: String(row.company_name ?? '').trim(),
    company_logo: row.company_logo || '',
    visible: row.visible !== false,
    allow_discount: row.allow_discount !== false,
  };
}

function normalizeTier(row) {
  return {
    tier_name: String(row.tier_name ?? '').trim(),
    visible_label: String(row.visible_label ?? row.tier_name ?? '').trim(),
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
    title: String(row.title ?? '').trim(),
    description: String(row.description ?? '').trim(),
    image: row.image || '',
    price: Number(row.price ?? 0),
    stock: Number(row.stock ?? 0),
    can_buy: row.can_buy !== false && row.is_active !== false && (kind === 'daily' ? Number(row.stock ?? 0) > 0 : true),
    status: row.status || (kind === 'flash' ? 'pending' : 'active'),
  };
}

function normalizeRuntimeRow(row) {
  const unitCode = String(row.unit_code ?? '').trim();
  return {
    product_id: String(row.product_id ?? '').trim(),
    product_name: String(row.product_name ?? '').trim(),
    company_id: String(row.company_id ?? '').trim(),
    company_name: String(row.company_name ?? '').trim(),
    company_logo: String(row.company_logo ?? '').trim(),
    category: String(row.category ?? '').trim(),
    product_image: row.product_image || '',
    status: String(row.status ?? '').trim() || 'active',
    visible: row.visible !== false,
    unit_code: unitCode,
    tier_name: String(row.tier_name ?? '').trim(),
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

function chooseTierRows(rows, selectedTierName) {
  if (!Array.isArray(rows) || !rows.length) return [];
  const cleanSelectedTier = String(selectedTierName ?? '').trim();
  if (cleanSelectedTier) {
    const selected = rows.filter((row) => row.tier_name === cleanSelectedTier);
    if (selected.length) return selected;
  }
  const activeRows = rows.filter((row) => row.runtime_healthy !== false && row.is_sellable !== false && row.unit_active !== false);
  if (activeRows.length) return activeRows;
  return rows;
}

function aggregateRuntimeProducts(rows, selectedTierName) {
  const byProduct = new Map();
  const filtered = chooseTierRows(rows, selectedTierName);

  for (const rawRow of filtered) {
    const row = normalizeRuntimeRow(rawRow);
    if (!row.product_id || !row.unit_code) continue;
    const current = byProduct.get(row.product_id) || {
      product_id: row.product_id,
      product_name: row.product_name,
      company_id: row.company_id,
      company_name: row.company_name,
      company_logo: row.company_logo,
      category: row.category,
      product_image: row.product_image,
      status: row.status,
      visible: row.visible,
      tier_name: row.tier_name,
      runtime_healthy: true,
      units: {},
      unitOrder: [],
      sellable_units: [],
      defaultUnit: null,
    };

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

    const isBetterDefault = !current.defaultUnit
      || Number(row.display_order ?? Number.POSITIVE_INFINITY) < Number(current.units[current.defaultUnit]?.display_order ?? Number.POSITIVE_INFINITY)
      || (Number(row.display_order ?? Number.POSITIVE_INFINITY) === Number(current.units[current.defaultUnit]?.display_order ?? Number.POSITIVE_INFINITY)
        && row.unit_code === 'carton');
    if (isBetterDefault && row.runtime_healthy !== false && row.is_sellable !== false && row.unit_active !== false && row.final_price > 0) {
      current.defaultUnit = row.unit_code;
    }

    byProduct.set(row.product_id, current);
  }

  return Object.fromEntries(byProduct.entries());
}

function normalizeTopRows(rows, kind) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({ ...row, kind }));
}

export async function loadCatalog(api, selectedTierName = null) {
  const requests = await Promise.allSettled([
    api.get('companies', { select: 'company_id,company_name,company_logo,visible,allow_discount', visible: 'eq.true', order: 'company_id.asc' }),
    api.get('v_runtime_products_full', { select: '*', order: 'product_id.asc,unit_code.asc' }),
    api.get('v_daily_deals', { select: '*', order: 'id.desc' }),
    api.get('v_flash_offers', { select: '*', order: 'start_time.desc' }),
    api.get('tiers', { select: 'tier_name,visible_label,min_order,discount_percent,visible,is_active,is_default,discount_carton,discount_pack', order: 'min_order.asc' }),
    api.get('app_settings', { select: 'key,value,updated_at,visible', visible: 'eq.true', order: 'updated_at.desc' }),
    api.get('v_top_products', { select: '*' }),
    api.get('v_top_companies', { select: '*' }),
  ]);

  const companies = requests[0].status === 'fulfilled' && requests[0].value.length ? requests[0].value : [];
  const runtimeRows = requests[1].status === 'fulfilled' && requests[1].value.length ? requests[1].value : [];
  const daily = requests[2].status === 'fulfilled' && requests[2].value.length ? requests[2].value : [];
  const flash = requests[3].status === 'fulfilled' && requests[3].value.length ? requests[3].value : [];
  const tiers = requests[4].status === 'fulfilled' && requests[4].value.length ? requests[4].value : [];
  const settings = requests[5].status === 'fulfilled' && requests[5].value.length ? requests[5].value : [];
  const topProducts = requests[6].status === 'fulfilled' && requests[6].value.length ? requests[6].value : [];
  const topCompanies = requests[7].status === 'fulfilled' && requests[7].value.length ? requests[7].value : [];

  const companyList = companies.map(normalizeCompany).filter((row) => row.company_id);
  const tierList = tiers.map(normalizeTier).filter((row) => row.tier_name);
  const productIndex = aggregateRuntimeProducts(runtimeRows, selectedTierName);
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
  };
}
