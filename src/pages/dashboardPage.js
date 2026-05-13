import { dom } from '../core/dom.js';
import { invoiceCard } from '../components/cards.js';
import { hasOperationalDashboard } from '../state/selectors.js';

const CAPABILITY_WIDGETS = {
  'orders.review': { label: 'مراجعة الطلبات', description: 'مراجعة الطلبات قبل الانتقال للمرحلة التالية', action: 'go-invoices', actionLabel: 'فتح الطلبات' },
  'warehouse.prepare': { label: 'التحضير', description: 'الطلبات التي تحتاج تجهيز ومراجعة مخزون', action: 'go-invoices', actionLabel: 'فتح الطلبات' },
  'shipment.dispatch': { label: 'الشحن', description: 'الطلبات الجاهزة للخروج للشحن', action: 'go-invoices', actionLabel: 'فتح الطلبات' },
  'delivery.execute': { label: 'التوصيل والتحصيل', description: 'مهام التسليم والتحصيل الميداني', action: 'go-invoices', actionLabel: 'فتح الفواتير' },
  'returns.receive': { label: 'المرتجعات', description: 'استلام ومتابعة المرتجعات', action: 'go-invoices', actionLabel: 'فتح الفواتير' },
  'system.manage_users': { label: 'إدارة المستخدمين', description: 'عرض وإدارة الحسابات التشغيلية', action: 'go-account', actionLabel: 'الحساب' },
  'system.manage_capabilities': { label: 'إدارة الصلاحيات', description: 'مراجعة الصلاحيات والتراخيص التشغيلية', action: 'go-account', actionLabel: 'الحساب' },
  'customers.manage': { label: 'إدارة العملاء', description: 'الوصول إلى العملاء وإدارتهم', action: 'go-customers', actionLabel: 'فتح العملاء' },
};

function getUserTypeLabel(userType) {
  const value = String(userType || '').trim().toLowerCase();
  if (value === 'admin') return 'إداري';
  if (value === 'rep' || value === 'sales_rep') return 'مندوب';
  if (value === 'customer') return 'عميل';
  return value || 'تشغيلي';
}


function capabilityWidget(capability) {
  if (!capability) return '';
  const key = String(capability.capability_key || '').trim();
  const widget = CAPABILITY_WIDGETS[key] || { label: capability.display_name || key, description: capability.description || 'صلاحية تشغيلية', action: null, actionLabel: 'عرض' };
  const actionAttr = widget.action ? ` data-action="${widget.action}"` : '';
  return `
    <article class="dashboard-card">
      <div class="dashboard-card__head">
        <div>
          <h3>${dom.escape(widget.label)}</h3>
          <p>${dom.escape(widget.description)}</p>
        </div>
        <span class="badge">${dom.escape(capability.domain_key || 'domain')}</span>
      </div>
      <div class="dashboard-card__meta">
        <span class="chip">${dom.escape(key || 'capability')}</span>
        <span class="chip">${capability.is_active === false ? 'متوقفة' : 'نشطة'}</span>
      </div>
      ${widget.action ? `<button class="btn btn--ghost dashboard-card__action" type="button"${actionAttr}>${dom.escape(widget.actionLabel)}</button>` : ''}
    </article>
  `;
}

export function renderDashboardPage(state) {
  const session = state.auth.session;
  const userType = String(session?.userType || session?.user_type || '').trim().toLowerCase();
  const systemUser = state.governance?.systemUser || null;
  const capabilities = Array.isArray(state.governance?.capabilities) ? state.governance.capabilities : [];
  const capabilitiesToShow = capabilities.filter((item) => item && item.is_active !== false);

  if (!session) {
    return `
      <div class="page-stack dashboard-page">
        <section class="page-section">
          <div class="empty-state">سجّل الدخول أولًا لعرض لوحة التحكم</div>
        </section>
      </div>
    `;
  }

  if (userType === 'rep') {
    const customers = Array.isArray(state.commerce.customers) ? state.commerce.customers : [];
    const invoices = Array.isArray(state.commerce.invoices) ? state.commerce.invoices : [];
    const scopedOrders = invoices.slice(0, 5);
    const customerCount = customers.length;
    const ordersCount = invoices.length;
    const recentOrderLabel = scopedOrders.length ? 'أحدث طلبات العملاء المرتبطة بك' : 'لا توجد طلبات بعد';
    return `
      <div class="page-stack dashboard-page dashboard-page--rep">
        <section class="page-section dashboard-summary">
          <div class="page-section__head">
            <div>
              <h2>لوحة المندوب</h2>
              <p>عرض مرئي مطابق لعملائك وطلباتك فقط</p>
            </div>
            <span class="badge">${dom.escape(session.name || session.username || session.phone || 'مندوب')}</span>
          </div>
          <div class="dashboard-summary__grid">
            <div class="dashboard-summary__card">
              <span>عدد العملاء</span>
              <strong>${customerCount}</strong>
            </div>
            <div class="dashboard-summary__card">
              <span>الطلبات المرتبطة</span>
              <strong>${ordersCount}</strong>
            </div>
            <div class="dashboard-summary__card">
              <span>الفواتير</span>
              <strong>${ordersCount}</strong>
            </div>
            <div class="dashboard-summary__card">
              <span>الحالة</span>
              <strong>إجمالي مرئي حسب المالك فقط</strong>
            </div>
          </div>
        </section>

        <section class="page-section">
          <div class="page-section__head">
            <div>
              <h2>${recentOrderLabel}</h2>
              <p>آخر التحركات الخاصة بعملائك</p>
            </div>
          </div>
          <div class="invoice-grid">
            ${scopedOrders.map(invoiceCard).join('') || '<div class="empty-state">لا توجد طلبات مرتبطة بالمندوب</div>'}
          </div>
        </section>

        <section class="page-section">
          <div class="page-section__head page-section__head--tight">
            <div>
              <h2>الوصول السريع</h2>
              <p>إضافة عميل أو بدء طلب جديد</p>
            </div>
          </div>
          <div class="dashboard-shortcuts">
            <button class="btn btn--primary" type="button" data-action="open-customer-modal">إضافة عميل</button>
            <button class="btn btn--ghost" type="button" data-action="go-checkout">إنشاء طلب</button>
            <button class="btn btn--ghost" type="button" data-action="go-customers">عملائي</button>
            <button class="btn btn--ghost" type="button" data-action="go-account">بياناتي</button>
          </div>
        </section>
      </div>
    `;
  }

  const operational = hasOperationalDashboard(state);
  if (!operational) {
    return `
      <div class="page-stack dashboard-page">
        <section class="page-section">
          <div class="page-section__head">
            <div>
              <h2>لوحة التحكم</h2>
              <p>هذه المساحة تظهر للحسابات التشغيلية فقط</p>
            </div>
          </div>
          <div class="empty-state">لا توجد صلاحيات تشغيلية مرتبطة بهذا الحساب</div>
        </section>
      </div>
    `;
  }

  return `
    <div class="page-stack dashboard-page">
      <section class="page-section dashboard-summary">
        <div class="page-section__head">
          <div>
            <h2>لوحة التحكم</h2>
            <p>عرض تشغيلي حسب الصلاحيات الفعلية</p>
          </div>
          <span class="badge">${dom.escape(getUserTypeLabel(systemUser?.user_type || session.userType))}</span>
        </div>
        <div class="dashboard-summary__grid">
          <div class="dashboard-summary__card">
            <span>الاسم</span>
            <strong>${dom.escape(systemUser?.full_name || session.name || session.username || '—')}</strong>
          </div>
          <div class="dashboard-summary__card">
            <span>الهاتف</span>
            <strong>${dom.escape(systemUser?.phone || session.phone || session.username || '—')}</strong>
          </div>
          <div class="dashboard-summary__card">
            <span>الصلاحيات</span>
            <strong>${capabilitiesToShow.length}</strong>
          </div>
          <div class="dashboard-summary__card">
            <span>المدير</span>
            <strong>${dom.escape(systemUser?.manager_user_id ? 'مرتبط إداريًا' : 'مباشر')}</strong>
          </div>
        </div>
      </section>

      <section class="page-section">
        <div class="page-section__head">
          <div>
            <h2>الصلاحيات المتاحة</h2>
            <p>بطاقات تشغيل خفيفة قابلة للتوسعة لاحقًا</p>
          </div>
        </div>
        <div class="dashboard-grid">
          ${capabilitiesToShow.map(capabilityWidget).join('') || '<div class="empty-state">لا توجد صلاحيات</div>'}
        </div>
      </section>

      <section class="page-section">
        <div class="page-section__head page-section__head--tight">
          <div>
            <h2>الوصول السريع</h2>
            <p>اختصارات تتماشى مع واجهة الحساب الحالية</p>
          </div>
        </div>
        <div class="dashboard-shortcuts">
          <button class="btn btn--ghost" type="button" data-action="go-account">بياناتي</button>
          <button class="btn btn--ghost" type="button" data-action="go-invoices">فواتيري</button>
          <button class="btn btn--ghost" type="button" data-action="install-app">تثبيت التطبيق</button>
          <button class="btn btn--ghost" type="button" data-action="logout">تسجيل الخروج</button>
        </div>
      </section>
    </div>
  `;
}

