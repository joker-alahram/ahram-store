import { modalFrame } from '../components/feedback.js';

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
  return `
    <section class="modal-overlay ${state.ui.activeModal === 'product' ? 'is-open' : 'is-hidden'}" data-modal="product">
      ${modalFrame(product.product_name, `
        <div class="product-modal">
          <div class="product-modal__image">${product.product_image ? `<img src="${product.product_image}" alt="${product.product_name}" />` : '<div>منتج</div>'}</div>
          <p>${product.company_name || ''}</p>
        </div>
      `, `<button class="btn btn--primary" type="button" data-action="toggle-product" data-product-id="${product.product_id}">إضافة للسلة</button>`)}
    </section>
  `;
}
