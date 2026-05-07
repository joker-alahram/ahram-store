function sanitizeImageUrl(value) {
  const src = String(value || '').trim();
  if (!src) return '';
  if (/^data:image\//i.test(src)) return '';
  return src;
}

function normalizeCompany(row) {
  return {
    company_id: String(row.company_id ?? row.id ?? '').trim(),
    company_name: String(row.company_name ?? '').trim(),
    company_logo: sanitizeImageUrl(row.company_logo || ''),
    visible: row.visible !== false,
    allow_discount: row.allow_discount !== false,
  };
}

function normalizeTier(row) {
  return {
    tier_name: String(row.tier_name ?? '').trim(),
    visible_label: String(row.visible_label ?? row.tier_name ?? '').trim(),
    min_order: Number(row.min_order ?? 0),
    visible: row.visible !== false,
    is_active: row.is_active !== false,
    is_default: row.is_default === true,
  };
}

function normalizeOffer(row, kind) {
  return {
    ...row,
    kind,
    id: row.id,
    title: String(row.title ?? '').trim(),
    description: String(row.description ?? '').trim(),
    image: sanitizeImageUrl(row.image || ''),
    price: Number(row.price ?? 0),
    stock: Number(row.stock ?? 0),
    can_buy: row.can_buy !== false && row.is_active !== false && (kind === 'daily' ? Number(row.stock ?? 0) > 0 : true),
    status: row.status || (kind === 'flash' ? 'pending' : 'active'),
  };
}

function normalizeProduct(row) {
  const sellableUnits = Array.isArray(row.sellable_units)
    ? row.sellable_units.map((unit) => String(unit || '').trim()).filter(Boolean)
    : [];
  return {
    product_id: String(row.product_id ?? '').trim(),
    product_name: String(row.product_name ?? '').trim(),
    company_id: String(row.company_id ?? '').trim(),
    product_image: sanitizeImageUrl(row.product_image || ''),
    carton_price: row.carton_price === null || row.carton_price === undefined || row.carton_price === '' ? null : Number(row.carton_price),
    pack_price: row.pack_price === null || row.pack_price === undefined || row.pack_price === '' ? null : Number(row.pack_price),
    half_pack_price: row.half_pack_price === null || row.half_pack_price === undefined || row.half_pack_price === '' ? null : Number(row.half_pack_price),
    piece_price: row.piece_price === null || row.piece_price === undefined || row.piece_price === '' ? null : Number(row.piece_price),
    has_carton: row.has_carton === true,
    has_pack: row.has_pack === true,
    has_half_pack: row.has_half_pack === true,
    has_piece: row.has_piece === true,
    allow_discount: row.allow_discount !== false,
    visible: row.visible !== false,
    status: row.status || 'active',
    category: row.category || '',
    sellable_units: sellableUnits,
    company_name: '',
  };
}

function deriveProductIndex(products, companies) {
  const companyMap = new Map((companies || []).map((company) => [company.company_id, company.company_name]));
  return Object.fromEntries((products || []).map((product) => [product.product_id, { ...product, company_name: companyMap.get(product.company_id) || '' }]));
}

function normalizeTopRows(rows, kind) {
  return Array.isArray(rows) ? rows.map((row) => ({ ...row, kind })) : [];
}

export async function loadCatalog(api) {
  const requests = await Promise.allSettled([
    api.get('companies', { select: 'company_id,company_name,company_logo,visible,allow_discount', visible: 'eq.true', order: 'company_id.asc' }),
    api.get('v_daily_deals', { select: '*', order: 'id.desc' }),
    api.get('v_flash_offers', { select: '*', order: 'start_time.desc' }),
    api.get('tiers', { select: 'tier_name,visible_label,min_order,visible,is_active,is_default', order: 'min_order.asc' }),
    api.get('app_settings', { select: 'key,value,updated_at,visible', visible: 'eq.true', order: 'updated_at.desc' }),
    api.get('v_top_products', { select: '*' }),
    api.get('v_top_companies', { select: '*' }),
    api.get('api_products', { select: 'product_id,product_name,company_id,product_image,carton_price,pack_price,half_pack_price,piece_price,has_carton,has_pack,has_half_pack,has_piece,allow_discount,visible,status,category,sellable_units', order: 'product_name.asc' }),
  ]);

  const companies = requests[0].status === 'fulfilled' && Array.isArray(requests[0].value) ? requests[0].value : [];
  const daily = requests[1].status === 'fulfilled' && Array.isArray(requests[1].value) ? requests[1].value : [];
  const flash = requests[2].status === 'fulfilled' && Array.isArray(requests[2].value) ? requests[2].value : [];
  const tiers = requests[3].status === 'fulfilled' && Array.isArray(requests[3].value) ? requests[3].value : [];
  const settings = requests[4].status === 'fulfilled' && Array.isArray(requests[4].value) ? requests[4].value : [];
  const topProducts = requests[5].status === 'fulfilled' && Array.isArray(requests[5].value) ? requests[5].value : [];
  const topCompanies = requests[6].status === 'fulfilled' && Array.isArray(requests[6].value) ? requests[6].value : [];
  const apiProducts = requests[7].status === 'fulfilled' && Array.isArray(requests[7].value) ? requests[7].value : [];

  const companyList = companies.map(normalizeCompany).filter((row) => row.company_id);
  const tierList = tiers.map(normalizeTier).filter((row) => row.tier_name);
  const productBase = apiProducts.map(normalizeProduct).filter((row) => row.product_id);
  const productIndex = deriveProductIndex(productBase, companyList);

  return {
    companies: companyList,
    products: Object.values(productIndex),
    tiers: tierList,
    settings,
    offers: {
      daily: daily.map((row) => normalizeOffer(row, 'daily')).filter((row) => row.id !== undefined && row.id !== null),
      flash: flash.map((row) => normalizeOffer(row, 'flash')).filter((row) => row.id !== undefined && row.id !== null),
    },
    top: {
      products: normalizeTopRows(topProducts, 'product'),
      companies: normalizeTopRows(topCompanies, 'company'),
    },
    settingsMap: Object.fromEntries((settings || []).map((row) => [String(row.key), row.value])),
    productIndex,
  };
}
