import { customerCard } from '../components/cards.js';
import { formatMoney, formatStatus } from '../services/invoiceService.js';

function customerNameForInvoice(state, invoice) {
  const id = String(invoice?.customer_id || '').trim();
  if (!id) return invoice?.customer_name || '—';
  const inStateCustomer = (state.commerce.customers || []).find((customer) => String(customer.id) === id);
  if (inStateCustomer) return inStateCustomer.name || '—';
  if (state.auth.selectedCustomer && String(state.auth.selectedCustomer.id) === id) return state.auth.selectedCustomer.name || '—';
  if (state.auth.session && String(state.auth.session.id) === id) return state.auth.session.name || state.auth.session.username || '—';
  return invoice?.customer_name || '—';
}

function invoiceSummaryCard(state, invoice) {
  const customerName = customerNameForInvoice(state, invoice);
  return `
    <article class="invoice-card">
      <div class="invoice-card__top">
        <div>
          <h3>فاتورة #${String(invoice.order_number || invoice.invoice_number || invoice.id || '').replace(/^#/, '')}</h3>
          <p>${customerName}</p>
        </div>
        <strong>${formatMoney(invoice.total_amount || 0)} ج.م</strong>
      </div>
      <div class="invoice-card__meta">
        <span class="chip">${invoice.user_type === 'rep' ? 'rep' : 'customer'}</span>
        <span class="chip">${formatStatus(invoice.status || '')}</span>
      </div>
      <div class="invoice-card__actions">
        <button class="btn btn--ghost" type="button" data-action="open-invoice-details" data-invoice-id="${String(invoice.id)}">تفاصيل الطلب</button>
      </div>
    </article>
  `;
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
  const invoices = state.commerce.invoices || [];
  return `
    <div class="page-stack">
      <section class="page-section">
        <div class="page-section__head"><div><h2>فواتيري</h2><p>الطلبات السابقة</p></div><button class="btn btn--ghost" type="button" data-action="refresh-invoices">تحديث</button></div>
        <div class="invoice-grid">${invoices.map((invoice) => invoiceSummaryCard(state, invoice)).join('') || '<div class="empty-state">لا توجد فواتير</div>'}</div>
      </section>
    </div>
  `;
}

function lineItemLabel(item) {
  const unit = String(item?.unit || item?.unitCode || 'piece');
  const labels = {
    carton: 'كرتونة',
    pack: 'دستة',
    half_pack: 'نصف دستة',
    piece: 'قطعة',
    single: 'قطعة',
  };
  return labels[unit] || item.unit || item.unitCode || 'قطعة';
}

export function renderInvoiceDetailsPage(state) {
  const detail = state.runtime.lastInvoiceDetail;
  if (!detail?.order) {
    return `
      <div class="page-stack">
        <section class="page-section">
          <div class="page-section__head">
            <div>
              <h2>تفاصيل الطلب</h2>
              <p>تعذر العثور على بيانات الفاتورة</p>
            </div>
          </div>
          <div class="empty-state">لا توجد بيانات لهذه الفاتورة الآن</div>
        </section>
      </div>
    `;
  }
  const { order, items, customerName, repName, whatsappMessage } = detail;
  return `
    <div class="page-stack">
      <section class="page-section">
        <div class="page-section__head">
          <div>
            <h2>تفاصيل الطلب</h2>
            <p>مطابقة مع قاعدة البيانات وواتساب</p>
          </div>
          <button class="btn btn--ghost" type="button" data-action="go-invoices">رجوع للفواتير</button>
        </div>
        <div class="invoice-detail-card">
          <div class="invoice-detail-card__row"><span>العميل</span><strong>${customerName || '—'}</strong></div>
          <div class="invoice-detail-card__row"><span>رقم الفاتورة</span><strong>${order.order_number || order.invoice_number || order.id || '—'}</strong></div>
          <div class="invoice-detail-card__row"><span>التاريخ</span><strong>${new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(order.created_at || Date.now()))}</strong></div>
          <div class="invoice-detail-card__row"><span>المندوب</span><strong>${repName || '—'}</strong></div>
          <div class="invoice-detail-card__row"><span>الإجمالي</span><strong>${formatMoney(order.total_amount || 0)} ج.م</strong></div>
          <div class="invoice-detail-card__row"><span>الحالة</span><strong>${formatStatus(order.status || '')}</strong></div>
        </div>
      </section>
      <section class="page-section">
        <div class="page-section__head"><div><h2>المنتجات</h2><p>العناصر المرسلة للقاعدة والواتساب</p></div></div>
        <div class="invoice-line-list">
          ${(items || []).map((item) => `
            <article class="invoice-line">
              <div>
                <h3>${item.productName || item.name || item.productId || ''}</h3>
                <p>${lineItemLabel(item)} · الكمية ${Number(item.qty || 1)} · ${formatMoney(item.finalPrice || 0)} ج.م</p>
              </div>
              <strong>${formatMoney(Number(item.qty || 0) * Number(item.finalPrice || 0))} ج.م</strong>
            </article>
          `).join('')}
        </div>
      </section>
      <section class="page-section">
        <div class="page-section__head"><div><h2>رسالة واتساب</h2><p>النص المرسل كما تم إنشاؤه</p></div></div>
        <div class="whatsapp-preview">${String(whatsappMessage || '').replace(/
/g, '<br />')}</div>
      </section>
    </div>
  `;
}

export function renderAccountPage(state) {
  const session = state.auth.session;
  return `
    <div class="page-stack">
      <section class="page-section">
        <div class="page-section__head">
          <div>
            <h2>الحساب</h2>
            <p>معلومات الجلسة والإعدادات</p>
          </div>
        </div>
        ${session ? `
          <div class="account-card">
            <div class="account-card__row"><span>الاسم</span><strong>${session.name || session.username || '—'}</strong></div>
            <div class="account-card__row"><span>النوع</span><strong>${session.userType === 'rep' ? 'مندوب' : 'عميل'}</strong></div>
            <div class="account-card__row"><span>الهاتف</span><strong>${session.phone || '—'}</strong></div>
            <div class="account-card__row"><span>النوع التصميمي</span><strong>${state.ui?.theme || 'dark'}</strong></div>
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
