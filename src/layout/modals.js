import { modalFrame } from '../components/feedback.js';
import { buildInvoiceModel, formatMoney, renderInvoiceItemHtml } from '../services/invoiceService.js';
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
  const selectedUnit = state.commerce.unitPrefs?.[product.product_id]
    || product.defaultUnit
    || Object.keys(product.units || {}).find((key) => Number(product.units[key]?.final_price ?? 0) > 0)
    || Object.keys(product.units || {})[0]
    || 'carton';
  const display = computeDisplayPrice(product, selectedUnit);
  const currentUnit = product.units?.[selectedUnit] || null;
  const canBuy = product.can_buy !== false && Number(currentUnit?.final_price ?? display.final ?? 0) > 0 && currentUnit?.unit_active !== false && currentUnit?.is_sellable !== false;
  const units = Object.values(product.units || {})
    .filter((unit) => unit?.unit_code)
    .sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0) || String(a.unit_code).localeCompare(String(b.unit_code), 'ar'));

  return `
    <section class="modal-overlay modal-overlay--center ${state.ui.activeModal === 'product' ? 'is-open' : 'is-hidden'}" data-modal="product" role="dialog" aria-modal="true" tabindex="-1">
      ${modalFrame(dom.escape(product.product_name || 'المنتج'), `
        <div class="product-modal">
          <button class="btn btn--ghost product-modal__close" type="button" data-action="close-modal" aria-label="إغلاق">×</button>
          <div class="product-modal__image">
            ${product.product_image ? `<img src="${dom.escape(product.product_image)}" alt="${dom.escape(product.product_name || '')}" />` : '<div>منتج</div>'}
          </div>
          <div class="product-modal__meta">
            <strong>${dom.escape(product.company_name || '')}</strong>
            <div class="badge-row">
              <span class="badge">${dom.escape(labelForUnit(selectedUnit))}</span>
              <span class="badge">${formatMoney(Number(currentUnit?.final_price ?? display.final ?? 0))} ج.م</span>
              <span class="badge">${Number(currentUnit?.available_qty ?? 0)} متاح</span>
            </div>
          </div>
          <div class="product-modal__units">
            ${units.map((unit) => `<button class="unit-chip ${unit.unit_code === selectedUnit ? 'is-active' : ''}" type="button" data-action="set-unit" data-product-id="${dom.escape(product.product_id)}" data-unit="${dom.escape(unit.unit_code)}" ${unit.runtime_healthy === false || unit.is_sellable === false || unit.unit_active === false || Number(unit.final_price ?? 0) <= 0 ? 'disabled' : ''}>${dom.escape(labelForUnit(unit.unit_code))}</button>`).join('')}
          </div>
          <div class="product-modal__pricing">
            <label class="qty-field qty-field--modal">
              <span>الكمية</span>
              <input type="text" inputmode="numeric" pattern="[0-9]*" value="${String(Number(state.commerce.qtyPrefs?.[product.product_id] || 1))}" data-role="product-qty" data-product-id="${dom.escape(product.product_id)}" autocomplete="off" spellcheck="false" />
            </label>
            <div class="product-modal__price-row">
              <span class="price price--main">${formatMoney(Number(currentUnit?.final_price ?? display.final ?? 0))} ج.م</span>
              <span class="unit-label">${canBuy ? 'جاهز للإضافة' : 'غير متاح حاليًا'}</span>
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
  const model = buildInvoiceModel({
    order: invoice,
    items: state.commerce.invoiceItemsById?.[String(invoice.id)] || [],
    session: state.auth.session,
    customer: invoice,
    tierLabel: state.commerce.selectedTier || '',
  });
  return `
    <section class="modal-overlay modal-overlay--center is-open" data-modal="invoice" role="dialog" aria-modal="true" tabindex="-1">
      ${modalFrame(`فاتورة #${model.number}`, `
        <div class="invoice-preview">
          <div class="invoice-preview__row"><span>التاريخ</span><strong>${new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(model.createdAt || Date.now()))}</strong></div>
          <div class="invoice-preview__row"><span>العميل</span><strong>${model.customer?.name || 'غير محدد'}</strong></div>
          <div class="invoice-preview__row"><span>النوع</span><strong>${model.userType || ''}</strong></div>
          <div class="invoice-preview__row"><span>الإجمالي</span><strong>${formatMoney(model.totalAmount || 0)} ج.م</strong></div>
          <div class="invoice-preview__items">${model.items.length ? model.items.map(renderInvoiceItemHtml).join('') : '<div class="empty-state">لا توجد تفاصيل متاحة</div>'}</div>
        </div>
      `, `<button class="btn btn--primary" type="button" data-action="close-modal">إغلاق</button>`)}
    </section>
  `;
}
