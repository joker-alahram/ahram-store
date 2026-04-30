function openCart() {
  els.cartDrawer.classList.remove('hidden');
  els.cartDrawer.setAttribute('aria-hidden', 'false');
  trackCartEvent('view', { id: 'cart', title: 'cart' }, { source: 'drawer' });
}
function closeCart() {
  els.cartDrawer.classList.add('hidden');
  els.cartDrawer.setAttribute('aria-hidden', 'true');
}
function cartKey(item) {
  return `${item.type}:${item.id}:${item.unit || 'single'}`;
}
function findCartItem(key) {
  return state.cart.find((item) => item.key === key);
}
function cartTotal() {
  return state.cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
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
  const tierPrice = tierUnitPrice(product, unit);
  if (tierPrice !== null && tierPrice > 0) return Number(tierPrice);
  return baseUnitPrice(product, unit);
}
function syncCartPricesFromCurrentState() {
  let changed = false;
  state.cart = state.cart.map((item) => {
    if (item.type !== 'product') return item;
    const product = state.products.find((row) => row.product_id === item.id);
    if (!product) return item;
    const price = resolveProductPrice(product, item.unit);
    const unitLabel = item.unit === 'carton' ? 'كرتونة' : 'دستة';
    if (Math.abs(Number(item.price || 0) - Number(price || 0)) > 0.0001 || item.unitLabel !== unitLabel) {
      changed = true;
      return { ...item, price, unitLabel };
    }
    return item;
  });
  if (changed) persistCart();
}
function persistCart() {
  saveJSON(STORAGE.cart, state.cart);
}
function setSearchBarHtml(html = '') {
  if (els.searchBar) els.searchBar.innerHTML = html;
}
function updateHeader() {
  const tierLabel = getSelectedTierLabel();
  els.tierBtn.textContent = tierLabel;
  els.userBtn.textContent = getSessionLabel();
  if (els.cartLabel) els.cartLabel.textContent = 'إتمام الشراء';
  els.cartValue.textContent = integer(cartTotal());
  updateFlashHeader();
  syncCheckoutButton();
}
function updateFlashHeader() {
  const flashState = getFlashState();
  if (!flashState.offer) {
    els.flashBtnText.textContent = 'عرض الساعة';
    els.flashBtnMeta.textContent = '';
    els.flashBtn.classList.remove('status-active', 'status-danger');
    return;
  }

  const { status, remaining, endedAt } = flashState;
  if (status === 'active') {
    els.flashBtnText.textContent = 'عرض الساعة';
    els.flashBtnMeta.textContent = remaining;
    els.flashBtn.classList.add('status-active');
    els.flashBtn.classList.remove('status-danger');
    return;
  }

  if (status === 'expired') {
    els.flashBtnText.textContent = 'انتهى العرض';
    els.flashBtnMeta.textContent = endedAt;
    els.flashBtn.classList.remove('status-active');
    els.flashBtn.classList.add('status-danger');
    return;
  }

  els.flashBtnText.textContent = 'عرض الساعة';
  els.flashBtnMeta.textContent = 'قريبًا';
  els.flashBtn.classList.remove('status-active');
  els.flashBtn.classList.remove('status-danger');
}
function getSelectedTierObject() {
  if (!state.selectedTier) return null;
  if (typeof state.selectedTier === 'string') {
    return state.tiers.find((tier) => tier.tier_name === state.selectedTier) || { tier_name: state.selectedTier };
  }
  return state.selectedTier;
}
function getSelectedTierLabel() {
  const tier = getSelectedTierObject();
  if (!tier) return 'الشريحة الرئيسية';
  return tierDisplayLabel(tier);
}
function tierDisplayLabel(tier) {
  const raw = String(tier?.visible_label || tier?.tier_name || 'الشريحة الرئيسية').trim();
  if (!raw) return 'الشريحة الرئيسية';
  return raw.toLowerCase() === 'base' ? 'الشريحة الرئيسية' : raw;
}
function tierName() {
  const tier = getSelectedTierObject();
  return tier?.tier_name || null;
}
function setSearch(value) {
  state.search = String(value || '').trim();
  renderApp();
}
function setSelectedTier(tier, persist = true) {
  state.selectedTier = tier;
  if (persist) saveJSON(STORAGE.tier, tier);
}
async function handleSelectTier(tier) {
  const current = tierName();
  if (current === tier.tier_name) {
    state.selectedTier = null;
    saveJSON(STORAGE.tier, null);
    state.tierPrices = { carton: new Map(), pack: new Map() };
    resetCheckoutStage();
    syncCartPricesFromCurrentState();
    renderCart();
    renderApp();
    navigate('#home');
    smartToast('tier.missing', 'تم الخروج من الشريحة', true);
    return;
  }
  setSelectedTier(tier, true);
  await loadTierPrices(tier);
  resetCheckoutStage();
  syncCartPricesFromCurrentState();
  renderCart();
  renderApp();
  navigate('#home');
  smartToast('tier.selected', `تم اختيار ${tierDisplayLabel(tier)}`, true);
  trackRecommendationSignal({
    source: 'tier_change',
    entity_type: 'tier',
    entity_id: tier.tier_name,
    signal_type: 'select',
    weight: 1,
    metadata: { tier_name: tier.tier_name },
  });
}
function toggleProductFromCard(productId) {
  const product = state.products.find((item) => item.product_id === productId);
  if (!product) return;
  const card = document.querySelector(`.product-card[data-product-id="${CSS.escape(productId)}"]`);
  const unit = card?.querySelector('.unit-chip.active')?.getAttribute('data-unit') || currentUnitForProduct(product);
  const qtyInput = card?.querySelector('.qty-input');
  const qty = setProductQty(productId, qtyInput ? qtyInput.value : getProductQty(productId));
  const key = cartKey({ type: 'product', id: productId, unit });
  const existing = findCartItem(key);
  if (existing) {
    state.cart = state.cart.filter((item) => item.key !== key);
    persistCart();
    resetCheckoutStage();
    renderCart();
    renderApp();
    state.behavior.lastCartActivity = Date.now();
    toast('تمت إزالة المنتج من السلة.');
    trackCartEvent('remove', existing, { source: 'product-card' });
    return;
  }

  const price = resolveProductPrice(product, unit);
  state.cart.push({
    key,
    type: 'product',
    id: productId,
    title: product.product_name,
    image: product.product_image || placeholderImage(product.product_name),
    company: companyName(product.company_id),
    unit,
    unitLabel: unit === 'carton' ? 'كرتونة' : 'دستة',
    price,
    qty,
  });
  persistCart();
  resetCheckoutStage();
  renderCart();
  renderApp();
  state.behavior.lastCartActivity = Date.now();
  toast('تمت إضافة المنتج إلى السلة.');
  trackCartEvent('add', state.cart[state.cart.length - 1], { source: 'product-card' });
}
function toggleDeal(type, id) {
  const source = type === 'deal' ? state.dailyDeals : state.flashOffers;
  const item = source.find((row) => String(row.id) === String(id));
  if (!item) return;
  if (type === 'deal' && !item.can_buy) return toast('صفقة اليوم غير متاحة');
  if (type === 'flash' && !item.can_buy) return toast('العرض غير متاح');
  const key = `${type}:${item.id}:single`;
  const existing = findCartItem(key);
  if (existing) {
    state.cart = state.cart.filter((row) => row.key !== key);
    persistCart();
    resetCheckoutStage();
    renderCart();
    renderApp();
    state.behavior.lastCartActivity = Date.now();
    toast('تمت إزالة المنتج من السلة.');
    trackCartEvent('remove', existing, { source: 'deal-card' });
    return;
  }
  state.cart.push({
    key,
    type,
    id: item.id,
    title: item.title,
    image: item.image || placeholderImage(item.title),
    company: type === 'deal' ? 'صفقة اليوم' : 'عرض الساعة',
    unit: 'single',
    unitLabel: 'دستة',
    price: Number(item.price || 0),
    qty: 1,
  });
  persistCart();
  resetCheckoutStage();
  renderCart();
  renderApp();
  state.behavior.lastCartActivity = Date.now();
  toast('تمت إضافة المنتج إلى السلة.');
  trackCartEvent('add', state.cart[state.cart.length - 1], { source: 'deal-card' });
}
function renderCart() {
  if (!state.cart.length) {
    els.cartItems.innerHTML = '<div class="empty-state">السلة فارغة الآن</div>';
    els.cartTotal.textContent = integer(cartTotal());
    syncCheckoutButton();
    updateHeader();
    return;
  }

  els.cartItems.innerHTML = state.cart.map((item) => `
    <div class="cart-item">
      <img src="${escapeHtml(item.image || placeholderImage(item.title))}" alt="${escapeHtml(item.title)}" loading="lazy" />
      <div>
        <h4 class="cart-title">${escapeHtml(item.title)}</h4>
        <div class="cart-meta">${escapeHtml(item.company || '')}</div>
        <div class="cart-price">${escapeHtml(item.unitLabel || item.unit || '')} · ${num(item.price)} ج.م</div>
        <div class="qty-row">
          <button data-action="qty-down" data-key="${escapeHtml(item.key)}" type="button">-</button>
          <input data-role="cart-qty" data-key="${escapeHtml(item.key)}" type="number" min="1" value="${integer(item.qty || 1)}" inputmode="numeric" />
          <button data-action="qty-up" data-key="${escapeHtml(item.key)}" type="button">+</button>
          <button class="ghost-btn" data-action="remove-item" data-key="${escapeHtml(item.key)}" type="button">حذف</button>
        </div>
      </div>
    </div>
  `).join('');

  els.cartTotal.textContent = integer(cartTotal());
  syncCheckoutButton();
  updateHeader();
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
  trackCartEvent('update', item, { source: 'qty-input' });
}
function removeCartItem(key) {
  const item = state.cart.find((row) => row.key === key);
  state.cart = state.cart.filter((row) => row.key !== key);
  persistCart();
  resetCheckoutStage();
  state.behavior.lastCartActivity = Date.now();
  renderCart();
  renderApp();
  if (item) trackCartEvent('remove', item, { source: 'cart' });
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
  trackCartEvent('update', item, { source: 'cart-adjust', delta });
}
async function getLiveCheckoutSnapshot() {
  const productItems = state.cart.filter((item) => item.type === 'product');
  const ids = [...new Set(productItems.map((item) => String(item.id)))];
  const tier = getSelectedTierObject();
  const tierKey = tier?.tier_name || null;
  const [freshProducts, freshTier] = await Promise.all([
    ids.length ? apiGet('v_products', {
      select: 'product_id,product_name,company_id,has_carton,has_pack,carton_price,pack_price,allow_discount',
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
    const liveDiscount = snapshot.tierRow && product.allow_discount !== false
      ? Number(snapshot.tierRow.discount_percent || 0)
      : 0;
    const livePrice = liveDiscount > 0 && liveBase > 0
      ? Number((liveBase * (1 - liveDiscount / 100)).toFixed(2))
      : liveBase;

    if (Math.abs(Number(item.price || 0) - livePrice) > 0.0001) {
      return {
        ok: false,
        message: `سعر ${item.title} تغيّر. أعد إضافة المنتج من جديد`,
      };
    }
  }

  if (snapshot.tierRow && Number(cartTotal()) < Number(snapshot.tierRow.min_order || 0)) {
    const remaining = Number(snapshot.tierRow.min_order || 0) - Number(cartTotal());
    return {
      ok: false,
      message: `المتبقي لتحقيق الشريحة: ${num(remaining)}. أضف منتجات لإكمال الخصم.`,
    };
  }

  return { ok: true, snapshot };
}
function validateBeforeOrder() {
  if (!state.session) {
    state.pendingReturnHash = location.hash || '#home';
    closeCart();
    openRegisterPage();
    toast('يلزمك التسجيل أولًا لإرسال الطلب.');
    return false;
  }

  if (state.session.userType === 'rep' && !state.selectedCustomer) {
    closeCart();
    navigate('#my-customers');
    toast('يلزمك اختيار عميل قبل إرسال الطلب.');
    return false;
  }

  if (!state.cart.length) {
    toast('السلة فارغة.');
    return false;
  }

  const tier = getSelectedTierObject();
  if (!tier) {
    toast('يلزمك اختيار الشريحة أولًا.');
    return false;
  }

  const total = cartTotal();
  const minOrder = Number(tier.min_order || 0);
  if (total < minOrder) {
    const diff = minOrder - total;
    closeCart();
    navigate('#home');
    toast(`المتبقي لتحقيق الشريحة: ${num(diff)}. أضف منتجات لإكمال الخصم.`);
    return false;
  }

  return true;
}
async function buildOrderPayload(orderNumber) {
  const isRep = state.session.userType === 'rep';
  const repCustomer = isRep ? state.selectedCustomer : null;
  return {
    order_number: String(orderNumber),
    user_type: state.session.userType,
    customer_id: isRep ? repCustomer?.id || null : state.session.id,
    sales_rep_id: isRep ? state.session.id : null,
    user_id: isRep ? state.session.id : null,
    total_amount: Number(cartTotal().toFixed(2)),
    products_total: Number(state.cart.filter((item) => item.type === 'product').reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0).toFixed(2)),
    deals_total: Number(state.cart.filter((item) => item.type === 'deal').reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0).toFixed(2)),
    flash_total: Number(state.cart.filter((item) => item.type === 'flash').reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0).toFixed(2)),
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
    price: Number(item.price || 0),
    unit: item.unit === 'carton' ? 'carton' : item.unit === 'pack' ? 'pack' : 'piece',
    type: item.type === 'deal' ? 'deal' : item.type === 'flash' ? 'flash' : 'product',
  }));
  if (!items.length) return;
  await apiPost('order_items', items);
}
function buildWhatsAppInvoice(order, items) {
  const model = buildInvoiceModel(order, items);
  return invoiceViewText(model);
}
function sendToWhatsApp(order, items) {
  const phone = CONFIG.supportWhatsapp;
  const text = buildWhatsAppInvoice(order, items);
  const url = `https://wa.me/${phone}?text=${text}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
async function handleCheckout() {
  if (!validateBeforeOrder()) return;

  const dbCheck = await validateCartAgainstDatabase();
  if (!dbCheck.ok) {
    toast(dbCheck.message);
    return;
  }

  try {
    const order = await createOrder();
    console.log('ORDER CREATED:', order.id);
    await insertOrderItems(order.id);
    await trackPurchaseEvent(order, state.cart);
    sendToWhatsApp(order, state.cart);

    toast('تم إرسال الطلب بنجاح.');

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
async function handleLogin() {

  const identifier = els.loginIdentifier.value.trim();
  const password = els.loginPassword.value.trim();
  if (!identifier || !password) {
    toast('أدخل البيانات كاملة');
    return;
  }

  try {
    let user = await lookupUser('customers', identifier);
    let userType = 'customer';
    if (!user) {
      user = await lookupUser('sales_reps', identifier);
      userType = 'rep';
    }
    if (!user) {
      smartToast('login.error', 'المستخدم غير موجود', true);
      return;
    }
    if (String(user.password || '').trim() !== password) {
      smartToast('login.error', 'كلمة المرور غير صحيحة', true);
      return;
    }

    state.session = { ...user, userType };
    state.invoicesLoaded = false;
    state.invoices = [];
    state.customersLoaded = false;
    state.customers = [];
    state.selectedCustomer = null;
    persistSelectedCustomer();
    saveJSON(STORAGE.session, state.session);
    closeLogin();
    updateHeader();
    renderApp();
    smartToast('login.success', `مرحبًا ${getSessionLabel()}`, true);
  } catch (error) {
    console.error(error);
    toast('تعذر تسجيل الدخول الآن');
  }
}
function logout() {
  state.session = null;
  state.invoicesLoaded = false;
  state.invoices = [];
  state.customersLoaded = false;
  state.customers = [];
  state.selectedCustomer = null;
  persistSelectedCustomer();
  saveJSON(STORAGE.session, null);
  toggleUserMenu(false);
  resetCheckoutStage();
  updateHeader();
  renderApp();
  toast('تم تسجيل الخروج');
}
async function handleRoute() {
  state.view = parseHash();
  if (state.view.type === 'deals') state.behavior.visitedDeals = true;
  if (state.view.type === 'flash') state.behavior.visitedFlash = true;
  if (state.view.type === 'invoices' && !state.invoicesLoaded) {
    await loadInvoices();
  }
  if (state.view.type === 'my-customers' && !state.customersLoaded) {
    await loadMyCustomers();
  }
  renderApp();
  const currentHash = location.hash || '#home';
  if (state.behavior.lastTrackedHash !== currentHash) {
    await trackPageVisit({
      page_title: state.view.type === 'company' ? companyName(state.view.companyId) : document.title,
      metadata: {
        route: state.view.type,
        company_id: state.view.companyId || null,
      },
    });
  }
  if (state.view.type === 'company') {
    bumpViewCounts(filteredProducts().map((product) => product.product_id));
  }
}
function syncUnitPreference(productId, unit) {
  state.unitPrefs[productId] = unit;
  saveJSON(STORAGE.unitPrefs, state.unitPrefs);
}
function wireGlobalEvents() {
  document.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-action], [data-close], [data-company-id]');
    if (!target) return;

    const closeTarget = target.getAttribute('data-close');
    if (closeTarget === 'loginModal') return closeLogin();
    if (closeTarget === 'myDataModal') return closeMyData();
    if (closeTarget === 'addCustomerModal') return closeAddCustomer();
    if (closeTarget === 'cartDrawer') return closeCart();
    if (closeTarget === 'registerPage') return closeRegisterPage();

    const action = target.getAttribute('data-action');
    if (action === 'close-cart') return closeCart();
    if (action === 'nav') {
      const targetHash = target.getAttribute('data-target');
      if (targetHash) navigate(`#${targetHash}`);
      return;
    }
    if (action === 'focus-search') {
      document.getElementById('searchInput')?.focus();
      return;
    }
    if (action === 'clear-search') {
      setSearch('');
      document.getElementById('searchInput')?.focus();
      return;
    }
    if (action === 'user') {
      if (!state.session) {
        openLogin();
        return;
      }
      toggleUserMenu();
      return;
    }
    if (action === 'checkout') return handleCheckout();
    if (action === 'save-cart') {
      persistCart();
      toast('تم حفظ السلة');
      return;
    }
    if (action === 'open-company') {
      const companyId = target.getAttribute('data-company-id');
      navigate(`#company/${encodeURIComponent(companyId)}`);
      return;
    }
    if (action === 'cart') return openCart();
    if (action === 'my-data') return openMyData();
    if (action === 'my-customers') {
      toggleUserMenu(false);
      return openMyCustomers();
    }
    if (action === 'open-add-customer') return openAddCustomer();
    if (action === 'save-customer') return saveCustomer();
    if (action === 'open-register') return openRegisterPage();
    if (action === 'register-submit') return registerCustomer();
    if (action === 'register-locate') {
      const locationInput = document.getElementById('registerLocation');
      if (!navigator.geolocation) {
        toast('الموقع غير مدعوم على الجهاز');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const value = `https://maps.google.com/?q=${latitude},${longitude}`;
          if (locationInput) locationInput.value = value;
          smartToast('success.register', 'تم تحديد الموقع', true);
        },
        () => {
          toast('تعذر تحديد الموقع');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
      return;
    }
    if (action === 'back-login') {
      navigate('#home');
      openLogin();
      return;
    }
    if (action === 'select-customer') return selectCustomer(target.getAttribute('data-customer-id'));
    if (action === 'set-unit') {
      const productId = target.getAttribute('data-product-id');
      const unit = target.getAttribute('data-unit');
      syncUnitPreference(productId, unit);
      resetCheckoutStage();
      renderApp();
      return;
    }
    if (action === 'open-product' || action === 'toggle-product') return toggleProductFromCard(target.getAttribute('data-product-id'));
    if (action === 'toggle-deal') return toggleDeal('deal', target.getAttribute('data-id'));
    if (action === 'toggle-flash') return toggleDeal('flash', target.getAttribute('data-id'));
    if (action === 'qty-up') return qtyAdjust(target.getAttribute('data-key'), 1);
    if (action === 'qty-down') return qtyAdjust(target.getAttribute('data-key'), -1);
    if (action === 'remove-item') return removeCartItem(target.getAttribute('data-key'));
    if (action === 'select-tier') {
      const tier = {
        tier_name: target.getAttribute('data-tier-name'),
        visible_label: target.getAttribute('data-visible-label'),
      };
      const matched = state.tiers.find((row) => row.tier_name === tier.tier_name) || tier;
      await handleSelectTier(matched);
      return;
    }
    if (action === 'invoices') {
      toggleUserMenu(false);
      navigate('#invoices');
      return;
    }
    if (action === 'logout') {
      logout();
      return;
    }
    if (action === 'refresh-invoices') {
      state.invoicesLoaded = false;
      await loadInvoices();
      renderApp();
      return;
    }
  });

  document.addEventListener('input', (event) => {
    const el = event.target;
    if (el.id === 'searchInput') {
      setSearch(el.value);
      return;
    }
    if (el.matches('[data-role="cart-qty"]')) {
      setCartQty(el.getAttribute('data-key'), el.value);
    }
    if (el.matches('[data-role="product-qty"]')) {
      setProductQty(el.getAttribute('data-product-id'), el.value);
    }
  });

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (form && form.id === 'registerForm') {
      event.preventDefault();
      registerCustomer();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeLogin();
      closeCart();
      toggleUserMenu(false);
    }
    if (event.key === 'Enter' && document.activeElement === els.loginPassword) {
      handleLogin();
    }
  });

  document.addEventListener('click', (event) => {
    const clickedInsideUser = event.target.closest('.user-wrap');
    if (!clickedInsideUser) toggleUserMenu(false);
    const clickedInsideModal = event.target.closest('.modal-card');
    if (!clickedInsideModal && event.target === els.loginModal) closeLogin();
    if (!clickedInsideModal && event.target === els.myDataModal) closeMyData();
    if (event.target === els.cartDrawer) closeCart();
  });

  // legacy explicit listeners intentionally removed; interactions are delegated globally
}
function triggerSmartBehavior() {
  if (!canShowMessage()) return;

  const tier = getSelectedTierObject();
  const now = Date.now();

  if (!tier && now - state.behavior.lastTierPrompt > 60000) {
    state.behavior.lastTierPrompt = now;
    smartToast('tier.missing', undefined, true);
    return;
  }

  if (state.cart.length === 0 && now - state.behavior.lastCartActivity > 45000 && now - state.behavior.lastCartPrompt > 45000) {
    state.behavior.lastCartPrompt = now;
    smartToast('cart.idle', undefined, true);
    return;
  }

  if (!state.behavior.visitedDeals && now - state.behavior.lastDealsPrompt > 90000) {
    state.behavior.lastDealsPrompt = now;
    smartToast('deals.suggest', undefined, true);
    return;
  }

  const flashState = getFlashState();
  if (flashState.status === 'active' && now - state.behavior.lastFlashPrompt > 90000) {
    state.behavior.lastFlashPrompt = now;
    smartToast('deals.active', undefined, true);
  }
}
function scheduleSmartPulse() {
  clearTimeout(salesPulseTimer);
  salesPulseTimer = setTimeout(() => {
    triggerSmartBehavior();
    scheduleSmartPulse();
  }, randomDelay());
}
async function tick() {
  updateHeader();
  const current = parseHash();
  if (current.type === 'flash') {
    renderApp();
    return;
  }
  updateFlashHeader();
}
async function init() {
  wireGlobalEvents();
  renderCart();
  updateHeader();
  syncCheckoutButton();
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
  clearInterval(dynamicTimer);
  dynamicTimer = setInterval(tick, 1000);
  scheduleSmartPulse();
  loadData();
  trackPageVisit({ page_title: document.title, metadata: { route: state.view.type || 'home', initial: true } });
}

init();
