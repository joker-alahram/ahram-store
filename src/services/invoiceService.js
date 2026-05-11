import { storageKeys } from '../core/storage.js';

const STATUS_MAP = {
  draft: 'مسودة',
  pending: 'قيد التنفيذ',
  confirmed: 'تم التأكيد',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  paid: 'مدفوع',
  submitted: 'تم الإرسال',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  rejected: 'مرفوض',
};

export function formatStatus(status) {
  return STATUS_MAP[String(status || '').trim()] || String(status || 'غير معروف');
}

export function persistInvoices(invoices) {
  void invoices;
}

function formatInvoiceNumber(order = {}) {
  return order.order_number || order.invoice_number || order.id || '';
}

function normalizeInvoiceLine(item = {}, index = 0) {
  const qty = Math.max(1, Number(item.qty || 1));
  const price = Number(item.price || 0);
  const total = qty * price;
  return {
    index,
    title: item.title || item.name || item.product_name || '',
    code: item.id || item.product_id || '',
    unit: item.unitLabel || item.unit || 'قطعة',
    qty,
    price,
    total,
  };
}

export function buildInvoiceModel({ order = {}, items = [], session = null, customer = null, tierLabel = '' } = {}) {
  const normalizedItems = (Array.isArray(items) ? items : []).map((item, index) => normalizeInvoiceLine(item, index));
  return {
    number: formatInvoiceNumber(order),
    createdAt: order.created_at || new Date().toISOString(),
    totalAmount: Number(order.total_amount ?? normalizedItems.reduce((sum, item) => sum + item.total, 0)),
    status: order.status || '',
    userType: order.user_type || session?.userType || '',
    tierLabel: tierLabel || 'الشريحة الرئيسية',
    rep: session?.userType === 'rep'
      ? {
          name: session.name || '',
          phone: session.phone || '',
          address: session.address || session.location || '',
        }
      : null,
    customer: customer
      ? {
          name: customer.name || '',
          phone: customer.phone || '',
          address: customer.address || customer.location || '',
        }
      : {
          name: session?.name || '',
          phone: session?.phone || '',
          address: session?.address || session?.location || '',
        },
    items: normalizedItems,
  };
}

function renderInvoiceTextLine(item) {
  return `
📦 ${item.title || ''}
كود: ${item.code || ''}
الوحدة: ${item.unit || 'قطعة'}
سعر الوحدة: ${formatMoney(item.price)} جنيه
الكمية: ${item.qty}
الإجمالي: ${formatMoney(item.total)} جنيه
━━━━━━━━━━━━━━
`;
}

export function renderInvoiceItemHtml(item) {
  return `
    <div class="invoice-preview__item">
      <strong>${item.title || item.code || ''}</strong>
      <span>${item.unit || ''} · ${Number(item.qty || 1)} × ${formatMoney(item.price || 0)} = ${formatMoney(item.total || 0)} ج.م</span>
    </div>`;
}

export function buildWhatsAppInvoice({ order, items, session, customer, tierLabel, supportWhatsapp }) {
  const model = buildInvoiceModel({ order, items, session, customer, tierLabel });
  const repBlock = model.rep
    ? `👨‍💼 المندوب
${model.rep.name}
📞 ${model.rep.phone}
📍 ${model.rep.address}
━━━━━━━━━━━━━━
`
    : '';

  const customerBlock = `👤 العميل
${model.customer.name}
📞 ${model.customer.phone}
📍 ${model.customer.address}
`;
  let message = `🧾 فاتورة طلب شراء
رقم الفاتورة: ${model.number}

━━━━━━━━━━━━━━
${repBlock}${customerBlock}━━━━━━━━━━━━━━
📊 الشريحة
${model.tierLabel}
━━━━━━━━━━━━━━
📦 تفاصيل الطلب
`;

  for (const item of model.items) {
    message += renderInvoiceTextLine(item);
  }

  message += `
💰 إجمالي الفاتورة:
${formatMoney(model.totalAmount)} جنيه
━━━━━━━━━━━━━━
`;
  return `https://wa.me/${supportWhatsapp}?text=${encodeURIComponent(message)}`;
}

export function formatMoney(value) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(n);
}
