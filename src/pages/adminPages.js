import { formatMoney, formatStatus } from '../services/invoiceService.js';
import { getSelectedTier } from '../state/selectors.js';

function statCard(title, value, note = '') {
  return `
    <article class="stat-card">
      <span class="stat-card__label">${title}</span>
      <strong class="stat-card__value">${value}</strong>
      ${note ? `<small class="stat-card__note">${note}</small>` : ''}
    </article>
  `;
}

export function renderAdminPage(state) {
  const catalog = state.commerce.catalog || {};
  const health = Array.isArray(catalog.health) ? catalog.health : [];
  const products = Object.values(catalog.productIndex || {});
  const companies = catalog.companies || [];
  const tiers = catalog.tiers || [];
  const selectedTier = getSelectedTier(state);
  const orderCount = (state.commerce.invoices || []).length;
  const healthLabel = health.find((row) => row.runtime_healthy === false) ? 'needs-attention' : 'stable';

  return `
    <div class="page-stack">
      <section class="page-section">
        <div class="page-section__head">
          <div>
            <h2>لوحة الإدارة</h2>
            <p>ملخص مباشر من طبقة العقود الحالية</p>
          </div>
        </div>
        <div class="stat-grid">
          ${statCard('الشركات', companies.length, 'من الفيوهات المعتمدة')}
          ${statCard('المنتجات', products.length, 'v_runtime_products')}
          ${statCard('الشرائح', tiers.length, selectedTier.display_name || selectedTier.tier_name)}
          ${statCard('الطلبات', orderCount, healthLabel)}
        </div>
      </section>
      <section class="page-section">
        <div class="page-section__head"><div><h2>حالة النظام</h2><p>v_runtime_commerce_health</p></div></div>
        <div class="list-stack">
          ${(health.length ? health : [{ label: 'stable', issue_count: 0, runtime_healthy: true }]).map((row) => `
            <article class="compact-row">
              <strong>${row.label || row.name || 'health'}</strong>
              <span>${row.runtime_healthy === false ? 'غير سليم' : 'سليم'}</span>
              <span>${row.issue_count ?? 0} ملاحظة</span>
            </article>
          `).join('')}
        </div>
      </section>
      <section class="page-section">
        <div class="page-section__head"><div><h2>آخر الطلبات</h2><p>v_orders_status</p></div></div>
        <div class="list-stack">
          ${(state.commerce.invoices || []).slice(0, 8).map((row) => `
            <article class="compact-row">
              <strong>${row.order_number || row.invoice_number || row.id}</strong>
              <span>${formatStatus(row.status || row.order_status || 'submitted')}</span>
              <span>${formatMoney(row.total_amount || row.grand_total || 0)} ج.م</span>
            </article>
          `).join('') || '<div class="empty-state">لا توجد بيانات طلبات</div>'}
        </div>
      </section>
    </div>
  `;
}

export function renderRepDashboardPage(state) {
  const session = state.auth.session || {};
  const customers = state.commerce.customers || [];
  return `
    <div class="page-stack">
      <section class="page-section">
        <div class="page-section__head"><div><h2>لوحة المندوب</h2><p>${session.name || 'المندوب'}</p></div></div>
        <div class="stat-grid">
          ${statCard('عملائي', customers.length, 'v_rep_customers')}
          ${statCard('فواتيري', (state.commerce.invoices || []).length, 'v_orders_status')}
          ${statCard('شريحتي', getSelectedTier(state).display_name || '-', '')}
        </div>
      </section>
    </div>
  `;
}

export function renderRepOrdersPage(state) {
  return `
    <div class="page-stack">
      <section class="page-section">
        <div class="page-section__head"><div><h2>طلبات المندوب</h2><p>الطلبات المرتبطة بالحساب الحالي</p></div></div>
        <div class="list-stack">
          ${(state.commerce.invoices || []).map((row) => `
            <article class="compact-row">
              <strong>${row.order_number || row.invoice_number || row.id}</strong>
              <span>${formatStatus(row.status || row.order_status || 'submitted')}</span>
              <span>${formatMoney(row.total_amount || row.grand_total || 0)} ج.م</span>
            </article>
          `).join('') || '<div class="empty-state">لا توجد طلبات</div>'}
        </div>
      </section>
    </div>
  `;
}
