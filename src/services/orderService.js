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

function inferItemType(productId) {
  const value = String(productId || '').trim();
  if (value.startsWith('deal:')) return 'deal';
  if (value.startsWith('flash:')) return 'flash';
  return 'product';
}

function normalizeOrderItem(item, orderId) {
  const productId = String(item?.productId ?? item?.id ?? item?.product_id ?? '').trim();
  const qty = Math.max(1, Math.trunc(Number(item?.qty || 1)));
  const price = Number.isFinite(Number(item?.finalPrice)) ? Number(Number(item.finalPrice).toFixed(2)) : 0;
  const unitCode = String(item?.unitCode || 'single').trim() || 'single';
  const type = inferItemType(productId);

  if (!orderId || !productId || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price < 0) {
    return null;
  }

  return {
    order_id: orderId,
    product_id: productId,
    type,
    qty,
    price,
    unit: type === 'product' ? unitCode : 'single',
  };
}

async function insertOrderItems(api, items) {
  const rows = [];
  for (const item of items) {
    const inserted = await api.post('order_items', item);
    rows.push(Array.isArray(inserted) ? inserted[0] : inserted);
  }
  return rows;
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
    invoice_number: Number(invoiceSequence || 0) || null,
  };

  const orderRows = await api.post('orders', orderPayload);
  const order = Array.isArray(orderRows) ? orderRows[0] : orderRows;
  if (!order?.id) throw new Error('ORDER_CREATE_FAILED');

  const items = state.commerce.cart.map((item) => normalizeOrderItem(item, order.id)).filter(Boolean);
  if (!items.length) throw new Error('ORDER_ITEMS_EMPTY');

  await insertOrderItems(api, items);
  return { order, items, customer };
}
