const CONFIG = {
  baseUrl: 'https://upzuslyqfcvpbkqyzyxp.supabase.co/rest/v1',
  apiKey: 'sb_publishable_vpqJxVuMbYbm0y3VvVhuJw_FBQkLvYg',
  supportWhatsapp: localStorage.getItem('support_whatsapp') || '201552670465',
};

const state = {
  companies: [],
  products: [],
  dailyDeals: [],
  flashOffers: [],
  view: { type: 'home', companyId: null },
  search: '',
  session: loadJSON('b2b_session', null),
  cart: loadJSON('b2b_cart', []),
  companyMap: new Map(),
};

const els = {
  app: document.getElementById('app'),
  companiesRail: document.getElementById('companiesRail'),
  productsGrid: document.getElementById('productsGrid'),
  productsSectionTitle: document.getElementById('productsSectionTitle'),
  dailyDealsRail: document.getElementById('dailyDealsRail'),
  flashOffersRail: document.getElementById('flashOffersRail'),
  companiesCount: document.getElementById('companiesCount'),
  productsCount: document.getElementById('productsCount'),
  dealsCount: document.getElementById('dealsCount'),
  loginBtn: document.getElementById('loginBtn'),
  cartBtn: document.getElementById('cartBtn'),
  cartCount: document.getElementById('cartCount'),
  cartDrawer: document.getElementById('cartDrawer'),
  cartItems: document.getElementById('cartItems'),
  cartTotal: document.getElementById('cartTotal'),
  checkoutBtn: document.getElementById('checkoutBtn'),
  saveCartBtn: document.getElementById('saveCartBtn'),
  loginModal: document.getElementById('loginModal'),
  loginIdentifier: document.getElementById('loginIdentifier'),
  loginPassword: document.getElementById('loginPassword'),
  submitLogin: document.getElementById('submitLogin'),
  toast: document.getElementById('toast'),
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  homeBtn: document.getElementById('homeBtn'),
  viewAllCompanies: document.getElementById('viewAllCompanies'),
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function num(value, digits = 2) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits, minimumFractionDigits: n % 1 === 0 ? 0 : digits }).format(n);
}

function integer(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"]+/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch] || ch));
}

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.add('hidden'), 2200);
}

function setOverlay(el, show) {
  el.classList.toggle('hidden', !show);
  el.setAttribute('aria-hidden', String(!show));
}

function getSessionLabel() {
  if (!state.session) return 'تسجيل الدخول';
  return state.session.name || state.session.username || state.session.phone || 'مستخدم';
}

function updateHeader() {
  els.loginBtn.textContent = getSessionLabel();
  els.cartCount.textContent = integer(state.cart.reduce((sum, item) => sum + item.qty, 0));
  els.cartTotal.textContent = `${num(cartTotal())} ج.م`;
}

function cartTotal() {
  return state.cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
}

function findInCart(key) {
  return state.cart.find((item) => item.key === key);
}

function cartKey(item) {
  return `${item.type}:${item.id}:${item.unit || 'single'}`;
}

function upsertCartItem(item, qty = 1) {
  const key = cartKey(item);
  const existing = findInCart(key);
  if (existing) {
    existing.qty += qty;
  } else {
    state.cart.push({ ...item, key, qty });
  }
  pruneCart();
  persistCart();
  renderCart();
  renderAllVisible();
}

function setCartQty(key, qty) {
  const item = state.cart.find((x) => x.key === key);
  if (!item) return;
  item.qty = Math.max(1, Number(qty || 1));
  pruneCart();
  persistCart();
  renderCart();
  renderAllVisible();
}

function removeCartItem(key) {
  state.cart = state.cart.filter((item) => item.key !== key);
  persistCart();
  renderCart();
  renderAllVisible();
}

function pruneCart() {
  state.cart = state.cart.filter((item) => Number(item.qty) > 0);
}

function persistCart() {
  saveJSON('b2b_cart', state.cart);
}

function getCompanyName(companyId) {
  return state.companyMap.get(companyId)?.company_name || companyId || '';
}

function productPrice(product, unit) {
  if (unit === 'pack') return Number(product.pack_price || 0);
  return Number(product.carton_price || 0);
}

function productUnits(product) {
  const units = [];
  if (Number(product.carton_price) > 0 || product.has_carton) units.push('carton');
  if (Number(product.pack_price) > 0 || product.has_pack) units.push('pack');
  return units;
}

function currentUnit(product, preferred = null) {
  const units = productUnits(product);
  if (preferred && units.includes(preferred)) return preferred;
  return units[0] || 'carton';
}

function isInCart(type, id, unit) {
  return Boolean(findInCart(`${type}:${id}:${unit || 'single'}`));
}

function parseHash() {
  const hash = decodeURIComponent(location.hash || '#home');
  const parts = hash.replace(/^#/, '').split('/');
  if (parts[0] === 'company' && parts[1]) return { type: 'company', companyId: parts[1] };
  return { type: 'home' };
}

function navigate(hash) {
  if (location.hash === hash) {
    handleRoute();
    return;
  }
  location.hash = hash;
}

function handleRoute() {
  state.view = parseHash();
  renderProducts();
}

async function apiGet(path, params = {}) {
  const url = new URL(`${CONFIG.baseUrl}/${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), {
    headers: {
      apikey: CONFIG.apiKey,
      Authorization: `Bearer ${CONFIG.apiKey}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} failed: ${res.status} ${text}`);
  }
  return await res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${CONFIG.baseUrl}/${path}`, {
    method: 'POST',
    headers: {
      apikey: CONFIG.apiKey,
      Authorization: `Bearer ${CONFIG.apiKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed: ${res.status} ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

async function apiPatch(path, body, params = {}) {
  const url = new URL(`${CONFIG.baseUrl}/${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), {
    method: 'PATCH',
    headers: {
      apikey: CONFIG.apiKey,
      Authorization: `Bearer ${CONFIG.apiKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PATCH ${path} failed: ${res.status} ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

async function loadData() {
  try {
    const [companies, products, dailyDeals, flashOffers] = await Promise.all([
      apiGet('companies', { select: 'company_id,company_name,company_logo,visible,allow_discount', visible: 'eq.true', order: 'company_name.asc' }),
      apiGet('v_products', { select: 'product_id,product_name,product_image,company_id,has_carton,has_pack,carton_price,pack_price,allow_discount', order: 'product_name.asc' }),
      apiGet('v_daily_deals', { select: '*' , order: 'id.desc' }),
      apiGet('v_flash_offers', { select: '*', order: 'start_time.desc' }),
    ]);

    state.companies = companies || [];
    state.products = products || [];
    state.dailyDeals = dailyDeals || [];
    state.flashOffers = flashOffers || [];
    state.companyMap = new Map(state.companies.map((c) => [c.company_id, c]));

    renderSummary();
    renderCompanies();
    renderDeals();
    renderProducts();
  } catch (error) {
    console.error(error);
    toast('تعذر تحميل البيانات من قاعدة البيانات');
  }
}

function renderSummary() {
  els.companiesCount.textContent = integer(state.companies.length);
  els.productsCount.textContent = integer(state.products.length);
  els.dealsCount.textContent = integer(state.dailyDeals.length + state.flashOffers.length);
}

function renderCompanies() {
  const chips = state.companies.slice(0, 20).map((company) => `
    <div class="company-chip" data-company-id="${escapeHtml(company.company_id)}">
      <img class="company-logo" src="${escapeHtml(company.company_logo || placeholderImage(company.company_name))}" alt="${escapeHtml(company.company_name)}" loading="lazy" />
      <div class="company-name">${escapeHtml(company.company_name)}</div>
    </div>
  `).join('');
  els.companiesRail.innerHTML = chips || '<div class="muted">لا توجد شركات ظاهرة الآن</div>';
}

function placeholderImage(seed) {
  const text = encodeURIComponent((seed || 'product').slice(0, 24));
  return `https://via.placeholder.com/640x640/111111/d8b35a?text=${text}`;
}

function normalizeText(v) {
  return String(v || '').toLowerCase().trim();
}

function filteredProducts() {
  let items = [...state.products];
  if (state.view.type === 'company' && state.view.companyId) {
    items = items.filter((p) => p.company_id === state.view.companyId);
  }
  const q = normalizeText(state.search);
  if (q) {
    items = items.filter((p) => {
      const company = normalizeText(getCompanyName(p.company_id));
      return normalizeText(p.product_name).includes(q) || company.includes(q) || normalizeText(p.product_id).includes(q);
    });
  }
  return items;
}

function renderProducts() {
  const list = filteredProducts();
  els.productsSectionTitle.textContent = state.view.type === 'company'
    ? `منتجات ${getCompanyName(state.view.companyId) || ''}`
    : 'المنتجات';

  if (!list.length) {
    els.productsGrid.innerHTML = '<div class="muted">لا توجد منتجات تطابق الفلتر الحالي</div>';
    return;
  }

  els.productsGrid.innerHTML = list.map((product) => renderProductCard(product)).join('');
}

function renderProductCard(product) {
  const defaultUnit = currentUnit(product);
  const units = productUnits(product);
  const unitOptions = units.length ? units.map((u) => `<option value="${u}" ${u === defaultUnit ? 'selected' : ''}>${u === 'carton' ? 'كرتونة' : 'قطعة/دستة'}</option>`).join('') : '<option value="carton">كرتونة</option>';
  const priceText = units.map((u) => `<span class="price-pill">${u === 'carton' ? 'كرتونة' : 'قطعة'}: ${num(productPrice(product, u))} ج.م</span>`).join('');
  const key = cartKey({ type: 'product', id: product.product_id, unit: defaultUnit });
  const isAdded = Boolean(findInCart(key));
  return `
    <article class="product-card" data-product-id="${escapeHtml(product.product_id)}">
      <img class="product-image" src="${escapeHtml(product.product_image || placeholderImage(product.product_name))}" alt="${escapeHtml(product.product_name)}" loading="lazy" />
      <div class="product-body">
        <div>
          <div class="product-title">${escapeHtml(product.product_name)}</div>
          <div class="small-note">${escapeHtml(getCompanyName(product.company_id))}</div>
        </div>
        <div class="price-row">${priceText}</div>
        <div class="controls">
          <label class="field">
            <span>الوحدة</span>
            <select data-role="unit" data-product-id="${escapeHtml(product.product_id)}">
              ${unitOptions}
            </select>
          </label>
          <label class="field">
            <span>الكمية</span>
            <input data-role="qty" data-product-id="${escapeHtml(product.product_id)}" type="number" min="1" step="1" value="1" inputmode="numeric" />
          </label>
        </div>
        <div class="product-actions">
          <button class="primary-btn" data-action="toggle-product" data-product-id="${escapeHtml(product.product_id)}">${isAdded ? 'إزالة' : 'شراء'}</button>
        </div>
      </div>
    </article>
  `;
}

function renderDeals() {
  els.dailyDealsRail.innerHTML = state.dailyDeals.map((deal) => renderDealCard(deal, 'deal')).join('') || '<div class="muted">لا توجد صفقات اليوم</div>';
  els.flashOffersRail.innerHTML = state.flashOffers.map((offer) => renderDealCard(offer, 'flash')).join('') || '<div class="muted">لا توجد عروض سريعة</div>';
}

function renderDealCard(item, type) {
  const title = escapeHtml(item.title);
  const desc = escapeHtml(item.description || '');
  const image = escapeHtml(item.image || placeholderImage(item.title));
  const price = num(item.price);
  const qty = type === 'flash' ? 'عرض محدود' : 'صفقة اليوم';
  const canBuy = type === 'flash' ? Boolean(item.can_buy) : Boolean(item.can_buy);
  const statusTag = type === 'flash' ? (item.status === 'active' ? 'نشط الآن' : item.status === 'pending' ? 'قريبًا' : 'منتهي') : (item.can_buy ? 'متاح' : 'غير متاح');
  const key = `${type}:${item.id}:single`;
  const added = Boolean(findInCart(key));
  return `
    <article class="${type === 'flash' ? 'flash-card' : 'deal-card'}">
      <img class="deal-image" src="${image}" alt="${title}" loading="lazy" />
      <div class="deal-body">
        <div class="badge-line">
          <span class="tag">${statusTag}</span>
          <span class="tag">${qty}</span>
        </div>
        <h3>${title}</h3>
        <p>${desc}</p>
        <div class="price-row">
          <span class="price-pill">${price} ج.م</span>
          ${item.stock !== undefined ? `<span class="price-pill">المخزون ${integer(item.stock)}</span>` : ''}
        </div>
        <div class="product-actions">
          <button class="primary-btn" data-action="toggle-${type}" data-id="${escapeHtml(item.id)}" ${canBuy ? '' : 'disabled'}>${added ? 'إزالة' : 'شراء'}</button>
        </div>
      </div>
    </article>
  `;
}

function renderCart() {
  if (!state.cart.length) {
    els.cartItems.innerHTML = '<div class="muted">السلة فارغة الآن</div>';
    updateHeader();
    return;
  }

  els.cartItems.innerHTML = state.cart.map((item) => `
    <div class="cart-item">
      <img src="${escapeHtml(item.image || placeholderImage(item.title))}" alt="${escapeHtml(item.title)}" />
      <div>
        <h4>${escapeHtml(item.title)}</h4>
        <div class="cart-meta">${escapeHtml(item.company || '')}</div>
        <div class="cart-price">${escapeHtml(item.unitLabel || item.unit || 'وحدة')} · ${num(item.price)} ج.م</div>
        <div class="qty-row">
          <button data-action="qty-down" data-key="${escapeHtml(item.key)}">-</button>
          <input data-role="cart-qty" data-key="${escapeHtml(item.key)}" type="number" min="1" value="${integer(item.qty)}" inputmode="numeric" />
          <button data-action="qty-up" data-key="${escapeHtml(item.key)}">+</button>
          <button data-action="remove-item" data-key="${escapeHtml(item.key)}" class="ghost-btn" style="min-height:34px;padding:0 10px">حذف</button>
        </div>
      </div>
    </div>
  `).join('');
  updateHeader();
}

function renderAllVisible() {
  renderProducts();
  renderDeals();
  renderCart();
  updateHeader();
}

function openLogin() {
  setOverlay(els.loginModal, true);
  els.loginIdentifier.focus();
}

function closeLogin() {
  setOverlay(els.loginModal, false);
}

function openCart() {
  els.cartDrawer.classList.remove('hidden');
  els.cartDrawer.setAttribute('aria-hidden', 'false');
}

function closeCart() {
  els.cartDrawer.classList.add('hidden');
  els.cartDrawer.setAttribute('aria-hidden', 'true');
}

async function lookupUser(table, identifier) {
  const trimmed = identifier.trim();
  const isPhoneLike = /^[+0-9][0-9\s-]+$/.test(trimmed) || /^\d{8,15}$/.test(trimmed);
  const or = isPhoneLike
    ? `or=(phone.eq.${encodeURIComponent(trimmed)},username.eq.${encodeURIComponent(trimmed)})`
    : `or=(username.eq.${encodeURIComponent(trimmed)},phone.eq.${encodeURIComponent(trimmed)})`;
  const url = `${table}?select=id,name,phone,username,password&${or}&limit=1`;
  const data = await apiGet(url.replace(/^.*\//, ''));
  return data?.[0] || null;
}

async function handleLogin() {
  const identifier = els.loginIdentifier.value.trim();
  const password = els.loginPassword.value.trim();
  if (!identifier || !password) {
    toast('أدخل الهاتف أو اسم المستخدم وكلمة المرور');
    return;
  }

  try {
    let user = await lookupUser('customers', identifier);
    let userType = 'customer';
    if (!user) {
      user = await lookupUser('sales_reps', identifier);
      userType = 'rep';
    }
    if (!user) {
      toast('المستخدم غير موجود');
      return;
    }
    if (String(user.password || '').trim() !== password) {
      toast('كلمة المرور غير صحيحة');
      return;
    }
    state.session = { ...user, userType };
    saveJSON('b2b_session', state.session);
    updateHeader();
    closeLogin();
    toast(`مرحبًا ${user.name || user.username || ''}`.trim());
  } catch (error) {
    console.error(error);
    toast('تعذر تسجيل الدخول الآن');
  }
}

async function createOrder(payload) {
  const inserted = await apiPost('orders', payload);
  return inserted?.[0];
}

async function createOrderItems(items) {
  if (!items.length) return [];
  return await apiPost('order_items', items);
}

function buildWhatsAppMessage(orderNumber, customerName, items, total) {
  const lines = [
    `طلب جديد رقم ${orderNumber}`,
    `العميل: ${customerName}`,
    '',
  ];
  items.forEach((item) => {
    lines.push(`- ${item.title} | ${item.unitLabel} | الكمية ${integer(item.qty)} | ${num(item.price)} ج.م`);
  });
  lines.push('', `الإجمالي: ${num(total)} ج.م`);
  return lines.join('\n');
}

async function checkout() {
  if (!state.session) {
    openLogin();
    toast('سجل الدخول أولًا لإتمام الطلب');
    return;
  }
  if (!state.cart.length) {
    toast('السلة فارغة');
    return;
  }
  const customerName = state.session.name || state.session.username || state.session.phone || 'عميل';
  const orderNumber = `ORD-${Date.now()}`;
  const total_amount = Number(cartTotal().toFixed(2));
  const products_total = Number(state.cart.filter((i) => i.type === 'product').reduce((s, i) => s + Number(i.price) * Number(i.qty), 0).toFixed(2));
  const deals_total = Number(state.cart.filter((i) => i.type === 'deal').reduce((s, i) => s + Number(i.price) * Number(i.qty), 0).toFixed(2));
  const flash_total = Number(state.cart.filter((i) => i.type === 'flash').reduce((s, i) => s + Number(i.price) * Number(i.qty), 0).toFixed(2));

  try {
    const orderPayload = {
      order_number: orderNumber,
      user_type: state.session.userType,
      total_amount,
      products_total,
      deals_total,
      flash_total,
      status: 'draft',
      customer_id: state.session.userType === 'customer' ? state.session.id : null,
      user_id: state.session.userType === 'rep' ? state.session.id : null,
    };

    const order = await createOrder(orderPayload);
    if (!order?.id) throw new Error('Order not created');

    const orderItemsPayload = state.cart.map((item) => ({
      order_id: order.id,
      product_id: String(item.id),
      type: String(item.type),
      qty: Number(item.qty),
      price: Number(item.price),
      unit: item.unit || 'single',
    }));
    await createOrderItems(orderItemsPayload);

    if (state.session.userType === 'customer') {
      await apiPatch('orders', { status: 'submitted' }, { id: `eq.${order.id}` }).catch(() => {});
    }

    const whatsappMessage = buildWhatsAppMessage(orderNumber, customerName, state.cart, total_amount);
    const recipient = CONFIG.supportWhatsapp;
    const waUrl = recipient
      ? `https://wa.me/${recipient}?text=${encodeURIComponent(whatsappMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    localStorage.setItem('last_order_number', orderNumber);
    state.cart = [];
    persistCart();
    renderCart();
    renderAllVisible();
    closeCart();
    toast('تم حفظ الطلب بنجاح');
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  } catch (error) {
    console.error(error);
    toast('فشل حفظ الطلب');
  }
}

function toggleProductFromCard(productId) {
  const card = document.querySelector(`.product-card[data-product-id="${CSS.escape(productId)}"]`);
  if (!card) return;
  const product = state.products.find((p) => p.product_id === productId);
  if (!product) return;
  const unit = card.querySelector('[data-role="unit"]')?.value || currentUnit(product);
  const qty = Math.max(1, Number(card.querySelector('[data-role="qty"]')?.value || 1));
  const key = cartKey({ type: 'product', id: productId, unit });
  const existing = findInCart(key);
  if (existing) {
    removeCartItem(key);
    toast('تمت الإزالة من السلة');
    return;
  }
  upsertCartItem({
    type: 'product',
    id: productId,
    title: product.product_name,
    image: product.product_image,
    company: getCompanyName(product.company_id),
    unit,
    unitLabel: unit === 'carton' ? 'كرتونة' : 'قطعة/دستة',
    price: productPrice(product, unit),
  }, qty);
  toast('تمت الإضافة للسلة');
}

function toggleDeal(type, id) {
  const source = type === 'deal' ? state.dailyDeals : state.flashOffers;
  const item = source.find((x) => String(x.id) === String(id));
  if (!item) return;
  const key = `${type}:${item.id}:single`;
  const existing = findInCart(key);
  if (existing) {
    removeCartItem(key);
    toast('تمت الإزالة من السلة');
    return;
  }
  if (type === 'deal' && !item.can_buy) return toast('صفقة اليوم غير متاحة');
  if (type === 'flash' && !item.can_buy) return toast('العرض السريع غير متاح');
  upsertCartItem({
    type,
    id: item.id,
    title: item.title,
    image: item.image,
    company: type === 'deal' ? 'صفقة اليوم' : 'عرض سريع',
    unit: 'single',
    unitLabel: 'قطعة',
    price: item.price,
  }, 1);
  toast('تمت الإضافة للسلة');
}

function saveSearch() {
  state.search = els.searchInput.value.trim();
  renderProducts();
}

function wireEvents() {
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-close], [data-action], [data-company-id]');
    if (!target) return;
    const closeId = target.getAttribute('data-close');
    if (closeId === 'loginModal') return closeLogin();
    if (closeId === 'cartDrawer') return closeCart();
    const action = target.getAttribute('data-action');
    if (action === 'toggle-product') return toggleProductFromCard(target.getAttribute('data-product-id'));
    if (action === 'toggle-deal') return toggleDeal('deal', target.getAttribute('data-id'));
    if (action === 'toggle-flash') return toggleDeal('flash', target.getAttribute('data-id'));
    if (action === 'qty-up') {
      const key = target.getAttribute('data-key');
      const item = state.cart.find((x) => x.key === key);
      if (item) setCartQty(key, Number(item.qty) + 1);
      return;
    }
    if (action === 'qty-down') {
      const key = target.getAttribute('data-key');
      const item = state.cart.find((x) => x.key === key);
      if (item) setCartQty(key, Math.max(1, Number(item.qty) - 1));
      return;
    }
    if (action === 'remove-item') return removeCartItem(target.getAttribute('data-key'));
    const companyId = target.getAttribute('data-company-id');
    if (companyId) navigate(`#company/${encodeURIComponent(companyId)}`);
  });

  document.addEventListener('input', (event) => {
    const el = event.target;
    if (el.matches('#searchInput')) saveSearch();
    if (el.matches('[data-role="cart-qty"]')) {
      setCartQty(el.getAttribute('data-key'), el.value);
    }
  });

  document.addEventListener('change', (event) => {
    const el = event.target;
    if (el.matches('[data-role="unit"]')) {
      const productId = el.getAttribute('data-product-id');
      const card = el.closest('.product-card');
      const qtyInput = card?.querySelector('[data-role="qty"]');
      const product = state.products.find((p) => p.product_id === productId);
      if (!product || !card) return;
      const unit = el.value;
      const key = cartKey({ type: 'product', id: productId, unit });
      const existing = findInCart(key);
      const addBtn = card.querySelector('[data-action="toggle-product"]');
      if (addBtn) addBtn.textContent = existing ? 'إزالة' : 'شراء';
      if (qtyInput) qtyInput.value = existing ? existing.qty : 1;
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeLogin();
      closeCart();
    }
    if (event.key === 'Enter' && document.activeElement === els.loginPassword) handleLogin();
  });

  els.loginBtn.addEventListener('click', () => state.session ? toast(`مرحبًا ${getSessionLabel()}`) : openLogin());
  els.cartBtn.addEventListener('click', openCart);
  els.submitLogin.addEventListener('click', handleLogin);
  els.checkoutBtn.addEventListener('click', checkout);
  els.saveCartBtn.addEventListener('click', () => { persistCart(); toast('تم حفظ السلة'); });
  els.homeBtn.addEventListener('click', () => navigate('#home'));
  els.viewAllCompanies.addEventListener('click', () => navigate('#home'));
  els.clearSearchBtn.addEventListener('click', () => { els.searchInput.value = ''; state.search = ''; renderProducts(); });
  els.searchInput.addEventListener('search', saveSearch);

}

function initSessionUI() {
  updateHeader();
  if (state.session) {
    els.loginBtn.textContent = getSessionLabel();
  }
}

async function init() {
  wireEvents();
  initSessionUI();
  renderCart();
  handleRoute();
  await loadData();
  window.addEventListener('hashchange', handleRoute);
  setInterval(() => {
    renderDeals();
    renderProducts();
  }, 60000);
}

init();
