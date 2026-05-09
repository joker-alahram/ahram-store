import { formatMoney } from './invoiceService.js';
import { generateSessionToken } from './contractUtils.js';

export function validateCheckout(state, tier, totals) {
  if (!state.auth.session) return { ok: false, code: 'NO_SESSION', message: 'يجب تسجيل الدخول أولاً' };
  if (!state.commerce.cart.length) return { ok: false, code: 'EMPTY_CART', message: 'السلة فارغة' };
  if (!tier) return { ok: false, code: 'NO_TIER', message: 'اختر الشريحة أولاً' };
  if ((state.auth.session.userType === 'rep' || state.auth.session.user_type === 'sales_rep') && !state.auth.selectedCustomer) return { ok: false, code: 'NO_CUSTOMER', message: 'اختر العميل أولاً' };
  if (Number(totals.grand) < Number(tier.min_order || 0)) {
    return { ok: false, code: 'MIN_ORDER', message: `متبقي ${formatMoney(Number(tier.min_order || 0) - Number(totals.grand))} للوصول للحد الأدنى` };
  }
  return { ok: true };
}

function buildOrderNumber(invoiceSequence) {
  const base = Number(invoiceSequence || Date.now());
  return `${base}`;
}

function buildItemSnapshot(item, state, tier, orderId = null) {
  const product = item.type === 'product' ? state.commerce.catalog.productIndex?.[item.id] : null;
  const unitRow = product?.units?.find((row) => String(row.unit_code) === String(item.unit));
  return {
    order_id: orderId,
    product_id: item.id,
    product_name_snapshot: product?.product_name || item.title || '',
    unit_code: item.unit || 'piece',
    unit_code_snapshot: item.unit || 'piece',
    quantity: Number(item.qty || 1),
    unit_price: Number(item.price || 0),
    unit_price_snapshot: Number(item.price || 0),
    line_total: Number(item.qty || 1) * Number(item.price || 0),
    tier_snapshot: tier?.tier_name || null,
    product_image_snapshot: product?.product_image || item.image || '',
    pricing_snapshot: {
      tier_name: tier?.tier_name || null,
      tier_display_name: tier?.display_name || tier?.visible_label || null,
      unit_code: item.unit || 'piece',
      final_price: Number(item.price || 0),
      available_qty: Number(unitRow?.available_qty || 0),
      reserved_qty: Number(unitRow?.reserved_qty || 0),
      minimum_sell_qty: Number(unitRow?.minimum_sell_qty || 1),
      allow_backorder: Boolean(unitRow?.allow_backorder),
      product_name: product?.product_name || item.title || '',
      company_id: product?.company_id || item.companyId || null,
      company_name: product?.company_name || item.companyName || null,
      category_name: product?.category_name || item.categoryName || null,
    },
  };
}

export async function submitOrder(api, state, tier, totals, invoiceSequence) {
  const session = state.auth.session;
  const isRep = session?.userType === 'rep' || session?.user_type === 'sales_rep';
  const customer = state.auth.selectedCustomer || (session?.userType === 'customer' || session?.user_type === 'customer' ? session : null);
  if (!customer?.id) throw new Error('NO_CUSTOMER');

  const orderNumber = buildOrderNumber(invoiceSequence);
  const subtotal = Number(totals.products + totals.deals + totals.flash);
  const discountTotal = 0;
  const grandTotal = Number(totals.grand.toFixed(2));
  const orderPayload = {
    order_number: orderNumber,
    customer_id: customer.id,
    sales_rep_id: isRep ? session.id : null,
    user_id: session.id,
    user_type: session.user_type || (isRep ? 'sales_rep' : 'customer'),
    status: 'submitted',
    payment_status: 'unpaid',
    payment_method: 'COD',
    currency: 'EGP',
    subtotal,
    discount_total: discountTotal,
    grand_total: grandTotal,
    total_amount: grandTotal,
    products_total: Number(totals.products || 0),
    deals_total: Number(totals.deals || 0),
    flash_total: Number(totals.flash || 0),
    tier_name: tier.tier_name,
    version: 1,
  };

  const idempotencyKey = generateSessionToken();
  const orderRows = await api.post('orders', orderPayload, undefined, { 'Idempotency-Key': idempotencyKey });
  const order = Array.isArray(orderRows) ? orderRows[0] : orderRows;
  if (!order?.id) throw new Error('ORDER_CREATE_FAILED');

  const items = state.commerce.cart.map((item) => buildItemSnapshot(item, state, tier, order.id));
  if (items.length) {
    await api.post('order_items', items, undefined, { 'Idempotency-Key': `${idempotencyKey}:items` });
  }

  return { order, items, customer };
}
