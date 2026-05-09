import { modalFrame } from '../components/feedback.js';
import { formatMoney } from '../services/invoiceService.js';
import { labelForUnit } from '../services/pricingService.js';

export function renderLoginModal(state) {
  return `
    <section class="modal-overlay ${state.ui.activeModal === 'login' ? 'is-open' : 'is-hidden'}" data-modal="login">
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
    <section class="modal-overlay ${state.ui.activeModal === 'customer' ? 'is-open' : 'is-hidden'}" data-modal="customer">
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
  const units = Object.values(product.units || {})
    .filter((unit) => unit?.unit_code)
    .sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0) || String(a.unit_code).localeCompare(String(b.unit_code), 'ar'));

  return `
    <section class="modal-overlay ${state.ui.activeModal === 'product' ? 'is-open' : 'is-hidden'}" data-modal="product">
      ${modalFrame(product.product_name, `
        <div class="product-modal">
          <div class="product-modal__image">${product.product_image ? `<img src="${product.product_image}" alt="${product.product_name}" />` : '<div>منتج</div>'}</div>
          <p>${product.company_name || ''}</p>
          <div class="product-modal__units">
            ${units.map((unit) => `<div class="product-modal__unit"><strong>${labelForUnit(unit.unit_code)}</strong><span>${formatMoney(unit.final_price || 0)} ج.م</span><em>${Number(unit.available_qty || 0)} متاح</em></div>`).join('')}
          </div>
        </div>
      `, `<button class="btn btn--primary" type="button" data-action="toggle-product" data-product-id="${product.product_id}">شراء</button>`)}
    </section>
  `;
}
