import { CONFIG, STORAGE_KEYS } from './config.js';
import { createDataLoader } from './pricing-engine/data.loader.js';
import { createPricingEngine } from './pricing-engine/index.js';
import { createCartEngine } from './cart.engine.js';

const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  },
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch] || ch));
}

function money(value) {
  return new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function svgPlaceholder(label = 'item') {
  const safe = String(label).slice(0, 24).replace(/[<>&"']/g, '');
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#f7de86"/>
          <stop offset="1" stop-color="#d4af37"/>
        </linearGradient>
      </defs>
      <rect width="640" height="640" rx="52" fill="#111827"/>
      <rect x="36" y="36" width="568" height="568" rx="42" fill="rgba(255,255,255,.02)" stroke="rgba(212,175,55,.2)"/>
      <text x="320" y="340" text-anchor="middle" font-family="Cairo,Arial,sans-serif" font-size="42" font-weight="700" fill="#f8f4ea">${safe}</text>
      <path d="M220 420h200" stroke="url(#g)" stroke-width="10" stroke-linecap="round"/>
    </svg>`)}`
}

function safeImage(url, seed) {
  const candidate = String(url ?? '').trim();
  if (!candidate) return svgPlaceholder(seed);
  if (/^(data:|https?:|\/\/)/i.test(candidate)) return candidate;
  return svgPlaceholder(seed);
}

const loader = createDataLoader({
  baseUrl: CONFIG.baseUrl,
  apiKey: CONFIG.apiKey,
  cacheTtlMs: CONFIG.cacheTtlMs,
  datasetTtlMs: CONFIG.cacheTtlMs,
});

const pricingEngine = createPricingEngine({
  loader,
  priceCacheTtlMs: CONFIG.cacheTtlMs,
  currency: 'EGP',
});

const cartEngine = createCartEngine({
  resolvePrice: pricingEngine.resolvePrice,
});

const state = {
  ready: false,
  route: location.hash.replace('#', '') || 'home',
  selectedUnit: storage.get(STORAGE_KEYS.unitPrefs, {}).defaultUnit || 'pack',
  selectedTierName: storage.get(STORAGE_KEYS.tier, null)?.tier_name || null,
  selectedCustomer: storage.get(STORAGE_KEYS.selectedCustomer, null),
  session: storage.get(STORAGE_KEYS.session, null),
  cart: storage.get(STORAGE_KEYS.cart, []),
  search: '',
  products: [],
  companies: [],
  tiers: [],
  deals: [],
  flash: [],
  customers: [],
  catalog: null,
  cartTotals: { total: 0, products: 0, deals: 0, flash: 0, eligible: 0 },
  busy: false,
  loadError: null,
  loginError: '',
  registerError: '',
  notice: '',
  renderToken: 0,
};

const els = {
  app: document.getElementById('app'),
  routeLabel: document.getElementById('routeLabel'),
  tierLabel: document.getElementById('tierLabel'),
  unitLabel: document.getElementById('unitLabel'),
  cartBadge: document.getElementById('cartBadge'),
  cartValue: document.getElementById('cartValue'),
  userLabel: document.getElementById('userLabel'),
  userSub: document.getElementById('userSub'),
  searchInput: document.getElementById('searchInput'),
  homeBtn: document.getElementById('homeBtn'),
  dealsBtn: document.getElementById('dealsBtn'),
  flashBtn: document.getElementById('flashBtn'),
  tiersBtn: document.getElementById('tiersBtn'),
  cartBtn: document.getElementById('cartBtn'),
  loginBtn: document.getElementById('loginBtn'),
  cartDrawer: document.getElementById('cartDrawer'),
  cartBackdrop: document.getElementById('cartBackdrop'),
  cartList: document.getElementById('cartList'),
  cartTotal: document.getElementById('cartTotal'),
  cartProductsTotal: document.getElementById('cartProductsTotal'),
  cartDealsTotal: document.getElementById('cartDealsTotal'),
  cartFlashTotal: document.getElementById('cartFlashTotal'),
  cartEligibleTotal: document.getElementById('cartEligibleTotal'),
  checkoutBtn: document.getElementById('checkoutBtn'),
  clearCartBtn: document.getElementById('clearCartBtn'),
  loginModal: document.getElementById('loginModal'),
  registerModal: document.getElementById('registerModal'),
  tierModal: document.getElementById('tierModal'),
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  loginMessage: document.getElementById('loginMessage'),
  registerMessage: document.getElementById('registerMessage'),
  loginIdentifier: document.getElementById('loginIdentifier'),
  loginPassword: document.getElementById('loginPassword'),
  registerName: document.getElementById('registerName'),
  registerPhone: document.getElementById('registerPhone'),
  registerAddress: document.getElementById('registerAddress'),
  registerLocation: document.getElementById('registerLocation'),
  registerUsername: document.getElementById('registerUsername'),
  registerPassword: document.getElementById('registerPassword'),
  renderRoot: document.getElementById('renderRoot'),
  toast: document.getElementById('toast'),
};

const notify = (message, type = 'info') => {
  if (!els.toast) return;
  els.toast.className = `toast show ${type}`;
  els.toast.textContent = message;
  clearTimeout(notify._timer);
  notify._timer = setTimeout(() => {
    els.toast.className = 'toast';
    els.toast.textContent = '';
  }, 2600);
};

function activeTier() {
  return state.catalog?.defaultTier || state.tiers.find((tier) => tier.tier_name === state.selectedTierName) || state.tiers.find((tier) => tier.is_default) || state.tiers[0] || null;
}

function selectedTierName() {
  return state.selectedTierName || activeTier()?.tier_name || 'base';
}

function persist() {
  storage.set(STORAGE_KEYS.cart, state.cart);
  storage.set(STORAGE_KEYS.tier, state.selectedTierName ? { tier_name: state.selectedTierName } : null);
  storage.set(STORAGE_KEYS.unitPrefs, { defaultUnit: state.selectedUnit });
  storage.set(STORAGE_KEYS.selectedCustomer, state.selectedCustomer);
  storage.set(STORAGE_KEYS.session, state.session);
}

function parseHash() {
  const raw = decodeURIComponent(location.hash || '#home').replace(/^#/, '');
  return raw || 'home';
}

function setRoute(route) {
  location.hash = route || 'home';
}

async function init() {
  bindEvents();
  await loadData();
  scheduleRender();
}

async function loadData() {
  state.busy = true;
  state.loadError = null;
  try {
    await pricingEngine.preload();
    const catalog = loader.getCatalog();
    state.catalog = catalog;
    state.products = catalog.products || [];
    state.companies = catalog.companies || [];
    state.tiers = catalog.tiers || [];
    state.deals = catalog.deals || [];
    state.flash = catalog.flashOffers || [];
    state.customers = catalog.customers || [];
    if (!state.selectedTierName && catalog.defaultTier?.tier_name) {
      state.selectedTierName = catalog.defaultTier.tier_name;
    }
    if (!state.session) {
      state.session = { visitorId: cryptoRandomId(), startedAt: Date.now() };
    }
    state.ready = true;
  } catch (error) {
    state.loadError = error?.message || 'Failed to load catalog';
    notify(state.loadError, 'error');
    state.ready = true;
  } finally {
    state.busy = false;
  }
}

function cryptoRandomId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `v_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function bindEvents() {
  window.addEventListener('hashchange', () => {
    state.route = parseHash();
    scheduleRender();
  });

  document.addEventListener('click', onDocumentClick);
  document.addEventListener('submit', onDocumentSubmit);

  els.searchInput?.addEventListener('input', (event) => {
    state.search = event.target.value || '';
    scheduleRender();
  });

  els.cartBackdrop?.addEventListener('click', closeCart);
  els.cartBtn?.addEventListener('click', openCart);
  els.checkoutBtn?.addEventListener('click', checkout);
  els.clearCartBtn?.addEventListener('click', async () => {
    state.cart = [];
    persist();
    scheduleRender();
  });

  els.homeBtn?.addEventListener('click', () => setRoute('home'));
  els.dealsBtn?.addEventListener('click', () => setRoute('deals'));
  els.flashBtn?.addEventListener('click', () => setRoute('flash'));
  els.tiersBtn?.addEventListener('click', () => setRoute('tiers'));
  els.loginBtn?.addEventListener('click', () => openModal('loginModal'));
}

function onDocumentClick(event) {
  const target = event.target.closest('[data-action], [data-add-product], [data-add-deal], [data-add-flash], [data-tier], [data-unit]');
  if (!target) return;

  const action = target.dataset.action;
  if (action === 'open-login') return openModal('loginModal');
  if (action === 'open-register') return openModal('registerModal');
  if (action === 'open-tier') return openModal('tierModal');
  if (action === 'close-modal') return closeModal(target.dataset.target);
  if (action === 'route') return setRoute(target.dataset.route);
  if (action === 'logout') return logout();
  if (action === 'select-tier') return selectTier(target.dataset.tier);
  if (action === 'select-unit') return selectUnit(target.dataset.unit);
  if (action === 'add-product') return addProductToCart(target.dataset.id, target.dataset.unit);
  if (action === 'add-deal') return addOfferToCart(target.dataset.id, 'deal');
  if (action === 'add-flash') return addOfferToCart(target.dataset.id, 'flash');
  if (action === 'remove-item') return removeItem(target.dataset.key);
  if (action === 'qty-minus') return changeQty(target.dataset.key, -1);
  if (action === 'qty-plus') return changeQty(target.dataset.key, 1);
  if (action === 'open-cart') return openCart();
  if (action === 'reload-app') return location.reload();
}

function onDocumentSubmit(event) {
  const form = event.target;
  if (form?.id === 'loginForm') {
    event.preventDefault();
    login();
  } else if (form?.id === 'registerForm') {
    event.preventDefault();
    registerCustomer();
  }
}

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('show');
  el.setAttribute('aria-hidden', 'false');
}

function closeModal(id) {
  if (id === 'cartDrawer') {
    closeCart();
    return;
  }
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('show');
  el.setAttribute('aria-hidden', 'true');
}

function openCart() {
  els.cartDrawer?.classList.add('show');
  els.cartBackdrop?.classList.add('show');
}

function closeCart() {
  els.cartDrawer?.classList.remove('show');
  els.cartBackdrop?.classList.remove('show');
}

function selectTier(tierName) {
  const tier = state.tiers.find((t) => String(t.tier_name) === String(tierName));
  if (!tier) return;
  state.selectedTierName = tier.tier_name;
  persist();
  notify(`تم اختيار شريحة ${tier.visible_label || tier.tier_name}`, 'success');
  scheduleRender();
}

function selectUnit(unit) {
  if (unit !== 'pack' && unit !== 'carton') return;
  state.selectedUnit = unit;
  persist();
  notify(`تم اختيار ${unit === 'pack' ? 'عبوة' : 'كرتونة'}`, 'success');
  scheduleRender();
}

async function addProductToCart(productId, unit) {
  const unitToUse = unit || state.selectedUnit;
  const tierName = selectedTierName();
  const product = state.products.find((p) => String(p.product_id) === String(productId));
  if (!product) return;

  const updated = await cartEngine.addToCart(state.cart, {
    productId,
    qty: 1,
    unit: unitToUse,
    tierName,
    kind: 'product',
    title: product.product_name,
    image: product.product_image,
    companyId: product.company_id,
  }, {
    tierName,
    deals: state.deals,
    flash: state.flash,
  });

  state.cart = updated;
  persist();
  notify('تمت إضافة المنتج للسلة', 'success');
  openCart();
  scheduleRender();
}

async function addOfferToCart(id, kind) {
  const tierName = selectedTierName();
  const updated = await cartEngine.addToCart(state.cart, {
    productId: id,
    qty: 1,
    unit: 'pack',
    tierName,
    kind,
    title: kind === 'deal'
      ? (state.deals.find((d) => String(d.id) === String(id))?.title || 'Deal')
      : (state.flash.find((f) => String(f.id) === String(id))?.title || 'Flash'),
  }, {
    tierName,
    deals: state.deals,
    flash: state.flash,
  });

  state.cart = updated;
  persist();
  notify(kind === 'deal' ? 'تمت إضافة صفقة اليوم' : 'تمت إضافة عرض الفلاش', 'success');
  openCart();
  scheduleRender();
}

function removeItem(key) {
  const targetKey = String(key);
  state.cart = state.cart.filter((item) => {
    const itemKey = [
      String(item.productId ?? item.id),
      String(item.kind || item.type || 'product'),
      String(item.unit || 'pack'),
      String(item.tierName || ''),
    ].join('|');
    return itemKey !== targetKey;
  });
  persist();
  scheduleRender();
}

function changeQty(key, delta) {
  const parts = String(key).split('|');
  state.cart = state.cart.map((item) => {
    const itemKey = [
      String(item.productId ?? item.id),
      String(item.kind || item.type || 'product'),
      String(item.unit || 'pack'),
      String(item.tierName || ''),
    ].join('|');
    if (itemKey !== key) return item;
    const nextQty = Math.max(1, Number(item.qty || 1) + delta);
    return { ...item, qty: nextQty };
  });
  persist();
  scheduleRender();
}

async function login() {
  const identifier = els.loginIdentifier?.value?.trim() || '';
  const password = els.loginPassword?.value || '';
  if (!identifier || !password) {
    notify('أدخل الهاتف أو اسم المستخدم وكلمة المرور', 'error');
    return;
  }
  try {
    await loader.ensureCatalog();
    const customer = loader.getCustomer(identifier);
    if (!customer || String(customer.password || '') !== String(password)) {
      throw new Error('بيانات الدخول غير صحيحة');
    }
    state.selectedCustomer = customer;
    state.session = { ...state.session, customerId: customer.id, loggedInAt: Date.now() };
    persist();
    closeModal('loginModal');
    notify(`أهلاً ${customer.name}`, 'success');
    scheduleRender();
  } catch (error) {
    notify(error?.message || 'فشل تسجيل الدخول', 'error');
  }
}

async function registerCustomer() {
  const payload = {
    name: els.registerName?.value?.trim(),
    phone: els.registerPhone?.value?.trim(),
    address: els.registerAddress?.value?.trim(),
    location: els.registerLocation?.value?.trim(),
    username: els.registerUsername?.value?.trim(),
    password: els.registerPassword?.value || '',
  };

  if (!payload.name || !payload.phone || !payload.username || !payload.password) {
    notify('اسم العميل والهاتف واسم المستخدم وكلمة المرور مطلوبة', 'error');
    return;
  }

  try {
    await loader.ensureCatalog();
    const exists = state.customers.some((c) => String(c.phone) === String(payload.phone) || String(c.username) === String(payload.username));
    if (exists) {
      throw new Error('العميل موجود بالفعل');
    }

    const created = await loader.insert('customers', {
      ...payload,
      customer_type: 'direct',
      default_tier_name: activeTier()?.tier_name || 'base',
      is_active: true,
      is_blocked: false,
    });

    const customer = Array.isArray(created) ? created[0] : created;
    state.customers = [customer, ...state.customers];
    state.selectedCustomer = customer;
    state.session = { ...state.session, customerId: customer.id, registeredAt: Date.now() };
    persist();
    closeModal('registerModal');
    notify('تم تسجيل العميل بنجاح', 'success');
    scheduleRender();
  } catch (error) {
    notify(error?.message || 'فشل التسجيل', 'error');
  }
}

function logout() {
  state.selectedCustomer = null;
  state.session = { ...state.session, customerId: null, loggedOutAt: Date.now() };
  persist();
  notify('تم تسجيل الخروج', 'success');
  scheduleRender();
}

async function checkout() {
  if (!state.selectedCustomer) {
    openModal('loginModal');
    notify('سجل الدخول أولاً قبل إتمام الشراء', 'error');
    return;
  }

  try {
    const repriced = await cartEngine.repriceCart(state.cart, {
      tierName: selectedTierName(),
      deals: state.deals,
      flash: state.flash,
    });

    const totals = cartEngine.cartTotals(repriced);
    if (!repriced.length) {
      throw new Error('السلة فارغة');
    }

    const orderRows = repriced.map((item) => ({
      product_id: String(item.productId ?? item.id),
      type: String(item.kind || item.type || 'product'),
      qty: Number(item.qty || 1),
      price: Number(item.price || 0),
      unit: String(item.unit || 'pack'),
    }));

    const orderPayload = {
      customer_id: state.selectedCustomer.id,
      user_type: 'customer',
      total_amount: totals.total,
      products_total: totals.products,
      deals_total: totals.deals,
      flash_total: totals.flash,
      status: 'draft',
      tier_name: selectedTierName(),
      customer_type: 'direct',
      workflow_status: 'قيد التنفيذ',
    };

    const insertedOrder = await loader.insert('orders', orderPayload);
    const order = Array.isArray(insertedOrder) ? insertedOrder[0] : insertedOrder;
    await loader.insert('order_items', orderRows.map((row) => ({
      ...row,
      order_id: order.id,
    })));

    state.cart = [];
    persist();
    closeCart();
    notify('تم إنشاء الطلب بنجاح', 'success');
    scheduleRender();
  } catch (error) {
    notify(error?.message || 'فشل إتمام الطلب', 'error');
  }
}

async function refreshCart() {
  state.cart = await cartEngine.repriceCart(state.cart, {
    tierName: selectedTierName(),
    deals: state.deals,
    flash: state.flash,
  });
  state.cartTotals = cartEngine.cartTotals(state.cart);
  persist();
}

function renderHeader() {
  const tier = activeTier();
  const selectedCustomer = state.selectedCustomer;
  if (els.routeLabel) els.routeLabel.textContent = routeTitle(state.route);
  if (els.tierLabel) els.tierLabel.textContent = tier?.visible_label || tier?.tier_name || 'Base';
  if (els.unitLabel) els.unitLabel.textContent = state.selectedUnit === 'pack' ? 'عبوة' : 'كرتونة';
  if (els.userLabel) els.userLabel.textContent = selectedCustomer?.name || 'دخول';
  if (els.userSub) els.userSub.textContent = selectedCustomer ? 'حسابك مفتوح' : 'تسجيل الدخول';
  if (els.cartBadge) els.cartBadge.textContent = String(state.cart.length);
  if (els.cartValue) els.cartValue.textContent = money(state.cartTotals.total);
}

function routeTitle(route) {
  if (route === 'deals') return 'صفقة اليوم';
  if (route === 'flash') return 'عرض الساعة';
  if (route === 'tiers') return 'الشرائح';
  if (route === 'cart') return 'السلة';
  if (route === 'login') return 'الدخول';
  if (route === 'register') return 'تسجيل عميل';
  return 'الرئيسية';
}

async function resolveCardPrice(product, unit = state.selectedUnit) {
  const pricing = await pricingEngine.resolvePrice({
    productId: product.product_id,
    qty: 1,
    unit,
    tierName: selectedTierName(),
    context: {
      kind: 'product',
      deals: state.deals,
      flash: state.flash,
    },
  });
  return pricing;
}

async function renderHome() {
  const query = state.search.trim().toLowerCase();
  const visibleProducts = state.products.filter((product) => {
    if (product.visible === false) return false;
    if (product.status && String(product.status).toLowerCase() !== 'active') return false;
    if (!query) return true;
    const text = `${product.product_name || ''} ${product.category || ''} ${product.company_id || ''}`.toLowerCase();
    return text.includes(query);
  }).slice(0, 48);

  const cards = await Promise.all(visibleProducts.map(async (product) => {
    const price = await resolveCardPrice(product, state.selectedUnit);
    const company = state.companies.find((c) => String(c.company_id) === String(product.company_id));
    return `
      <article class="card product-card">
        <div class="product-hero">
          <img class="product-image" src="${escapeHtml(safeImage(product.product_image, product.product_name))}" alt="${escapeHtml(product.product_name)}" loading="lazy" />
          <div class="product-meta">
            <div class="product-title">${escapeHtml(product.product_name)}</div>
            <div class="product-sub">${escapeHtml(company?.company_name || product.company_id || '')}</div>
            <div class="badge-row">
              ${product.has_pack ? '<span class="badge">عبوة</span>' : ''}
              ${product.has_carton ? '<span class="badge">كرتونة</span>' : ''}
              ${product.category ? `<span class="badge">${escapeHtml(product.category)}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="price-row">
          <div class="price-main">${money(price.unitPrice)} <small>ج.م</small></div>
          <div class="price-sub">الإجمالي للوحدة المختارة</div>
        </div>
        <div class="action-row">
          <button class="btn btn-soft" data-unit="pack" data-action="add-product" data-id="${escapeHtml(product.product_id)}" ${product.has_pack === false ? 'disabled' : ''}>إضافة عبوة</button>
          <button class="btn btn-soft" data-unit="carton" data-action="add-product" data-id="${escapeHtml(product.product_id)}" ${product.has_carton === false ? 'disabled' : ''}>إضافة كرتونة</button>
        </div>
      </article>
    `;
  }));

  return `
    <section class="hero card">
      <div>
        <div class="eyebrow">B2B Commerce Pricing Engine</div>
        <h1>تسعير مباشر من قاعدة البيانات بدون ازدواجية قرارات</h1>
        <p>كل سعر يمر عبر Pricing Engine فقط. السلة تعيد التسعير عند الإضافة والعرض والدفع.</p>
        <div class="hero-actions">
          <button class="btn btn-primary" data-action="route" data-route="deals">صفقة اليوم</button>
          <button class="btn btn-soft" data-action="route" data-route="flash">عرض الساعة</button>
          <button class="btn btn-soft" data-action="route" data-route="tiers">اختيار الشريحة</button>
        </div>
      </div>
      <div class="hero-stats">
        <div class="stat"><span>${state.products.length}</span><small>منتج</small></div>
        <div class="stat"><span>${state.tiers.length}</span><small>شريحة</small></div>
        <div class="stat"><span>${state.deals.length}</span><small>صفقة</small></div>
        <div class="stat"><span>${state.flash.length}</span><small>فلاش</small></div>
      </div>
    </section>
    <section class="section-head">
      <h2>المنتجات</h2>
      <div class="toolbar">
        <button class="btn btn-soft" data-action="select-unit" data-unit="pack">عبوة</button>
        <button class="btn btn-soft" data-action="select-unit" data-unit="carton">كرتونة</button>
      </div>
    </section>
    <section class="grid products-grid">
      ${cards.join('') || '<div class="empty">لا توجد منتجات مطابقة</div>'}
    </section>
  `;
}

async function renderDeals() {
  const cards = await Promise.all(state.deals.slice(0, 24).map(async (deal) => {
    const priced = await pricingEngine.resolvePrice({
      productId: deal.id,
      qty: 1,
      unit: 'pack',
      tierName: selectedTierName(),
      kind: 'deal',
      context: { kind: 'deal', deals: state.deals },
    });
    return `
      <article class="card product-card offer-card">
        <div class="product-hero">
          <img class="product-image" src="${escapeHtml(safeImage(deal.image, deal.title))}" alt="${escapeHtml(deal.title)}" loading="lazy" />
          <div class="product-meta">
            <div class="product-title">${escapeHtml(deal.title)}</div>
            <div class="product-sub">${escapeHtml(deal.description || '')}</div>
          </div>
        </div>
        <div class="price-row">
          <div class="price-main">${money(priced.unitPrice)} <small>ج.م</small></div>
          <div class="price-sub">صفقة اليوم</div>
        </div>
        <button class="btn btn-primary" data-action="add-deal" data-id="${escapeHtml(deal.id)}">إضافة للسلة</button>
      </article>
    `;
  }));

  return `
    <section class="section-head">
      <h2>صفقة اليوم</h2>
      <div class="helper">العروض المعروضة تأتي من قاعدة البيانات وتُسعَّر من المحرك فقط.</div>
    </section>
    <section class="grid products-grid">
      ${cards.join('') || '<div class="empty">لا توجد صفقات حالياً</div>'}
    </section>
  `;
}

async function renderFlash() {
  const cards = await Promise.all(state.flash.slice(0, 24).map(async (offer) => {
    const priced = await pricingEngine.resolvePrice({
      productId: offer.id,
      qty: 1,
      unit: 'pack',
      tierName: selectedTierName(),
      kind: 'flash',
      context: { kind: 'flash', flash: state.flash, now: Date.now() },
    });
    return `
      <article class="card product-card offer-card flash-card">
        <div class="product-hero">
          <img class="product-image" src="${escapeHtml(safeImage(offer.image, offer.title))}" alt="${escapeHtml(offer.title)}" loading="lazy" />
          <div class="product-meta">
            <div class="product-title">${escapeHtml(offer.title)}</div>
            <div class="product-sub">${escapeHtml(offer.description || '')}</div>
            <div class="badge-row">
              <span class="badge">${escapeHtml(offer.status || 'flash')}</span>
              <span class="badge">حتى ${escapeHtml(String(offer.end_time || '').slice(0, 16).replace('T', ' '))}</span>
            </div>
          </div>
        </div>
        <div class="price-row">
          <div class="price-main">${money(priced.unitPrice)} <small>ج.م</small></div>
          <div class="price-sub">عرض وقتي</div>
        </div>
        <button class="btn btn-primary" data-action="add-flash" data-id="${escapeHtml(offer.id)}">إضافة للسلة</button>
      </article>
    `;
  }));

  return `
    <section class="section-head">
      <h2>عرض الساعة</h2>
      <div class="helper">العروض الوقتية تُعاد مطابقتها مع الوقت الحالي عند كل تسعير.</div>
    </section>
    <section class="grid products-grid">
      ${cards.join('') || '<div class="empty">لا توجد عروض فلاش حالياً</div>'}
    </section>
  `;
}

async function renderTiers() {
  const cards = state.tiers.map((tier) => {
    const active = String(tier.tier_name) === String(selectedTierName());
    return `
      <article class="card tier-card ${active ? 'active' : ''}">
        <div class="tier-name">${escapeHtml(tier.visible_label || tier.tier_name)}</div>
        <div class="tier-meta">خصم ${escapeHtml(String(tier.discount_percent ?? 0))}%</div>
        <div class="tier-meta">الحد الأدنى ${money(tier.min_order || 0)} ج.م</div>
        <button class="btn ${active ? 'btn-primary' : 'btn-soft'}" data-action="select-tier" data-tier="${escapeHtml(tier.tier_name)}">
          ${active ? 'محدد' : 'اختيار'}
        </button>
      </article>
    `;
  });

  return `
    <section class="section-head">
      <h2>الشرائح التجارية</h2>
      <div class="helper">اختيار الشريحة يؤثر فقط عبر Pricing Engine.</div>
    </section>
    <section class="grid tiers-grid">
      ${cards.join('') || '<div class="empty">لا توجد شرائح</div>'}
    </section>
  `;
}

function renderCartItems() {
  if (!state.cart.length) {
    return '<div class="empty">السلة فارغة</div>';
  }

  return state.cart.map((item) => {
    const key = [
      String(item.productId ?? item.id),
      String(item.kind || item.type || 'product'),
      String(item.unit || 'pack'),
      String(item.tierName || ''),
    ].join('|');
    const title = item.title || item.name || item.product_name || item.productId || item.id;
    return `
      <article class="cart-item">
        <div class="cart-item-title">${escapeHtml(title)}</div>
        <div class="cart-item-meta">${escapeHtml(item.kind || item.type || 'product')} · ${escapeHtml(item.unit || 'pack')} · ${escapeHtml(item.tierName || selectedTierName())}</div>
        <div class="cart-item-row">
          <button class="qty-btn" data-action="qty-minus" data-key="${escapeHtml(key)}">−</button>
          <span class="qty-num">${escapeHtml(String(item.qty || 1))}</span>
          <button class="qty-btn" data-action="qty-plus" data-key="${escapeHtml(key)}">+</button>
          <div class="cart-item-price">${money(item.total ?? item.price)} ج.م</div>
        </div>
        <div class="action-row">
          <button class="btn btn-soft" data-action="remove-item" data-key="${escapeHtml(key)}">حذف</button>
        </div>
      </article>
    `;
  }).join('');
}

async function renderCart() {
  const repriced = await cartEngine.repriceCart(state.cart, {
    tierName: selectedTierName(),
    deals: state.deals,
    flash: state.flash,
  });
  state.cart = repriced;
  state.cartTotals = cartEngine.cartTotals(repriced);
  persist();

  return `
    <section class="section-head">
      <h2>السلة</h2>
      <div class="helper">أي سعر داخل السلة يتم استبداله تلقائياً من المحرك.</div>
    </section>
    <section class="card cart-summary">
      <div>الإجمالي: <strong>${money(state.cartTotals.total)} ج.م</strong></div>
      <div>المنتجات: ${money(state.cartTotals.products)} ج.م</div>
      <div>الصفقات: ${money(state.cartTotals.deals)} ج.م</div>
      <div>الفلاش: ${money(state.cartTotals.flash)} ج.م</div>
      <div>المؤهل للشريحة: ${money(state.cartTotals.eligible)} ج.م</div>
    </section>
    <section class="cart-list">
      ${renderCartItems()}
    </section>
  `;
}

async function renderCustomers() {
  const selected = state.selectedCustomer;
  const rows = state.customers.slice(0, 24).map((customer) => `
    <div class="list-row">
      <div>
        <div class="list-title">${escapeHtml(customer.name)}</div>
        <div class="list-sub">${escapeHtml(customer.phone || '')}</div>
      </div>
      <div class="list-sub">${escapeHtml(customer.customer_type || 'direct')}</div>
    </div>
  `).join('');

  return `
    <section class="section-head">
      <h2>حسابي</h2>
      <div class="helper">${selected ? `مسجّل باسم ${escapeHtml(selected.name)}` : 'غير مسجل الدخول'}</div>
    </section>
    <section class="grid two-col">
      <article class="card">
        <div class="section-title">العميل الحالي</div>
        <div class="profile-line">${selected ? escapeHtml(selected.name) : 'غير مسجل'}</div>
        <div class="profile-line">${selected ? escapeHtml(selected.phone || '') : '---'}</div>
        <div class="profile-line">${selected ? escapeHtml(selected.location || '') : '---'}</div>
        <div class="action-row">
          <button class="btn btn-primary" data-action="open-login">دخول</button>
          <button class="btn btn-soft" data-action="open-register">تسجيل</button>
          <button class="btn btn-soft" data-action="logout">خروج</button>
        </div>
      </article>
      <article class="card">
        <div class="section-title">العملاء المسجلون</div>
        <div class="list-stack">${rows || '<div class="empty">لا يوجد عملاء</div>'}</div>
      </article>
    </section>
  `;
}

async function renderRegister() {
  return `
    <section class="section-head">
      <h2>تسجيل عميل</h2>
      <div class="helper">إضافة عميل جديد إلى جدول customers.</div>
    </section>
    <section class="card">
      <form id="registerForm" class="form-grid">
        <input id="registerName" placeholder="اسم العميل" />
        <input id="registerPhone" placeholder="الهاتف" />
        <input id="registerAddress" placeholder="العنوان" />
        <input id="registerLocation" placeholder="الموقع" />
        <input id="registerUsername" placeholder="اسم المستخدم" />
        <input id="registerPassword" type="password" placeholder="كلمة المرور" />
        <button class="btn btn-primary" type="submit">حفظ</button>
      </form>
    </section>
  `;
}

async function renderLogin() {
  return `
    <section class="section-head">
      <h2>تسجيل الدخول</h2>
      <div class="helper">يتم البحث داخل جدول customers.</div>
    </section>
    <section class="card">
      <form id="loginForm" class="form-grid">
        <input id="loginIdentifier" placeholder="الهاتف أو اسم المستخدم" />
        <input id="loginPassword" type="password" placeholder="كلمة المرور" />
        <button class="btn btn-primary" type="submit">دخول</button>
      </form>
    </section>
  `;
}

async function renderMain() {
  if (state.loadError) {
    return `
      <section class="hero card">
        <div>
          <div class="eyebrow">خطأ تحميل</div>
          <h1>تعذر تحميل البيانات من قاعدة البيانات</h1>
          <p>${escapeHtml(state.loadError)}</p>
          <div class="hero-actions">
            <button class="btn btn-primary" data-action="reload-app">إعادة التحميل</button>
          </div>
        </div>
      </section>
    `;
  }
  const route = state.route;
  if (route === 'deals') return renderDeals();
  if (route === 'flash') return renderFlash();
  if (route === 'tiers') return renderTiers();
  if (route === 'cart') return renderCart();
  if (route === 'customers') return renderCustomers();
  if (route === 'register') return renderRegister();
  if (route === 'login') return renderLogin();
  return renderHome();
}

function updateMisc() {
  renderHeader();
  if (els.renderRoot) {
    // no-op
  }
}

async function scheduleRender() {
  const token = ++state.renderToken;
  if (!state.ready) return;
  try {
    if (!state.loadError) {
      await refreshCart();
    }
    if (token !== state.renderToken) return;
    updateMisc();
    const html = await renderMain();
    if (token !== state.renderToken) return;
    els.app.innerHTML = html;
    if (els.cartTotal) els.cartTotal.textContent = money(state.cartTotals.total);
    if (els.cartProductsTotal) els.cartProductsTotal.textContent = money(state.cartTotals.products);
    if (els.cartDealsTotal) els.cartDealsTotal.textContent = money(state.cartTotals.deals);
    if (els.cartFlashTotal) els.cartFlashTotal.textContent = money(state.cartTotals.flash);
    if (els.cartEligibleTotal) els.cartEligibleTotal.textContent = money(state.cartTotals.eligible);
    persist();
  } catch (error) {
    console.error(error);
    notify(error?.message || 'فشل في العرض', 'error');
  }
}

async function checkoutLabel() {
  const totals = cartEngine.cartTotals(state.cart);
  return `${money(totals.total)} ج.م`;
}

async function main() {
  state.route = parseHash();
  await init();
}

main();
