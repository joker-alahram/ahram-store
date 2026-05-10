import { toastStack } from '../components/feedback.js';
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
        ${items.length ? items.map(renderCartLine).join('') : '<div class="empty-state">السلة فارغة</div>'}
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
