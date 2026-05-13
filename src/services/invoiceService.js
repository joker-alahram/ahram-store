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

export function formatCairoDateTime(value) {
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Cairo' }).format(new Date(value || Date.now()));
}

export function buildWhatsAppInvoice({ order, items, session, customer, tierLabel, supportWhatsapp }) {
  const repBlock = session?.userType === 'rep'
    ? `👨‍💼 المندوب\n${session.name || ''}\n📞 ${session.phone || ''}\n📍 ${session.address || session.location || ''}\n━━━━━━━━━━━━━━\n`
    : '';

  const customerBlock = customer
    ? `👤 العميل\n${customer.name || ''}\n📞 ${customer.phone || ''}\n📍 ${customer.address || customer.location || ''}\n`
    : `👤 العميل\n${session?.name || ''}\n📞 ${session?.phone || ''}\n📍 ${session?.address || session?.location || ''}\n`;

  let message = `🧾 فاتورة طلب شراء\nرقم الفاتورة: ${order.order_number || order.invoice_number || order.id}\n\n━━━━━━━━━━━━━━\n${repBlock}${customerBlock}━━━━━━━━━━━━━━\n📊 الشريحة\n${tierLabel || 'الشريحة الرئيسية'}\n━━━━━━━━━━━━━━\n📦 تفاصيل الطلب\n`;

  for (const item of items) {
    message += `\n📦 ${item.title || item.name || ''}\nكود: ${item.id || item.product_id || ''}\nالوحدة: ${item.unitLabel || item.unit || 'قطعة'}\nسعر الوحدة: ${formatMoney(item.price)} جنيه\nالكمية: ${item.qty || 1}\nالإجمالي: ${formatMoney(Number(item.qty || 0) * Number(item.price || 0))} جنيه\n━━━━━━━━━━━━━━\n`;
  }

  message += `\n💰 إجمالي الفاتورة:\n${formatMoney(order.total_amount)} جنيه\n━━━━━━━━━━━━━━\n`;
  return `https://wa.me/${supportWhatsapp}?text=${encodeURIComponent(message)}`;
}

export function formatMoney(value) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(n);
}
