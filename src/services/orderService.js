import { formatMoney } from './invoiceService.js';
import { isOfferActive } from './offerService.js';

function normalizeUnitCode(value) {
  const unit = String(value || '').trim();
  if (['carton', 'pack', 'half_pack', 'piece'].includes(unit)) return unit;
  return unit || 'piece';
}

function isOfferType(value) {
  return ['flash', 'deal', 'offer'].includes(String(value || '').trim().toLowerCase());
}

function normalizeOfferSnapshotId(item) {
  const raw = item?.offer_id ?? item?.id ?? null;
  if (raw === null || raw === undefined || raw === '') return null;
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) return Math.trunc(numeric);
  const text = String(raw).trim();
  return text ? text : null;
}

function normalizeNullableText(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

function normalizeOrderItem(item, tier) {
  const sourceType = String(item?.type || 'product').trim().toLowerCase() || 'product';
  const isFlashBundle = isOfferType(sourceType);
  const qty = isFlashBundle ? 1 : Math.max(1, Number(item?.qty || 1));
  const basePrice = Number(item?.base_price ?? item?.basePrice ?? item?.price ?? 0);
  const finalPrice = Number(item?.final_price ?? item?.finalPrice ?? item?.price ?? 0);
  const unit = isFlashBundle ? 'bundle' : normalizeUnitCode(item?.unit_code || item?.unit || item?.unit_name);
  const productId = isFlashBundle ? null : String(item?.product_id || item?.id || '').trim();
  const offerId = isFlashBundle ? normalizeOfferSnapshotId(item) : null;
  const companyIdSnapshot = normalizeNullableText(item?.company_id || item?.companyId || item?.companyID || null);

  if (!isFlashBundle && !productId) {
    throw new Error('INVALID_PRODUCT_ID');
  }
  if (!finalPrice || finalPrice <= 0) {
    throw new Error('INVALID_FINAL_PRICE');
  }
  if (isFlashBundle && offerId === null) {
    throw new Error('INVALID_OFFER_ID');
  }

  return {
    product_id: productId,
    runtime_type: isFlashBundle ? 'flash_offer' : 'product',
    type: isFlashBundle ? 'flash_offer' : sourceType,
    qty,
    price: finalPrice,
    unit,
    product_name_snapshot: String(item?.name || item?.title || item?.product_name || '').trim(),
    company_id_snapshot: companyIdSnapshot,
    unit_code: isFlashBundle ? 'FLASH_BUNDLE' : unit,
    tier_name: String(item?.tier_name || item?.tierName || tier?.tier_name || 'base').trim() || 'base',
    base_price_snapshot: basePrice,
    final_price_snapshot: finalPrice,
    pricing_source_snapshot: String(item?.pricing_source || 'runtime').trim() || 'runtime',
    pricing_resolved_at: new Date().toISOString(),
    applied_discount_percent_snapshot: Number(item?.discount_percent || 0),
    line_total: Number(item?.line_total ?? finalPrice * qty),
    currency_code: 'EGP',
    reserved_qty: isFlashBundle ? 0 : qty,
    fulfilled_qty: 0,
    rejected_qty: 0,
    offer_id_snapshot: offerId,
  };
}

function dedupeOrderItems(items) {
  const seen = new Set();
  const result = [];
  for (const item of Array.isArray(items) ? items : []) {
    const key = [
      item.runtime_type || item.type || 'product',
      item.product_id || '',
      item.unit_code || '',
      item.offer_id_snapshot || '',
    ].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

export function validateCheckout(state, tier, totals) {
  const session = state.auth.session;
  const userType = session?.user_type || session?.userType || 'customer';
  const flashItems = (state.commerce.cart || []).filter((item) => item.type === 'flash' || item.runtime_type === 'flash_offer');
  const flashOffers = Array.isArray(state.commerce.catalog?.offers?.flash) ? state.commerce.catalog.offers.flash : [];
  const flashOfferMap = new Map(flashOffers.map((offer) => [String(offer.id), offer]));
  const hasInvalidFlash = flashItems.some((item) => {
    const runtimeStatus = String(item?.runtime_status || '').trim().toLowerCase();
    const isOfferActiveLocal = runtimeStatus ? runtimeStatus === 'active' && item?.is_checkout_available === true : null;
    if (isOfferActiveLocal !== null) return !isOfferActiveLocal;
    const offer = flashOfferMap.get(String(item.offer_id_snapshot || item.offer_id || item.id || '')) || null;
    if (!offer) return true;
    return !isOfferActive(offer);
  });

  if (!session) return { ok: false, code: 'NO_SESSION', message: 'يجب تسجيل الدخول أولاً' };
  if (!state.commerce.cart.length) return { ok: false, code: 'EMPTY_CART', message: 'السلة فارغة' };
  if (!tier) return { ok: false, code: 'NO_TIER', message: 'اختر الشريحة أولاً' };
  if (userType === 'sales_rep' && !state.auth.selectedCustomer) return { ok: false, code: 'NO_CUSTOMER', message: 'اختر العميل أولاً' };
  if (hasInvalidFlash) return { ok: false, code: 'FLASH_EXPIRED', message: 'عرض الساعة انتهى ولا يمكن إرساله' };
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
    runtime_type: item.runtime_type,
  }));

  if (orderItemsPayload.length) await api.post('order_items', orderItemsPayload);
  return { order, items: orderItemsPayload, customer };
}
