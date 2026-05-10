import { computeCartTotals, getActiveCustomer, getSelectedTier } from '../state/selectors.js';
import { formatMoney } from '../services/invoiceService.js';
import { labelForUnit } from '../services/pricingService.js';

function renderCartLine(item) {
  const unitLabel = item.unitLabel || labelForUnit(item.unit || item.unit_code || 'piece');
  const qty = Number(item.qty || 1);
  const price = Number(item.price || 0);
  const total = qty * price;
  return `
    <article class="cart-line">
      <div class="cart-line__title">${item.title || item.product_name || `#${item.id || item.product_id || ''}`}</div>
      <div class="cart-line__row">
        <span class="cart-line__unit">${unitLabel}</span>
        <div class="cart-line__stepper">
          ${item.type === 'product' ? `<button type="button" data-action="qty-down" data-key="${item.key}">-</button><input type="number" min="1" value="${qty}" data-role="cart-qty" data-key="${item.key}" /><button type="button" data-action="qty-up" data-key="${item.key}">+</button>` : ''}
        </div>
        <strong class="cart-line__price">${formatMoney(price)} ج.م</strong>
        <strong class="cart-line__total">${formatMoney(total)} ج.م</strong>
      </div>
      <div class="cart-line__actions">
        <button class="btn btn--ghost" type="button" data-action="remove-item" data-key="${item.key}">حذف</button>
      </div>
    </article>
  `;
}

export function renderTierProgress(state, totals, tier) {
  if (!tier || tier.tier_name === 'base') return '';
  const remaining = Math.max(0, Number(tier.min_order || 0) - Number(totals.grand || 0));
  return `
    <section class="page-section page-section--dense">
      <div class="tier-progress">
        <div><h2>${tier.visible_label || tier.tier_name}</h2><p>المتبقي لتحقيق الشريحة</p></div>
        <div class="tier-progress__value"><strong>${formatMoney(remaining)} ج.م</strong><span>المتبقي لتحقيق الشريحة</span></div>
      </div>
    </section>
  `;
}

export function renderCartPage(state) {
  const totals = computeCartTotals(state);
  const tier = getSelectedTier(state);
  const customer = getActiveCustomer(state) || state.auth.session;
  return `
    <div class="page-stack page-stack--cart">
      <section class="page-section page-section--dense">
        <div class="page-section__head page-section__head--tight">
          <div><h2>السلة</h2><p>مراجعة العناصر قبل المتابعة</p></div>
        </div>
        <div class="checkout-box checkout-box--total">
          <div class="checkout-box__row"><span>الإجمالي</span><strong>${formatMoney(totals.grand)} ج.م</strong></div>
        </div>
      </section>
      ${renderTierProgress(state, totals, tier)}
      <section class="page-section page-section--dense">
        <div class="cart-list">
          ${(state.commerce.cart || []).map(renderCartLine).join('') || '<div class="empty-state">السلة فارغة</div>'}
        </div>
      </section>
      <section class="page-section page-section--summary">
        <div class="summary-box">
          <div><span>الإجمالي</span><strong>${formatMoney(totals.grand)} ج.م</strong></div>
          <div><span>المنتجات</span><strong>${formatMoney(totals.products)} ج.م</strong></div>
          <div><span>الصفقات</span><strong>${formatMoney(totals.deals + totals.flash)} ج.م</strong></div>
          <button class="btn btn--primary" type="button" data-action="go-checkout">إغلاق السلة ومتابعة الشراء</button>
        </div>
      </section>
    </div>
  `;
}

export function renderCheckoutPage(state) {
  const totals = computeCartTotals(state);
  const tier = getSelectedTier(state);
  const customer = getActiveCustomer(state) || state.auth.session;
  const loading = state.runtime.loading.checkout;
  const remaining = Math.max(0, Number(tier?.min_order || 0) - Number(totals.grand || 0));
  return `
    <div class="page-stack page-stack--checkout checkout-page">
      <section class="page-section checkout-page__hero">
        <div class="page-section__head">
          <div><h2>إتمام الطلب</h2><p>شاشة مستقلة للإرسال النهائي</p></div>
        </div>
        <div class="checkout-box checkout-box--total checkout-page__total">
          <div class="checkout-box__row"><span>الإجمالي الكلي</span><strong>${formatMoney(totals.grand)} ج.م</strong></div>
          <div class="checkout-box__row"><span>الشريحة</span><strong>${tier.visible_label || tier.tier_name}</strong></div>
          <div class="checkout-box__row"><span>العميل</span><strong>${customer?.name || 'غير محدد'}</strong></div>
          <div class="checkout-box__row"><span>حد الشريحة</span><strong>${formatMoney(tier.min_order || 0)} ج.م</strong></div>
          ${tier.tier_name && tier.tier_name !== 'base' ? `<div class="checkout-box__row"><span>المتبقي لتحقيق الشريحة</span><strong>${formatMoney(remaining)} ج.م</strong></div>` : ''}
          <button class="btn btn--primary" type="button" data-action="submit-checkout">${loading ? 'جارٍ الإرسال…' : 'إرسال الطلب'}</button>
        </div>
      </section>
      <section class="page-section page-section--dense">
        <div class="page-section__head page-section__head--tight">
          <div><h2>عناصر الفاتورة</h2><p>عرض مضغوط للحسابات</p></div>
        </div>
        <div class="cart-list">
          ${(state.commerce.cart || []).map(renderCartLine).join('') || '<div class="empty-state">السلة فارغة</div>'}
        </div>
      </section>
    </div>
  `;
}
