import { el } from '../utils/dom.js';
import { money, integer } from '../utils/format.js';

export function cartScreen({ cart = [], onRemove, onQty, onCheckout }) {
  const total = cart.reduce((sum, item) => sum + Number(item.final_price ?? 0) * Number(item.quantity ?? 0), 0);
  return el('section', { class: 'panel' },
    el('div', { class: 'section-head' }, el('div', {}, el('h2', {}, 'Cart'), el('p', { class: 'muted' }, 'No pricing math is done here. Line items use the runtime final price as received.')), el('button', { class: 'btn btn-primary', onclick: onCheckout }, 'Proceed to checkout')),
    cart.length ? el('div', { class: 'stack' }, ...cart.map(item => el('div', { class: 'line-item card' },
      el('div', { class: 'line-title' }, item.product_name || item.name),
      el('div', { class: 'line-meta' }, `${item.unit_code || 'unit'} · ${money(item.final_price ?? 0)} · stock ${integer(item.available_qty ?? 0)}`),
      el('div', { class: 'qty-controls' },
        el('button', { class: 'btn btn-ghost', onclick: () => onQty?.(item.product_id, Math.max(1, Number(item.quantity || 1) - 1)) }, '−'),
        el('strong', {}, integer(item.quantity ?? 1)),
        el('button', { class: 'btn btn-ghost', onclick: () => onQty?.(item.product_id, Number(item.quantity || 1) + 1) }, '+'),
      ),
      el('div', { class: 'line-total' }, money(Number(item.final_price ?? 0) * Number(item.quantity ?? 0))),
      el('button', { class: 'btn btn-secondary', onclick: () => onRemove?.(item.product_id) }, 'Remove'),
    )) ) : el('div', { class: 'empty-state card' }, 'Cart is empty.'),
    el('div', { class: 'totals card' }, el('span', {}, 'Grand total'), el('strong', {}, money(total))),
  );
}
