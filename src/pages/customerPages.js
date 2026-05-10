import { customerCard, invoiceCard } from '../components/cards.js';

function getCustomerNameMap(state) {
  return new Map((state.commerce.customers || []).map((customer) => [String(customer.id), customer.name || '']));
}

export function renderCustomersPage(state) {
  if (state.auth.session?.userType !== 'rep') {
    return `<section class="empty-panel"><div class="empty-state">هذه الصفحة متاحة للمندوب فقط</div></section>`;
  }
  const customers = state.commerce.customers || [];
  const selectedId = state.auth.selectedCustomer?.id;
  const pendingFlow = state.ui.pendingFlow;
  return `
    <div class="page-stack">
      <section class="page-section">
        <div class="page-section__head">
          <div>
            <h2>عملائي</h2>
            <p>${pendingFlow?.name === 'checkout' ? 'يجب اختيار العميل أولًا' : 'إدارة العملاء المرتبطين بالمندوب'}</p>
          </div>
          <button class="btn btn--primary" type="button" data-action="open-customer-modal">إضافة عميل</button>
        </div>
        ${pendingFlow?.name === 'checkout' ? '<div class="badge">بعد الاختيار سيتم فتح شاشة إتمام الطلب مباشرة</div>' : ''}
        <div class="customer-grid">${customers.map((customer) => customerCard(customer, String(customer.id) === String(selectedId))).join('') || '<div class="empty-state">لا توجد عملاء</div>'}</div>
      </section>
    </div>
  `;
}

export function renderInvoicesPage(state) {
  const customerNames = getCustomerNameMap(state);
  return `
    <div class="page-stack">
      <section class="page-section">
        <div class="page-section__head"><div><h2>فواتيري</h2><p>الطلبات السابقة</p></div><button class="btn btn--ghost" type="button" data-action="refresh-invoices">تحديث</button></div>
        <div class="invoice-grid">${(state.commerce.invoices || []).map((invoice) => invoiceCard(invoice, state.auth.session?.userType === 'rep' ? (customerNames.get(String(invoice.customer_id)) || invoice.customer_name || '') : '')).join('') || '<div class="empty-state">لا توجد فواتير</div>'}</div>
      </section>
    </div>
  `;
}

export function renderAccountPage(state) {
  const session = state.auth.session;
  return `
    <div class="page-stack">
      <section class="page-section">
        <div class="page-section__head"><div><h2>الحساب</h2><p>معلومات الجلسة والإعدادات</p></div></div>
        ${session ? `
          <div class="account-card">
            <div class="account-card__row"><span>الاسم</span><strong>${session.name || session.username || '—'}</strong></div>
            <div class="account-card__row"><span>النوع</span><strong>${session.userType === 'rep' ? 'مندوب' : 'عميل'}</strong></div>
            <div class="account-card__row"><span>الهاتف</span><strong>${session.phone || '—'}</strong></div>
            <div class="account-card__row"><span>النوع التصميمي</span><strong>${state.ui.theme}</strong></div>
            <div class="account-card__actions">
              <button class="btn btn--ghost" type="button" data-action="logout">تسجيل الخروج</button>
              <button class="btn btn--primary" type="button" data-action="go-invoices">فواتيري</button>
            </div>
          </div>
        ` : '<div class="empty-state">غير مسجل الدخول</div>'}
      </section>
    </div>
  `;
}
