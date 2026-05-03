/* cart.runtime.js — cart state, pricing, and checkout */



function openCart() {
  els.cartDrawer.classList.remove('hidden');
  els.cartDrawer.setAttribute('aria-hidden', 'false');
}


function closeCart() {
  els.cartDrawer.classList.add('hidden');
  els.cartDrawer.setAttribute('aria-hidden', 'true');
}


function toggleUserMenu(force) {
  if (!els.userMenu) return;
  const next = typeof force === 'boolean' ? force : els.userMenu.classList.contains('hidden');
  els.userMenu.classList.toggle('hidden', !next);
  els.userMenu.setAttribute('aria-hidden', String(!next));
}


function getSessionLabel() {
  if (!state.session) return 'تسجيل الدخول';
  return state.session.name || state.session.username || state.session.phone || 'مستخدم';
}


function cartKey(item) {
  return `${item.type}:${item.id}:${item.unit || 'single'}`;
}


function findCartItem(key) {
  return state.cart.find((item) => item.key === key);
}


function cartTotal() {
  return CART_ENGINE.cartTotal(state.cart);
}


function eligibleTierTotal() {
  return CART_ENGINE.eligibleTierTotal(state.cart);
}


function cartTotals() {
  return CART_ENGINE.cartTotals(state.cart);
}


function selectedTierMinimum() {
  return Number(getSelectedTierObject()?.min_order || 0);
}


function tierRemainingAmount() {
  const tier = getSelectedTierObject();
  if (!tier) return null;
  return Math.max(0, selectedTierMinimum() - Number(eligibleTierTotal() || 0));
}


function tierStatusLine() {
  const tier = getSelectedTierObject();
  if (!tier) return 'اختر شريحة تجارية لبدء التسعير';
  const remaining = tierRemainingAmount() || 0;
  if (remaining > 0) return `متبقي ${num(remaining)} ج.م للوصول إلى ${num(selectedTierMinimum())}`;
  return 'مؤهل بالكامل ضمن هذه الشريحة';
}


function getProductQty(productId) {
  const value = Number(state.productQtyPrefs?.[productId] || 1);
  return Number.isFinite(value) && value > 0 ? Math.max(1, Math.floor(value)) : 1;
}


function setProductQty(productId, qty) {
  const next = Math.max(1, Math.floor(Number(qty || 1)));
  state.productQtyPrefs[productId] = next;
  saveJSON(STORAGE.productQtyPrefs, state.productQtyPrefs);
  return next;
}


function resetCheckoutStage() {
  state.checkoutStage = 'validate';
  if (els.checkoutBtn) els.checkoutBtn.textContent = 'التحقق من الطلب';
}


function syncCheckoutButton() {
  if (!els.checkoutBtn) return;
  els.checkoutBtn.textContent = state.checkoutStage === 'submit' ? 'إرسال الطلب' : 'التحقق من الطلب';
}


function resolveProductPrice(product, unit) {
  const snapshot = typeof getPricingSnapshotForProduct === 'function'
    ? getPricingSnapshotForProduct(product, unit)
    : null;
  return Number(snapshot?.unit ?? snapshot?.breakdown?.final ?? 0);
}


function syncCartPricesFromCurrentState() {
  const next = repriceCart(CART_ENGINE, state.cart, buildPricingContext());
  const changed = JSON.stringify(next) !== JSON.stringify(state.cart);
  state.cart = next;
  if (changed) persistCart();
}


function persistCart() {
  saveJSON(STORAGE.cart, state.cart);
}


function describeCartBadge(item) {
  if (item.type === 'product') return 'يحتسب ضمن الشريحة';
  if (item.type === 'deal') return 'سعر خاص · غير محتسب ضمن هدف الشريحة';
  if (item.type === 'flash') return 'عرض محدود · غير محتسب ضمن هدف الشريحة';
  return '';
}


function consumePendingTierAction() {
  const pending = state.pendingTierAction;
  state.pendingTierAction = null;
  return pending;
}


function setCartQty(key, qty) {
  const item = state.cart.find((row) => row.key === key);
  if (!item) return;
  item.qty = Math.max(1, Number(qty || 1));
  persistCart();
  resetCheckoutStage();
  state.behavior.lastCartActivity = Date.now();
  renderCart();
  renderApp();
}


function removeCartItem(key) {
  state.cart = state.cart.filter((row) => row.key !== key);
  persistCart();
  resetCheckoutStage();
  state.behavior.lastCartActivity = Date.now();
  renderCart();
  renderApp();
}


function qtyAdjust(key, delta) {
  const item = state.cart.find((row) => row.key === key);
  if (!item) return;
  item.qty = Math.max(1, Number(item.qty || 1) + delta);
  persistCart();
  resetCheckoutStage();
  state.behavior.lastCartActivity = Date.now();
  renderCart();
  renderApp();
}


async function getLiveCheckoutSnapshot() {
  const productItems = state.cart.filter((item) => item.type === 'product');
  const ids = [...new Set(productItems.map((item) => String(item.id)))];
  const tier = getSelectedTierObject();
  const tierKey = tier?.tier_name || null;
  const [freshProducts, freshTier] = await Promise.all([
    ids.length ? apiGet('v_products', {
      select: 'product_id,product_name,company_id,has_carton,has_pack,carton_price,pack_price,allow_discount,discount_pack',
      product_id: `in.(${ids.join(',')})`,
    }).catch(() => []) : Promise.resolve([]),
    tierKey ? apiGet('tiers', { select: 'tier_name,min_order,visible_label,discount_percent', tier_name: `eq.${tierKey}`, limit: '1' }).catch(() => []) : Promise.resolve([]),
  ]);

  const productsMap = new Map((freshProducts || []).map((row) => [String(row.product_id), row]));
  const tierRow = Array.isArray(freshTier) ? freshTier[0] : freshTier?.[0];

  return { productsMap, tierRow };
}


async function validateCartAgainstDatabase() {
  if (!state.cart.length) {
    return { ok: false, message: 'السلة فارغة' };
  }

  const snapshot = await getLiveCheckoutSnapshot();
  for (const item of state.cart) {
    if (item.type !== 'product') continue;
    const product = snapshot.productsMap.get(String(item.id));
    if (!product) {
      return { ok: false, message: `المنتج ${item.title} غير موجود الآن` };
    }

    const liveBase = item.unit === 'pack'
      ? Number(product.pack_price || 0)
      : Number(product.carton_price || 0);
    const liveDiscount = snapshot.tierRow && product.allow_discount !== false && !(String(item.unit || '') === 'pack' && product.discount_pack === false)
      ? Number(snapshot.tierRow.discount_percent || 0)
      : 0;
    const livePrice = liveDiscount > 0 && liveBase > 0
      ? Number((liveBase * (1 - liveDiscount / 100)).toFixed(2))
      : liveBase;

    if (Math.abs(Number(item.pricing?.unit || 0) - livePrice) > 0.0001) {
      return {
        ok: false,
        message: `سعر ${item.title} تغيّر. أعد إضافة المنتج من جديد`,
      };
    }
  }

  if (snapshot.tierRow && Number(CART_ENGINE.eligibleTierTotal(state.cart)) < Number(snapshot.tierRow.min_order || 0)) {
    const remaining = Number(snapshot.tierRow.min_order || 0) - Number(CART_ENGINE.eligibleTierTotal(state.cart));
    return {
      ok: false,
      message: `متبقي لك ${num(remaining)} للوصول إلى الشريحة`,
    };
  }

  return { ok: true, snapshot };
}


function validateBeforeOrder() {
  if (!state.session) {
    state.pendingReturnHash = location.hash || '#home';
    state.pendingOpenCart = !els.cartDrawer?.classList.contains('hidden');
    smartToast('login.missing', 'يجب إنشاء حساب أولاً لإتمام الطلب', true);
    openRegisterPage();
    return false;
  }

  if (state.session.userType === 'rep' && !state.selectedCustomer) {
    smartToast('checkout.missing', 'يجب اختيار عميل قبل إرسال الطلب', true);
    navigate('#my-customers');
    return false;
  }

  if (!state.cart.length) {
    smartToast('cart.empty', 'السلة فارغة', true);
    return false;
  }

  const tier = getSelectedTierObject();
  if (!tier) {
    smartToast('tier.missing', 'يرجى اختيار الشريحة المناسبة', true);
    return false;
  }

  const total = eligibleTierTotal();
  if (total < Number(tier.min_order || 0)) {
    const diff = Number(tier.min_order || 0) - total;
    smartToast('tier.incomplete', `فاضل ${num(diff)} جنيه لتفعيل شريحة ${tierDisplayLabel(tier)}`, true);
    return false;
  }

  return true;
}


async function buildOrderPayload(orderNumber) {
  const isRep = state.session.userType === 'rep';
  const repCustomer = isRep ? state.selectedCustomer : null;
  const totals = cartTotals();
  return {
    order_number: String(orderNumber),
    user_type: state.session.userType,
    customer_id: isRep ? repCustomer?.id || null : state.session.id,
    sales_rep_id: isRep ? state.session.id : null,
    user_id: isRep ? state.session.id : null,
    total_amount: Number(totals.total.toFixed(2)),
    products_total: Number(totals.products.toFixed(2)),
    deals_total: Number(totals.deals.toFixed(2)),
    flash_total: Number(totals.flash.toFixed(2)),
    status: 'pending',
  };
}


async function createOrder() {
  const orderNumber = await reserveInvoiceNumber();
  const payload = await buildOrderPayload(orderNumber);
  const res = await apiPost('orders', payload);
  if (!res || !res[0]) throw new Error('Order creation failed');
  return res[0];
}


async function insertOrderItems(orderId) {
  const items = state.cart.map((item) => ({
    order_id: orderId,
    product_id: String(item.id),
    qty: Number(item.qty || 1),
    pricing: { unit: Number(item.pricing?.unit || 0), total: Number(item.pricing?.total || 0), breakdown: item.pricing?.breakdown || { base: Number(item.pricing?.unit || 0), tier: 0, deals: 0, flash: 0, final: Number(item.pricing?.unit || 0) }, context: item.pricing?.context || { tier: null, appliedDeals: [], flashId: null }, timestamp: item.pricing?.timestamp || Date.now() },
    unit: item.unit === 'carton' ? 'carton' : item.unit === 'pack' ? 'pack' : 'piece',
    type: item.type === 'deal' ? 'deal' : item.type === 'flash' ? 'flash' : 'product',
  }));
  if (!items.length) return;
  await apiPost('order_items', items);
}


function buildWhatsAppInvoice(order, items) {

  let repBlock = '';
  let customerBlock = '';

  // 🟢 حالة المندوب
  if (state.session.userType === 'rep') {

    const rep = state.session;
    const customer = state.selectedCustomer;

    repBlock = `
👨‍💼 المندوب
${rep.name || ''}
📞 ${rep.phone || ''}
📍 ${rep.address || rep.location || ''}
━━━━━━━━━━━━━━
`;

    customerBlock = `
👤 العميل
${customer?.name || ''}
📞 ${customer?.phone || ''}
📍 ${customer?.address || customer?.location || ''}
`;

  } else {

    // 🔵 عميل مباشر
    const customer = state.session;

    customerBlock = `
👤 العميل
${customer.name || ''}
📞 ${customer.phone || ''}
📍 ${customer.address || customer.location || ''}
`;
  }

  let message = `🧾 فاتورة طلب شراء
رقم الفاتورة: ${order.order_number}

━━━━━━━━━━━━━━
${repBlock}${customerBlock}

━━━━━━━━━━━━━━
📊 الشريحة
${getSelectedTierLabel()}
━━━━━━━━━━━━━━
📦 تفاصيل الطلب
`;

  items.forEach((i) => {
    const unitLabel =
      i.unit === 'carton' ? 'كرتونة' :
      i.unit === 'pack' ? 'دستة' :
      'قطعة';

    message += `
📦 ${i.title || i.name || ''}
كود: ${i.id}
الوحدة: ${unitLabel}
سعر الوحدة: ${num(i.price)} جنيه
الكمية: ${i.qty}
الإجمالي: ${num(Number(i.qty || 0) * Number(i.price || 0))} جنيه

━━━━━━━━━━━━━━
`;
  });

  message += `
💰 إجمالي الفاتورة:
${num(order.total_amount)} جنيه
━━━━━━━━━━━━━━
`;

  return encodeURIComponent(message);
}


function resolveWhatsAppRecipient() {
  return state.session?.userType === 'rep' ? '201552670465' : '201040880002';
}


function sendToWhatsApp(order, items) {
  const phone = resolveWhatsAppRecipient();
  const text = buildWhatsAppInvoice(order, items);
  const url = `https://wa.me/${phone}?text=${text}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}


async function handleCheckout() {
  if (!validateBeforeOrder()) return;

  try {
    const order = await createOrder();
    console.log('ORDER CREATED:', order.id);
    await insertOrderItems(order.id);
    sendToWhatsApp(order, state.cart);

    recordUiEvent('checkout.submit', { orderId: order.id, orderNumber: order.order_number, total: Number(cartTotal().toFixed(2)) });
    smartToast('success.order', 'تم إرسال الطلب بنجاح', true);

    state.cart = [];
    persistCart();
    resetCheckoutStage();
    renderCart();
    renderApp();
    closeCart();
  } catch (e) {
    console.error(e);
    resetCheckoutStage();
    syncCheckoutButton();
    toast('فشل إرسال الطلب');
  }
}


function checkout() {
  return handleCheckout();
}


function logout() {
  recordUiEvent('logout', { userId: state.session?.id || null, userType: state.session?.userType || null });
  state.session = null;
  state.invoicesLoaded = false;
  state.invoices = [];
  state.customersLoaded = false;
  state.customers = [];
  state.selectedCustomer = null;
  persistSelectedCustomer();
  saveJSON(STORAGE.session, null);
  toggleUserMenu(false);
  closeMyData();
  resetCheckoutStage();
  updateHeader();
  renderApp();
  toast('تم تسجيل الخروج');
}


function syncUnitPreference(productId, unit) {
  state.unitPrefs[productId] = unit;
  saveJSON(STORAGE.unitPrefs, state.unitPrefs);
}


function initCartRuntime() {
  renderCart();
  syncCheckoutButton();
}
