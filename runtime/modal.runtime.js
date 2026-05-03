/* modal.runtime.js — overlay and modal lifecycle */



function openProductModal(productId) {
  const product = typeof productId === 'object' ? productId : getProductById(productId);
  if (!product) return;

  state.activeDeal = null;
  state.activeProduct = product;
  recordUiEvent('product.details', { productId: product.product_id, companyId: product.company_id });

  const unit = currentUnitForProduct(product);
  const inCart = Boolean(findCartItem(cartKey({ type: 'product', id: product.product_id, unit })));
  const priceText = displayPriceText(product, unit);
  const unitText = unit === 'carton' ? 'كرتونة' : 'دستة';

  els.productModalTitle.textContent = product.product_name;
  els.productModalBody.innerHTML = `
    <div class="modal-hero">
      <img src="${escapeHtml(product.product_image || placeholderImage(product.product_name))}" alt="${escapeHtml(product.product_name)}" class="modal-image" />
      <div class="modal-meta">
        <div class="badge-row">
          <span class="badge">${escapeHtml(companyName(product.company_id))}</span>
          <span class="badge">${escapeHtml(unitText)}</span>
        </div>
        <div class="price-main">${escapeHtml(priceText)} ج.م</div>
        <p class="helper-text">${escapeHtml(product.allow_discount === false ? 'غير قابل للخصم' : 'قابل للتسعير حسب الشريحة')}</p>
      </div>
    </div>
  `;

  els.productModalAction.textContent = inCart ? 'إزالة من السلة' : 'شراء';
  els.productModalAction.setAttribute('data-action', 'toggle-product');
  els.productModalAction.setAttribute('data-product-id', product.product_id);
  els.productModalAction.removeAttribute('data-id');
  els.productModalSecondary.textContent = 'إغلاق';
  setOverlay(els.productModal, true);
}


function openOfferModal(type, id) {
  const source = type === 'deal' ? state.dailyDeals : state.flashOffers;
  const item = source.find((row) => String(row.id) === String(id));
  if (!item) return;

  state.activeProduct = null;
  state.activeDeal = item;
  recordUiEvent(`${type}.details`, { offerId: item.id, companyId: item.company_id || null });

  const canBuy = Boolean(item.can_buy);
  const actionLabel = type === 'deal' ? 'شراء الآن' : 'شراء الآن';
  const buttonLabel = canBuy ? (findCartItem(`${type}:${item.id}:single`) ? 'إزالة من السلة' : actionLabel) : 'انتهى العرض';

  els.productModalTitle.textContent = item.title;
  els.productModalBody.innerHTML = `
    <div class="modal-hero">
      <img src="${escapeHtml(item.image || placeholderImage(item.title))}" alt="${escapeHtml(item.title)}" class="modal-image" />
      <div class="modal-meta">
        <div class="badge-row">
          <span class="badge">${escapeHtml(type === 'deal' ? 'صفقة اليوم' : 'عرض الساعة')}</span>
          <span class="badge">${escapeHtml(type === 'flash' ? (item.status === 'active' ? 'نشط الآن' : item.status === 'expired' ? 'منتهي' : 'قريبًا') : (item.can_buy ? 'متاح' : 'غير متاح'))}</span>
        </div>
        <div class="price-main">${num(item.price)} ج.م</div>
        <p class="helper-text">${escapeHtml(item.description || '')}</p>
      </div>
    </div>
  `;

  els.productModalAction.textContent = buttonLabel;
  els.productModalAction.setAttribute('data-action', type === 'deal' ? 'toggle-deal' : 'toggle-flash');
  els.productModalAction.setAttribute('data-id', item.id);
  els.productModalAction.removeAttribute('data-product-id');
  els.productModalSecondary.textContent = 'إغلاق';
  setOverlay(els.productModal, true);
}


function closeProductModal() {
  setOverlay(els.productModal, false);
  state.activeProduct = null;
  state.activeDeal = null;
}


function setOverlay(el, show) {
  el.classList.toggle('hidden', !show);
  el.setAttribute('aria-hidden', String(!show));
}


function openLogin() {
  setOverlay(els.loginModal, true);
  els.loginIdentifier.focus();
}


function closeLogin() {
  setOverlay(els.loginModal, false);
}



function openRegisterPage() {
  state.pendingReturnHash = location.hash || '#home';
  state.pendingOpenCart = !els.cartDrawer?.classList.contains('hidden');
  closeLogin();
  if (location.hash !== '#register') {
    navigate('#register');
  } else {
    renderApp();
  }
}


function closeRegisterPage() {
  const next = state.pendingReturnHash || '#home';
  state.pendingReturnHash = null;
  navigate(next);
  if (state.pendingOpenCart) {
    state.pendingOpenCart = false;
    setTimeout(openCart, 0);
  }
}


function collectRegisterForm() {
  const name = document.getElementById('registerName')?.value || '';
  const phone = document.getElementById('registerPhone')?.value || '';
  const password = document.getElementById('registerPassword')?.value || '';
  const address = document.getElementById('registerAddress')?.value || '';
  const business_name = document.getElementById('registerBusinessName')?.value || '';
  const location = document.getElementById('registerLocation')?.value || '';
  return {
    name: String(name).trim(),
    phone: String(phone).trim(),
    password: String(password).trim(),
    address: String(address).trim(),
    business_name: String(business_name).trim(),
    location: String(location).trim(),
  };
}


function validateRegister(data) {
  if (!data.name || data.name.trim().split(/\s+/).length < 2) {
    return "اكتب اسمك ثنائي على الأقل";
  }

  if (!/^01[0-9]{9}$/.test(data.phone)) {
    return "رقم الموبايل مش صحيح";
  }

  if (!data.password || data.password.length < 4) {
    return "الباسورد لازم يكون 4 أرقام أو أكتر";
  }

  if (!data.address) {
    return "اكتب العنوان";
  }

  return null;
}


async function registerCustomer() {
  const data = collectRegisterForm();
  const error = validateRegister(data);
  if (error) {
    smartToast(error);
    return;
  }

  try {
    const exists = await apiGet('customers', {
      phone: `eq.${data.phone}`,
      select: 'id',
      limit: 1,
    }).catch(() => []);

    if (exists?.length) {
      smartToast('register.duplicate', 'رقمك متسجل قبل كده');
      return;
    }

    const created = (await apiPost('customers', {
      name: data.name,
      phone: data.phone,
      password: data.password,
      address: data.address,
      location: data.location || null,
      customer_type: 'direct',
      sales_rep_id: null,
      created_by: null,
    }))[0];

    console.log('CUSTOMER CREATED:', created.id);

    state.session = {
      id: created.id,
      name: created.name,
      phone: created.phone,
      address: created.address,
      location: created.location,
      userType: 'customer',
    };

    state.invoicesLoaded = false;
    state.invoices = [];
    state.customersLoaded = false;
    state.customers = [];
    state.selectedCustomer = null;

    saveJSON(STORAGE.session, state.session);
    sessionStorage.setItem('last_msg', '');

    smartToast('register.success', 'تم إنشاء الحساب بنجاح', true);
    const nextHash = state.pendingReturnHash || '#home';
    const reopenCart = state.pendingOpenCart;
    state.pendingReturnHash = null;
    state.pendingOpenCart = false;
    navigate(nextHash);
    if (reopenCart) setTimeout(openCart, 0);
  } catch (error) {
    console.error(error);
    smartToast('errors.generic', 'تعذر إنشاء الحساب الآن', true);
  }
}


function renderMyDataContent() {
  const s = state.session || {};
  const tier = getSelectedTierObject();
  const cartCount = state.cart.reduce((sum, item) => sum + Number(item.qty || 1), 0);
  const orderCount = Array.isArray(state.invoices) ? state.invoices.length : 0;
  const isRep = s.userType === 'rep';
  const summaryTiles = [
    {
      label: 'نوع الحساب',
      value: isRep ? 'مندوب' : s.userType === 'customer' ? 'عميل مباشر' : 'غير معروف',
      note: isRep ? 'وصول تشغيلي كامل' : 'وصول عميل مباشر',
    },
    {
      label: 'الاسم',
      value: s.name || s.username || 'غير متاح',
      note: s.phone || 'لا توجد بيانات اتصال',
    },
    {
      label: 'الشريحة',
      value: tier ? tierDisplayLabel(tier) : 'لم تُحدد',
      note: tier ? tierStatusLine() : 'غير مفعلة بعد',
    },
    {
      label: 'الطلبات',
      value: `${integer(orderCount)} طلب`,
      note: `${integer(cartCount)} منتج داخل السلة`,
    },
  ];
  const actions = [
    ['بيانات الحساب', 'open-account-summary'],
    ['عملائي', 'my-customers', !isRep],
    ['فواتيري', 'invoices'],
    ['طلباتي', 'invoices'],
    ['حالة الشريحة', 'open-tier-modal'],
    [state.session ? 'تسجيل الخروج' : 'تسجيل الدخول', state.session ? 'logout' : 'open-login'],
  ];
  if (!els.myDataContent) return;
  els.myDataContent.innerHTML = `
    <div class="account-summary-grid">
      ${summaryTiles.map((tile) => `
        <div class="account-summary-card">
          <span class="account-summary-label">${escapeHtml(tile.label)}</span>
          <strong>${escapeHtml(tile.value)}</strong>
          <small>${escapeHtml(tile.note)}</small>
        </div>
      `).join('')}
    </div>
    <div class="profile-grid profile-grid-operational">
      <div class="profile-item">
        <span class="profile-label">رقم الهاتف</span>
        <span class="profile-value">${escapeHtml(s.phone || 'غير متاح')}</span>
      </div>
      <div class="profile-item">
        <span class="profile-label">العنوان</span>
        <span class="profile-value">${escapeHtml(s.address || s.location || 'غير متاح')}</span>
      </div>
      <div class="profile-item">
        <span class="profile-label">حالة السلة</span>
        <span class="profile-value">${integer(cartCount)} منتج</span>
      </div>
      <div class="profile-item">
        <span class="profile-label">الطلبات</span>
        <span class="profile-value">${integer(orderCount)} طلب</span>
      </div>
    </div>
    <div class="account-actions-rail account-actions-rail-operational">
      ${actions.map(([label, action, disabled = false]) => `
        <button class="${action === 'logout' ? 'ghost-btn' : 'primary-btn'}" type="button" data-action="${escapeHtml(action)}" ${disabled ? 'disabled' : ''}>${escapeHtml(label)}</button>
      `).join('')}
    </div>
  `;
}


function openMyData() {
  toggleUserMenu(false);
  renderMyDataContent();
  setOverlay(els.myDataModal, true);
}


function closeMyData() {
  setOverlay(els.myDataModal, false);
}


function openMyCustomers() {
  if (!state.session) {
    toast('سجّل الدخول أولًا');
    openLogin();
    return;
  }
  if (state.session.userType !== 'rep') {
    toast('هذه الصفحة للمندوب فقط');
    return;
  }
  navigate('#my-customers');
}


function closeAddCustomer() {
  setOverlay(els.addCustomerModal, false);
}


function openAddCustomer() {
  if (!state.session) {
    toast('سجّل الدخول أولًا');
    openLogin();
    return;
  }
  if (state.session.userType !== 'rep') {
    toast('إضافة العملاء متاحة للمندوب فقط');
    return;
  }
  const nameEl = document.getElementById('custName');
  const phoneEl = document.getElementById('custPhone');
  const addressEl = document.getElementById('custAddress');
  if (nameEl) nameEl.value = '';
  if (phoneEl) phoneEl.value = '';
  if (addressEl) addressEl.value = '';
  setOverlay(els.addCustomerModal, true);
  setTimeout(() => nameEl?.focus(), 50);
}


function persistSelectedCustomer() {
  if (state.selectedCustomer) {
    saveJSON('b2b_selected_customer', state.selectedCustomer);
  } else {
    localStorage.removeItem('b2b_selected_customer');
  }
}


function selectCustomer(id) {
  const customer = state.customers.find((c) => c.id === id);
  if (!customer) return;
  state.selectedCustomer = customer;
  persistSelectedCustomer();
  closeAddCustomer();
  toast(`تم اختيار العميل: ${customer.name}`);
  navigate('#home');
}


async function saveCustomer() {
  if (!state.session || state.session.userType !== 'rep') {
    toast('هذه العملية للمندوب فقط');
    return;
  }

  const name = document.getElementById('custName')?.value.trim();
  const phone = document.getElementById('custPhone')?.value.trim();
  const address = document.getElementById('custAddress')?.value.trim();

  if (!name) {
    toast('اسم العميل مطلوب');
    return;
  }

  const payload = {
    name,
    phone: phone || null,
    address: address || null,
    customer_type: 'rep',
    created_by: state.session.id,
    sales_rep_id: state.session.id,
  };

  try {
    const created = (await apiPost('customers', payload))[0] || null;
    toast('تم إضافة العميل');
    closeAddCustomer();
    await loadMyCustomers();
    if (created?.id) {
      state.selectedCustomer = created;
      persistSelectedCustomer();
      toast(`تم اختيار العميل: ${created.name}`);
    }
    renderApp();
  } catch (error) {
    console.error(error);
    toast('تعذر إضافة العميل');
  }
}


function renderMyCustomersPage() {
  const repMode = state.session?.userType === 'rep';
  const selected = state.selectedCustomer;
  if (!repMode) {
    els.pageContent.innerHTML = `
      <div class="page-stack">
        <section class="section-card">
          <div class="section-head">
            <div>
              <h2>عملائي</h2>
              <div class="helper-text">هذه الصفحة متاحة للمندوب فقط</div>
            </div>
          </div>
        </section>
      </div>
    `;
    return;
  }

  const rows = state.customersLoaded ? state.customers : [];
  els.pageContent.innerHTML = `
    <div class="page-stack">
      <section class="section-card">
        <div class="section-head customers-head">
          <div>
            <h2>عملائي</h2>
            <div class="helper-text">اختر العميل قبل بدء الطلب</div>
          </div>
          <button class="primary-btn" data-action="open-add-customer" type="button">➕ إضافة عميل</button>
        </div>
        ${selected ? `
          <div class="selected-customer">
            <span class="selected-customer-label">العميل المختار</span>
            <strong>${escapeHtml(selected.name)}</strong>
            <small>${escapeHtml(selected.phone || '')}</small>
          </div>
        ` : ''}
      </section>
      <section class="customer-list">
        ${!state.customersLoaded ? `<div class="empty-state">جاري تحميل العملاء...</div>` : rows.length ? rows.map((customer) => `
          <article class="customer-card" data-action="select-customer" data-customer-id="${escapeHtml(customer.id)}">
            <div class="customer-card-top">
              <div>
                <h3 class="customer-name">${escapeHtml(customer.name)}</h3>
                <div class="customer-meta">${escapeHtml(customer.phone || 'بدون هاتف')}</div>
              </div>
              ${selected && selected.id === customer.id ? '<span class="badge">مختار</span>' : ''}
            </div>
            <div class="customer-address">${escapeHtml(customer.address || 'بدون عنوان')}</div>
          </article>
        `).join('') : `<div class="empty-state">لا توجد عملاء مرتبطة بهذا المندوب</div>`}
      </section>
    </div>
  `;
}


function openTierModal(pendingAction = null) {
  state.pendingTierAction = pendingAction || state.pendingTierAction || null;
  renderTierModalBody();
  setOverlay(els.tierModal, true);
}


function closeTierModal() {
  setOverlay(els.tierModal, false);
}


async function fulfillPendingTierAction() {
  const pending = consumePendingTierAction();
  if (!pending) return;

  if (pending.kind === 'product') {
    const product = getProductById(pending.productId);
    if (!product) return;
    const unit = pending.unit || currentUnitForProduct(product);
    const qty = Math.max(1, Number(pending.qty || getProductQty(product.product_id) || 1));
    const key = cartKey({ type: 'product', id: product.product_id, unit });
    if (findCartItem(key)) return;
    const price = resolveProductPrice(product, unit);
    state.cart.push({
      key,
      type: 'product',
      id: product.product_id,
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
    state.behavior.lastCartActivity = Date.now();
    recordUiEvent('cart.add', { productId: product.product_id, unit, qty, companyId: product.company_id });
    smartToast('cart.add', 'تم تفعيل الشريحة وإضافة المنتج للسلة', true);
    return;
  }

  if (pending.kind === 'deal' || pending.kind === 'flash') {
    const source = pending.kind === 'deal' ? state.dailyDeals : state.flashOffers;
    const item = source.find((row) => String(row.id) === String(pending.id));
    if (!item) return;
    const key = `${pending.kind}:${item.id}:single`;
    if (findCartItem(key)) return;
    state.cart.push({
      key,
      type: pending.kind,
      id: item.id,
      title: item.title,
      image: item.image || placeholderImage(item.title),
      company: pending.kind === 'deal' ? 'صفقة اليوم' : 'عرض الساعة',
      unit: 'single',
      unitLabel: 'دستة',
      price: Number(item.price || 0),
      qty: 1,
    });
    persistCart();
    resetCheckoutStage();
    state.behavior.lastCartActivity = Date.now();
    recordUiEvent('cart.add', { offerId: item.id, offerType: pending.kind });
    smartToast('cart.add', 'تم تفعيل الشريحة وإضافة العرض للسلة', true);
  }
}


function renderRegisterPage() {
  const target = els.registerPage || els.pageContent;
  if (!target) return;

  target.innerHTML = `
    <section class="register-shell">
      <div class="section-card register-card">
        <div class="register-hero">
          <h1>تسجيل عميل جديد</h1>
          <p>سجل حسابك الشخصى لتتمكن من أرسال طلبات الشراء ومتابعة كل طلباتك السابقه</p>
        </div>

        <form class="register-form" id="registerForm" autocomplete="on">
          <div class="register-grid">
            <label class="field">
              <span>الاسم الكامل</span>
              <input id="registerName" type="text" placeholder="الاسم ثنائي على الأقل" autocomplete="name" />
            </label>

            <label class="field">
              <span>رقم الموبايل</span>
              <input id="registerPhone" type="tel" placeholder="01xxxxxxxxx" inputmode="numeric" autocomplete="tel" />
            </label>

            <label class="field">
              <span>كلمة المرور</span>
              <input id="registerPassword" type="password" placeholder="4 أرقام أو أكتر" autocomplete="new-password" />
            </label>

            <label class="field">
              <span>العنوان</span>
              <input id="registerAddress" type="text" placeholder="العنوان بالتفصيل" autocomplete="street-address" />
            </label>

            <label class="field">
              <span>اسم النشاط (اختياري)</span>
              <input id="registerBusinessName" type="text" placeholder="اسم المحل أو النشاط" autocomplete="organization" />
            </label>

            <div class="field">
              <span>الموقع (اختياري)</span>
              <div class="location-row">
                <input id="registerLocation" type="text" placeholder="اضغط تحديد الموقع" autocomplete="off" />
                <button class="ghost-btn" id="registerLocateBtn" type="button">تحديد الموقع</button>
              </div>
            </div>
          </div>

          <div class="register-actions">
            <button class="primary-btn" id="registerSubmitBtn" type="submit">تحقق وسجل</button>
            <button class="ghost-btn" id="backToLoginBtn" type="button">رجوع للدخول</button>
          </div>
        </form>
      </div>
    </section>
  `;
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
    recordUiEvent('login.success', { userId: user.id, userType });
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


function initModalRuntime() {
  return true;
}
