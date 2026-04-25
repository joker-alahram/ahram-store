const SUPABASE_URL = window.SUPABASE_URL || window.__SUPABASE_URL__ || '';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || window.__SUPABASE_ANON_KEY__ || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Set SUPABASE_URL and SUPABASE_ANON_KEY in script.js or via window globals.');
}

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const state = {
  user: null,
  customer: null,
  customerByPhone: null,
  rep: null,
  selectedTier: 'base',
  settings: null,
  products: [],
  companies: [],
  dailyDeals: [],
  flashOffers: [],
  cart: loadCart(),
  orders: [],
  myCustomers: [],
  activeCompany: 'all',
  search: '',
  selectedRepCustomerId: null,
};

const els = {};
const moneyFmt = new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 });

function $(id) { return document.getElementById(id); }
function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
function isEmpty(v) { return v === null || v === undefined || String(v).trim() === ''; }
function money(value) {
  const n = Number(value || 0);
  return moneyFmt.format(Number.isFinite(n) ? n : 0);
}
function toStr(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}
function clampInt(v, min = 1) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= min ? n : min;
}
function uid(prefix = 'item') {
  if (window.crypto && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function normalizePhone(v) {
  return String(v || '').trim().replace(/\s+/g, '');
}
function hashPassword(rawPassword) {
  const lib = window.bcrypt || window.dcodeIO?.bcrypt;
  if (!lib || typeof lib.hashSync !== 'function') {
    throw new Error('bcrypt library not available');
  }
  return lib.hashSync(String(rawPassword || ''), 10);
}
function loadCart() {
  try { return JSON.parse(localStorage.getItem('b2b_cart') || '[]'); }
  catch { return []; }
}
function saveCart() {
  localStorage.setItem('b2b_cart', JSON.stringify(state.cart));
}
function setMessage(targetId, text, kind = '') {
  const el = $(targetId);
  if (!el) return;
  el.textContent = text;
  el.className = `message-box ${kind}`.trim();
  el.classList.remove('hidden');
}
function clearMessage(targetId) {
  const el = $(targetId);
  if (!el) return;
  el.className = 'message-box muted hidden';
  el.textContent = '';
}
function openAuthModal(start = 'login') {
  $('authModal').classList.remove('hidden');
  switchAuth(start);
}
function closeAuthModal() {
  $('authModal').classList.add('hidden');
}
function switchAuth(mode) {
  const loginBtn = document.querySelector('.auth-tabs .tab-btn[data-auth="login"]');
  const regBtn = document.querySelector('.auth-tabs .tab-btn[data-auth="register"]');
  const loginForm = $('loginForm');
  const registerForm = $('registerForm');
  if (mode === 'register') {
    loginBtn.classList.remove('active');
    regBtn.classList.add('active');
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  } else {
    loginBtn.classList.add('active');
    regBtn.classList.remove('active');
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  }
}
function setView(viewName) {
  for (const btn of document.querySelectorAll('.quick-actions .tab-btn')) {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  }
  for (const panel of document.querySelectorAll('.view-panel')) panel.classList.remove('active');
  $(`${viewName}View`).classList.add('active');
}
function refreshSessionChip() {
  const user = state.user;
  const customer = state.customer;
  const rep = state.rep;
  $('sessionChip').textContent = user ? `${user.name} (${user.role})` : 'غير مسجل الدخول';
  $('tierChip').textContent = `Tier: ${state.selectedTier || 'base'}`;
  $('customerChip').textContent = customer
    ? `العميل: ${customer.customer_name || customer.trader_name || customer.phone}`
    : rep
      ? `المندوب: ${rep.rep_name || rep.rep_id}`
      : 'العميل: —';
}
function updateStats() {
  $('statProducts').textContent = String(state.products.length);
  $('statCompanies').textContent = String(state.companies.length);
  $('statCustomers').textContent = String(state.myCustomers.length || 0);
}
function currentCompanyName(companyId) {
  const c = state.companies.find(x => toStr(x.company_id) === toStr(companyId));
  return c?.company_name || toStr(companyId) || '—';
}
function getProductPriceForTier(productId, tierName, unit) {
  const key = `${toStr(productId)}|${String(tierName || 'base').trim().toLowerCase()}`;
  const table = unit === 'pack' ? state.priceMaps.pack : unit === 'piece' ? state.priceMaps.piece : state.priceMaps.carton;
  return table.get(key);
}
function buildPriceMaps(raw = { carton: [], pack: [], piece: [] }) {
  state.priceMaps = { carton: new Map(), pack: new Map(), piece: new Map() };
  for (const row of raw.carton || []) {
    state.priceMaps.carton.set(`${toStr(row.product_id)}|${String(row.tier_name || 'base').trim().toLowerCase()}`, Number(row.price || 0));
  }
  for (const row of raw.pack || []) {
    state.priceMaps.pack.set(`${toStr(row.product_id)}|${String(row.tier_name || 'base').trim().toLowerCase()}`, Number(row.price || 0));
  }
  for (const row of raw.piece || []) {
    state.priceMaps.piece.set(`${toStr(row.product_id)}|${String(row.tier_name || 'base').trim().toLowerCase()}`, Number(row.price || 0));
  }
}
function pickPriceForProduct(product, unit) {
  const tier = String(state.selectedTier || 'base').trim().toLowerCase();
  const productId = toStr(product.product_id);
  let price = getProductPriceForTier(productId, tier, unit);
  if (price === undefined || price === null || Number.isNaN(Number(price))) {
    price = getProductPriceForTier(productId, 'base', unit);
  }
  return price;
}
function productImageSrc(url) {
  const u = String(url || '').trim();
  if (!u) return 'https://placehold.co/600x600/f6f8fc/8796ac?text=No+Image';
  return u;
}
function visibleProducts() {
  const q = state.search.trim().toLowerCase();
  return state.products.filter(p => {
    const companyName = currentCompanyName(p.company_id).toLowerCase();
    const name = String(p.product_name || '').toLowerCase();
    const id = String(p.product_id || '').toLowerCase();
    const matchesSearch = !q || name.includes(q) || companyName.includes(q) || id.includes(q);
    const matchesCompany = state.activeCompany === 'all' || toStr(p.company_id) === state.activeCompany;
    return matchesSearch && matchesCompany;
  });
}
function cartKey(item) {
  return `${item.kind}:${toStr(item.product_id)}:${toStr(item.unit || '')}`;
}
function addToCart(item) {
  const key = cartKey(item);
  const index = state.cart.findIndex(x => cartKey(x) === key);
  if (index >= 0) {
    state.cart[index].qty = clampInt(state.cart[index].qty + (item.qty || 1), 1);
  } else {
    state.cart.push({
      id: uid('cart'),
      kind: item.kind,
      product_id: toStr(item.product_id),
      title: item.title,
      company_name: item.company_name || '',
      unit: item.unit || '',
      qty: clampInt(item.qty || 1, 1),
      price: Number(item.price || 0),
      image: item.image || '',
    });
  }
  saveCart();
  renderCart();
  setView('cart');
}
function updateCartQty(itemId, delta) {
  const item = state.cart.find(x => x.id === itemId);
  if (!item) return;
  item.qty = clampInt(Number(item.qty || 1) + delta, 1);
  saveCart();
  renderCart();
}
function removeCartItem(itemId) {
  state.cart = state.cart.filter(x => x.id !== itemId);
  saveCart();
  renderCart();
}
function clearCart() {
  state.cart = [];
  saveCart();
  renderCart();
}
function cartTotals() {
  const totals = { products_total: 0, deals_total: 0, flash_total: 0, total_amount: 0 };
  for (const item of state.cart) {
    const subtotal = Number(item.price || 0) * Number(item.qty || 0);
    if (item.kind === 'daily_deal') totals.deals_total += subtotal;
    else if (item.kind === 'flash_offer') totals.flash_total += subtotal;
    else totals.products_total += subtotal;
    totals.total_amount += subtotal;
  }
  return totals;
}
function orderNumber() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${stamp}-${rand}`;
}
function determineCustomerId() {
  if (state.user?.role === 'customer') return toStr(state.customer?.customer_id || '');
  if (state.user?.role === 'rep') return toStr(state.selectedRepCustomerId || '');
  return '';
}
function determineUserType() {
  return state.user?.role || 'guest';
}
function renderCompanies() {
  const wrap = $('companiesWrap');
  const items = [{ company_id: 'all', company_name: 'الكل' }, ...state.companies];
  wrap.innerHTML = items.map(c => `
    <button class="chip ${state.activeCompany === toStr(c.company_id) ? 'active' : ''}" data-company="${escapeHtml(toStr(c.company_id))}">
      ${escapeHtml(c.company_name || '—')}
    </button>
  `).join('');
  wrap.querySelectorAll('button[data-company]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeCompany = btn.dataset.company;
      renderCompanies();
      renderProducts();
    });
  });
}
function renderProducts() {
  const grid = $('productsGrid');
  const products = visibleProducts();
  grid.innerHTML = products.map(product => {
    const carton = pickPriceForProduct(product, 'carton');
    const pack = pickPriceForProduct(product, 'pack');
    const piece = pickPriceForProduct(product, 'piece');
    const units = [];
    if (Number.isFinite(Number(carton)) && carton !== undefined) units.push({ unit: 'carton', label: 'كرتونة', price: carton });
    if (Number.isFinite(Number(pack)) && pack !== undefined) units.push({ unit: 'pack', label: 'دستة', price: pack });
    if (Number.isFinite(Number(piece)) && piece !== undefined) units.push({ unit: 'piece', label: 'قطعة', price: piece });
    return `
      <article class="card">
        <div class="card-img">
          <img src="${escapeHtml(productImageSrc(product.product_image))}" alt="${escapeHtml(product.product_name || '')}" loading="lazy">
        </div>
        <div class="card-body">
          <h4 class="card-title">${escapeHtml(product.product_name || '')}</h4>
          <div class="card-meta">${escapeHtml(currentCompanyName(product.company_id))}</div>
          <div class="price-row">
            ${units.map(u => `<span class="price-pill">${escapeHtml(u.label)}: ${escapeHtml(money(u.price))}</span>`).join('')}
          </div>
          <div class="card-actions">
            <div class="unit-btns">
              ${units.map((u, idx) => `
                <button class="small-btn ${idx === 0 ? 'active' : ''}" data-unit-btn="${escapeHtml(toStr(product.product_id))}" data-unit="${escapeHtml(u.unit)}">
                  ${escapeHtml(u.label)}
                </button>
              `).join('')}
            </div>
            <button class="primary-btn" data-add-product="${escapeHtml(toStr(product.product_id))}">إضافة للسلة</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('[data-unit-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pid = btn.dataset.unitBtn;
      const unit = btn.dataset.unit;
      const card = btn.closest('.card');
      card.querySelectorAll('[data-unit-btn]').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      btn.dataset.selected = unit;
    });
  });

  grid.querySelectorAll('[data-add-product]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pid = btn.dataset.addProduct;
      const card = btn.closest('.card');
      const activeUnitBtn = card.querySelector('[data-unit-btn].active');
      const unit = activeUnitBtn?.dataset.unit || 'carton';
      const product = state.products.find(p => toStr(p.product_id) === toStr(pid));
      if (!product) return;
      const price = pickPriceForProduct(product, unit);
      if (!Number.isFinite(Number(price))) {
        setMessage('authMsg', 'لا يوجد سعر متاح لهذا المنتج بالشريحة الحالية.', 'error');
        openAuthModal('login');
        return;
      }
      addToCart({
        kind: 'product',
        product_id: product.product_id,
        title: product.product_name,
        company_name: currentCompanyName(product.company_id),
        unit,
        price,
        image: product.product_image,
      });
    });
  });
}
function renderDeals() {
  const grid = $('dailyDealsGrid');
  grid.innerHTML = state.dailyDeals.map(item => `
    <article class="card">
      <div class="card-img">
        <img src="${escapeHtml(productImageSrc(item.image))}" alt="${escapeHtml(item.title || '')}" loading="lazy">
      </div>
      <div class="card-body">
        <h4 class="card-title">${escapeHtml(item.title || '')}</h4>
        <div class="card-meta">${escapeHtml(item.description || 'صفقة اليوم')}</div>
        <div class="price-row">
          <span class="price-pill deal">${escapeHtml(money(item.price))}</span>
          <span class="price-pill">المتاح: ${escapeHtml(toStr(item.stock || 0))}</span>
        </div>
        <div class="card-actions">
          <button class="primary-btn" data-add-deal="${escapeHtml(toStr(item.id))}" ${item.can_buy ? '' : 'disabled'}>${item.can_buy ? 'إضافة للطلب' : 'غير متاح'}</button>
        </div>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('[data-add-deal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.addDeal;
      const item = state.dailyDeals.find(x => toStr(x.id) === toStr(id));
      if (!item || !item.can_buy) return;
      addToCart({
        kind: 'daily_deal',
        product_id: toStr(item.id),
        title: item.title,
        company_name: 'صفقة اليوم',
        unit: '',
        price: item.price,
        image: item.image,
      });
    });
  });
}
function renderFlashOffers() {
  const grid = $('flashOffersGrid');
  grid.innerHTML = state.flashOffers.map(item => `
    <article class="card">
      <div class="card-img">
        <img src="${escapeHtml(productImageSrc(item.image))}" alt="${escapeHtml(item.title || '')}" loading="lazy">
      </div>
      <div class="card-body">
        <h4 class="card-title">${escapeHtml(item.title || '')}</h4>
        <div class="card-meta">${escapeHtml(item.description || 'عرض سريع')}</div>
        <div class="price-row">
          <span class="price-pill flash">${escapeHtml(money(item.price))}</span>
          <span class="price-pill">${escapeHtml(item.status || '')}</span>
        </div>
        <div class="card-actions">
          <button class="primary-btn" data-add-flash="${escapeHtml(toStr(item.id))}" ${item.can_buy ? '' : 'disabled'}>${item.can_buy ? 'إضافة للطلب' : 'غير متاح'}</button>
        </div>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('[data-add-flash]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.addFlash;
      const item = state.flashOffers.find(x => toStr(x.id) === toStr(id));
      if (!item || !item.can_buy) return;
      addToCart({
        kind: 'flash_offer',
        product_id: toStr(item.id),
        title: item.title,
        company_name: 'عرض سريع',
        unit: '',
        price: item.price,
        image: item.image,
      });
    });
  });
}
function renderCart() {
  const list = $('cartList');
  const totals = cartTotals();
  $('sumProducts').textContent = money(totals.products_total);
  $('sumDeals').textContent = money(totals.deals_total);
  $('sumFlash').textContent = money(totals.flash_total);
  $('sumTotal').textContent = money(totals.total_amount);

  if (!state.cart.length) {
    list.innerHTML = `<div class="message-box muted">السلة فارغة الآن.</div>`;
  } else {
    list.innerHTML = state.cart.map(item => `
      <div class="line-item">
        <div class="line-top">
          <div>
            <div class="line-title">${escapeHtml(item.title || '')}</div>
            <div class="line-sub">
              ${escapeHtml(item.kind === 'product' ? 'منتج' : item.kind === 'daily_deal' ? 'صفقة اليوم' : 'عرض سريع')}
              ${item.unit ? ` • ${escapeHtml(item.unit)}` : ''}
              ${item.company_name ? ` • ${escapeHtml(item.company_name)}` : ''}
            </div>
          </div>
          <strong>${escapeHtml(money(Number(item.price || 0) * Number(item.qty || 0)))}</strong>
        </div>
        <div class="line-actions">
          <button class="qty-btn" data-qty-minus="${escapeHtml(item.id)}">-</button>
          <div class="qty-pill">${escapeHtml(toStr(item.qty))}</div>
          <button class="qty-btn" data-qty-plus="${escapeHtml(item.id)}">+</button>
          <button class="ghost-btn" data-remove-item="${escapeHtml(item.id)}">حذف</button>
        </div>
      </div>
    `).join('');
  }

  list.querySelectorAll('[data-qty-minus]').forEach(btn => btn.addEventListener('click', () => updateCartQty(btn.dataset.qtyMinus, -1)));
  list.querySelectorAll('[data-qty-plus]').forEach(btn => btn.addEventListener('click', () => updateCartQty(btn.dataset.qtyPlus, 1)));
  list.querySelectorAll('[data-remove-item]').forEach(btn => btn.addEventListener('click', () => removeCartItem(btn.dataset.removeItem)));

  const isRep = state.user?.role === 'rep';
  $('repCustomerBox').classList.toggle('hidden', !isRep);
  if (isRep) {
    const select = $('repCustomerSelect');
    select.innerHTML = state.myCustomers.map(c => `
      <option value="${escapeHtml(toStr(c.customer_id))}" ${toStr(c.customer_id) === toStr(state.selectedRepCustomerId) ? 'selected' : ''}>
        ${escapeHtml(c.customer_name || c.trader_name || c.phone || c.customer_id)}
      </option>
    `).join('');
    if (!state.selectedRepCustomerId && state.myCustomers.length) {
      state.selectedRepCustomerId = toStr(state.myCustomers[0].customer_id);
      select.value = state.selectedRepCustomerId;
    }
    select.onchange = () => {
      state.selectedRepCustomerId = select.value;
    };
  }

  const canCheckout = !!state.user && (state.user.role === 'customer' || state.user.role === 'rep');
  $('btnCheckout').disabled = !canCheckout || !state.cart.length || (state.user?.role === 'rep' && !state.selectedRepCustomerId);
  $('checkoutNote').textContent = canCheckout
    ? (state.user.role === 'rep'
      ? 'الطلب سيُسجل باسم العميل المختار ثم يفتح واتساب.'
      : 'الطلب سيُسجل باسم العميل الحالي ثم يفتح واتساب.')
    : 'الطلب يحتاج تسجيل دخول أولًا.';
}
async function renderOrders() {
  const wrap = $('ordersList');
  if (!state.user) {
    wrap.innerHTML = `<div class="message-box muted">سجل الدخول لعرض الطلبات.</div>`;
    return;
  }
  const orders = await loadOrders();
  if (!orders.length) {
    wrap.innerHTML = `<div class="message-box muted">لا توجد طلبات بعد.</div>`;
    return;
  }
  wrap.innerHTML = orders.map(order => `
    <div class="order-item">
      <div class="order-top">
        <div>
          <div class="order-title">${escapeHtml(order.order_number || '')}</div>
          <div class="order-sub">
            الحالة: ${escapeHtml(order.status || '')} •
            الإجمالي: ${escapeHtml(money(order.total_amount))} •
            ${escapeHtml(new Date(order.created_at).toLocaleString('ar-EG'))}
          </div>
        </div>
        <strong>${escapeHtml(money(order.total_amount))}</strong>
      </div>
      <div class="line-actions">
        <button class="ghost-btn" data-open-order="${escapeHtml(toStr(order.id))}">عرض الأصناف</button>
      </div>
      <div id="orderItems-${escapeHtml(toStr(order.id))}" class="stack-list" style="margin-top:10px; display:none;"></div>
    </div>
  `).join('');

  wrap.querySelectorAll('[data-open-order]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const orderId = btn.dataset.openOrder;
      const host = document.getElementById(`orderItems-${CSS.escape(orderId)}`);
      if (!host) return;
      if (host.style.display === 'none') {
        host.style.display = 'grid';
        host.innerHTML = `<div class="message-box muted">جار التحميل...</div>`;
        const items = await loadOrderItems(orderId);
        host.innerHTML = items.map(item => `
          <div class="line-item">
            <div class="line-top">
              <div>
                <div class="line-title">${escapeHtml(item.type || 'product')} • ${escapeHtml(item.product_id || '')}</div>
                <div class="line-sub">الكمية: ${escapeHtml(toStr(item.qty))} • الوحدة: ${escapeHtml(item.unit || '-')}</div>
              </div>
              <strong>${escapeHtml(money(Number(item.price || 0) * Number(item.qty || 0)))}</strong>
            </div>
          </div>
        `).join('') || '<div class="message-box muted">لا توجد أصناف.</div>';
      } else {
        host.style.display = 'none';
      }
    });
  });
}
async function renderCustomers() {
  const wrap = $('customersList');
  if (!state.user) {
    wrap.innerHTML = `<div class="message-box muted">سجل الدخول لعرض العملاء.</div>`;
    return;
  }
  if (state.user.role !== 'rep') {
    wrap.innerHTML = `<div class="message-box muted">هذه الشاشة مخصصة للمندوبين.</div>`;
    return;
  }
  const customers = await loadMyCustomers();
  if (!customers.length) {
    wrap.innerHTML = `<div class="message-box muted">لا يوجد عملاء مرتبطون بهذا المندوب.</div>`;
    return;
  }
  wrap.innerHTML = customers.map(c => `
    <div class="customer-item">
      <div class="customer-top">
        <div>
          <div class="customer-title">${escapeHtml(c.customer_name || c.trader_name || '')}</div>
          <div class="customer-sub">هاتف: ${escapeHtml(c.phone || '')} • العنوان: ${escapeHtml(c.address || '-')} • الحالة: ${escapeHtml(c.status || '-')}</div>
        </div>
        <strong>#${escapeHtml(toStr(c.customer_id))}</strong>
      </div>
    </div>
  `).join('');
}
async function fetchMaybeSingle(query) {
  const res = await query;
  if (res.error) throw res.error;
  return res.data;
}
async function loadSettings() {
  const { data, error } = await db
    .from('app_settings')
    .select('company_name, company_logo, company_banner, whatsapp_number, phone, address, google_map, updated_at')
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn(error);
    state.settings = null;
    return;
  }
  state.settings = data || null;
  if (state.settings?.company_name) $('companyName').textContent = state.settings.company_name;
  $('companyMeta').textContent = state.settings?.address || 'متجر جملة لمستحضرات التجميل';
}
async function loadCompanies() {
  const { data, error } = await db
    .from('companies')
    .select('company_id, company_name, company_logo, visible, allow_discount')
    .order('company_name', { ascending: true });
  if (error) throw error;
  state.companies = (data || []).filter(c => c.visible !== false);
}
async function loadProducts() {
  const { data, error } = await db
    .from('v_products')
    .select('product_id, product_name, product_image, company_id, has_carton, has_pack, carton_price, pack_price, allow_discount')
    .order('product_name', { ascending: true });
  if (error) throw error;
  state.products = data || [];
}
async function loadPriceTables() {
  const tier = String(state.selectedTier || 'base').trim().toLowerCase();
  const tiers = tier === 'base' ? ['base'] : ['base', tier];
  const [carton, pack, piece] = await Promise.all([
    db.from('prices_carton').select('product_id, tier_name, price, visible').in('tier_name', tiers).eq('visible', true),
    db.from('prices_pack').select('product_id, tier_name, price, visible').in('tier_name', tiers).eq('visible', true),
    db.from('prices_piece').select('product_id, tier_name, price, visible').in('tier_name', tiers).eq('visible', true),
  ]);
  if (carton.error) console.warn(carton.error);
  if (pack.error) console.warn(pack.error);
  if (piece.error) console.warn(piece.error);
  buildPriceMaps({
    carton: carton.data || [],
    pack: pack.data || [],
    piece: piece.data || [],
  });
}
async function loadDailyDeals() {
  const { data, error } = await db.from('v_daily_deals').select('*').order('id', { ascending: false });
  if (error) throw error;
  state.dailyDeals = data || [];
}
async function loadFlashOffers() {
  const { data, error } = await db.from('v_flash_offers').select('*').order('start_time', { ascending: false });
  if (error) throw error;
  state.flashOffers = data || [];
}
async function loginUser(code, password) {
  const { data, error } = await db.rpc('login_user', {
    p_code: String(code || '').trim(),
    p_password: String(password || '')
  });
  if (error) throw error;
  return data;
}
async function registerCustomer(name, phone, password, address) {
  const payload = {
    p_name: String(name || '').trim(),
    p_phone: normalizePhone(phone),
    p_password: String(password || ''),
    p_address: String(address || '').trim()
  };
  try {
    const { data, error } = await db.rpc('register_customer', payload);
    if (error) throw error;
    return data;
  } catch (rpcError) {
    console.warn('register_customer RPC failed, trying direct inserts:', rpcError);
    const { data: customer, error: customerError } = await db
      .from('customers')
      .insert({
        customer_name: payload.p_name,
        trader_name: payload.p_name,
        business_name: payload.p_name,
        phone: payload.p_phone,
        address: payload.p_address,
        created_by: '7777',
        tier_name: 'base',
        visible: true,
        status: 'unassigned'
      })
      .select('customer_id')
      .single();
    if (customerError) throw customerError;

    const { error: userError } = await db
      .from('users')
      .insert({
        code: payload.p_phone,
        name: payload.p_name,
        role: 'customer',
        password_hash: hashPassword(payload.p_password)
      });
    if (userError) throw userError;

    return { status: 'success', customer_id: customer.customer_id };
  }
}
async function loadCurrentCustomerProfile(user) {
  state.customer = null;
  state.customerByPhone = null;
  state.rep = null;
  state.selectedTier = 'base';

  if (!user) {
    refreshSessionChip();
    return;
  }

  if (user.role === 'customer') {
    const { data, error } = await db.from('customers').select('*').eq('phone', user.code).maybeSingle();
    if (!error && data) {
      state.customer = data;
      state.customerByPhone = data;
      state.selectedTier = String(data.tier_name || 'base').trim().toLowerCase() || 'base';
      state.selectedRepCustomerId = toStr(data.customer_id);
    }
  }

  if (user.role === 'rep') {
    const { data, error } = await db.from('sales_reps').select('rep_id, rep_name, phone, region').eq('rep_id', user.rep_id).maybeSingle();
    if (!error && data) state.rep = data;
    state.selectedTier = 'base';
  }

  refreshSessionChip();
}
async function loadMyCustomers() {
  if (!state.user || state.user.role !== 'rep' || !state.user.rep_id) {
    state.myCustomers = [];
    updateStats();
    return [];
  }
  let rows = [];
  try {
    const { data, error } = await db.from('v_my_customers').select('*');
    if (!error && Array.isArray(data) && data.length) {
      rows = data;
    }
  } catch (e) {
    console.warn(e);
  }
  if (!rows.length) {
    const { data, error } = await db.from('customers').select('customer_id, customer_name, phone, address, tier_name, created_by, visible, created_at, trader_name, business_name, shop_image, status').eq('created_by', state.user.rep_id).order('created_at', { ascending: false });
    if (error) throw error;
    rows = data || [];
  }
  state.myCustomers = rows;
  if (!state.selectedRepCustomerId && rows.length) state.selectedRepCustomerId = toStr(rows[0].customer_id);
  updateStats();
  return rows;
}
async function loadOrders() {
  const user = state.user;
  if (!user) return [];
  let query = db.from('orders').select('id, order_number, user_type, user_id, customer_id, total_amount, products_total, deals_total, flash_total, status, created_at, updated_at').order('created_at', { ascending: false }).limit(40);
  if (user.role === 'customer' && state.customer?.customer_id) {
    query = query.eq('customer_id', state.customer.customer_id);
  } else if (user.role === 'rep') {
    const customers = state.myCustomers.length ? state.myCustomers : await loadMyCustomers();
    const ids = customers.map(c => toStr(c.customer_id)).filter(Boolean);
    if (!ids.length) return [];
    query = query.in('customer_id', ids);
  } else {
    query = query.eq('user_id', user.id);
  }
  const { data, error } = await query;
  if (error) throw error;
  state.orders = data || [];
  return state.orders;
}
async function loadOrderItems(orderId) {
  const { data, error } = await db.from('order_items').select('id, order_id, product_id, type, qty, price, unit, created_at').eq('order_id', orderId).order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}
function buildWhatsappMessage(order, items, customer) {
  const lines = [];
  lines.push(`طلب جديد رقم: ${order.order_number}`);
  lines.push(`العميل: ${customer?.customer_name || customer?.trader_name || customer?.phone || 'غير محدد'}`);
  if (customer?.phone) lines.push(`الهاتف: ${customer.phone}`);
  if (customer?.address) lines.push(`العنوان: ${customer.address}`);
  lines.push('');
  lines.push('تفاصيل الأصناف:');
  for (const item of items) {
    const title = item.type === 'product' ? (state.products.find(p => toStr(p.product_id) === toStr(item.product_id))?.product_name || item.product_id) : item.type;
    const unit = item.unit ? ` / ${item.unit}` : '';
    lines.push(`- ${title}${unit} × ${item.qty} = ${Number(item.price || 0) * Number(item.qty || 0)}`);
  }
  lines.push('');
  lines.push(`إجمالي المنتجات: ${Number(order.products_total || 0)}`);
  lines.push(`إجمالي الصفقات: ${Number(order.deals_total || 0)}`);
  lines.push(`إجمالي العروض السريعة: ${Number(order.flash_total || 0)}`);
  lines.push(`الإجمالي النهائي: ${Number(order.total_amount || 0)}`);
  return lines.join('\n');
}
async function createOrder() {
  if (!state.user || !state.cart.length) return;
  const totals = cartTotals();
  const customerId = determineCustomerId();
  if (state.user.role === 'customer' && !customerId) {
    setMessage('authMsg', 'تعذر تحديد العميل المرتبط بالحساب الحالي.', 'error');
    return;
  }
  if (state.user.role === 'rep' && !customerId) {
    setMessage('authMsg', 'اختر عميلًا قبل تنفيذ الطلب.', 'error');
    return;
  }

  const order = {
    order_number: orderNumber(),
    user_type: determineUserType(),
    user_id: toStr(state.user.id),
    customer_id: customerId,
    total_amount: totals.total_amount,
    products_total: totals.products_total,
    deals_total: totals.deals_total,
    flash_total: totals.flash_total,
    status: 'submitted',
  };

  const items = state.cart.map(item => ({
    product_id: toStr(item.product_id),
    type: item.kind === 'daily_deal' ? 'daily_deal' : item.kind === 'flash_offer' ? 'flash_offer' : 'product',
    qty: clampInt(item.qty, 1),
    price: Number(item.price || 0),
    unit: item.unit || null,
  }));

  let created = null;
  try {
    const { data, error } = await db.rpc('create_order_with_items', {
      p_order: order,
      p_items: items
    });
    if (error) throw error;
    created = data;
  } catch (rpcError) {
    console.warn('create_order_with_items RPC failed, using direct inserts:', rpcError);
    const { data: insertedOrder, error: orderError } = await db
      .from('orders')
      .insert(order)
      .select('id, order_number, user_type, user_id, customer_id, total_amount, products_total, deals_total, flash_total, status, created_at')
      .single();
    if (orderError) throw orderError;
    created = { order: insertedOrder };

    const orderId = insertedOrder.id;
    if (items.length) {
      const insertItems = items.map(item => ({
        order_id: orderId,
        product_id: item.product_id,
        type: item.type,
        qty: item.qty,
        price: item.price,
        unit: item.unit,
      }));
      const { error: itemsError } = await db.from('order_items').insert(insertItems);
      if (itemsError) throw itemsError;
    }
  }

  const orderRow = created?.order || created;
  const customer = state.user.role === 'customer'
    ? state.customer
    : state.myCustomers.find(c => toStr(c.customer_id) === toStr(customerId));
  const whatsappNumber = String(state.settings?.whatsapp_number || '').trim();
  const message = buildWhatsappMessage(orderRow, items, customer);

  clearCart();
  await renderOrders();

  if (whatsappNumber) {
    const url = `https://wa.me/${encodeURIComponent(whatsappNumber)}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    setMessage('checkoutNote', 'تم إنشاء الطلب، لكن رقم واتساب غير موجود في app_settings.', 'error');
  }
}
async function bootstrap() {
  els.btnAuthToggle = $('btnAuthToggle');
  els.btnRefresh = $('btnRefresh');

  document.querySelectorAll('.quick-actions .tab-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });
  document.querySelectorAll('.auth-tabs .tab-btn[data-auth]').forEach(btn => {
    btn.addEventListener('click', () => switchAuth(btn.dataset.auth));
  });

  $('btnAuthToggle').addEventListener('click', () => openAuthModal(state.user ? 'login' : 'login'));
  $('btnCloseAuth').addEventListener('click', closeAuthModal);
  $('authModal').addEventListener('click', e => { if (e.target.id === 'authModal') closeAuthModal(); });
  $('btnLogin').addEventListener('click', onLogin);
  $('btnRegister').addEventListener('click', onRegister);
  $('btnRefresh').addEventListener('click', refreshAll);
  $('btnClearSearch').addEventListener('click', () => {
    $('searchInput').value = '';
    state.search = '';
    renderProducts();
  });
  $('searchInput').addEventListener('input', e => {
    state.search = e.target.value || '';
    renderProducts();
  });
  $('btnClearCart').addEventListener('click', clearCart);
  $('btnCheckout').addEventListener('click', createOrder);
  $('btnReloadOrders').addEventListener('click', renderOrders);
  $('btnReloadCustomers').addEventListener('click', renderCustomers);

  await refreshAll();
  setView('home');
}
async function refreshAll() {
  try {
    await loadSettings();
    await Promise.all([
      loadCompanies(),
      loadProducts(),
      loadPriceTables(),
      loadDailyDeals(),
      loadFlashOffers(),
    ]);
    await loadCurrentCustomerProfile(state.user);
    if (state.user?.role === 'rep') {
      await loadMyCustomers();
    } else {
      state.myCustomers = [];
    }
    updateStats();
    renderCompanies();
    renderProducts();
    renderDeals();
    renderFlashOffers();
    renderCart();
    await renderOrders();
    await renderCustomers();
    refreshSessionChip();
  } catch (err) {
    console.error(err);
    setMessage('authMsg', `خطأ في التحميل: ${err.message || err}`, 'error');
  }
}
async function onLogin() {
  clearMessage('authMsg');
  try {
    const code = $('loginCode').value;
    const password = $('loginPassword').value;
    const user = await loginUser(code, password);
    state.user = {
      id: toStr(user.id),
      name: user.name,
      role: user.role,
      rep_id: user.rep_id ? toStr(user.rep_id) : ''
    };
    localStorage.setItem('b2b_user', JSON.stringify(state.user));
    await loadCurrentCustomerProfile(state.user);
    if (state.user.role === 'rep') {
      await loadMyCustomers();
    }
    refreshSessionChip();
    renderCart();
    await renderOrders();
    await renderCustomers();
    closeAuthModal();
    setMessage('checkoutNote', 'تم تسجيل الدخول بنجاح.', 'success');
  } catch (err) {
    setMessage('authMsg', err.message || 'فشل تسجيل الدخول', 'error');
  }
}
async function onRegister() {
  clearMessage('authMsg');
  try {
    const name = $('regName').value;
    const phone = $('regPhone').value;
    const password = $('regPassword').value;
    const address = $('regAddress').value;
    const result = await registerCustomer(name, phone, password, address);
    setMessage('authMsg', `تم إنشاء الحساب بنجاح. رقم العميل: ${toStr(result.customer_id || '')}`, 'success');
  } catch (err) {
    setMessage('authMsg', err.message || 'فشل إنشاء الحساب', 'error');
  }
}

function restoreSession() {
  try {
    const saved = localStorage.getItem('b2b_user');
    if (saved) state.user = JSON.parse(saved);
  } catch {}
}

restoreSession();
bootstrap();
