import { formatMoney } from './invoiceService.js';

export function validateCheckout(state, tier, totals) {
  if (!state.auth.session) return { ok: false, code: 'NO_SESSION', message: 'يجب تسجيل الدخول أولاً' };
  if (!state.commerce.cart.length) return { ok: false, code: 'EMPTY_CART', message: 'السلة فارغة' };
  if (!tier) return { ok: false, code: 'NO_TIER', message: 'اختر الشريحة أولاً' };
  if (state.auth.session.userType === 'rep' && !state.auth.selectedCustomer) return { ok: false, code: 'NO_CUSTOMER', message: 'اختر العميل أولاً' };
  if (Number(totals.grand) < Number(tier.min_order || 0)) {
    return { ok: false, code: 'MIN_ORDER', message: `متبقي ${formatMoney(Number(tier.min_order || 0) - Number(totals.grand))} للوصول للحد الأدنى` };
  }
  return { ok: true };
}

export async function submitOrder(api, state, tier, totals, invoiceSequence) {
  const session = state.auth.session;
  const customer = state.auth.selectedCustomer || (session?.userType === 'customer' ? session : null);
  const isRep = session?.userType === 'rep';

  const orderPayload = {
    user_type: session.userType,
    total_amount: Number(totals.grand.toFixed(2)),
    products_total: Number(totals.products.toFixed(2)),
    deals_total: Number(totals.deals.toFixed(2)),
    flash_total: Number(totals.flash.toFixed(2)),
    status: 'pending',
    customer_id: customer?.id || session.id,
    user_id: session.id,
    sales_rep_id: isRep ? session.id : null,
    rep_id: isRep ? session.id : null,
    customer_type: isRep ? 'rep' : 'direct',
    tier_name: tier.tier_name,
  };

  const orderRows = await api.post('orders', orderPayload);
  const order = Array.isArray(orderRows) ? orderRows[0] : orderRows;
  if (!order?.id) throw new Error('ORDER_CREATE_FAILED');

  const items = state.commerce.cart.map((item) => ({
    order_id: order.id,
    product_id: String(item.id),
    type: item.type,
    qty: Number(item.qty || 1),
    price: Number(item.price || 0),
    unit: item.unit || 'piece',
  }));

  if (items.length) await api.post('order_items', items);
  return { order, items, customer };
}
