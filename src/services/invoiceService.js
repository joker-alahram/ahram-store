import { formatMoney } from './runtimeUtils.js';

export { formatMoney };

export function buildWhatsAppInvoice({ order, items, customer, tierLabel, supportWhatsapp }) {
  const lines = [
    'طلب جديد من متجر الأهرام',
    `رقم الطلب: ${order?.id || ''}`,
    `العميل: ${customer?.name || 'غير محدد'}`,
    `الشريحة: ${tierLabel || ''}`,
    '',
    ...items.map((item) => `${item.product_name || ''} | ${item.unit_code || ''} | ${item.qty || 0} × ${formatMoney(item.final_price || 0)} = ${formatMoney((item.qty || 0) * (item.final_price || 0))}`),
    '',
    `الإجمالي: ${formatMoney(order?.total_amount || 0)}`,
    supportWhatsapp ? `واتساب الدعم: ${supportWhatsapp}` : '',
  ].filter(Boolean);
  return encodeURIComponent(lines.join('\n'));
}
