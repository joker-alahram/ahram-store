import { toastStack } from '../components/feedback.js';

export function renderDrawer(state) {
  const items = state.commerce.cart || [];
  const open = Boolean(state.ui.drawerOpen);
  return `
    <div class="drawer-shell ${open ? 'is-open' : 'is-hidden'}" id="drawerShell" aria-hidden="${open ? 'false' : 'true'}">
      <button class="drawer-backdrop" type="button" data-action="close-cart-drawer" aria-label="إغلاق السلة"></button>
      <aside class="drawer" id="drawerPanel" aria-hidden="${open ? 'false' : 'true'}">
        <div class="drawer__head">
          <h3>السلة</h3>
          <button class="icon-btn" type="button" data-action="close-cart-drawer" aria-label="إغلاق السلة">×</button>
        </div>
        <div class="drawer__body">
          ${items.length ? items.map((item) => `
            <article class="drawer-item">
              <div>
                <h4>${item.title || ''}</h4>
                <p>${item.unitLabel || item.unit || ''} · ${Number(item.qty || 1)} × ${Number(item.price || 0)}</p>
              </div>
              <button class="btn btn--ghost" type="button" data-action="remove-item" data-key="${item.key}">حذف</button>
            </article>
          `).join('') : '<div class="empty-state">السلة فارغة</div>'}
        </div>
        <div class="drawer__foot">
          <button class="btn btn--primary" type="button" data-action="go-checkout">إتمام الشراء</button>
          <button class="btn btn--ghost drawer__close-btn" type="button" data-action="close-cart-drawer">إغلاق السلة واستكمال التسوق</button>
        </div>
      </aside>
    </div>
  `;
}

export function renderToasts(state) {
  return `
    <div class="toast-stack">
      ${toastStack(state.ui.toastQueue || [])}
    </div>
  `;
}
