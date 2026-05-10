import { formatMoney } from '../services/invoiceService.js';
import { computeCartTotals, getSelectedTier, getActiveCustomer } from '../state/selectors.js';

function renderTierProgress(state, totals, tier) {
  const currentTier = tier?.tier_name || '';
  const remaining = Math.max(0, Number(tier?.min_order || 0) - Number(totals.grand || 0));
  if (!currentTier || currentTier === 'base') return '';
  return `
    <section class="page-section page-section--dense">
      <div class="page-section__head page-section__head--tight"><div><h2>${tier.visible_label || tier.tier_name}</h2><p>المتبقي لتحقيق الشريحة</p></div></div>
      <div class="tier-progress"><strong>${formatMoney(remaining)} ج.م</strong><span>المتبقي لتحقيق الشريحة</span></div>
    </section>
  `;
}

export function renderCartPage(state) {
  const totals = computeCartTotals(state);
  const tier = getSelectedTier(state);
  const customer = getActiveCustomer(state) || state.auth.session;
  return `
    <div class="page-stack">
      <section class="page-section page-section--dense">
        <div class="page-section__head page-section__head--tight">
          <div><h2>السلة</h2><p>مراجعة العناصر قبل المتابعة</p></div>
        </div>
        <div class="checkout-box checkout-box--total">
          <div class="checkout-box__row"><span>الإجمالي</span><strong>${formatMoney(totals.grand)} ج.م</strong></div>
        </div>
      </section>
      ${renderTierProgress(state, totals, tier)}
      <section class="page-section">
        <div class="cart-list">
          ${(state.commerce.cart || []).map((item) => `
            <article class="cart-item">
              <img src="${item.image || ''}" alt="${item.title || ''}" loading="lazy" />
              <div>
                <h3>${item.title || ''}</h3>
                <p>${item.unitLabel || item.unit || ''}</p>
                <p>${Number(item.qty || 1)} × ${formatMoney(item.price || 0)} ج.م</p>
                <p>الإجمالي ${formatMoney(Number(item.qty || 1) * Number(item.price || 0))} ج.م</p>
                <div class="cart-item__actions">
                  ${item.type === 'product' ? `<button type="button" data-action="qty-down" data-key="${item.key}">-</button><input type="number" min="1" value="${Number(item.qty || 1)}" data-role="cart-qty" data-key="${item.key}" /><button type="button" data-action="qty-up" data-key="${item.key}">+</button>` : ''}
                  <button class="btn btn--ghost" type="button" data-action="remove-item" data-key="${item.key}">حذف</button>
                </div>
              </div>
            </article>
          `).join('') || '<div class="empty-state">السلة فارغة</div>'}
        </div>
      </section>
      <section class="page-section page-section--summary">
        <div class="summary-box">
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
  const loading = state.runtime.loading.checkout;
  const remaining = Math.max(0, Number(tier?.min_order || 0) - Number(totals.grand || 0));
  return `
    <div class="page-stack">
      <section class="page-section">
        <div class="page-section__head"><div><h2>التحقق من الطلب</h2><p>مراجعة نهائية قبل الإنشاء</p></div></div>
        <div class="checkout-box">
          <div class="checkout-box__row"><span>الشريحة</span><strong>${tier.visible_label || tier.tier_name}</strong></div>
          <div class="checkout-box__row"><span>العميل</span><strong>${customer?.name || 'غير محدد'}</strong></div>
          <div class="checkout-box__row"><span>الإجمالي</span><strong>${formatMoney(totals.grand)} ج.م</strong></div>
          <div class="checkout-box__row"><span>حد الشريحة</span><strong>${formatMoney(tier.min_order || 0)} ج.م</strong></div>
          ${tier.tier_name && tier.tier_name !== 'base' ? `<div class="checkout-box__row"><span>المتبقي لتحقيق الشريحة</span><strong>${formatMoney(remaining)} ج.م</strong></div>` : ''}
          <button class="btn btn--primary" type="button" data-action="submit-checkout">${loading ? 'جارٍ الإرسال…' : 'إرسال الطلب'}</button>
        </div>
      </section>
    </div>
  `;
}
