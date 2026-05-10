import { formatMoney } from './invoiceService.js';
import { normalizeUserType } from './authService.js';

export function validateCheckout(state, tier, totals) {
  if (!state.auth.session) return { ok: false, code: 'NO_SESSION', message: 'يجب تسجيل الدخول أولاً' };
  if (!state.commerce.cart.length) return { ok: false, code: 'EMPTY_CART', message: 'السلة فارغة' };
  if (!tier) return { ok: false, code: 'NO_TIER', message: 'اختر الشريحة أولاً' };
  if (normalizeUserType(state.auth.session.userType) === 'rep' && !state.auth.selectedCustomer) return { ok: false, code: 'NO_CUSTOMER', message: 'اختر العميل أولاً' };
  if (Number(totals.grand) < Number(tier.min_order || 0)) {
    return { ok: false, code: 'MIN_ORDER', message: `متبقي ${formatMoney(Number(tier.min_order || 0) - Number(totals.grand))} للوصول للحد الأدنى` };
  }
  return { ok: true };
}

export async function submitOrder(api, state, tier, totals, invoiceSequence) {
  const session = state.auth.session;
  const userType = normalizeUserType(session?.userType);
  const customer = state.auth.selectedCustomer || (userType === 'customer' ? session : null);
  const linkedRepId = userType === 'rep' ? session.id : session?.sales_rep_id || session?.rep_id || session?.created_by_rep_id || customer?.sales_rep_id || customer?.rep_id || null;

  const orderPayload = {
    user_type: userType,
    total_amount: Number(totals.grand.toFixed(2)),
    products_total: Number(totals.products.toFixed(2)),
    deals_total: Number(totals.deals.toFixed(2)),
    flash_total: Number(totals.flash.toFixed(2)),
    status: 'submitted',
    customer_id: customer?.id || session.id,
    user_id: session.id,
    sales_rep_id: linkedRepId,
    rep_id: linkedRepId,
    customer_type: userType === 'rep' ? 'rep' : 'direct',
    tier_name: tier.tier_name || 'base',
  };

  const orderRows = await api.post('orders', orderPayload);
  const order = Array.isArray(orderRows) ? orderRows[0] : orderRows;
  if (!order?.id) throw new Error('ORDER_CREATE_FAILED');

  const items = state.commerce.cart.map((item) => {
  const qty = Number(item.qty || 1);

  const basePrice =
    Number(item.base_price ?? item.basePrice ?? item.price ?? 0);

  const finalPrice =
    Number(item.final_price ?? item.finalPrice ?? item.price ?? 0);

  const lineTotal =
    Number(item.line_total ?? (finalPrice * qty));

  return {
    order_id: order.id,

    product_id: String(item.id),

    type: item.type || 'product',

    qty,

    price: finalPrice,

    unit: item.unit_name || item.unit || 'piece',

    product_name_snapshot:
      item.name || item.product_name || '',

    company_id_snapshot:
      item.company_id || '',

    unit_code:
      item.unit_code || item.unit || 'piece',

    tier_name:
      item.tier_name || tier.tier_name || 'base',

    base_price_snapshot: basePrice,

    final_price_snapshot: finalPrice,

    pricing_source_snapshot:
      item.pricing_source || 'runtime',

    applied_discount_percent_snapshot:
      Number(item.discount_percent || 0),

    line_total: lineTotal,

    currency_code: 'EGP',

    reserved_qty: qty,

    fulfilled_qty: 0,

    rejected_qty: 0,
  };
});

  if (items.length) await api.post('order_items', items);
  return { order, items, customer };
}
