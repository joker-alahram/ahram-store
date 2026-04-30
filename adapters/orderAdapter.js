function buildInvoiceModel(order, items = [], context = {}) {
  const isRep = String(order?.user_type || state.session?.userType || '').toLowerCase() === 'rep';
  const customer = order?.customer || (isRep ? state.selectedCustomer || null : state.session || null);
  const rep = order?.rep || (isRep ? state.session || null : order?.sales_rep || null);
  const safeItems = Array.isArray(items) ? items.map((item) => ({
    id: item.product_id ?? item.id ?? '',
    title: item.title || item.name || productById(item.product_id)?.product_name || '',
    unit: item.unit || 'piece',
    qty: Number(item.qty || 0),
    price: Number(item.price || 0),
  })) : [];
  const productsTotal = Number(order?.products_total ?? safeItems.reduce((sum, item) => sum + (item.price * item.qty), 0));
  const dealsTotal = Number(order?.deals_total ?? safeItems.filter((item) => item.unit === 'single').reduce((sum, item) => sum + (item.price * item.qty), 0));
  const flashTotal = Number(order?.flash_total ?? 0);
  const totalAmount = Number(order?.total_amount ?? (productsTotal + dealsTotal + flashTotal));
  return {
    invoice_number: order?.invoice_number || order?.order_number || '',
    order_number: order?.order_number || order?.invoice_number || '',
    customer_type: isRep ? 'مندوب' : 'عميل مباشر',
    customer,
    rep,
    tier_name: order?.tier_name || getSelectedTierLabel(),
    status: order?.status || '',
    created_at: order?.created_at || '',
    items: safeItems,
    totals: {
      products_total: productsTotal,
      deals_total: dealsTotal,
      flash_total: flashTotal,
      total_amount: totalAmount,
    },
    context,
  };
}
function invoiceViewHtml(model) {
  const customer = model.customer || {};
  const rep = model.rep || {};
  return `
    <article class="invoice-card invoice-view">
      <div class="invoice-top">
        <div>
          <div class="invoice-number">فاتورة رقم ${escapeHtml(model.invoice_number || model.order_number || '')}</div>
          <div class="invoice-meta">
            <span>${escapeHtml(formatDateTime(model.created_at || ''))}</span>
            <span>نوع العميل: ${escapeHtml(model.customer_type || '')}</span>
          </div>
        </div>
        <span class="invoice-amount mono">${num(model.totals.total_amount)} ج.م</span>
      </div>

      <div class="invoice-surface">
        <div class="invoice-row"><span class="invoice-label">العميل</span><span class="invoice-value">${escapeHtml(customer.name || customer.username || 'غير متاح')}</span></div>
        <div class="invoice-row"><span class="invoice-label">رقم الهاتف</span><span class="invoice-value">${escapeHtml(customer.phone || 'غير متاح')}</span></div>
        <div class="invoice-row"><span class="invoice-label">العنوان</span><span class="invoice-value">${escapeHtml(customer.address || customer.location || 'غير متاح')}</span></div>
        ${rep?.name ? `<div class="invoice-row"><span class="invoice-label">المندوب</span><span class="invoice-value">${escapeHtml(rep.name || '')}</span></div>` : ''}
        ${rep?.phone ? `<div class="invoice-row"><span class="invoice-label">هاتف المندوب</span><span class="invoice-value">${escapeHtml(rep.phone || '')}</span></div>` : ''}
        <div class="invoice-row"><span class="invoice-label">الشريحة</span><span class="invoice-value">${escapeHtml(model.tier_name || '')}</span></div>
      </div>

      <div class="invoice-items">
        ${model.items.length ? model.items.map((item) => `
          <div class="invoice-item">
            <div class="invoice-item-main">
              <strong>${escapeHtml(item.title || '')}</strong>
              <span>${escapeHtml(item.id || '')}</span>
            </div>
            <div class="invoice-item-meta">
              <span>${escapeHtml(item.unit === 'carton' ? 'كرتونة' : item.unit === 'pack' ? 'دستة' : 'قطعة')}</span>
              <span>${integer(item.qty || 0)} × ${num(item.price)} ج.م</span>
              <span>${num((item.qty || 0) * (item.price || 0))} ج.م</span>
            </div>
          </div>
        `).join('') : '<div class="empty-state">لا توجد عناصر</div>'}
      </div>

      <div class="invoice-surface">
        <div class="invoice-row"><span class="invoice-label">إجمالي المنتجات</span><span class="invoice-value">${num(model.totals.products_total)} ج.م</span></div>
        <div class="invoice-row"><span class="invoice-label">إجمالي العروض</span><span class="invoice-value">${num(model.totals.deals_total)} ج.م</span></div>
        <div class="invoice-row"><span class="invoice-label">إجمالي الساعة</span><span class="invoice-value">${num(model.totals.flash_total)} ج.م</span></div>
        <div class="invoice-row"><span class="invoice-label">الإجمالي النهائي</span><span class="invoice-value">${num(model.totals.total_amount)} ج.م</span></div>
      </div>
    </article>`;
}
function invoiceViewText(model) {
  const lines = [];
  lines.push('🧾 فاتورة طلب شراء');
  lines.push(`رقم الفاتورة: ${model.invoice_number || model.order_number || ''}`);
  lines.push('');
  lines.push(`نوع العميل: ${model.customer_type || ''}`);
  if (model.customer?.name) lines.push(`العميل: ${model.customer.name}`);
  if (model.customer?.phone) lines.push(`رقم الهاتف: ${model.customer.phone}`);
  if (model.customer?.address || model.customer?.location) lines.push(`العنوان: ${model.customer.address || model.customer.location}`);
  if (model.rep?.name) lines.push(`المندوب: ${model.rep.name}`);
  if (model.rep?.phone) lines.push(`هاتف المندوب: ${model.rep.phone}`);
  lines.push(`الشريحة: ${model.tier_name || ''}`);
  lines.push('');
  lines.push('العناصر:');
  model.items.forEach((item) => {
    lines.push(`- ${item.title || ''} | ${item.id || ''} | ${item.unit === 'carton' ? 'كرتونة' : item.unit === 'pack' ? 'دستة' : 'قطعة'} | ${integer(item.qty || 0)} × ${num(item.price)} = ${num((item.qty || 0) * (item.price || 0))}`);
  });
  lines.push('');
  lines.push(`إجمالي المنتجات: ${num(model.totals.products_total)} ج.م`);
  lines.push(`إجمالي العروض: ${num(model.totals.deals_total)} ج.م`);
  lines.push(`إجمالي الساعة: ${num(model.totals.flash_total)} ج.م`);
  lines.push(`الإجمالي النهائي: ${num(model.totals.total_amount)} ج.م`);
  return encodeURIComponent(lines.join('\n'));
}
