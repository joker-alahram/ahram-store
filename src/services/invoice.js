import { money } from '../utils/format.js';
import { CONFIG } from '../config.js';

export function buildWhatsAppInvoice(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const lines = [
    `*${CONFIG.appName}*`,
    `Order: ${order.order_number || order.id || '—'}`,
    `Status: ${order.status || '—'}`,
    `Customer: ${order.customer_name || order.customer_id || '—'}`,
    '',
    ...items.map((item, index) => `${index + 1}. ${item.product_name_snapshot || item.product_name || item.product_id || 'Item'} × ${item.quantity ?? item.qty ?? 1} = ${money(item.line_total ?? item.total ?? item.unit_price ?? 0)}`),
    '',
    `Subtotal: ${money(order.subtotal ?? 0)}`,
    `Discount: ${money(order.discount_total ?? 0)}`,
    `Grand Total: ${money(order.grand_total ?? 0)}`,
  ];
  return lines.join('\n');
}

export function whatsappLink(message, supportNumber = CONFIG.supportWhatsapp) {
  const text = encodeURIComponent(message);
  return `https://wa.me/${String(supportNumber).replace(/\D/g, '')}?text=${text}`;
}
