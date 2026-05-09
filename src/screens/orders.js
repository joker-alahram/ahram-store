import { el } from '../utils/dom.js';
import { money, dateTime } from '../utils/format.js';
import { buildWhatsAppInvoice, whatsappLink } from '../services/invoice.js';

export function ordersScreen({ orders = [], onOpen, onShareWhatsApp }) {
  return el('section', { class: 'panel' },
    el('div', { class: 'section-head' }, el('div', {}, el('h2', {}, 'Orders'), el('p', { class: 'muted' }, 'Read model from v_orders_status or the orders table snapshots.'))),
    el('div', { class: 'stack' }, ...orders.map(order => el('article', { class: 'card order-card' },
      el('div', { class: 'order-top' },
        el('div', {}, el('h3', {}, `#${order.order_number || order.id}`), el('div', { class: 'muted' }, `${order.status || 'submitted'} · ${dateTime(order.created_at)}`)),
        el('div', { class: 'order-sum' }, money(order.grand_total ?? order.total_amount ?? 0)),
      ),
      el('div', { class: 'order-meta-grid' },
        el('div', {}, 'Customer', el('strong', {}, order.customer_name || order.customer_id || '—')),
        el('div', {}, 'Payment', el('strong', {}, order.payment_status || 'unpaid')),
        el('div', {}, 'Inventory', el('strong', {}, order.inventory_status || 'not_reserved')),
      ),
      el('div', { class: 'actions' },
        el('button', { class: 'btn btn-secondary', onclick: () => onOpen?.(order) }, 'Details'),
        el('button', { class: 'btn btn-primary', onclick: () => onShareWhatsApp?.(whatsappLink(buildWhatsAppInvoice(order))) }, 'WhatsApp invoice'),
      )
    ))),
  );
}
