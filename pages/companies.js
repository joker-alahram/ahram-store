function renderInvoicesPage() {
  const rows = state.invoices;
  els.pageContent.innerHTML = `
    <div class="page-stack">
      <section class="section-card">
        <div class="section-head">
          <div>
            <h2>فواتيري</h2>
            <div class="helper-text">نفس قالب الفاتورة يظهر هنا وفي واتساب وتفاصيل الطلب</div>
          </div>
          <button class="ghost-btn" data-action="refresh-invoices" type="button">تحديث</button>
        </div>
      </section>
      <section class="invoice-list">
        ${!state.session ? `<div class="empty-state">سجّل الدخول لعرض الفواتير</div>` : rows.length ? rows.map(renderInvoiceCard).join('') : `<div class="empty-state">لا توجد فواتير مرتبطة بهذا الحساب</div>`}
      </section>
    </div>
  `;
}
function renderInvoiceCard(order) {
  const model = buildInvoiceModel(order, order.items || [], { source: 'dashboard' });
  return invoiceViewHtml(model);
}
