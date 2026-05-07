import { storageKeys, saveJSON } from '../core/storage.js';

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
  saveJSON(storageKeys.invoices, invoices);
}

export function buildWhatsAppInvoice({ order, items, session, customer, tierLabel, supportWhatsapp }) {
  const repBlock = session?.userType === 'rep'
    ? `👨‍💼 المندوب
${session.name || ''}
📞 ${session.phone || ''}
📍 ${session.address || session.location || ''}
━━━━━━━━━━━━━━
`
    : '';

  const customerBlock = customer
    ? `👤 العميل
${customer.name || ''}
📞 ${customer.phone || ''}
📍 ${customer.address || customer.location || ''}
`
    : `👤 العميل
${session?.name || ''}
📞 ${session?.phone || ''}
📍 ${session?.address || session?.location || ''}
`;

  let message = `🧾 فاتورة طلب شراء
رقم الفاتورة: ${order.order_number || order.invoice_number || order.id}

━━━━━━━━━━━━━━
${repBlock}${customerBlock}
━━━━━━━━━━━━━━
📊 الشريحة
${tierLabel || 'الشريحة الرئيسية'}
━━━━━━━━━━━━━━
📦 تفاصيل الطلب
`;

  for (const item of items) {
    message += `
📦 ${item.title || item.name || ''}
كود: ${item.id || item.product_id || ''}
الوحدة: ${item.unitLabel || item.unit || 'قطعة'}
سعر الوحدة: ${formatMoney(item.price)} جنيه
الكمية: ${item.qty || 1}
الإجمالي: ${formatMoney(Number(item.qty || 0) * Number(item.price || 0))} جنيه
━━━━━━━━━━━━━━
`;
  }

  message += `
💰 إجمالي الفاتورة:
${formatMoney(order.total_amount)} جنيه
━━━━━━━━━━━━━━
`;
  return `https://wa.me/${supportWhatsapp}?text=${encodeURIComponent(message)}`;
}

export function formatMoney(value) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(n);
}
