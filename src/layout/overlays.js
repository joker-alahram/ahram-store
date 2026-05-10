import { toastStack } from '../components/feedback.js';
import { formatMoney } from '../services/invoiceService.js';

export function renderDrawer(state) {
  const items = state.commerce.cart || [];
  const grand = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
  return `
    <aside class="drawer ${state.ui.drawerOpen ? 'is-open' : 'is-hidden'}" id="drawerPanel" aria-hidden="${state.ui.drawerOpen ? 'false' : 'true'}">
      <div class="drawer__head">
        <h3>السلة</h3>
        <button class="icon-btn" type="button" data-action="close-cart-drawer">×</button>
      </div>
      <div class="drawer__body">
        ${items.length ? items.map((item) => `
          <article class="cart-item">
            <img src="${item.image || ''}" alt="${item.title || ''}" loading="lazy" />
            <div>
              <h4>${item.title || ''}</h4>
              <p>${item.unitLabel || item.unit || ''}</p>
              <p>${Number(item.qty || 1)} × ${formatMoney(item.price || 0)} ج.م</p>
              <p>الإجمالي ${formatMoney(Number(item.qty || 1) * Number(item.price || 0))} ج.م</p>
              <div class="cart-item__actions">
                ${item.type === 'product' ? `<button type="button" data-action="qty-down" data-key="${item.key}">-</button><input type="number" min="1" value="${Number(item.qty || 1)}" data-role="cart-qty" data-key="${item.key}" /><button type="button" data-action="qty-up" data-key="${item.key}">+</button>` : ''}
                <button class="btn btn--ghost" type="button" data-action="remove-item" data-key="${item.key}">حذف</button>
              </div>
            </div>
          </article>
        `).join('') : '<div class="empty-state">السلة فارغة</div>'}
      </div>
      <div class="drawer__foot">
        <div class="drawer__total"><span>الإجمالي</span><strong>${formatMoney(grand)} ج.م</strong></div>
        <button class="btn btn--primary" type="button" data-action="go-checkout">إتمام الشراء</button>
        <button class="btn btn--ghost" type="button" data-action="close-cart-drawer">إغلاق السلة ومتابعة الشراء</button>
      </div>
    </aside>
  `;
}

export function renderToasts(state) {
  return `
    <div class="toast-stack">
      ${toastStack(state.ui.toastQueue || [])}
    </div>
  `;
}
