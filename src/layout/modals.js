import { modalFrame } from '../components/feedback.js';
import { formatMoney } from '../services/invoiceService.js';
import { labelForUnit } from '../services/pricingService.js';
import { tierCard } from '../components/cards.js';

export function renderLoginModal(state) {
  return `
    <section class="modal-overlay ${state.ui.activeModal === 'login' ? 'is-open' : 'is-hidden'}" data-modal="login" tabindex="-1">
      ${modalFrame('تسجيل الدخول', `
        <form class="auth-form auth-form--modal" data-form="login">
          <label><span>الهاتف أو اسم المستخدم</span><input name="identifier" type="text" autocomplete="username" /></label>
          <label><span>كلمة المرور</span><input name="password" type="password" autocomplete="current-password" /></label>
          <button class="btn btn--primary" type="submit">${state.runtime.loading.auth ? 'جارٍ الدخول…' : 'دخول'}</button>
          <button class="btn btn--ghost" type="button" data-action="go-register">تسجيل عميل جديد</button>
        </form>
      `)}
    </section>
  `;
}

export function renderCustomerModal(state) {
  return `
    <section class="modal-overlay ${state.ui.activeModal === 'customer' ? 'is-open' : 'is-hidden'}" data-modal="customer" tabindex="-1">
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

export function renderTierModal(state) {
  const shouldShow = state.ui.activeModal === 'tier';
  return `
    <section class="modal-overlay ${shouldShow ? 'is-open' : 'is-hidden'}" data-modal="tier" tabindex="-1">
      ${modalFrame('اختر الشريحة المناسبة أولاً', `
        <div class="modal-guide">
          <p>اختر الشريحة ثم عُد لمتابعة الإضافة أو الشراء. التسعير سيظل من المصدر المعتمد فقط.</p>
          <div class="modal-guide__tiers">
            ${(state.commerce.catalog.tiers || []).slice(0, 4).map((tier) => tierCard(tier, tier.tier_name === state.commerce.selectedTier)).join('')}
          </div>
        </div>
      `, `<button class="btn btn--primary" type="button" data-action="go-tiers">فتح صفحة الشرائح</button>`)}
    </section>
  `;
}

export function renderProductModal(state, product) {
  if (!product) return '';
  const units = Object.values(product.units || {})
    .filter((unit) => unit?.unit_code)
    .sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0) || String(a.unit_code).localeCompare(String(b.unit_code), 'ar'));

  return `
    <section class="modal-overlay ${state.ui.activeModal === 'product' ? 'is-open' : 'is-hidden'}" data-modal="product" tabindex="-1">
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

export function renderInvoiceModal(state, invoice, items = []) {
  if (!invoice) return '';
  const customerName = invoice.customer_name || (state.auth.session?.userType === 'rep' ? (state.commerce.customers || []).find((customer) => String(customer.id) === String(invoice.customer_id))?.name : state.auth.session?.name) || '';
  const rows = items.length ? items : (invoice.items || []).map((item) => ({ ...item, price: Number(item.price || 0), qty: Number(item.qty || 1) }));
  return `
    <section class="modal-overlay ${state.ui.activeModal === 'invoice' ? 'is-open' : 'is-hidden'}" data-modal="invoice" tabindex="-1">
      ${modalFrame(`فاتورة #${invoice.order_number || invoice.invoice_number || invoice.id}`, `
        <div class="invoice-preview">
          <div class="invoice-preview__meta">
            <div><span>العميل</span><strong>${customerName || '—'}</strong></div>
            <div><span>التاريخ</span><strong>${new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(invoice.created_at || Date.now()))}</strong></div>
            <div><span>الإجمالي</span><strong>${formatMoney(invoice.total_amount || 0)} ج.م</strong></div>
            <div><span>الحالة</span><strong>${invoice.status || ''}</strong></div>
          </div>
          <div class="invoice-preview__items">
            ${rows.map((item) => `
              <article class="invoice-preview__item">
                <div>
                  <h4>${item.title || item.name || item.product_name || `#${item.product_id || item.id || ''}`}</h4>
                  <p>${item.unitLabel || labelForUnit(item.unit || item.unit_code || 'piece')}</p>
                </div>
                <div>
                  <strong>${Number(item.qty || 1)} × ${formatMoney(item.price || 0)}</strong>
                  <span>${formatMoney(Number(item.qty || 1) * Number(item.price || 0))} ج.م</span>
                </div>
              </article>
            `).join('') || '<div class="empty-state">لا توجد تفاصيل</div>'}
          </div>
        </div>
      `, `<button class="btn btn--ghost" type="button" data-action="close-modal">إغلاق</button>`)}
    </section>
  `;
}
