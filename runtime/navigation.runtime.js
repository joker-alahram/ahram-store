/* navigation.runtime.js — routing and runtime orchestration */



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
  const preserveSearch = active && active.id === 'headerSearchInput' ? { start: active.selectionStart, end: active.selectionEnd } : null;
  updateHeader();
  state.view = parseHash();
  const isRegister = state.view.type === 'register';
  const isHome = state.view.type === 'home';

  if (els.mobileHeaderShell) els.mobileHeaderShell.classList.toggle('hidden', isRegister);
  if (els.bottomNav) els.bottomNav.classList.toggle('hidden', isRegister);
  if (els.banner) {
    els.banner.classList.toggle('hidden', isRegister);
    els.banner.innerHTML = isRegister ? '' : companyBannerHtml();
  }
  if (els.searchBar) els.searchBar.classList.toggle('hidden', isRegister);
  if (els.pageContent) els.pageContent.classList.toggle('hidden', isRegister);
  if (els.registerPage) els.registerPage.classList.toggle('hidden', !isRegister);

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
  } else {
    renderHomePage();
  }

  wirePageEvents();

  if (state.pendingScrollTarget) {
    const scrollTarget = document.getElementById(state.pendingScrollTarget);
    state.pendingScrollTarget = null;
    if (scrollTarget) {
      setTimeout(() => scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
  }

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



let navigationRuntimeBound = false;

function initNavigationRuntime() {
  if (navigationRuntimeBound) return;
  navigationRuntimeBound = true;
  wireGlobalEvents();
  window.addEventListener('hashchange', handleRoute);
}


function wirePageEvents() {
  let registerFormBound = wirePageEvents._registerFormBound || null;
  let registerSubmitBound = wirePageEvents._registerSubmitBound || null;
  let registerLocateBound = wirePageEvents._registerLocateBound || null;
  let backToLoginBound = wirePageEvents._backToLoginBound || null;

  const registerForm = document.getElementById('registerForm');
  if (registerForm && registerForm !== registerFormBound) {
    registerForm.addEventListener('submit', (event) => {
      event.preventDefault();
      registerCustomer();
    });
    registerFormBound = registerForm;
  }

  const registerSubmitBtn = document.getElementById('registerSubmitBtn');
  if (registerSubmitBtn && registerSubmitBtn !== registerSubmitBound) {
    registerSubmitBtn.addEventListener('click', registerCustomer);
    registerSubmitBound = registerSubmitBtn;
  }

  const registerLocateBtn = document.getElementById('registerLocateBtn');
  if (registerLocateBtn && registerLocateBtn !== registerLocateBound) {
    registerLocateBtn.addEventListener('click', () => {
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
          toast('تم تحديد الموقع');
        },
        () => {
          toast('تعذر تحديد الموقع');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    });
    registerLocateBound = registerLocateBtn;
  }

  const backToLoginBtn = document.getElementById('backToLoginBtn');
  if (backToLoginBtn && backToLoginBtn !== backToLoginBound) {
    backToLoginBtn.addEventListener('click', () => {
      navigate('#home');
      openLogin();
    });
    backToLoginBound = backToLoginBtn;
  }

  wirePageEvents._registerFormBound = registerFormBound;
  wirePageEvents._registerSubmitBound = registerSubmitBound;
  wirePageEvents._registerLocateBound = registerLocateBound;
  wirePageEvents._backToLoginBound = backToLoginBound;
}


async function handleRoute() {
  state.view = parseHash();
  recordUiEvent('route.change', { page: state.view.type, companyId: state.view.companyId || null });

  if (state.view.type === 'home') {
    recordUiEvent('page.view', { page: 'home' });
  }
  if (state.view.type === 'company' && state.view.companyId) {
    recordUiEvent('company.view', { companyId: state.view.companyId });
  }
  if (state.view.type === 'deals') {
    state.behavior.visitedDeals = true;
  }
  if (state.view.type === 'flash') {
    state.behavior.visitedFlash = true;
  }
  if (state.view.type === 'invoices' && !state.invoicesLoaded) {
    await loadInvoices();
  }
  if (state.view.type === 'my-customers' && !state.customersLoaded) {
    await loadMyCustomers();
  }
  renderApp();
}


function wireGlobalEvents() {
  document.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-action], [data-close], [data-company-id]');
    if (!target) return;

    const closeTarget = target.getAttribute('data-close');
    if (closeTarget === 'loginModal') return closeLogin();
    if (closeTarget === 'myDataModal') return closeMyData();
    if (closeTarget === 'addCustomerModal') return closeAddCustomer();
    if (closeTarget === 'productModal') return closeProductModal();
    if (closeTarget === 'tierModal') return closeTierModal();
    if (closeTarget === 'cartDrawer') return closeCart();
    if (closeTarget === 'navDrawer') return closeNavDrawer();
    if (closeTarget === 'registerPage') return closeRegisterPage();

    const action = target.getAttribute('data-action');
    if (action === 'open-company') {
      const companyId = target.getAttribute('data-company-id');
      recordUiEvent('company.click', { companyId });
      closeNavDrawer();
      navigate(`#company/${encodeURIComponent(companyId)}`);
      return;
    }
    if (action === 'home-cta') {
      closeNavDrawer();
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
      closeNavDrawer();
      closeCart();
      toggleUserMenu(false);
      state.search = '';
      navigate('#home');
      return;
    }
    if (action === 'nav-categories' || action === 'nav-tiers') {
      closeNavDrawer();
      closeCart();
      toggleUserMenu(false);
      navigate('#tiers');
      return;
    }
    if (action === 'nav-deals') {
      closeNavDrawer();
      closeCart();
      toggleUserMenu(false);
      navigate('#deals');
      return;
    }
    if (action === 'nav-cart') {
      closeNavDrawer();
      toggleUserMenu(false);
      openCart();
      return;
    }
    if (action === 'nav-account') {
      closeNavDrawer();
      openMyData();
      return;
    }
    if (action === 'open-tier-modal') {
      openTierModal();
      return;
    }
    if (action === 'open-tiers-page') {
      closeTierModal();
      navigate('#tiers');
      return;
    }
    if (action === 'shelf-more') {
      const hash = target.getAttribute('data-hash') || '#home';
      if (hash === '#cart') {
        openCart();
      } else {
        navigate(hash);
      }
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
    if (action === 'cart') return openCart();
    if (action === 'open-account-summary') return openMyData();
    if (action === 'my-data') return openMyData();
    if (action === 'open-login') { toggleUserMenu(false); closeMyData(); openLogin(); return; }
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
    if (action === 'open-product') return openProductModal(target.getAttribute('data-product-id'));
    if (action === 'open-offer') return openOfferModal(target.getAttribute('data-offer-type'), target.getAttribute('data-id'));
    if (action === 'toggle-product') return toggleProductFromCard(target.getAttribute('data-product-id'));
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
    if (el.matches('[data-role="cart-qty"]')) {
      setCartQty(el.getAttribute('data-key'), el.value);
    }
    if (el.matches('[data-role="product-qty"]')) {
      setProductQty(el.getAttribute('data-product-id'), el.value);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeLogin();
      closeCart();
      closeNavDrawer();
      toggleUserMenu(false);
    }
    if (event.key === 'Enter' && document.activeElement === els.loginPassword) {
      handleLogin();
    }
  });

  document.addEventListener('click', (event) => {
    const clickedInsideUser = event.target.closest('.user-wrap');
    if (!clickedInsideUser) toggleUserMenu(false);
    const clickedInsideNav = event.target.closest('.nav-drawer');
    if (!clickedInsideNav && event.target !== els.menuBtn) closeNavDrawer();
    const clickedInsideModal = event.target.closest('.modal-card');
    if (!clickedInsideModal && event.target === els.loginModal) closeLogin();
    if (!clickedInsideModal && event.target === els.myDataModal) closeMyData();
    if (event.target === els.cartDrawer) closeCart();
  });

  if (els.menuBtn) els.menuBtn.addEventListener('click', () => toggleNavDrawer());
  if (els.headerSearchInput) {
    els.headerSearchInput.addEventListener('input', (event) => {
      state.search = event.target.value;
      renderApp();
    });
  }
  if (els.headerClearSearchBtn) {
    els.headerClearSearchBtn.addEventListener('click', () => {
      state.search = '';
      renderApp();
      setTimeout(() => document.getElementById('headerSearchInput')?.focus(), 0);
    });
  }
  if (els.homeBtn) els.homeBtn.addEventListener('click', () => { state.search = ''; navigate('#home'); });
  if (els.tierBtn) els.tierBtn.addEventListener('click', () => openTierModal());
  if (els.flashBtn) els.flashBtn.addEventListener('click', () => navigate('#flash'));
  if (els.cartBtn) els.cartBtn.addEventListener('click', openCart);
  if (els.userBtn) els.userBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    openMyData();
  });
  els.submitLogin.addEventListener('click', handleLogin);
  const openRegisterBtn = document.getElementById('openRegister');
  if (openRegisterBtn) openRegisterBtn.addEventListener('click', openRegisterPage);
  if (els.checkoutBtn) {
    els.checkoutBtn.onclick = async () => {
      await handleCheckout();
    };
  }
  els.saveCartBtn.addEventListener('click', () => {
    persistCart();
    toast('تم حفظ السلة');
  });
}
