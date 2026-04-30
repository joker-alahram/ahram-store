async function registerCustomer() {
  const data = collectRegisterForm();
  const error = validateRegister(data);
  if (error) {
    smartToast(error);
    return;
  }

  try {
    const exists = await apiGet('customers', {
      phone: `eq.${data.phone}`,
      select: 'id',
      limit: 1,
    }).catch(() => []);

    if (exists?.length) {
      smartToast('register.duplicate', 'رقمك متسجل قبل كده');
      return;
    }

    const created = (await apiPost('customers', {
      name: data.name,
      phone: data.phone,
      password: data.password,
      address: data.address,
      location: data.location || null,
      customer_type: 'direct',
      sales_rep_id: null,
      created_by: null,
    }))[0];

    console.log('CUSTOMER CREATED:', created.id);

    state.session = {
      id: created.id,
      name: created.name,
      phone: created.phone,
      address: created.address,
      location: created.location,
      userType: 'customer',
    };

    state.invoicesLoaded = false;
    state.invoices = [];
    state.customersLoaded = false;
    state.customers = [];
    state.selectedCustomer = null;

    saveJSON(STORAGE.session, state.session);
    sessionStorage.setItem('last_msg', '');

    smartToast('register.success', 'تم إنشاء الحساب بنجاح', true);
    const nextHash = state.pendingReturnHash || '#home';
    const reopenCart = state.pendingOpenCart;
    state.pendingReturnHash = null;
    state.pendingOpenCart = false;
    navigate(nextHash);
    if (reopenCart) setTimeout(openCart, 0);
  } catch (error) {
    console.error(error);
    smartToast('errors.generic', 'تعذر إنشاء الحساب الآن', true);
  }
}
function settingValue(key, fallback = '') {
  return state.settingMap.get(key) ?? fallback;
}
function pickSetting(keys, fallback = '') {
  for (const key of keys) {
    const value = state.settingMap.get(key);
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return fallback;
}
function appBannerImage() {
  return pickSetting(['banner_image', 'home_banner_image', 'banner', 'hero_banner', 'main_banner']);
}
function visibleHomeSettings() {
  const hidden = new Set(['banner_image', 'home_banner_image', 'banner', 'hero_banner', 'main_banner']);
  return state.settings.filter((row) => row.key && !hidden.has(row.key)).slice(0, 6);
}
function companyName(companyId) {
  return state.companyMap.get(companyId)?.company_name || companyId || '';
}
function currentUnitForProduct(product) {
  const saved = state.unitPrefs[product.product_id];
  const available = availableUnits(product);
  if (saved && available.includes(saved)) return saved;
  if (available.includes('carton')) return 'carton';
  if (available.includes('pack')) return 'pack';
  return 'carton';
}
function availableUnits(product) {
  const units = [];
  if (product.has_carton || Number(product.carton_price) > 0) units.push('carton');
  if (product.has_pack || Number(product.pack_price) > 0) units.push('pack');
  return units;
}
function baseUnitPrice(product, unit) {
  if (unit === 'pack') return Number(product.pack_price || 0);
  return Number(product.carton_price || 0);
}
function tierUnitPrice(product, unit) {
  const tier = getSelectedTierObject();
  if (!tier) return null;

  const discount = Number(tier.discount_percent || 0);
  if (!discount || discount <= 0) return null;
  if (product.allow_discount === false) return null;

  const base = baseUnitPrice(product, unit);
  if (!base || base <= 0) return null;

  const finalPrice = base * (1 - discount / 100);
  return Number(finalPrice.toFixed(2));
}
function displayPriceBlock(product, unit) {
  const base = baseUnitPrice(product, unit);
  const discounted = tierUnitPrice(product, unit);
  const unitLabel = unit === 'carton' ? 'كرتونة' : 'دستة';

  if (discounted !== null && discounted < base) {
    return `
      <div class="price-wrap">
        <span class="price-old">${num(base)} ج.م</span>
        <span class="price-new">${num(discounted)} ج.م</span>
        <span class="product-sub">${unitLabel}</span>
      </div>
    `;
  }

  return `
    <div class="price-wrap">
      <span class="price-main">${num(base)} ج.م</span>
      <span class="product-sub">${unitLabel}</span>
    </div>
  `;
}
function activeFlashOffer() {
  return state.flashOffers.find((offer) => offer.status === 'active' || offer.can_buy) || null;
}
function getFlashState() {
  const offer = state.flashOffers[0] || null;
  const active = activeFlashOffer();
  const current = active || offer;
  if (!current) return { offer: null, status: null, remaining: '', endedAt: '' };

  if (current.status === 'active' || current.can_buy) {
    return {
      offer: current,
      status: 'active',
      remaining: countdownTo(current.end_time),
      endedAt: formatDateTime(current.end_time),
    };
  }

  if (current.status === 'expired') {
    return {
      offer: current,
      status: 'expired',
      remaining: '',
      endedAt: formatDateTime(current.end_time),
    };
  }

  return {
    offer: current,
    status: 'pending',
    remaining: countdownTo(current.start_time),
    endedAt: formatDateTime(current.start_time),
  };
}
async function lookupUser(table, identifier) {
  const trimmed = String(identifier || '').trim();
  const rows = await apiGet(table, {
    select: 'id,name,phone,username,password',
    or: `(phone.eq.${trimmed},username.eq.${trimmed})`,
    limit: '1',
  }).catch(async () => {
    const phone = await apiGet(table, { select: 'id,name,phone,username,password', phone: `eq.${trimmed}`, limit: '1' });
    if (phone?.length) return phone;
    return await apiGet(table, { select: 'id,name,phone,username,password', username: `eq.${trimmed}`, limit: '1' });
  });
  return rows?.[0] || null;
}
async function loadTierPrices(tier) {
  state.tierPrices = { carton: new Map(), pack: new Map() };
  syncCartPricesFromCurrentState();
}
async function loadInvoices() {
  if (!state.session) {
    state.invoices = [];
    state.invoicesLoaded = true;
    return;
  }
  const filterKey = state.session.userType === 'customer' ? 'customer_id' : 'user_id';
  const rows = await apiGet('orders', {
    select: 'id,order_number,invoice_number,created_at,total_amount,products_total,deals_total,flash_total,status,user_type,customer_id,user_id,sales_rep_id,rep_id,tier_name,updated_at',
    [filterKey]: `eq.${state.session.id}`,
    order: 'created_at.desc',
  }).catch(() => []);
  const orderIds = (rows || []).map((row) => row.id).filter(Boolean);
  const customerIds = [...new Set((rows || []).map((row) => row.customer_id).filter(Boolean))];
  const repIds = [...new Set((rows || []).map((row) => row.sales_rep_id || row.rep_id).filter(Boolean))];
  const [itemsRows, customersRows, repsRows] = await Promise.all([
    orderIds.length ? apiGet('order_items', {
      select: 'order_id,product_id,type,qty,price,unit,created_at',
      order_id: `in.(${orderIds.join(',')})`,
      order: 'created_at.asc',
    }).catch(() => []) : Promise.resolve([]),
    customerIds.length ? apiGet('customers', {
      select: 'id,name,phone,address,location,customer_type',
      id: `in.(${customerIds.join(',')})`,
    }).catch(() => []) : Promise.resolve([]),
    repIds.length ? apiGet('sales_reps', {
      select: 'id,name,phone,region,username',
      id: `in.(${repIds.join(',')})`,
    }).catch(() => []) : Promise.resolve([]),
  ]);

  const itemsByOrder = new Map();
  (itemsRows || []).forEach((row) => {
    const list = itemsByOrder.get(row.order_id) || [];
    list.push(row);
    itemsByOrder.set(row.order_id, list);
  });
  const customersById = new Map((customersRows || []).map((row) => [row.id, row]));
  const repsById = new Map((repsRows || []).map((row) => [row.id, row]));

  state.invoices = (rows || []).map((order) => ({
    ...order,
    items: itemsByOrder.get(order.id) || [],
    customer: customersById.get(order.customer_id) || null,
    rep: repsById.get(order.sales_rep_id || order.rep_id) || null,
  }));
  state.invoicesLoaded = true;
}
async function loadData() {
  try {
    const [companies, products, dailyDeals, flashOffers, tiers, settings, topProducts, productPopularity, customerRecommendations] = await Promise.all([
      apiGet('companies', { select: 'company_id,company_name,company_logo,visible,allow_discount', visible: 'eq.true', order: 'company_id.asc' }),
      apiGet('v_products', { select: 'product_id,product_name,product_image,company_id,has_carton,has_pack,carton_price,pack_price,allow_discount', order: 'product_name.asc' }),
      apiGet('v_daily_deals', { select: '*', order: 'id.desc' }),
      apiGet('v_flash_offers', { select: '*', order: 'start_time.desc' }),
      apiGet('tiers', { select: 'tier_name,visible_label,min_order,discount_percent', order: 'min_order.asc' }),
      apiGet('app_settings', { select: 'key,value,updated_at', order: 'updated_at.desc' }).catch(() => []),
      apiGet('v_top_products', { select: '*', order: 'total_sales.desc' }).catch(() => []),
      apiGet('v_product_popularity', { select: '*', order: 'score.desc' }).catch(() => []),
      apiGet('v_customer_recommendations', { select: '*', order: 'score.desc' }).catch(() => []),
    ]);

    state.companies = sortCompanies(companies || []);
    state.products = sortProducts(products || []);
    state.dailyDeals = dailyDeals || [];
    state.flashOffers = flashOffers || [];
    state.tiers = tiers || [];
    state.settings = settings || [];
    state.settingMap = new Map((settings || []).map((row) => [row.key, row.value]));
    state.companyMap = new Map(state.companies.map((company) => [company.company_id, company]));
    state.topProducts = topProducts || [];
    state.productPopularity = productPopularity || [];
    state.customerRecommendations = customerRecommendations || [];

    if (state.selectedTier) {
      const matched = state.tiers.find((tier) => tier.tier_name === tierName()) || state.selectedTier;
      state.selectedTier = matched;
      saveJSON(STORAGE.tier, matched);
      await loadTierPrices(matched);
    }

    await syncInvoiceSequence();
    await syncInvoiceSequence();
    syncCartPricesFromCurrentState();
    resetCheckoutStage();
    renderCart();
    renderApp();
  } catch (error) {
    console.error(error);
    toast('تعذر تحميل البيانات من قاعدة البيانات');
    renderApp();
  }
}
function filteredCompanies() {
  const q = normalizeText(state.search);
  const rows = state.companies.filter((company) => {
    if (!q) return true;
    return normalizeText(company.company_name).includes(q) || normalizeText(company.company_id).includes(q);
  });
  return sortCompanies(rows);
}
function filteredProducts() {
  let items = [...state.products];
  if (state.view.type === 'company' && state.view.companyId) {
    items = items.filter((product) => product.company_id === state.view.companyId);
  }
  const q = normalizeText(state.search);
  if (q) {
    items = items.filter((product) => {
      return normalizeText(product.product_name).includes(q)
        || normalizeText(product.product_id).includes(q)
        || normalizeText(companyName(product.company_id)).includes(q);
    });
  }
  return sortProducts(items);
}
