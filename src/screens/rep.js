import { el } from '../utils/dom.js';
import { money } from '../utils/format.js';

export function repDashboardScreen({ repSales = [], customers = [] }) {
  const totalSales = repSales.reduce((s, r) => s + Number(r.total_sales ?? 0), 0);
  const totalOrders = repSales.reduce((s, r) => s + Number(r.total_orders ?? 0), 0);
  return el('section', { class: 'panel' },
    el('div', { class: 'section-head' }, el('div', {}, el('h2', {}, 'Rep Dashboard'), el('p', { class: 'muted' }, 'Your analytics are scoped by the authenticated sales_rep identity.'))),
    el('div', { class: 'metrics-grid' },
      el('div', { class: 'metric card' }, el('div', { class: 'muted' }, 'Orders'), el('div', { class: 'metric-value' }, totalOrders)),
      el('div', { class: 'metric card' }, el('div', { class: 'muted' }, 'Sales'), el('div', { class: 'metric-value' }, money(totalSales))),
      el('div', { class: 'metric card' }, el('div', { class: 'muted' }, 'Customers'), el('div', { class: 'metric-value' }, customers.length)),
    ),
    el('div', { class: 'card' }, el('h3', {}, 'Top rows'), el('pre', { class: 'code' }, JSON.stringify(repSales.slice(0, 8), null, 2)))
  );
}

export function repCustomersScreen({ customers = [], onCreate }) {
  return el('section', { class: 'panel' },
    el('div', { class: 'section-head' }, el('div', {}, el('h2', {}, 'Rep Customers'), el('p', { class: 'muted' }, 'The customer is linked via sales_rep_id at creation time.')), el('button', { class: 'btn btn-primary', onclick: onCreate }, 'Add customer')),
    el('div', { class: 'table card' },
      el('div', { class: 'table-row table-head' }, el('div', {}, 'Name'), el('div', {}, 'Phone'), el('div', {}, 'Status')),
      ...customers.map(c => el('div', { class: 'table-row' }, el('div', {}, c.name || c.username), el('div', {}, c.phone || '—'), el('div', {}, c.is_blocked ? 'blocked' : 'active')))
    )
  );
}
