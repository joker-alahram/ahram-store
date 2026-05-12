import { modalFrame } from '../components/feedback.js';
import { formatCairoDateTime, formatMoney } from '../services/invoiceService.js';
import { computeDisplayPrice, labelForUnit } from '../services/pricingService.js';
import { dom } from '../core/dom.js';

export function renderLoginModal(state) {
  return `
    <section class="modal-overlay modal-overlay--center ${state.ui.activeModal === 'login' ? 'is-open' : 'is-hidden'}" data-modal="login" role="dialog" aria-modal="true" tabindex="-1">
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
    <section class="modal-overlay modal-overlay--center ${state.ui.activeModal === 'customer' ? 'is-open' : 'is-hidden'}" data-modal="customer" role="dialog" aria-modal="true" tabindex="-1">
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
  const selectedUnit = state.commerce.unitPrefs?.[product.product_id] || product.defaultUnit || Object.keys(product.units || {}).find((key) => Number(product.units[key]?.final_price ?? 0) > 0) || Object.keys(product.units || {})[0] || 'carton';
  const display = computeDisplayPrice(product, selectedUnit);
  const currentUnit = product.units?.[selectedUnit] || null;
  const canBuy = product.can_buy !== false && Number(currentUnit?.final_price ?? display.final ?? 0) > 0 && currentUnit?.unit_active !== false && currentUnit?.is_sellable !== false;
  const units = Object.values(product.units || {}).filter((unit) => unit?.unit_code).sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0) || String(a.unit_code).localeCompare(String(b.unit_code), 'ar'));
  const quantity = Math.max(1, Number(state.commerce.qtyPrefs?.[product.product_id] || 1));

  return `
    <section class="modal-overlay modal-overlay--center ${state.ui.activeModal === 'product' ? 'is-open' : 'is-hidden'}" data-modal="product" role="dialog" aria-modal="true" tabindex="-1">
      ${modalFrame(dom.escape(product.product_name || 'المنتج'), `
        <div class="product-modal product-modal--compact">
          <button class="btn btn--ghost product-modal__close" type="button" data-action="close-modal" aria-label="إغلاق">×</button>
          <div class="product-modal__layout">
            <div class="product-modal__image">${product.product_image ? `<img src="${dom.escape(product.product_image)}" alt="${dom.escape(product.product_name || '')}" />` : '<div>منتج</div>'}</div>
            <div class="product-modal__content">
              <div class="product-modal__meta">
                <strong>${dom.escape(product.company_name || '')}</strong>
                <div class="badge-row">
                  <span class="badge">${dom.escape(labelForUnit(selectedUnit))}</span>
                  <span class="badge">${formatMoney(Number(currentUnit?.final_price ?? display.final ?? 0))} ج.م</span>
                </div>
              </div>
              <div class="product-modal__units">${units.map((unit) => `<button class="unit-chip ${unit.unit_code === selectedUnit ? 'is-active' : ''}" type="button" data-action="set-unit" data-product-id="${dom.escape(product.product_id)}" data-unit="${dom.escape(unit.unit_code)}" ${unit.runtime_healthy === false || unit.is_sellable === false || unit.unit_active === false || Number(unit.final_price ?? 0) <= 0 ? 'disabled' : ''}>${dom.escape(labelForUnit(unit.unit_code))}</button>`).join('')}</div>
              <div class="product-modal__pricing">
                <div class="qty-stepper qty-stepper--modal ${canBuy ? '' : 'is-disabled'}">
                  <button class="qty-stepper__btn" type="button" data-action="product-qty-down" data-product-id="${dom.escape(product.product_id)}" aria-label="إنقاص الكمية">-</button>
                  <label class="qty-field qty-field--modal qty-field--inline"><span>الكمية</span><input type="text" inputmode="numeric" pattern="[0-9]*" value="${String(quantity)}" data-role="product-qty" data-product-id="${dom.escape(product.product_id)}" autocomplete="off" spellcheck="false" /></label>
                  <button class="qty-stepper__btn" type="button" data-action="product-qty-up" data-product-id="${dom.escape(product.product_id)}" aria-label="زيادة الكمية">+</button>
                </div>
                <div class="product-modal__price-row"><span class="price price--main">${formatMoney(Number(currentUnit?.final_price ?? display.final ?? 0))} ج.م</span><span class="unit-label">${canBuy ? 'جاهز للشراء' : 'غير متاح حاليًا'}</span></div>
              </div>
            </div>
          </div>
        </div>
      `, `<button class="btn btn--primary" type="button" data-action="toggle-product" data-product-id="${dom.escape(product.product_id)}" ${canBuy ? '' : 'disabled'}>${canBuy ? 'شراء' : 'غير متاح'}</button>`)}
    </section>
  `;
}

export function renderInvoiceModal(state) {
  if (state.ui.activeModal !== 'invoice' || !state.ui.selectedInvoiceId) return '';
  const invoice = (state.commerce.invoices || []).find((item) => String(item.id) === String(state.ui.selectedInvoiceId));
  if (!invoice) return '';
  const items = state.commerce.invoiceItemsById?.[String(invoice.id)] || [];
  return `
    <section class="modal-overlay modal-overlay--center is-open" data-modal="invoice" role="dialog" aria-modal="true" tabindex="-1">
      ${modalFrame(`فاتورة #${invoice.order_number || invoice.invoice_number || invoice.id}`, `
        <div class="invoice-preview">
          <div class="invoice-preview__row"><span>التاريخ</span><strong>${formatCairoDateTime(invoice.created_at || Date.now())}</strong></div>
          <div class="invoice-preview__row"><span>العميل</span><strong>${invoice.customer_name || 'غير محدد'}</strong></div>
          <div class="invoice-preview__row"><span>النوع</span><strong>${invoice.user_type || ''}</strong></div>
          <div class="invoice-preview__row"><span>الإجمالي</span><strong>${formatMoney(invoice.total_amount || 0)} ج.م</strong></div>
          <div class="invoice-preview__items">${items.length ? items.map((item) => `
            <div class="invoice-preview__item">
              <strong>${item.title || item.product_name || item.product_id || ''}</strong>
              <span>${item.unit || item.unitLabel || ''} · ${Number(item.qty || 1)} × ${formatMoney(item.price || 0)} = ${formatMoney(Number(item.qty || 1) * Number(item.price || 0))} ج.م</span>
            </div>`).join('') : '<div class="empty-state">لا توجد تفاصيل متاحة</div>'}</div>
        </div>
      `, `<button class="btn btn--primary" type="button" data-action="go-invoices">إغلاق</button>`)}
    </section>
  `;
}
