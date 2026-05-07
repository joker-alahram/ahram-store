import { dom } from '../core/dom.js';
import { computeDisplayPrice, labelForUnit, resolveProductUnit } from '../services/pricingService.js';
import { formatMoney } from '../services/invoiceService.js';
import { modalFrame } from '../components/feedback.js';

function productQuickViewBody(state, product) {
  if (!product) return '<div class="empty-state">لا يوجد منتج محدد</div>';
  const tier = state.commerce.catalog.tiers.find((item) => item.tier_name === state.commerce.priceBook.tierName)
    || state.commerce.catalog.tiers.find((item) => item.is_default)
    || state.commerce.catalog.tiers[0]
    || null;
  const unit = resolveProductUnit(product, state.commerce.unitPrefs[product.product_id]);
  const selectedQty = Math.max(1, Number(state.commerce.qtyPrefs[product.product_id] || 1));
  const inCart = state.commerce.cart.some((item) => item.type === 'product' && item.id === product.product_id && item.unit === unit);
  const display = computeDisplayPrice(product, unit, tier);
  const availableUnits = Array.isArray(product.sellable_units) && product.sellable_units.length
    ? product.sellable_units
    : Object.entries(product.prices || {}).filter(([, value]) => Number(value) > 0).map(([key]) => key);

  const unitButtons = availableUnits.length
    ? availableUnits.map((candidate) => `
        <button class="unit-chip ${candidate === unit ? 'is-active' : ''}" type="button" data-action="modal-set-unit" data-product-id="${dom.escape(product.product_id)}" data-unit="${dom.escape(candidate)}">
          ${dom.escape(labelForUnit(candidate))}
        </button>
      `).join('')
    : '<span class="empty-state">لا توجد وحدات متاحة</span>';

  return `
    <div class="product-modal product-modal--quick-view">
      <div class="product-modal__media">
        ${product.product_image ? `<img src="${dom.escape(product.product_image)}" alt="${dom.escape(product.product_name)}" loading="eager" />` : `<div class="product-modal__media-fallback">${dom.escape((product.product_name || 'P').slice(0, 1))}</div>`}
      </div>
      <div class="product-modal__content">
        <div class="product-modal__title">${dom.escape(product.product_name)}</div>
        <div class="product-modal__company">${dom.escape(product.company_name || '')}</div>
        <div class="product-modal__price-row">
          ${display.final < display.base ? `<span class="price price--old">${formatMoney(display.base)} ج.م</span><span class="price price--new">${formatMoney(display.final)} ج.م</span>` : `<span class="price price--main">${formatMoney(display.final ?? display.base)} ج.م</span>`}
          <span class="product-modal__unit-current">${dom.escape(labelForUnit(unit))}</span>
        </div>
        <div class="product-modal__units">${unitButtons}</div>
        <label class="product-modal__qty">
          <span>الكمية</span>
          <input type="text" inputmode="numeric" autocomplete="off" spellcheck="false" value="${String(selectedQty)}" data-role="modal-product-qty" data-product-id="${dom.escape(product.product_id)}" />
        </label>
        <div class="product-modal__note">${product.allow_discount === false ? 'غير قابل للخصم' : 'يتم تطبيق تسعير الشريحة على الكرتونة فقط'}</div>
      </div>
    </div>
  `;
}

export function renderLoginModal(state) {
  return `
    <section class="modal-overlay ${state.ui.activeModal === 'login' ? 'is-open' : 'is-hidden'}" data-modal="login" aria-hidden="${state.ui.activeModal === 'login' ? 'false' : 'true'}">
      ${modalFrame('تسجيل الدخول', `
        <form class="auth-form auth-form--modal" data-form="login">
          <label><span>الهاتف أو اسم المستخدم</span><input name="identifier" type="text" autocomplete="username" /></label>
          <label><span>كلمة المرور</span><input name="password" type="password" autocomplete="current-password" /></label>
          <button class="btn btn--primary" type="submit">دخول</button>
          <button class="btn btn--ghost" type="button" data-action="go-register">تسجيل عميل جديد</button>
        </form>
      `)}
    </section>
  `;
}

export function renderCustomerModal(state) {
  return `
    <section class="modal-overlay ${state.ui.activeModal === 'customer' ? 'is-open' : 'is-hidden'}" data-modal="customer" aria-hidden="${state.ui.activeModal === 'customer' ? 'false' : 'true'}">
      ${modalFrame('إضافة عميل', `
        <form class="auth-form auth-form--modal" data-form="customer-create">
          <label><span>اسم العميل</span><input name="name" type="text" /></label>
          <label><span>الهاتف</span><input name="phone" type="text" /></label>
          <label><span>العنوان</span><input name="address" type="text" /></label>
          <button class="btn btn--primary" type="submit">حفظ العميل</button>
        </form>
      `)}
    </section>
  `;
}

export function renderProductModal(state, product) {
  if (!product) return '';
  const unit = resolveProductUnit(product, state.commerce.unitPrefs[product.product_id]);
  const inCart = state.commerce.cart.some((item) => item.type === 'product' && item.id === product.product_id && item.unit === unit);
  return `
    <section class="modal-overlay ${state.ui.activeModal === 'product' ? 'is-open' : 'is-hidden'}" data-modal="product" aria-hidden="${state.ui.activeModal === 'product' ? 'false' : 'true'}">
      ${modalFrame(product.product_name, productQuickViewBody(state, product), `
        <button class="btn btn--primary" type="button" data-action="toggle-product" data-product-id="${dom.escape(product.product_id)}">${inCart ? 'إزالة من السلة' : 'إضافة للسلة'}</button>
      `)}
    </section>
  `;
}
