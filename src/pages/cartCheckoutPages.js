import { formatMoney } from '../services/invoiceService.js';
import { computeCartTotals, getSelectedTier, getActiveCustomer } from '../state/selectors.js';

function renderCartLine(item) {
  const qty = Number(item.qty || 1);
  const unitPrice = Number(item.price || 0);
  const lineTotal = qty * unitPrice;
  return `
    <article class="cart-item cart-item--compact">
      <img src="${item.image || ''}" alt="${item.title || ''}" loading="lazy" />
      <div class="cart-item__content">
        <div class="cart-item__title">${item.title || ''}</div>
        <div class="cart-item__line">${item.unitLabel || item.unit || ''} · ${formatMoney(unitPrice)} ج.م · الإجمالي ${formatMoney(lineTotal)} ج.م</div>
        <div class="cart-item__actions">
          ${item.type === 'product' ? `<button type="button" data-action="qty-down" data-key="${item.key}">-</button><input type="number" min="1" value="${qty}" data-role="cart-qty" data-key="${item.key}" /><button type="button" data-action="qty-up" data-key="${item.key}">+</button>` : ''}
          <button class="btn btn--ghost" type="button" data-action="remove-item" data-key="${item.key}">حذف</button>
        </div>
      </div>
    </article>
  `;
}

export function renderCartPage(state) {
  const totals = computeCartTotals(state);
  const items = state.commerce.cart;
  const tier = getSelectedTier(state);
  const remaining = Math.max(0, Number(tier.min_order || 0) - Number(totals.grand || 0));
  return `
    <div class="page-stack">
      <section class="page-section">
        <div class="page-section__head"><div><h2>السلة</h2><p>عناصر الطلب الحالية</p></div></div>
        <div class="cart-list">
          ${items.length ? items.map(renderCartLine).join('') : '<div class="empty-state">السلة فارغة</div>'}
        </div>
      </section>
      <section class="page-section page-section--summary">
        <div class="summary-box">
          <div><span>الشريحة</span><strong>${tier.visible_label || tier.tier_name}</strong></div>
          ${tier.tier_name && tier.tier_name !== 'base' ? `<div><span>المتبقي لتحقيق الشريحة</span><strong>${formatMoney(remaining)} ج.م</strong></div>` : ''}
          <div><span>الإجمالي</span><strong>${formatMoney(totals.grand)} ج.م</strong></div>
          <div><span>المنتجات</span><strong>${formatMoney(totals.products)} ج.م</strong></div>
          <div><span>الصفقات</span><strong>${formatMoney(totals.deals + totals.flash)} ج.م</strong></div>
          <button class="btn btn--primary" type="button" data-action="go-checkout">إتمام الشراء</button>
        </div>
      </section>
    </div>
  `;
}

export function renderCheckoutPage(state) {
  const totals = computeCartTotals(state);
  const tier = getSelectedTier(state);
  const customer = getActiveCustomer(state) || state.auth.session;
  const remaining = Math.max(0, Number(tier.min_order || 0) - Number(totals.grand || 0));
  return `
    <div class="page-stack checkout-page checkout-page--full">
      <section class="page-section checkout-page__summary">
        <div class="page-section__head"><div><h2>التحقق من الطلب</h2><p>مراجعة نهائية قبل الإنشاء</p></div></div>
        <div class="checkout-box checkout-box--top">
          <div class="checkout-box__row"><span>الشريحة</span><strong>${tier.visible_label || tier.tier_name}</strong></div>
          <div class="checkout-box__row"><span>العميل</span><strong>${customer?.name || 'غير محدد'}</strong></div>
          <div class="checkout-box__row"><span>الإجمالي</span><strong>${formatMoney(totals.grand)} ج.م</strong></div>
          <div class="checkout-box__row"><span>حد الشريحة</span><strong>${formatMoney(tier.min_order || 0)} ج.م</strong></div>
          ${tier.tier_name && tier.tier_name !== 'base' ? `<div class="checkout-box__row checkout-box__row--remaining"><span>المتبقي لتحقيق الشريحة</span><strong>${formatMoney(remaining)} ج.م</strong></div>` : ''}
        </div>
      </section>

      <section class="page-section checkout-page__items">
        <div class="page-section__head page-section__head--tight"><div><h2>تفاصيل الفاتورة</h2><p>كل صنف في سطر مستقل</p></div></div>
        <div class="checkout-items">
          ${(state.commerce.cart || []).length ? (state.commerce.cart || []).map((item) => {
            const qty = Number(item.qty || 1);
            const unitPrice = Number(item.price || 0);
            const lineTotal = qty * unitPrice;
            return `
              <article class="checkout-line">
                <div class="checkout-line__name">${item.title || ''}</div>
                <div class="checkout-line__details">
                  <span>${item.unitLabel || item.unit || ''}</span>
                  <span>الكمية ${qty}</span>
                  <span>سعر الوحدة ${formatMoney(unitPrice)} ج.م</span>
                  <span>الإجمالي ${formatMoney(lineTotal)} ج.م</span>
                  <div class="checkout-line__controls">${item.type === 'product' ? `<button type="button" data-action="qty-down" data-key="${item.key}">-</button><input type="number" min="1" value="${qty}" data-role="cart-qty" data-key="${item.key}" /><button type="button" data-action="qty-up" data-key="${item.key}">+</button>` : ''}</div>
                </div>
              </article>
            `;
          }).join('') : '<div class="empty-state">السلة فارغة</div>'}
        </div>
      </section>

      <section class="page-section checkout-page__action">
        <div class="summary-box summary-box--checkout">
          <div><span>إجمالي السلة</span><strong>${formatMoney(totals.grand)} ج.م</strong></div>
          <button class="btn btn--primary" type="button" data-action="submit-checkout" ${state.ui.checkoutBusy ? 'disabled' : ''}>${state.ui.checkoutBusy ? 'جارٍ الإرسال…' : 'إرسال الطلب'}</button>
        </div>
      </section>
    </div>
  `;
}
