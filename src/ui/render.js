import { dom } from '../core/dom.js';
import { ROLES } from '../contracts/runtime.js';
import { formatMoney, labelForUnit } from '../services/pricingService.js';
import { selectCartSummary, selectCatalog, selectRole, selectVisibleTier, selectAuthorizedCustomers } from '../state/selectors.js';

const fmtDate = new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });

function safeDate(value) {
  try {
    return fmtDate.format(new Date(value || Date.now()));
  } catch {
    return '';
  }
}

function navItems(role) {
  const base = [
    { route: 'home', label: 'الرئيسية', icon: '⌂' },
    { route: 'offers', label: 'العروض', icon: '✦' },
    { route: 'cart', label: 'السلة', icon: '🛒' }
  ];
  if (role === ROLES.GUEST) return [...base, { route: 'login', label: 'الدخول', icon: '⇢' }];
  if (role === ROLES.CUSTOMER) return [...base, { route: 'orders', label: 'طلباتي', icon: '▤' }, { route: 'account', label: 'الحساب', icon: '◔' }];
  if (role === ROLES.SALES_REP) return [...base, { route: 'customers', label: 'العملاء', icon: '◫' }, { route: 'orders', label: 'الطلبات', icon: '▤' }, { route: 'analytics', label: 'التحليلات', icon: '⟡' }];
  return [...base, { route: 'customers', label: 'العملاء', icon: '◫' }, { route: 'reps', label: 'المناديب', icon: '⚇' }, { route: 'orders', label: 'الطلبات', icon: '▤' }, { route: 'analytics', label: 'التحليلات', icon: '⟡' }, { route: 'settings', label: 'الإعدادات', icon: '⚙' }];
}

function badge(text, className = '') {
  return `<span class="badge ${className}">${dom.escape(text)}</span>`;
}

function companyChip(company, active = false) {
  const style = company.color ? `style="--chip-accent:${company.color}"` : '';
  return `<button class="company-chip ${active ? 'is-active' : ''}" ${style} type="button" data-action="select-company" data-company-id="${dom.escape(company.company_id)}"><span>${dom.escape((company.company_name || 'X').slice(0, 1))}</span><strong>${dom.escape(company.company_name)}</strong></button>`;
}

function tierChip(tier, active = false) {
  return `<button class="tier-chip ${active ? 'is-active' : ''}" type="button" data-action="select-tier" data-tier-name="${dom.escape(tier.tier_name)}">${dom.escape(tier.display_name || tier.tier_name)}</button>`;
}

function productCard(product, state) {
  const selectedUnit = product.units?.[0];
  const inCart = state.cart.items.some((item) => item.kind === 'product' && item.product_id === product.product_id);
  const available = selectedUnit ? Math.max(0, selectedUnit.available_qty - selectedUnit.reserved_qty) : 0;
  const unitCode = selectedUnit?.unit_code || 'carton';
  const price = selectedUnit?.final_price || 0;
  const qtyKey = `${product.product_id}:${unitCode}:${selectedUnit?.tier_name || 'base'}`;
  const cartItem = state.cart.items.find((item) => item.key === qtyKey || (item.kind === 'product' && item.product_id === product.product_id));
  const currentQty = cartItem?.quantity || 1;

  return `
    <article class="product-card" data-product-id="${dom.escape(product.product_id)}">
      <button type="button" class="product-card__hero" data-action="open-product" data-product-id="${dom.escape(product.product_id)}">
        <div class="product-card__thumb" style="--company-accent:${dom.escape(product.color || '#999')}">
          <span>${dom.escape((product.company_name || 'P').slice(0, 1))}</span>
        </div>
        <div class="product-card__head">
          <strong>${dom.escape(product.product_name)}</strong>
          <span>${dom.escape(product.company_name || '')}</span>
        </div>
      </button>
      <div class="product-card__meta">
        ${badge(labelForUnit(unitCode))}
        ${badge(`المتاح ${available}` , available > 0 ? 'badge--success' : 'badge--danger')}
        ${badge(dom.escape(product.tier_name))}
      </div>
      <div class="product-card__price">
        <strong>${formatMoney(price)} ج.م</strong>
        <span>${dom.escape(product.product_id)}</span>
      </div>
      <div class="qty-control" aria-label="quantity">
        <button type="button" data-action="set-cart-qty" data-product-key="${dom.escape(qtyKey)}" data-delta="-1">−</button>
        <input data-role="cart-qty" data-product-key="${dom.escape(qtyKey)}" value="${currentQty}" inputmode="numeric" pattern="[0-9]*" />
        <button type="button" data-action="set-cart-qty" data-product-key="${dom.escape(qtyKey)}" data-delta="1">+</button>
      </div>
      <div class="card-actions">
        <button type="button" class="btn btn--primary" data-action="add-product" data-product-id="${dom.escape(product.product_id)}" data-unit-code="${dom.escape(unitCode)}" data-tier-name="${dom.escape(selectedUnit?.tier_name || product.tier_name)}">إضافة للسلة</button>
        <button type="button" class="btn btn--ghost" data-action="open-product" data-product-id="${dom.escape(product.product_id)}">تفاصيل</button>
      </div>
    </article>
  `;
}

function offerCard(offer, kind) {
  const canBuy = kind === 'daily' ? offer.can_buy !== false : offer.can_buy !== false;
  return `
    <article class="offer-card offer-card--${dom.escape(kind)}">
      <div class="offer-card__body">
        <div class="offer-card__meta">${badge(kind === 'daily' ? 'يومي' : 'فلاش', kind === 'daily' ? 'badge--info' : 'badge--warning')} ${badge(canBuy ? 'متاح' : 'مغلق', canBuy ? 'badge--success' : 'badge--danger')}</div>
        <h3>${dom.escape(offer.title)}</h3>
        <p>${dom.escape(offer.description || '')}</p>
        <div class="offer-card__foot">
          <strong>${formatMoney(offer.price)} ج.م</strong>
          <button type="button" class="btn btn--primary" data-action="add-offer" data-offer-kind="${dom.escape(kind)}" data-offer-id="${dom.escape(offer.id)}" ${canBuy ? '' : 'disabled'}>إضافة</button>
        </div>
      </div>
    </article>
  `;
}

function orderCard(order, state) {
  const customer = state.data.customers.find((c) => c.id === order.customer_id);
  return `
    <article class="order-card">
      <div class="order-card__top">
        <div>
          <strong>#${dom.escape(order.order_number)}</strong>
          <span>${dom.escape(customer?.name || 'عميل غير معروف')}</span>
        </div>
        ${badge(order.status, order.status === 'cancelled' ? 'badge--danger' : 'badge--info')}
      </div>
      <div class="order-card__items">
        ${(order.items || []).slice(0, 2).map((item) => `<div class="order-line">${dom.escape(item.product_name_snapshot)} × ${item.quantity} — ${formatMoney(item.line_total)} ج.م</div>`).join('')}
      </div>
      <div class="order-card__foot">
        <strong>${formatMoney(order.grand_total)} ج.م</strong>
        <span>${safeDate(order.created_at)}</span>
      </div>
      <div class="card-actions">
        <button type="button" class="btn btn--ghost" data-action="open-order" data-order-id="${dom.escape(order.id)}">فتح</button>
        <button type="button" class="btn btn--primary" data-action="send-whatsapp" data-order-id="${dom.escape(order.id)}">واتساب</button>
      </div>
    </article>
  `;
}

function customerCard(customer, selected = false) {
  return `
    <article class="customer-card ${selected ? 'is-selected' : ''}">
      <div class="customer-card__top">
        <div>
          <strong>${dom.escape(customer.name)}</strong>
          <span>${dom.escape(customer.phone || 'بدون هاتف')}</span>
        </div>
        ${selected ? badge('مختار', 'badge--success') : ''}
      </div>
      <div class="customer-card__meta">${dom.escape(customer.location || customer.address || '')}</div>
      <div class="card-actions">
        <button type="button" class="btn btn--ghost" data-action="select-customer" data-customer-id="${dom.escape(customer.id)}">${selected ? 'محدد' : 'اختيار'}</button>
      </div>
    </article>
  `;
}

function repCard(rep) {
  return `
    <article class="rep-card">
      <div class="rep-card__top">
        <div>
          <strong>${dom.escape(rep.name)}</strong>
          <span>${dom.escape(rep.username || rep.phone || '')}</span>
        </div>
        ${badge(rep.is_blocked ? 'موقوف' : 'نشط', rep.is_blocked ? 'badge--danger' : 'badge--success')}
      </div>
      <div class="rep-card__meta">${dom.escape(rep.login_code || '')}</div>
    </article>
  `;
}

function summaryCard(label, value) {
  return `
    <article class="summary-card">
      <span>${dom.escape(label)}</span>
      <strong>${dom.escape(String(value))}</strong>
    </article>
  `;
}

function renderHome(state) {
  const catalog = selectCatalog(state);
  const visibleTier = selectVisibleTier(state);
  const products = catalog.products.slice(0, state.ui.visibleCount);
  const total = catalog.products.length;
  return `
    <section class="hero">
      <div class="hero__copy">
        <div class="hero__eyebrow">${badge('Mobile-first', 'badge--info')} ${badge('Render-only runtime', 'badge--success')}</div>
        <h1>${dom.escape(state.data.settings.hero_title || 'B2B Commerce')}</h1>
        <p>${dom.escape(state.data.settings.hero_subtitle || 'Authoritative commerce runtime.')}</p>
        <div class="hero__stats">
          ${summaryCard('المنتجات', catalog.counts.products)}
          ${summaryCard('الشركات', catalog.counts.companies)}
          ${summaryCard('الطلبات', catalog.counts.orders)}
          ${summaryCard('الشرائح', state.data.tiers.length)}
        </div>
      </div>
      <div class="hero__panel">
        <div class="hero__panel-row">
          <strong>الشريحة الحالية</strong>
          <span>${dom.escape(visibleTier?.display_name || visibleTier?.tier_name || '')}</span>
        </div>
        <div class="hero__panel-row">
          <strong>الوضع</strong>
          <span>${dom.escape(state.auth.role)}</span>
        </div>
        <div class="hero__panel-row">
          <strong>السلة</strong>
          <span>${state.cart.items.length} بند</span>
        </div>
        <button type="button" class="btn btn--primary full" data-action="go" data-route="cart">فتح السلة</button>
      </div>
    </section>

    <section class="section">
      <div class="section__head">
        <div>
          <h2>الشركات</h2>
          <p>مرشح سريع للشركات النشطة.</p>
        </div>
        <button type="button" class="btn btn--ghost" data-action="go" data-route="offers">العروض</button>
      </div>
      <div class="chips chips--companies">
        ${catalog.companies.map((company) => companyChip(company, state.ui.selectedCompany === company.company_id)).join('')}
      </div>
    </section>

    <section class="section">
      <div class="section__head">
        <div>
          <h2>المنتجات</h2>
          <p>${total ? `عرض ${Math.min(products.length, total)} من ${total}` : 'لا توجد نتائج.'}</p>
        </div>
        <button type="button" class="btn btn--ghost" data-action="load-more">تحميل المزيد</button>
      </div>
      <div class="product-grid">
        ${products.map((product) => productCard(product, state)).join('') || `<div class="empty">لا توجد منتجات مطابقة.</div>`}
      </div>
    </section>
  `;
}

function renderOffers(state) {
  return `
    <section class="section">
      <div class="section__head">
        <div><h2>العروض اليومية</h2><p>Entities منفصلة وليست جزءًا من pricing engine.</p></div>
      </div>
      <div class="offer-grid">
        ${(state.data.dailyDeals || []).map((offer) => offerCard(offer, 'daily')).join('')}
      </div>
    </section>
    <section class="section">
      <div class="section__head">
        <div><h2>العروض الفلاش</h2><p>حالة العرض تُدار من runtime view.</p></div>
      </div>
      <div class="offer-grid">
        ${(state.data.flashOffers || []).map((offer) => offerCard(offer, 'flash')).join('')}
      </div>
    </section>
  `;
}

function renderTiers(state) {
  return `
    <section class="section">
      <div class="section__head">
        <div><h2>الشرائح الظاهرة</h2><p>تحميل مباشر من العقد الرسمية.</p></div>
      </div>
      <div class="tier-grid">
        ${(state.data.tiers || []).map((tier) => `
          <article class="tier-card ${state.ui.selectedTier === tier.tier_name ? 'is-active' : ''}">
            <div class="tier-card__top">
              <div>
                <strong>${dom.escape(tier.display_name || tier.tier_name)}</strong>
                <span>Min order ${formatMoney(tier.min_order || 0)} ج.م</span>
              </div>
              ${badge(tier.is_default ? 'افتراضية' : 'إضافية', tier.is_default ? 'badge--success' : 'badge--info')}
            </div>
            <button type="button" class="btn btn--primary" data-action="select-tier" data-tier-name="${dom.escape(tier.tier_name)}">${state.ui.selectedTier === tier.tier_name ? 'محدد' : 'اختيار'}</button>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderCart(state) {
  const summary = selectCartSummary(state);
  const customer = state.data.customers.find((c) => c.id === state.cart.customer_id);
  return `
    <section class="section">
      <div class="section__head">
        <div><h2>السلة</h2><p>حفظ محلي مؤقت مع snapshot للأسعار.</p></div>
        <button type="button" class="btn btn--ghost" data-action="clear-cart">تفريغ</button>
      </div>
      <div class="cart-summary">
        <div class="cart-summary__row"><span>العميل</span><strong>${dom.escape(customer?.name || 'غير محدد')}</strong></div>
        <div class="cart-summary__row"><span>البنود</span><strong>${summary.quantity}</strong></div>
        <div class="cart-summary__row"><span>الإجمالي</span><strong>${formatMoney(summary.grand_total)} ج.م</strong></div>
      </div>
      <div class="cart-list">
        ${(state.cart.items || []).map((item) => `
          <article class="cart-item">
            <div>
              <strong>${dom.escape(item.product_name_snapshot)}</strong>
              <div class="cart-item__meta">${dom.escape(item.unit_code_snapshot)} · ${dom.escape(item.tier_snapshot)}</div>
              <div class="cart-item__meta">${formatMoney(item.unit_price_snapshot)} ج.م</div>
            </div>
            <div class="cart-item__actions">
              <div class="qty-control qty-control--small">
                <button type="button" data-action="set-cart-qty" data-product-key="${dom.escape(item.key)}" data-delta="-1">−</button>
                <input data-role="cart-qty" data-product-key="${dom.escape(item.key)}" value="${item.quantity}" inputmode="numeric" />
                <button type="button" data-action="set-cart-qty" data-product-key="${dom.escape(item.key)}" data-delta="1">+</button>
              </div>
              <button type="button" class="btn btn--ghost" data-action="remove-cart-item" data-product-key="${dom.escape(item.key)}">حذف</button>
            </div>
          </article>
        `).join('') || '<div class="empty">السلة فارغة.</div>'}
      </div>
      <div class="card-actions">
        <button type="button" class="btn btn--primary full" data-action="go" data-route="checkout" ${state.cart.items.length ? '' : 'disabled'}>متابعة للدفع</button>
        <button type="button" class="btn btn--ghost full" data-action="go" data-route="home">متابعة التسوق</button>
      </div>
    </section>
  `;
}

function renderOrders(state) {
  const orders = state.data.orders || [];
  return `
    <section class="section">
      <div class="section__head">
        <div><h2>الطلبات</h2><p>عرض الحالة من سجل أوامر التشغيل.</p></div>
      </div>
      <div class="order-grid">
        ${orders.map((order) => orderCard(order, state)).join('') || '<div class="empty">لا توجد طلبات.</div>'}
      </div>
    </section>
  `;
}

function renderCustomers(state) {
  const customers = selectAuthorizedCustomers(state);
  return `
    <section class="section">
      <div class="section__head">
        <div><h2>العملاء</h2><p>عرض مقيد حسب الدور.</p></div>
      </div>
      <form class="inline-form" data-form="customer-create">
        <input name="name" placeholder="اسم العميل" required />
        <input name="phone" placeholder="الهاتف" />
        <input name="location" placeholder="الموقع" />
        <button class="btn btn--primary" type="submit">إضافة</button>
      </form>
      <div class="customer-grid">
        ${customers.map((customer) => customerCard(customer, state.cart.customer_id === customer.id)).join('') || '<div class="empty">لا يوجد عملاء.</div>'}
      </div>
    </section>
  `;
}

function renderReps(state) {
  const reps = (state.data.authUsers || []).filter((user) => user.user_type === ROLES.SALES_REP);
  return `
    <section class="section">
      <div class="section__head">
        <div><h2>المناديب</h2><p>قائمة تشغيلية لا تعتمد على UI logic.</p></div>
      </div>
      <div class="rep-grid">
        ${reps.map((rep) => repCard(rep)).join('')}
      </div>
    </section>
  `;
}

function renderAnalytics(state, helpers) {
  const summary = helpers.analytics.summary();
  return `
    <section class="section">
      <div class="section__head">
        <div><h2>التحليلات</h2><p>لوحة قراءات مشتقة من سجل التشغيل.</p></div>
      </div>
      <div class="summary-grid">
        ${summaryCard('الإيراد', `${formatMoney(summary.revenue)} ج.م`)}
        ${summaryCard('الطلبات', summary.orders)}
        ${summaryCard('العملاء', summary.customers)}
        ${summaryCard('المنتجات', summary.products)}
        ${summaryCard('submitted', summary.submitted)}
        ${summaryCard('shipped/delivered', summary.shipped)}
      </div>
      <div class="section section--compact">
        <div class="section__head"><div><h3>أداء المناديب</h3></div></div>
        <div class="rep-grid">
          ${helpers.analytics.repPerformance().map((rep) => repCard(rep)).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderAuth(state) {
  const isLogged = state.auth.role !== ROLES.GUEST;
  return `
    <section class="section">
      <div class="section__head">
        <div><h2>${isLogged ? 'الحساب' : 'الدخول'}</h2><p>${isLogged ? 'جلسة محفوظة محليًا.' : 'استخدم username أو phone أو login_code مع كلمة المرور.'}</p></div>
      </div>
      ${isLogged ? `
        <div class="summary-grid">
          ${summaryCard('الدور', state.auth.role)}
          ${summaryCard('المستخدم', state.auth.user?.name || '')}
          ${summaryCard('انتهاء الجلسة', safeDate(state.auth.session?.expires_at))}
        </div>
        <div class="card-actions">
          <button type="button" class="btn btn--primary" data-action="logout">تسجيل الخروج</button>
        </div>
      ` : `
        <form class="auth-form" data-form="login">
          <input name="identity" placeholder="username / phone / login_code" required />
          <input name="password" type="password" placeholder="password" required />
          <button class="btn btn--primary full" type="submit">دخول</button>
        </form>
      `}
    </section>
  `;
}

function renderCheckout(state, helpers) {
  const summary = selectCartSummary(state);
  const customer = state.data.customers.find((c) => c.id === state.cart.customer_id);
  return `
    <section class="section">
      <div class="section__head">
        <div><h2>الدفع</h2><p>إنشاء الطلب من snapshot محفوظ.</p></div>
      </div>
      <div class="checkout-box">
        <div class="checkout-box__row"><span>العميل</span><strong>${dom.escape(customer?.name || 'غير محدد')}</strong></div>
        <div class="checkout-box__row"><span>البنود</span><strong>${summary.quantity}</strong></div>
        <div class="checkout-box__row"><span>الإجمالي</span><strong>${formatMoney(summary.grand_total)} ج.م</strong></div>
        <div class="checkout-box__row"><span>الدفع</span><strong>COD</strong></div>
      </div>
      <div class="card-actions">
        <button type="button" class="btn btn--primary full" data-action="submit-checkout" ${state.cart.items.length ? '' : 'disabled'}>إنشاء الطلب</button>
        <button type="button" class="btn btn--ghost full" data-action="go" data-route="cart">رجوع للسلة</button>
      </div>
    </section>
  `;
}

function renderSettings(state) {
  return `
    <section class="section">
      <div class="section__head">
        <div><h2>الإعدادات</h2><p>Theme + runtime configuration.</p></div>
      </div>
      <div class="summary-grid">
        ${summaryCard('Theme', state.ui.theme)}
        ${summaryCard('WhatsApp', state.app.config.supportWhatsapp)}
        ${summaryCard('Source', state.runtime.source)}
        ${summaryCard('Sync', safeDate(state.runtime.lastSyncAt))}
      </div>
      <div class="card-actions">
        <button type="button" class="btn btn--ghost" data-action="toggle-theme">تبديل الثيم</button>
      </div>
    </section>
  `;
}

function renderPage(state, helpers) {
  switch (state.ui.route) {
    case 'offers': return renderOffers(state);
    case 'tiers': return renderTiers(state);
    case 'cart': return renderCart(state);
    case 'orders': return renderOrders(state);
    case 'customers': return renderCustomers(state);
    case 'reps': return renderReps(state);
    case 'analytics': return renderAnalytics(state, helpers);
    case 'login':
    case 'account': return renderAuth(state);
    case 'checkout': return renderCheckout(state, helpers);
    case 'settings': return renderSettings(state);
    case 'home':
    default: return renderHome(state);
  }
}

function renderModal(state, helpers) {
  if (!state.ui.modal) return '';
  const modal = state.ui.modal;
  if (modal.type === 'product') {
    const product = modal.product;
    return `
      <section class="modal is-open" data-modal="product">
        <div class="modal__sheet">
          <div class="modal__head">
            <strong>${dom.escape(product.product_name)}</strong>
            <button type="button" class="icon-btn" data-action="close-modal">×</button>
          </div>
          <div class="modal__body">
            <div class="summary-grid">
              ${summaryCard('الشركة', product.company_name || '')}
              ${summaryCard('الشريحة', product.tier_name || '')}
              ${summaryCard('السعر', `${formatMoney(product.units?.[0]?.final_price || 0)} ج.م`)}
              ${summaryCard('المتاح', product.units?.[0] ? Math.max(0, product.units[0].available_qty - product.units[0].reserved_qty) : 0)}
            </div>
            <p class="muted">${dom.escape(product.category || '')}</p>
          </div>
          <div class="modal__foot">
            <button type="button" class="btn btn--primary" data-action="add-product" data-product-id="${dom.escape(product.product_id)}" data-unit-code="${dom.escape(product.units?.[0]?.unit_code || 'carton')}" data-tier-name="${dom.escape(product.units?.[0]?.tier_name || 'base')}">إضافة للسلة</button>
          </div>
        </div>
      </section>
    `;
  }
  if (modal.type === 'order') {
    const order = modal.order;
    return `
      <section class="modal is-open" data-modal="order">
        <div class="modal__sheet">
          <div class="modal__head">
            <strong>#${dom.escape(order.order_number)}</strong>
            <button type="button" class="icon-btn" data-action="close-modal">×</button>
          </div>
          <div class="modal__body">
            <div class="summary-grid">
              ${summaryCard('الحالة', order.status)}
              ${summaryCard('الإجمالي', `${formatMoney(order.grand_total)} ج.م`)}
              ${summaryCard('العميل', order.customer_id)}
              ${summaryCard('المندوب', order.sales_rep_id || '-')}
            </div>
            <div class="order-lines">
              ${(order.items || []).map((item) => `<div class="order-line">${dom.escape(item.product_name_snapshot)} × ${item.quantity} — ${formatMoney(item.line_total)} ج.م</div>`).join('')}
            </div>
          </div>
          <div class="modal__foot">
            <button type="button" class="btn btn--primary" data-action="send-whatsapp" data-order-id="${dom.escape(order.id)}">واتساب</button>
          </div>
        </div>
      </section>
    `;
  }
  return '';
}

function renderToast(state) {
  const items = state.data.uiEvents.slice(-3).map((event, index) => `
    <article class="toast toast--${dom.escape(event.event_type || 'info')}">
      <strong>${dom.escape(event.event_type)}</strong>
      <span>${dom.escape(event.payload ? JSON.stringify(event.payload).slice(0, 120) : '')}</span>
    </article>
  `);
  return `<div class="toast-stack">${items.join('')}</div>`;
}

function renderBottomNav(state, helpers) {
  const items = navItems(selectRole(state));
  return `
    <nav class="bottom-nav" aria-label="main navigation">
      ${items.map((item) => `<button type="button" class="bottom-nav__item ${state.ui.route === item.route ? 'is-active' : ''}" data-action="go" data-route="${dom.escape(item.route)}"><span>${dom.escape(item.icon)}</span><strong>${dom.escape(item.label)}</strong></button>`).join('')}
    </nav>
  `;
}

export function renderApp(state, helpers) {
  const catalog = selectCatalog(state);
  const role = selectRole(state);
  const visibleTier = selectVisibleTier(state);
  return `
    <div class="app-shell theme-${dom.escape(state.ui.theme || 'dark')}" data-role="${dom.escape(role)}">
      <header class="topbar">
        <div class="topbar__row">
          <div class="brand">
            <div class="brand__mark">A</div>
            <div>
              <strong>${dom.escape(state.app.config.appName || 'الأهرام B2B')}</strong>
              <span>${dom.escape(state.runtime.source)}</span>
            </div>
          </div>
          <div class="topbar__actions">
            <button type="button" class="icon-btn" data-action="toggle-theme">◐</button>
            <button type="button" class="btn btn--ghost" data-action="go" data-route="${state.auth.role === ROLES.GUEST ? 'login' : 'account'}">${state.auth.role === ROLES.GUEST ? 'دخول' : dom.escape(state.auth.user?.name || 'الحساب')}</button>
          </div>
        </div>

        <div class="search-bar">
          <input id="searchInput" type="search" value="${dom.escape(state.ui.search || '')}" placeholder="بحث في المنتجات والشركات..." data-action="search" />
          <button type="button" class="btn btn--ghost" data-action="clear-search">مسح</button>
        </div>

        <div class="tier-strip" aria-label="tiers">
          ${state.data.tiers.map((tier) => tierChip(tier, visibleTier?.tier_name === tier.tier_name)).join('')}
        </div>

        <div class="company-strip">
          ${catalog.companies.map((company) => companyChip(company, state.ui.selectedCompany === company.company_id)).join('')}
        </div>
      </header>

      <main class="content">
        ${renderPage(state, helpers)}
      </main>

      <button type="button" class="floating-cart" data-action="go" data-route="cart">
        <span>🛒</span>
        <strong>${state.cart.items.length}</strong>
        <em>${formatMoney(selectCartSummary(state).grand_total)} ج.م</em>
      </button>

      ${renderBottomNav(state, helpers)}
      ${renderModal(state, helpers)}
      ${renderToast(state)}
    </div>
  `;
}
