import { storageKeys, saveJSON } from '../core/storage.js';

const STATUS_MAP = {
  draft: 'مسودة',
  submitted: 'تم الإرسال',
  confirmed: 'تم التأكيد',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
  reserved: 'محجوز',
  not_reserved: 'غير محجوز',
  pending: 'قيد التنفيذ',
  paid: 'مدفوع',
  approved: 'مقبول',
  rejected: 'مرفوض',
};

export function formatStatus(status) {
  return STATUS_MAP[String(status || '').trim()] || String(status || 'غير معروف');
}

export function persistInvoices(invoices) {
  saveJSON(storageKeys.invoices, invoices);
}

export function buildWhatsAppInvoice({ order, items, session, customer, tierLabel, supportWhatsapp }) {
  const resolvedItems = Array.isArray(items) ? items : [];
  const repBlock = session?.userType === 'rep' || session?.user_type === 'sales_rep'
    ? `👨‍💼 المندوب\n${session.name || ''}\n📞 ${session.phone || ''}\n━━━━━━━━━━━━━━\n`
    : '';

  const customerBlock = customer
    ? `👤 العميل\n${customer.name || ''}\n📞 ${customer.phone || ''}\n📍 ${customer.address || customer.location || ''}\n`
    : `👤 العميل\n${session?.name || ''}\n📞 ${session?.phone || ''}\n`;

  let message = `🧾 فاتورة طلب شراء\nرقم الفاتورة: ${order.order_number || order.invoice_number || order.id}\n\n━━━━━━━━━━━━━━\n${repBlock}${customerBlock}━━━━━━━━━━━━━━\n📊 الشريحة\n${tierLabel || 'بدون خصم'}\n━━━━━━━━━━━━━━\n📦 تفاصيل الطلب\n`;

  for (const item of resolvedItems) {
    const title = item.product_name_snapshot || item.title || item.name || '';
    const unitCode = item.unit_code_snapshot || item.unit || 'piece';
    const unitLabel = item.unitLabel || item.unit_label || unitCode;
    const qty = Number(item.quantity || item.qty || 1);
    const price = Number(item.unit_price || item.price || 0);
    message += `\n📦 ${title}\nكود: ${item.product_id || item.id || ''}\nالوحدة: ${unitLabel}\nسعر الوحدة: ${formatMoney(price)} جنيه\nالكمية: ${qty}\nالإجمالي: ${formatMoney(qty * price)} جنيه\n━━━━━━━━━━━━━━\n`;
  }

  message += `\n💰 إجمالي الفاتورة:\n${formatMoney(order.grand_total ?? order.total_amount ?? 0)} جنيه\n━━━━━━━━━━━━━━\n`;
  return `https://wa.me/${supportWhatsapp}?text=${encodeURIComponent(message)}`;
}

export function formatMoney(value) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(n);
}
