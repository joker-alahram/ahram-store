import { el } from '../utils/dom.js';
import { money, integer } from '../utils/format.js';

function metric(label, value, hint = '') {
  return el('div', { class: 'metric card' }, el('div', { class: 'muted' }, label), el('div', { class: 'metric-value' }, value), hint ? el('div', { class: 'small' }, hint) : null);
}

export function adminScreen({ health = [], products = [], tiers = [], customers = [], salesReps = [], orders = [] }) {
  const grand = orders.reduce((s, o) => s + Number(o.grand_total ?? o.total_amount ?? 0), 0);
  return el('section', { class: 'panel' },
    el('div', { class: 'section-head' }, el('div', {}, el('h2', {}, 'Admin Dashboard'), el('p', { class: 'muted' }, 'All reads are from official views.'))),
    el('div', { class: 'metrics-grid' },
      metric('Products', integer(products.length), 'v_runtime_products'),
      metric('Tiers', integer(tiers.length), 'v_visible_tiers'),
      metric('Customers', integer(customers.length), 'customers / v_rep_customers'),
      metric('Sales reps', integer(salesReps.length), 'sales_reps'),
      metric('Orders value', money(grand), 'v_orders_status'),
      metric('Runtime healthy', String(health?.[0]?.runtime_healthy ?? true), 'v_runtime_commerce_health'),
    ),
    el('div', { class: 'grid-2' },
      el('div', { class: 'card' }, el('h3', {}, 'Health'), el('pre', { class: 'code' }, JSON.stringify(health, null, 2))),
      el('div', { class: 'card' }, el('h3', {}, 'Operational notes'), el('ul', { class: 'bullets' },
        el('li', {}, 'No tier discount math in JS.'),
        el('li', {}, 'No stock engine in JS.'),
        el('li', {}, 'Writes must go through the specified routes.'),
      )),
    )
  );
}
