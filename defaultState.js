import { demoData } from './demoData.js';

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

function normalizeProduct(row) {
  const unitCode = Array.isArray(row.sellable_units) ? row.sellable_units.map((u) => String(u).trim()).filter(Boolean) : [];
  const prices = {
    carton: Number(row.carton_price ?? 0) || null,
    pack: Number(row.pack_price ?? 0) || null,
    half_pack: Number(row.half_pack_price ?? 0) || null,
    piece: Number(row.piece_price ?? 0) || null,
  };
  return {
    product_id: String(row.product_id ?? '').trim(),
    product_name: String(row.product_name ?? '').trim(),
    company_id: String(row.company_id ?? '').trim(),
    product_image: row.product_image || '',
    status: row.status || 'active',
    visible: row.visible !== false,
    has_carton: row.has_carton !== false && prices.carton !== null,
    has_pack: row.has_pack !== false && prices.pack !== null,
    has_half_pack: row.has_half_pack !== false && prices.half_pack !== null,
    has_piece: row.has_piece !== false && prices.piece !== null,
    category: row.category || '',
    type: row.type || 'normal',
    allow_discount: row.allow_discount !== false,
    sellable_units: unitCode.length ? unitCode : Object.entries(prices).filter(([, value]) => value !== null).map(([unit]) => unit),
    prices,
    company_name: '',
  };
}

function deriveProductIndex(products, companies) {
  const companyMap = new Map(companies.map((c) => [c.company_id, c.company_name]));
  return Object.fromEntries(products.map((product) => [product.product_id, { ...product, company_name: companyMap.get(product.company_id) || '' }]));
}

function normalizeTopRows(rows, kind) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({ ...row, kind }));
}

export async function loadCatalog(api, selectedTierName = null) {
  const fallback = demoData;
  const requests = await Promise.allSettled([
    api.get('companies', { select: 'company_id,company_name,company_logo,visible,allow_discount', visible: 'eq.true', order: 'company_id.asc' }),
    api.get('v_final_sellable_products', { select: 'product_id,product_name,unit_code,tier_name,allow_sale,apply_discount,base_price,final_price', order: 'product_id.asc' }),
    api.get('v_daily_deals', { select: '*', order: 'id.desc' }),
    api.get('v_flash_offers', { select: '*', order: 'start_time.desc' }),
    api.get('tiers', { select: 'tier_name,visible_label,min_order,discount_percent,visible,is_active,is_default,discount_carton,discount_pack', order: 'min_order.asc' }),
    api.get('app_settings', { select: 'key,value,updated_at,visible', visible: 'eq.true', order: 'updated_at.desc' }),
    api.get('v_top_products', { select: '*' }),
    api.get('v_top_companies', { select: '*' }),
    api.get('api_products', { select: 'product_id,product_name,company_id,product_image,carton_price,pack_price,half_pack_price,piece_price,has_carton,has_pack,has_half_pack,has_piece,allow_discount,visible,status,category,sellable_units', order: 'product_name.asc' }),
    api.get('products', { select: 'product_id,product_name,company_id,product_image,status,visible,has_carton,has_pack,type,category,allow_discount,discount_carton,discount_pack,discount_unit', order: 'product_name.asc' }),
  ]);

  const companies = requests[0].status === 'fulfilled' && requests[0].value.length ? requests[0].value : fallback.companies;
  const pricingRows = requests[1].status === 'fulfilled' && requests[1].value.length ? requests[1].value : [];
  const daily = requests[2].status === 'fulfilled' && requests[2].value.length ? requests[2].value : fallback.dailyDeals;
  const flash = requests[3].status === 'fulfilled' && requests[3].value.length ? requests[3].value : fallback.flashOffers;
  const tiers = requests[4].status === 'fulfilled' && requests[4].value.length ? requests[4].value : fallback.tiers;
  const settings = requests[5].status === 'fulfilled' && requests[5].value.length ? requests[5].value : fallback.settings;
  const topProducts = requests[6].status === 'fulfilled' && requests[6].value.length ? requests[6].value : [];
  const topCompanies = requests[7].status === 'fulfilled' && requests[7].value.length ? requests[7].value : [];
  const apiProducts = requests[8].status === 'fulfilled' && requests[8].value.length ? requests[8].value : [];
  const rawProducts = requests[9].status === 'fulfilled' && requests[9].value.length ? requests[9].value : fallback.products;

  const productSource = apiProducts.length ? apiProducts : rawProducts;

  const companyList = companies.map(normalizeCompany).filter((row) => row.company_id);
  const tierList = tiers.map(normalizeTier).filter((row) => row.tier_name);
  const activeTierName = selectedTierName || tierList.find((tier) => tier.is_default)?.tier_name || tierList[0]?.tier_name || 'base';
  const productBase = productSource.map(normalizeProduct).filter((row) => row.product_id);
  const companyMap = new Map(companyList.map((item) => [item.company_id, item.company_name]));
  const productIndex = deriveProductIndex(productBase, companyList);

  for (const product of Object.values(productIndex)) {
    const rowsForProduct = pricingRows.filter((row) => String(row.product_id) === String(product.product_id));
    const tierMatch = rowsForProduct.filter((row) => String(row.tier_name) === String(activeTierName));
    const sourceRows = tierMatch.length ? tierMatch : rowsForProduct.filter((row) => row.allow_sale !== false);
    for (const row of sourceRows) {
      const unit = String(row.unit_code || '').trim();
      if (!unit) continue;
      product.prices[unit] = Number(row.final_price ?? row.base_price ?? 0) || null;
      if (product.sellable_units.indexOf(unit) < 0 && product.prices[unit] !== null) product.sellable_units.push(unit);
    }
    if (!product.sellable_units.length) {
      product.sellable_units = Object.entries(product.prices)
        .filter(([, value]) => value !== null)
        .map(([unit]) => unit);
    }
    product.sellable_units = product.sellable_units.filter(Boolean).filter((unit, index, all) => all.indexOf(unit) === index);
    if (companyMap.has(product.company_id)) product.company_name = companyMap.get(product.company_id);
  }

  return {
    companies: companyList,
    products: Object.values(productIndex),
    tiers: tierList.length ? tierList : fallback.tiers,
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
