import { formatCairoDateTime, formatMoney } from '../services/invoiceService.js';
import { computeCartTotals, getSelectedTier, getActiveCustomer } from '../state/selectors.js';

function renderCartLine(item) {
  const qty = Number(item.qty || 1);
  const unitPrice = Number(item.price || 0);
  const lineTotal = qty * unitPrice;
  return `
    <article class="invoice-line invoice-line--editable">
      <div class="invoice-line__thumb">
        ${item.image ? `<img src="${item.image}" alt="${item.title || ''}" loading="lazy" />` : '<span>•</span>'}
      </div>
      <div class="invoice-line__content">
        <div class="invoice-line__top">
          <div>
            <h3>${item.title || ''}</h3>
            <p>${item.unitLabel || item.unit || ''}</p>
          </div>
          <strong>${formatMoney(lineTotal)} ج.م</strong>
        </div>
        <div class="invoice-line__meta">
          <span>سعر الوحدة ${formatMoney(unitPrice)} ج.م</span>
          <span>الكمية ${qty}</span>
        </div>
        <div class="invoice-line__actions">
          <div class="qty-stepper qty-stepper--invoice ${item.type === 'product' ? '' : 'is-disabled'}">
            ${item.type === 'product' ? `<button type="button" data-action="qty-down" data-key="${item.key}">-</button><input type="number" min="1" value="${qty}" data-role="cart-qty" data-key="${item.key}" /><button type="button" data-action="qty-up" data-key="${item.key}">+</button>` : ''}
          </div>
          <button class="btn btn--ghost" type="button" data-action="remove-item" data-key="${item.key}">حذف</button>
        </div>
      </div>
    </article>
  `;
}

function progressPct(total, minOrder) {
  if (!Number(minOrder)) return 100;
  return Math.max(0, Math.min(100, (Number(total || 0) / Number(minOrder || 1)) * 100));
}

function renderInvoiceLayout({ state, totals, tier, customer, itemsHtml, title, subtitle, actionLabel, actionDisabled, actionAttr, footerNote, invoiceId = null, compact = false }) {
  const remaining = Math.max(0, Number(tier.min_order || 0) - Number(totals.grand || 0));
  const progress = progressPct(totals.grand, tier.min_order);
  return `
    <div class="page-stack checkout-page checkout-page--full invoice-page ${compact ? 'invoice-page--compact' : ''}">
      <section class="page-section invoice-hero">
        <div class="invoice-hero__head">
          <div>
            <h2>${title}</h2>
            <p>${subtitle}</p>
          </div>
          ${invoiceId ? `<div class="badge">#${invoiceId}</div>` : ''}
        </div>
        <div class="invoice-hero__grid">
          <div class="invoice-hero__block">
            <span>الشريحة</span>
            <strong>${tier.visible_label || tier.tier_name}</strong>
          </div>
          <div class="invoice-hero__block">
            <span>العميل</span>
            <strong>${customer?.name || 'غير محدد'}</strong>
          </div>
          <div class="invoice-hero__block invoice-hero__block--total">
            <span>إجمالي السلة</span>
            <strong>${formatMoney(totals.grand)} ج.م</strong>
          </div>
          ${tier.tier_name && tier.tier_name !== 'base' ? `<div class="invoice-hero__block"><span>المتبقي للشريحة</span><strong>${formatMoney(remaining)} ج.م</strong></div>` : ''}
        </div>
        <div class="checkout-progress"><span style="width:${progress}%"></span></div>
      </section>
      <section class="page-section invoice-lines">
        <div class="page-section__head page-section__head--tight"><div><h2>تفاصيل الطلب</h2><p>كل صنف في سطر مستقل</p></div></div>
        <div class="checkout-items invoice-items">${itemsHtml}</div>
      </section>
      <section class="page-section invoice-action">
        <div class="invoice-action__bar">
          <div>
            <span>${footerNote || 'مراجعة نهائية قبل الإرسال'}</span>
            <strong>${formatMoney(totals.grand)} ج.م</strong>
          </div>
          ${actionAttr ? `<button class="btn btn--primary" type="button" ${actionAttr} ${actionDisabled ? 'disabled' : ''}>${actionLabel}</button>` : ''}
        </div>
      </section>
    </div>
  `;
}

export function renderCartPage(state) {
  const totals = computeCartTotals(state);
  const items = state.commerce.cart;
  const tier = getSelectedTier(state);
  const remaining = Math.max(0, Number(tier.min_order || 0) - Number(totals.grand || 0));
  const progress = progressPct(totals.grand, tier.min_order);
  return `
    <div class="page-stack">
      <section class="page-section">
        <div class="page-section__head"><div><h2>السلة</h2><p>عناصر الطلب الحالية</p></div></div>
        <div class="summary-box summary-box--compact">
          <div><span>الشريحة الحالية</span><strong>${tier.visible_label || tier.tier_name}</strong></div>
          <div><span>الإجمالي</span><strong>${formatMoney(totals.grand)} ج.م</strong></div>
          ${tier.tier_name && tier.tier_name !== 'base' ? `<div><span>المتبقي لتحقيق الشريحة</span><strong>${formatMoney(remaining)} ج.م</strong></div>` : ''}
          <div class="checkout-progress"><span style="width:${progress}%"></span></div>
        </div>
        <div class="cart-list">
          ${items.length ? items.map(renderCartLine).join('') : '<div class="empty-state">السلة فارغة</div>'}
        </div>
      </section>
      <section class="page-section page-section--summary">
        <div class="summary-box">
          <div><span>الشريحة</span><strong>${tier.visible_label || tier.tier_name}</strong></div>
          ${tier.tier_name && tier.tier_name !== 'base' ? `<div><span>المتبقي لتحقيق الشريحة</span><strong>${formatMoney(remaining)} ج.م</strong></div>` : ''}
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
  const itemsHtml = (state.commerce.cart || []).length ? (state.commerce.cart || []).map(renderCartLine).join('') : '<div class="empty-state">السلة فارغة</div>';
  return renderInvoiceLayout({
    state,
    totals,
    tier,
    customer,
    itemsHtml,
    title: 'مراجعة الطلب',
    subtitle: 'نموذج إرسال الطلب على هيئة فاتورة تشغيلية واحدة',
    actionLabel: state.ui.checkoutBusy ? 'جارٍ الإرسال…' : 'إرسال الطلب',
    actionDisabled: state.ui.checkoutBusy,
    actionAttr: 'data-action="submit-checkout"',
    footerNote: 'أرسل الطلب بعد مراجعة الكميات والأسعار',
  });
}

export function renderInvoicePage(state) {
  const invoiceId = state.app.route.params.invoiceId || state.ui.selectedInvoiceId;
  const invoice = (state.commerce.invoices || []).find((item) => String(item.id) === String(invoiceId));
  if (!invoice) {
    return `<div class="page-stack"><section class="page-section"><div class="empty-state">الفاتورة غير متاحة</div></section></div>`;
  }
  const items = state.commerce.invoiceItemsById?.[String(invoice.id)] || [];
  const totals = { grand: Number(invoice.total_amount || 0), products: 0, deals: 0, flash: 0 };
  const tier = state.commerce.catalog.tiers?.find((item) => item.tier_name === invoice.tier_name) || getSelectedTier(state);
  const customer = { name: invoice.customer_name || 'غير محدد' };
  const itemsHtml = items.length ? items.map((item) => `
    <article class="invoice-line invoice-line--readonly">
      <div class="invoice-line__thumb">
        ${item.image ? `<img src="${item.image}" alt="${item.title || ''}" loading="lazy" />` : '<span>•</span>'}
      </div>
      <div class="invoice-line__content">
        <div class="invoice-line__top">
          <div>
            <h3>${item.title || item.product_name || ''}</h3>
            <p>${item.unit || item.unitLabel || ''}</p>
          </div>
          <strong>${formatMoney(Number(item.qty || 1) * Number(item.price || 0))} ج.م</strong>
        </div>
        <div class="invoice-line__meta">
          <span>الكمية ${Number(item.qty || 1)}</span>
          <span>سعر الوحدة ${formatMoney(Number(item.price || 0))} ج.م</span>
        </div>
      </div>
    </article>
  `).join('') : '<div class="empty-state">لا توجد تفاصيل متاحة</div>';

  return renderInvoiceLayout({
    state,
    totals,
    tier,
    customer,
    itemsHtml,
    title: `فاتورة #${invoice.order_number || invoice.invoice_number || invoice.id}`,
    subtitle: 'عرض الفاتورة بنفس التنسيق التشغيلي',
    actionLabel: 'إغلاق الفاتورة',
    actionDisabled: false,
    actionAttr: 'data-action="go-invoices"',
    footerNote: formatCairoDateTime(invoice.created_at || Date.now()),
    invoiceId: invoice.order_number || invoice.invoice_number || invoice.id,
    compact: true,
  });
}
