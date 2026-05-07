import { dom } from '../core/dom.js';
import { getUnitPrice, labelForUnit, resolveProductUnit, safeImageUrl } from '../services/pricingService.js';
import { formatMoney } from '../services/invoiceService.js';
import { modalFrame } from '../components/feedback.js';
import { cartItemKey } from '../services/cartService.js';

function productQuickViewBody(state, product) {
  if (!product) return '<div class="empty-state">لا يوجد منتج محدد</div>';
  const unit = resolveProductUnit(product, state.commerce.unitPrefs[product.product_id]);
  const selectedQty = Math.max(1, Number(state.commerce.qtyPrefs[product.product_id] || 1));
  const inCart = state.commerce.cart.some((item) => cartItemKey(item) === `${product.product_id}::${unit || 'single'}::${String(state.commerce.selectedTier || '')}`);
  const selectedPrice = unit ? getUnitPrice(product, unit) : null;
  const availableUnits = Array.isArray(product.sellable_units) ? product.sellable_units : [];

  const unitButtons = availableUnits.length
    ? availableUnits.map((candidate) => `
        <button class="unit-chip ${candidate === unit ? 'is-active' : ''}" type="button" data-action="modal-set-unit" data-product-id="${dom.escape(product.product_id)}" data-unit="${dom.escape(candidate)}">
          ${dom.escape(labelForUnit(candidate))}
        </button>
      `).join('')
    : '<span class="empty-state">لا توجد وحدات متاحة</span>';

  const image = safeImageUrl(product.product_image);

  return `
    <div class="product-modal product-modal--quick-view">
      <div class="product-modal__media">
        ${image ? `<img src="${dom.escape(image)}" alt="${dom.escape(product.product_name)}" loading="eager" />` : `<div class="product-modal__media-fallback">${dom.escape((product.product_name || 'P').slice(0, 1))}</div>`}
      </div>
      <div class="product-modal__content">
        <div class="product-modal__title">${dom.escape(product.product_name)}</div>
        <div class="product-modal__company">${dom.escape(product.company_name || '')}</div>
        <div class="product-modal__price-row">
          <span class="price price--main">${dom.escape(selectedPrice === null ? '—' : `${formatMoney(selectedPrice)} ج.م`)}</span>
          <span class="product-modal__unit-current">${dom.escape(labelForUnit(unit))}</span>
        </div>
        <div class="product-modal__units">${unitButtons}</div>
        <label class="product-modal__qty">
          <span>الكمية</span>
          <input type="text" inputmode="numeric" autocomplete="off" spellcheck="false" value="${String(selectedQty)}" data-role="modal-product-qty" data-product-id="${dom.escape(product.product_id)}" />
        </label>
        <div class="product-modal__note">السعر النهائي يأتي من قاعدة البيانات</div>
        <button class="btn btn--primary" type="button" data-action="toggle-product" data-product-id="${dom.escape(product.product_id)}">${inCart ? 'إزالة من السلة' : 'شراء'}</button>
      </div>
    </div>
  `;
}

export function renderLoginModal(state) {
  return `
    <section class="modal-overlay ${state.ui.activeModal === 'login' ? 'is-open' : 'is-hidden'}" data-modal="login" aria-hidden="${state.ui.activeModal === 'login' ? 'false' : 'true'}">
      ${modalFrame('تسجيل الدخول', `
        <form class="auth-form auth-form--modal" data-form="login">
          <label><span>الهاتف أو المستخدم</span><input type="text" name="identifier" autocomplete="username" /></label>
          <label><span>كلمة المرور</span><input type="password" name="password" autocomplete="current-password" /></label>
          <div class="auth-form__actions">
            <button class="btn btn--primary" type="submit">دخول</button>
            <button class="btn btn--ghost" type="button" data-action="close-modal">إغلاق</button>
          </div>
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
          <label><span>الاسم</span><input type="text" name="name" autocomplete="name" /></label>
          <label><span>الهاتف</span><input type="text" name="phone" autocomplete="tel" /></label>
          <label><span>العنوان</span><input type="text" name="address" /></label>
          <div class="auth-form__actions">
            <button class="btn btn--primary" type="submit">حفظ</button>
            <button class="btn btn--ghost" type="button" data-action="close-modal">إلغاء</button>
          </div>
        </form>
      `)}
    </section>
  `;
}

export function renderProductModal(state, product) {
  return `
    <section class="modal-overlay ${state.ui.activeModal === 'product' ? 'is-open' : 'is-hidden'}" data-modal="product" aria-hidden="${state.ui.activeModal === 'product' ? 'false' : 'true'}">
      ${modalFrame('معاينة المنتج', productQuickViewBody(state, product), '')}
    </section>
  `;
}
