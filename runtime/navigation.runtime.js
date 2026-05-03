/* navigation.runtime.js — routing, delegation, and runtime orchestration */

let navigationRuntimeBound = false;

function parseHash() {
  const raw = decodeURIComponent(location.hash || '#home').replace(/^#/, '');
  const parts = raw.split('/').filter(Boolean);
  if (!parts.length || parts[0] === 'home') return { type: 'home' };
  if (parts[0] === 'company' && parts[1]) return { type: 'company', companyId: parts[1] };
  if (parts[0] === 'tiers') return { type: 'tiers' };
  if (parts[0] === 'deals') return { type: 'deals' };
  if (parts[0] === 'flash') return { type: 'flash' };
  if (parts[0] === 'invoices') return { type: 'invoices' };
  if (parts[0] === 'my-customers') return { type: 'my-customers' };
  if (parts[0] === 'register') return { type: 'register' };
  if (parts[0] === 'cart') return { type: 'cart' };
  if (parts[0] === 'account') return { type: 'account' };
  return { type: 'home' };
}

function navigate(hash) {
  const nextHash = hash || '#home';
  if (location.hash === nextHash) {
    handleRoute();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  location.hash = nextHash;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateOperationalNav() {
  const mode = state.view?.type || 'home';
  const activeMap = {
    home: 'home',
    company: 'tiers',
    tiers: 'tiers',
    deals: 'deals',
    flash: 'deals',
    cart: 'cart',
    account: 'account',
    invoices: 'account',
    'my-customers': 'account',
    register: 'account',
  };
  const active = activeMap[mode] || 'home';
  document.querySelectorAll('[data-nav]').forEach((button) => {
    const isActive = button.getAttribute('data-nav') === active;
    button.classList.toggle('is-active', isActive);
    if (isActive) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

function renderApp() {
  const active = document.activeElement;
  const preserveSearch = active && active.id === 'headerSearchInput'
    ? { start: active.selectionStart, end: active.selectionEnd }
    : null;

  updateHeader();
  state.view = parseHash();

  const isRegister = state.view.type === 'register';

  if (els.mobileHeaderShell) els.mobileHeaderShell.classList.toggle('hidden', isRegister);
  if (els.bottomNav) els.bottomNav.classList.toggle('hidden', isRegister);
  if (els.banner) {
    els.banner.classList.toggle('hidden', isRegister);
    setPersistentHtml(els.banner, isRegister ? '' : companyBannerHtml());
  }
  if (els.searchBar) els.searchBar.classList.toggle('hidden', isRegister);
  if (els.pageContent) els.pageContent.classList.toggle('hidden', isRegister);
  if (els.registerPage) els.registerPage.classList.toggle('hidden', !isRegister);

  try {
    if (isRegister) {
      renderRegisterPage();
      setTimeout(() => document.getElementById('registerName')?.focus(), 50);
    } else if (state.view.type === 'home') {
      renderHomePage();
    } else if (state.view.type === 'company') {
      renderCompanyPage();
    } else if (state.view.type === 'tiers') {
      renderTierPage();
    } else if (state.view.type === 'deals') {
      renderDealsPage();
    } else if (state.view.type === 'flash') {
      renderFlashPage();
    } else if (state.view.type === 'invoices') {
      renderInvoicesPage();
    } else if (state.view.type === 'my-customers') {
      renderMyCustomersPage();
    } else if (state.view.type === 'account' || state.view.type === 'cart') {
      renderHomePage();
    } else {
      renderHomePage();
    }
  } catch (error) {
    console.error('render.failed', error);
    showToast?.('تعذر عرض الصفحة الحالية', 'error');
  }

  if (state.pendingScrollTarget) {
    const scrollTarget = document.getElementById(state.pendingScrollTarget);
    state.pendingScrollTarget = null;
    if (scrollTarget) {
      setTimeout(() => scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
  }

  updateOperationalNav();

  if (preserveSearch) {
    const input = document.getElementById('headerSearchInput');
    if (input) {
      input.focus();
      try {
        input.setSelectionRange(preserveSearch.start ?? input.value.length, preserveSearch.end ?? input.value.length);
      } catch {}
    }
  }
}

async function handleRoute() {
  state.view = parseHash();
  try {
    recordUiEvent?.('route.change', { page: state.view.type, companyId: state.view.companyId || null });
    if (state.view.type === 'home') recordUiEvent?.('page.view', { page: 'home' });
    if (state.view.type === 'company' && state.view.companyId) recordUiEvent?.('company.view', { companyId: state.view.companyId });
    if (state.view.type === 'deals') state.behavior.visitedDeals = true;
    if (state.view.type === 'flash') state.behavior.visitedFlash = true;
    if (state.view.type === 'invoices' && !state.invoicesLoaded) await loadInvoices();
    if (state.view.type === 'my-customers' && !state.customersLoaded) await loadMyCustomers();
  } catch (error) {
    console.warn('route.bootstrap.failed', error);
  }
  renderApp();
}

function closeAnyTransientUI() {
  closeLogin?.();
  closeCart?.();
  closeNavDrawer?.();
  toggleUserMenu?.(false);
}

async function handleAction(action, target) {
  if (!action) return;

  if (action === 'toggle-nav-drawer') return toggleNavDrawer?.();
  if (action === 'clear-search') {
    state.search = '';
    renderApp();
    setTimeout(() => document.getElementById('headerSearchInput')?.focus(), 0);
    return;
  }
  if (action === 'notify-action') {
    try { target.__notifyAction?.(); } catch (error) { console.warn('notify action error:', error); }
    return;
  }
  if (action === 'open-cart') return openCart?.();
  if (action === 'close-cart') return closeCart?.();
  if (action === 'open-login') {
    if (state.session) return openMyData?.();
    return openLogin?.();
  }
  if (action === 'open-register') return openRegisterPage?.();
  if (action === 'login-submit') return handleLogin?.();
  if (action === 'checkout') return handleCheckout?.();
  if (action === 'save-cart') {
    persistCart?.();
    toast?.('تم حفظ السلة');
    return;
  }
  if (action === 'register-submit') return;
  if (action === 'register-locate') {
    const locationInput = document.getElementById('registerLocation');
    if (!navigator.geolocation) {
      toast?.('الموقع غير مدعوم على الجهاز');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const value = `https://maps.google.com/?q=${latitude},${longitude}`;
        if (locationInput) locationInput.value = value;
        smartToast?.('success.register', 'تم تحديد الموقع', true);
      },
      () => toast?.('تعذر تحديد الموقع'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
    return;
  }
  if (action === 'back-login') {
    navigate('#home');
    openLogin?.();
    return;
  }
  if (action === 'home-cta') {
    closeNavDrawer?.();
    const hash = target.getAttribute('data-hash') || '#home';
    navigate(hash);
    if (hash === '#flash') {
      setTimeout(() => document.getElementById('flash-offers')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } else if (hash === '#home') {
      setTimeout(() => document.getElementById('companies-shelf')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
    return;
  }
  if (action === 'nav-home') {
    closeAnyTransientUI();
    state.search = '';
    navigate('#home');
    return;
  }
  if (action === 'nav-tiers') {
    closeAnyTransientUI();
    navigate('#tiers');
    return;
  }
  if (action === 'nav-deals') {
    closeAnyTransientUI();
    navigate('#deals');
    return;
  }
  if (action === 'nav-cart') {
    closeAnyTransientUI();
    openCart?.();
    return;
  }
  if (action === 'nav-account') {
    closeAnyTransientUI();
    if (state.session) openMyData?.();
    else openLogin?.();
    return;
  }
  if (action === 'open-tier-modal') return openTierModal?.();
  if (action === 'open-tiers-page') {
    closeTierModal?.();
    navigate('#tiers');
    return;
  }
  if (action === 'shelf-more') {
    const hash = target.getAttribute('data-hash') || '#home';
    if (hash === '#cart') openCart?.();
    else navigate(hash);
    return;
  }
  if (action === 'filter-category') {
    const category = target.getAttribute('data-category') || '';
    if (category) {
      state.search = category;
      navigate('#home');
    }
    return;
  }
  if (action === 'cart') return openCart?.();
  if (action === 'open-account-summary' || action === 'my-data') return openMyData?.();
  if (action === 'my-customers') return openMyCustomers?.();
  if (action === 'open-add-customer') return openAddCustomer?.();
  if (action === 'save-customer') return saveCustomer?.();
  if (action === 'select-customer') return selectCustomer?.(target.getAttribute('data-customer-id'));
  if (action === 'open-company') {
    const companyId = target.getAttribute('data-company-id');
    closeNavDrawer?.();
    navigate(`#company/${encodeURIComponent(companyId)}`);
    return;
  }
  if (action === 'open-product') return openProductModal?.(target.getAttribute('data-product-id'));
  if (action === 'open-offer') return openOfferModal?.(target.getAttribute('data-offer-type'), target.getAttribute('data-id'));
  if (action === 'set-unit') {
    syncUnitPreference?.(target.getAttribute('data-product-id'), target.getAttribute('data-unit'));
    resetCheckoutStage?.();
    renderApp();
    return;
  }
  if (action === 'toggle-product') return toggleProductFromCard?.(target.getAttribute('data-product-id'));
  if (action === 'toggle-deal') return toggleDeal?.('deal', target.getAttribute('data-id'));
  if (action === 'toggle-flash') return toggleDeal?.('flash', target.getAttribute('data-id'));
  if (action === 'qty-up') return qtyAdjust?.(target.getAttribute('data-key'), 1);
  if (action === 'qty-down') return qtyAdjust?.(target.getAttribute('data-key'), -1);
  if (action === 'remove-item') return removeCartItem?.(target.getAttribute('data-key'));
  if (action === 'select-tier') {
    const tier = {
      tier_name: target.getAttribute('data-tier-name'),
      visible_label: target.getAttribute('data-visible-label'),
    };
    const matched = state.tiers.find((row) => row.tier_name === tier.tier_name) || tier;
    await handleSelectTier?.(matched);
    return;
  }
  if (action === 'invoices') return navigate('#invoices');
  if (action === 'logout') return logout?.();
  if (action === 'refresh-invoices') {
    state.invoicesLoaded = false;
    await loadInvoices?.();
    renderApp();
    return;
  }
}

function handleDelegatedClick(event) {
  const target = event.target?.closest?.('[data-action], [data-close], [data-company-id]');
  if (!target) {
    const clickedInsideUser = event.target?.closest?.('.user-wrap');
    if (!clickedInsideUser) toggleUserMenu?.(false);
    const clickedInsideNav = event.target?.closest?.('.nav-drawer');
    if (!clickedInsideNav && event.target !== els.menuBtn) closeNavDrawer?.();
    const clickedInsideModal = event.target?.closest?.('.modal-card');
    if (!clickedInsideModal && event.target === els.loginModal) closeLogin?.();
    if (!clickedInsideModal && event.target === els.myDataModal) closeMyData?.();
    if (event.target === els.cartDrawer) closeCart?.();
    return;
  }

  const closeTarget = target.getAttribute('data-close');
  if (closeTarget === 'loginModal') return closeLogin?.();
  if (closeTarget === 'myDataModal') return closeMyData?.();
  if (closeTarget === 'addCustomerModal') return closeAddCustomer?.();
  if (closeTarget === 'productModal') return closeProductModal?.();
  if (closeTarget === 'tierModal') return closeTierModal?.();
  if (closeTarget === 'cartDrawer') return closeCart?.();
  if (closeTarget === 'navDrawer') return closeNavDrawer?.();
  if (closeTarget === 'registerPage') return closeRegisterPage?.();

  const action = target.getAttribute('data-action');
  handleAction(action, target).catch((error) => console.warn('action.failed', action, error));
}

function handleDelegatedInput(event) {
  const el = event.target;
  if (!el) return;
  if (el.matches?.('[data-role="cart-qty"]')) {
    setCartQty?.(el.getAttribute('data-key'), el.value);
  }
  if (el.matches?.('[data-role="product-qty"]')) {
    setProductQty?.(el.getAttribute('data-product-id'), el.value);
  }
}


function handleDelegatedSubmit(event) {
  const form = event.target;
  if (!form?.matches?.('#registerForm')) return;
  event.preventDefault();
  registerCustomer?.();
}

function handleDelegatedKeydown(event) {
  if (event.key === 'Escape') {
    closeLogin?.();
    closeCart?.();
    closeNavDrawer?.();
    toggleUserMenu?.(false);
  }
  if (event.key === 'Enter' && document.activeElement === els.loginPassword) {
    handleLogin?.();
  }
}

function initNavigationRuntime() {
  if (navigationRuntimeBound) return;
  navigationRuntimeBound = true;
  document.addEventListener('click', handleDelegatedClick);
  document.addEventListener('input', handleDelegatedInput);
  document.addEventListener('submit', handleDelegatedSubmit);
  document.addEventListener('keydown', handleDelegatedKeydown);
  window.addEventListener('hashchange', handleRoute);
}
