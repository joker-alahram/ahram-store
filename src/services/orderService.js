import { formatMoney } from './invoiceService.js';

function normalizeUnitCode(value) {
  const unit = String(value || '').trim();
  if (['carton', 'pack', 'half_pack', 'piece'].includes(unit)) return unit;
  return unit || 'piece';
}

function isOfferType(value) {
  return ['flash', 'deal', 'offer'].includes(String(value || '').trim().toLowerCase());
}

function buildOfferProductId(item) {
  const sourceType = String(item.type || item.offer_kind_snapshot || '').trim().toLowerCase();
  const offerId = String(item.offer_id || item.id || item.product_id || item.source_product_id || '').trim();
  if (!offerId) return null;
  return `${sourceType === 'deal' ? 'deal' : 'flash'}:${offerId}`;
}

function normalizeOrderItem(item, tier) {
  const qty = Math.max(1, Number(item.qty || 1));
  const basePrice = Number(item.base_price ?? item.basePrice ?? item.price ?? 0);
  const finalPrice = Number(item.final_price ?? item.finalPrice ?? item.price ?? 0);
  const unit = normalizeUnitCode(item.unit_code || item.unit || item.unit_name);
  const sourceType = String(item.type || 'product').trim().toLowerCase() || 'product';
  const productId = isOfferType(sourceType)
    ? (String(item.product_id || '').trim() || buildOfferProductId(item) || `flash:${String(item.offer_id || item.id || '').trim()}`)
    : String(item.product_id || item.id || '').trim();

  if (!productId) {
    throw new Error('INVALID_PRODUCT_ID');
  }
  if (!finalPrice || finalPrice <= 0) {
    throw new Error('INVALID_FINAL_PRICE');
  }

  return {
    product_id: productId,
    type: isOfferType(sourceType) ? 'flash' : sourceType,
    source_type: sourceType || 'product',
    qty,
    price: finalPrice,
    unit,
    product_name_snapshot: item.name || item.title || item.product_name || '',
    company_id_snapshot: item.company_id || item.companyId || '',
    offer_id_snapshot: item.offer_id || item.id || null,
    source_product_id_snapshot: item.source_product_id || (isOfferType(sourceType) ? item.product_id || null : null),
    offer_kind_snapshot: sourceType === 'flash' ? 'flash' : sourceType === 'deal' ? 'deal' : null,
    unit_code: unit,
    tier_name: item.tier_name || item.tierName || tier?.tier_name || 'base',
    base_price_snapshot: basePrice,
    final_price_snapshot: finalPrice,
    pricing_source_snapshot: item.pricing_source || 'runtime',
    applied_discount_percent_snapshot: Number(item.discount_percent || 0),
    package_details_snapshot: item.package_details || '',
    line_total: Number(item.line_total ?? finalPrice * qty),
    currency_code: 'EGP',
    reserved_qty: qty,
    fulfilled_qty: 0,
    rejected_qty: 0,
  };
}

function dedupeOrderItems(items) {
  const seen = new Set();
  const result = [];
  for (const item of Array.isArray(items) ? items : []) {
    const key = [item.product_id, item.unit_code, item.type, item.offer_id_snapshot || ''].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

export function validateCheckout(state, tier, totals) {
  const session = state.auth.session;
  const userType = session?.user_type || session?.userType || 'customer';
  const flashItems = (state.commerce.cart || []).filter((item) => item.type === 'flash');
  const flashState = state.runtime?.flashState;

  if (!session) return { ok: false, code: 'NO_SESSION', message: 'يجب تسجيل الدخول أولاً' };
  if (!state.commerce.cart.length) return { ok: false, code: 'EMPTY_CART', message: 'السلة فارغة' };
  if (!tier) return { ok: false, code: 'NO_TIER', message: 'اختر الشريحة أولاً' };
  if (userType === 'sales_rep' && !state.auth.selectedCustomer) return { ok: false, code: 'NO_CUSTOMER', message: 'اختر العميل أولاً' };
  if (flashItems.length && flashState?.status !== 'active') return { ok: false, code: 'FLASH_EXPIRED', message: 'عرض الساعة انتهى ولا يمكن إرساله' };
  if (Number(totals.grand || 0) <= 0) return { ok: false, code: 'INVALID_TOTAL', message: 'إجمالي الطلب غير صالح' };
  if (Number(totals.grand) < Number(tier.min_order || 0)) {
    return { ok: false, code: 'MIN_ORDER', message: `متبقي ${formatMoney(Number(tier.min_order || 0) - Number(totals.grand))} للوصول للحد الأدنى` };
  }
  return { ok: true };
}

export async function submitOrder(api, state, tier, totals) {
  const session = state.auth.session;
  if (!session?.id) throw new Error('INVALID_SESSION');

  const userType = session?.user_type || session?.userType || 'customer';
  const customer = state.auth.selectedCustomer || (userType === 'customer' ? session : null);
  const linkedRepId = userType === 'sales_rep' ? session.id : session?.sales_rep_id || session?.rep_id || session?.created_by_rep_id || customer?.sales_rep_id || customer?.rep_id || null;

  if (!customer?.id && userType !== 'sales_rep') throw new Error('INVALID_CUSTOMER');

  const normalizedItems = dedupeOrderItems(state.commerce.cart.map((item) => normalizeOrderItem(item, tier)));

  const orderPayload = {
    user_type: userType === 'sales_rep' ? 'rep' : userType,
    total_amount: Number(Number(totals.grand || 0).toFixed(2)),
    products_total: Number(Number(totals.products || 0).toFixed(2)),
    deals_total: Number(Number(totals.deals || 0).toFixed(2)),
    flash_total: Number(Number(totals.flash || 0).toFixed(2)),
    status: 'submitted',
    customer_id: customer?.id || session.id,
    user_id: session.id,
    sales_rep_id: linkedRepId,
    rep_id: linkedRepId,
    customer_type: customer?.customer_type || (userType === 'sales_rep' ? 'rep' : 'direct'),
    tier_name: tier?.tier_name || 'base',
  };

  const orderRows = await api.post('orders', orderPayload);
  const order = Array.isArray(orderRows) ? orderRows[0] : orderRows;
  if (!order?.id) throw new Error('ORDER_CREATE_FAILED');

  const orderItemsPayload = normalizedItems.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    type: item.type,
    qty: item.qty,
    price: item.price,
    unit: item.unit,
    product_name_snapshot: item.product_name_snapshot,
    company_id_snapshot: item.company_id_snapshot,
    unit_code: item.unit_code,
    tier_name: item.tier_name,
    base_price_snapshot: item.base_price_snapshot,
    final_price_snapshot: item.final_price_snapshot,
    pricing_source_snapshot: item.pricing_source_snapshot,
    applied_discount_percent_snapshot: item.applied_discount_percent_snapshot,
    line_total: item.line_total,
    currency_code: item.currency_code,
    reserved_qty: item.reserved_qty,
    fulfilled_qty: item.fulfilled_qty,
    rejected_qty: item.rejected_qty,
    offer_id_snapshot: item.offer_id_snapshot,
    source_type_snapshot: item.source_type,
    source_product_id_snapshot: item.source_product_id_snapshot,
    offer_kind_snapshot: item.offer_kind_snapshot,
    package_details_snapshot: item.package_details_snapshot,
  }));

  if (orderItemsPayload.length) await api.post('order_items', orderItemsPayload);
  return { order, items: orderItemsPayload, customer };
}
