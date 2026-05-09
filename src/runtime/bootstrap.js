import { readConfig } from '../core/config.js';
import { dom } from '../core/dom.js';
import { navigate, parseRoute } from '../core/router.js';
import { createStore } from '../state/store.js';
import { loadJSON, storageKeys, saveJSON } from '../core/storage.js';
import { createApiClient } from '../services/apiClient.js';
import { loadRuntimeProducts } from '../repositories/runtimeProductsRepository.js';
import { loadRuntimeTiers } from '../repositories/runtimeTiersRepository.js';
import { loadRuntimeSettings } from '../repositories/runtimeSettingsRepository.js';
import { loadRuntimeOffers } from '../repositories/runtimeOffersRepository.js';
import { hydrateRuntimeCart, persistRuntimeCart, persistRuntimeTier, persistRuntimeUnitPrefs, persistRuntimeQtyPrefs, persistRuntimeCustomer } from '../repositories/runtimeCartRepository.js';
import { buildRuntimeCatalog, getDefaultTier, groupProductsByCompany, resolveTierProduct, resolveVisibleProducts } from '../services/productsService.js';
import { addVariantToCart, computeCartTotals, clearCart, cartKeyForVariant, removeCartLine, updateCartQty } from '../services/cartService.js';
import { login, logout, registerCustomer, loadRepCustomers, getSession } from '../services/authService.js';
import { validateCheckout, submitOrder } from '../services/checkoutService.js';
import { trackRuntimeEvent } from '../services/analyticsService.js';
import { formatMoney, buildWhatsAppInvoice } from '../services/invoiceService.js';
import { labelForUnit, normalizeText, cartLineKey, isoNow } from '../services/runtimeUtils.js';

function shellHtml() {
  return `
  <div class="app-shell">
    <header class="app-header" id="appHeader"></header>
    <section class="app-banner" id="appBanner"></section>
    <section class="app-hero" id="appHero"></section>
    <section class="app-search" id="appSearch"></section>
    <main class="app-main" id="appPage"></main>
    <footer class="app-footer" id="appFooter"></footer>
    <div class="app-overlays">
      <div id="appDrawerHost"></div>
      <div id="appModalHost"></div>
      <div id="appToastHost" aria-live="polite" aria-atomic="true"></div>
    </div>
  </div>`;
}

function createInitialState() {
  const theme = loadJSON(storageKeys.theme, 'premium-dark') || 'premium-dark';
  const selectedTier = loadJSON(storageKeys.tier, null);
  const session = getSession();
  return {
    app: { ready: false, route: parseRoute(), error: null },
    ui: {
      search: '',
      drawerOpen: false,
      activeModal: null,
      accountMenuOpen: false,
      selectedProductId: null,
      selectedCompanyId: null,
      selectedTierName: selectedTier,
      toastQueue: [],
      flashTick: Date.now(),
      pendingFlow: null,
      theme,
      invoiceOpenId: null,
    },
    auth: {
      session,
      selectedCustomer: loadJSON(storageKeys.customer, null),
      loginBusy: false,
      registerBusy: false,
    },
    commerce: {
      selectedTierName: selectedTier,
      unitPrefs: loadJSON(storageKeys.unitPrefs, {}),
      qtyPrefs: loadJSON(storageKeys.qtyPrefs, {}),
      cart: hydrateRuntimeCart(),
      catalog: {
        companies: [],
        products: [],
        productIndex: {},
        tiers: [],
        settings: {},
        offers: { daily: [], flash: [] },
      },
      customers: [],
      invoices: [],
    },
    runtime: {
      loading: { catalog: false, customers: false, invoices: false },
      behavior: loadJSON(storageKeys.behavior, []),
      flashState: null,
      lastSync: null,
    },
  };
}

function formatDate(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function escape(value) {
  return dom.escape(value);
}

function unitOptions(product, tierName) {
  return (product?.variants || []).filter((variant) => variant.tier_name === tierName);
}

function currentVariantForProduct(product, state, tierName) {
  const options = unitOptions(product, tierName);
  if (!options.length) return null;
  const preferred = String(state.commerce.unitPrefs[product.product_id] || '').trim();
  return options.find((variant) => variant.unit_code === preferred) || options[0];
}

function productHasCartLine(state, productId, tierName, unitCode) {
  return state.commerce.cart.some((item) => item.product_id === productId && item.tier_name === tierName && item.unit_code === unitCode);
}

function renderShell(state) {
  const tier = getSelectedTierSafe(state);
  const settings = state.commerce.catalog.settings || {};
  const bannerImage = settings.banner_image || '';
  const flash = state.runtime.flashState;
  const session = state.auth.session;
  const route = state.app.route.name;
  const companyCount = state.commerce.catalog.companies.length;
  const productCount = state.commerce.catalog.products.length;

  return {
    header: `
      <div class="header-shell">
        <div class="header-row header-row--primary">
          <button class="btn btn--ghost header-chip" type="button" data-action="nav" data-route="home">الرئيسية</button>
          <button class="btn btn--ghost header-chip" type="button" data-action="nav" data-route="tiers">${escape(tier.display_name || tier.tier_name || 'الشريحة')}</button>
          <button class="btn btn--ghost header-chip" type="button" data-action="nav" data-route="offers">العروض</button>
          <button class="btn btn--ghost header-chip" type="button" data-action="nav" data-route="cart">السلة ${state.commerce.cart.length ? `(${state.commerce.cart.length})` : ''}</button>
        </div>
        <div class="header-row header-row--secondary">
          <button class="btn btn--ghost" type="button" data-action="toggle-account">${escape(session?.name || session?.username || 'الحساب')}</button>
          <button class="btn btn--primary" type="button" data-action="nav" data-route="checkout">مراجعة الطلب</button>
        </div>
        <div class="header-menu ${state.ui.accountMenuOpen ? 'is-open' : ''}">
          ${session ? `
            <button type="button" data-action="nav" data-route="account">الحساب</button>
            <button type="button" data-action="nav" data-route="invoices">الفواتير</button>
            ${session.userType === 'rep' ? '<button type="button" data-action="nav" data-route="customers">العملاء</button>' : ''}
            <button type="button" data-action="logout">تسجيل الخروج</button>
          ` : `
            <button type="button" data-action="nav" data-route="login">تسجيل الدخول</button>
            <button type="button" data-action="nav" data-route="register">تسجيل عميل</button>
          `}
        </div>
      </div>
    `,
    banner: bannerImage ? `
      <div class="banner-shell">
        <img src="${escape(bannerImage)}" alt="banner" loading="eager" />
      </div>
    ` : '',
    hero: route === 'home' ? `
      <section class="hero-shell">
        <div class="hero-copy">
          <p class="eyebrow">منصة توزيع B2B عربية</p>
          <h1>واجهة تشغيلية مباشرة على البيانات الحية</h1>
          <p>الشركات: ${companyCount} · المنتجات: ${productCount} · الشريحة النشطة: ${escape(tier.display_name || tier.tier_name || 'base')}</p>
          <div class="hero-actions">
            <button class="btn btn--primary" type="button" data-action="nav" data-route="companies">تصفح الشركات</button>
            <button class="btn btn--ghost" type="button" data-action="nav" data-route="tiers">إدارة الشريحة</button>
          </div>
        </div>
        <div class="hero-stats">
          <div><span>العروض اليومية</span><strong>${state.commerce.catalog.offers.daily.length}</strong></div>
          <div><span>فلاش أوفر</span><strong>${state.commerce.catalog.offers.flash.length}</strong></div>
          <div><span>السلة</span><strong>${state.commerce.cart.length}</strong></div>
          <div><span>الوقت</span><strong>${formatDate(flash?.offer?.current_time || Date.now())}</strong></div>
        </div>
      </section>
    ` : '',
    search: `
      <div class="search-shell">
        <label class="search-box">
          <span>بحث مباشر</span>
          <input id="runtimeSearch" type="search" value="${escape(state.ui.search)}" placeholder="ابحث باسم المنتج أو الشركة أو الكود" autocomplete="off" />
        </label>
        <div class="search-actions">
          <button class="btn btn--ghost" type="button" data-action="clear-search">مسح</button>
          <button class="btn btn--ghost" type="button" data-action="nav" data-route="cart">فتح السلة</button>
        </div>
      </div>
    `,
    footer: `
      <nav class="bottom-nav">
        <button type="button" data-action="nav" data-route="home">الرئيسية</button>
        <button type="button" data-action="nav" data-route="companies">الشركات</button>
        <button type="button" data-action="nav" data-route="cart">السلة</button>
        <button type="button" data-action="nav" data-route="checkout">الطلب</button>
      </nav>
    `,
  };
}

function getSelectedTierSafe(state) {
  const catalogTiers = state.commerce.catalog.tiers || [];
  const selected = catalogTiers.find((tier) => tier.tier_name === state.commerce.selectedTierName) || getDefaultTier(catalogTiers) || catalogTiers[0] || { tier_name: 'base', display_name: 'base', min_order: 0, is_default: true };
  return selected;
}

function renderUnitChips(product, state, tierName) {
  const variants = unitOptions(product, tierName);
  return variants.map((variant) => {
    const active = state.commerce.unitPrefs[product.product_id] === variant.unit_code || (!state.commerce.unitPrefs[product.product_id] && variants[0]?.unit_code === variant.unit_code);
    return `<button type="button" class="unit-chip ${active ? 'is-active' : ''}" data-action="set-unit" data-product-id="${escape(product.product_id)}" data-unit-code="${escape(variant.unit_code)}">${escape(labelForUnit(variant.unit_code))}</button>`;
  }).join('');
}

function renderProductCard(product, state, tierName) {
  const variant = currentVariantForProduct(product, state, tierName);
  if (!variant) return '';
  const inCart = productHasCartLine(state, product.product_id, tierName, variant.unit_code);
  const image = product.product_image ? `<img src="${escape(product.product_image)}" alt="${escape(product.product_name)}" loading="lazy" />` : `<div class="product-card__image-fallback">${escape((product.product_name || 'P').slice(0, 1))}</div>`;
  return `
    <article class="product-card">
      <button class="product-card__media" type="button" data-action="open-product" data-product-id="${escape(product.product_id)}">
        ${image}
      </button>
      <div class="product-card__body">
        <div class="product-card__title">${escape(product.product_name)}</div>
        <div class="product-card__meta">${escape(product.company_name || '')}</div>
        <div class="product-card__price-row">
          <span class="price price--main">${formatMoney(variant.final_price)} ج.م</span>
          <span class="badge">${escape(tierName)}</span>
        </div>
        <div class="product-card__inventory">متاح: ${Number(variant.available_qty || 0)} · محجوز: ${Number(variant.reserved_qty || 0)}</div>
        <div class="unit-group">${renderUnitChips(product, state, tierName)}</div>
        <label class="qty-field">
          <span>الكمية</span>
          <input type="number" min="1" inputmode="numeric" value="${Number(state.commerce.qtyPrefs[product.product_id] || 1)}" data-role="product-qty" data-product-id="${escape(product.product_id)}" />
        </label>
        <button class="btn btn--primary product-card__cta" type="button" data-action="add-to-cart" data-product-id="${escape(product.product_id)}" data-tier-name="${escape(tierName)}" data-unit-code="${escape(variant.unit_code)}">${inCart ? 'إضافة كمية' : 'إضافة للسلة'}</button>
      </div>
    </article>
  `;
}

function renderCompanyCard(company) {
  return `
    <article class="company-card" data-action="nav" data-route="company" data-company-id="${escape(company.company_id || '')}">
      <div class="company-card__logo">${company.company_logo ? `<img src="${escape(company.company_logo)}" alt="${escape(company.company_name)}" loading="lazy" />` : `<span>${escape((company.company_name || 'C').slice(0, 1))}</span>`}</div>
      <h3 class="company-card__title">${escape(company.company_name || 'شركة')}</h3>
      <p class="company-card__meta">${Number(company.product_count || 0)} منتج</p>
      <button class="btn btn--ghost" type="button">تصفح</button>
    </article>
  `;
}

function renderOfferCard(offer, kind) {
  const status = kind === 'flash' ? (offer.status || 'active') : (offer.can_buy ? 'متاح' : 'غير متاح');
  return `
    <article class="offer-card">
      <div class="offer-card__media">${offer.image ? `<img src="${escape(offer.image)}" alt="${escape(offer.title || '')}" loading="lazy" />` : `<div class="offer-card__image-fallback">${escape((offer.title || 'O').slice(0, 1))}</div>`}</div>
      <div class="offer-card__body">
        <div class="badge-row"><span class="badge">${escape(status)}</span><span class="badge">${formatMoney(offer.price)} ج.م</span></div>
        <h3>${escape(offer.title || '')}</h3>
        <p>${escape(offer.description || '')}</p>
      </div>
    </article>
  `;
}

function renderTierCard(tier, active = false) {
  return `
    <article class="tier-card ${active ? 'is-active' : ''}">
      <div class="tier-card__head">
        <div>
          <h3>${escape(tier.display_name || tier.tier_name)}</h3>
          <p>الحد الأدنى ${formatMoney(tier.min_order || 0)} ج.م</p>
        </div>
        <span class="badge">${escape(tier.tier_name)}</span>
      </div>
      <button class="btn btn--primary" type="button" data-action="select-tier" data-tier-name="${escape(tier.tier_name)}">${active ? 'محدد' : 'اختيار'}</button>
    </article>
  `;
}

function renderCartLine(item) {
  const key = cartLineKey(item);
  return `
    <article class="cart-item">
      <div class="cart-item__body">
        <h3>${escape(item.product_name || '')}</h3>
        <p>${escape(labelForUnit(item.unit_code))} · ${escape(item.tier_name || '')}</p>
        <p>${formatMoney(item.final_price || 0)} ج.م</p>
      </div>
      <div class="cart-item__actions">
        <div class="qty-stepper">
          <button type="button" data-action="cart-qty-down" data-line-key="${escape(key)}">-</button>
          <input type="number" min="1" data-role="cart-qty" data-line-key="${escape(key)}" value="${Number(item.qty || 1)}" />
          <button type="button" data-action="cart-qty-up" data-line-key="${escape(key)}">+</button>
        </div>
        <button class="btn btn--ghost" type="button" data-action="remove-cart-line" data-line-key="${escape(key)}">حذف</button>
      </div>
    </article>
  `;
}

function renderPage(state) {
  const tier = getSelectedTierSafe(state);
  const catalog = state.commerce.catalog;
  const search = state.ui.search;
  const route = state.app.route;
  const visibleProducts = resolveVisibleProducts(catalog, search, tier.tier_name, route.name === 'company' ? route.params.companyId : '');
  const groupedCompanies = groupProductsByCompany(catalog, search, tier.tier_name);
  const totals = computeCartTotals(state.commerce.cart);
  const session = state.auth.session;

  if (!state.app.ready) {
    return '<section class="page-section"><div class="empty-state">جارٍ تحميل البيانات الحية...</div></section>';
  }

  switch (route.name) {
    case 'home': {
      const topCompanies = groupedCompanies.slice(0, 4);
      const topProducts = visibleProducts.slice(0, 12);
      return `
        <div class="page-stack">
          <section class="page-section"><div class="page-section__head"><div><h2>الشركات</h2><p>الشبكة التشغيلية الحية</p></div></div><div class="company-grid">${topCompanies.map((company) => renderCompanyCard(company)).join('') || '<div class="empty-state">لا توجد شركات ظاهرة</div>'}</div></section>
          <section class="page-section"><div class="page-section__head"><div><h2>المنتجات</h2><p>مطابقة للشريحة الحالية</p></div></div><div class="product-grid">${topProducts.map((product) => renderProductCard(product, state, tier.tier_name)).join('') || '<div class="empty-state">لا توجد منتجات مطابقة</div>'}</div></section>
          <section class="page-section"><div class="page-section__head"><div><h2>العروض اليومية</h2><p>مصدرها v_daily_deals</p></div></div><div class="offer-grid">${(catalog.offers.daily || []).slice(0, 4).map((offer) => renderOfferCard(offer, 'daily')).join('') || '<div class="empty-state">لا توجد عروض يومية</div>'}</div></section>
          <section class="page-section"><div class="page-section__head"><div><h2>فلاش أوفر</h2><p>مصدرها v_flash_offers</p></div></div><div class="offer-grid">${(catalog.offers.flash || []).slice(0, 4).map((offer) => renderOfferCard(offer, 'flash')).join('') || '<div class="empty-state">لا توجد فلاش أوفر</div>'}</div></section>
        </div>
      `;
    }
    case 'companies':
      return `
        <div class="page-stack"><section class="page-section"><div class="page-section__head"><div><h2>الشركات</h2><p>عرض مباشر للشركات الحية</p></div></div><div class="company-grid">${groupedCompanies.map((company) => renderCompanyCard(company)).join('') || '<div class="empty-state">لا توجد شركات</div>'}</div></section></div>
      `;
    case 'company': {
      const companyId = route.params.companyId || state.ui.selectedCompanyId || '';
      const company = catalog.companies.find((item) => String(item.company_id) === String(companyId)) || groupedCompanies.find((item) => String(item.company_id) === String(companyId));
      const companyProducts = resolveVisibleProducts(catalog, search, tier.tier_name, companyId);
      return `
        <div class="page-stack">
          <section class="page-section"><div class="page-section__head"><div><h2>${escape(company?.company_name || 'الشركة')}</h2><p>${company?.product_count ? `${company.product_count} منتج` : 'قائمة المنتجات الحية'}</p></div></div><div class="product-grid">${companyProducts.map((product) => renderProductCard(product, state, tier.tier_name)).join('') || '<div class="empty-state">لا توجد منتجات لهذه الشركة</div>'}</div></section>
        </div>
      `;
    }
    case 'offers':
      return `
        <div class="page-stack">
          <section class="page-section"><div class="page-section__head"><div><h2>العروض اليومية</h2><p>v_daily_deals</p></div></div><div class="offer-grid">${(catalog.offers.daily || []).map((offer) => renderOfferCard(offer, 'daily')).join('') || '<div class="empty-state">لا توجد عروض</div>'}</div></section>
          <section class="page-section"><div class="page-section__head"><div><h2>فلاش أوفر</h2><p>v_flash_offers</p></div></div><div class="offer-grid">${(catalog.offers.flash || []).map((offer) => renderOfferCard(offer, 'flash')).join('') || '<div class="empty-state">لا توجد فلاش أوفر</div>'}</div></section>
        </div>
      `;
    case 'tiers':
      return `<div class="page-stack"><section class="page-section"><div class="page-section__head"><div><h2>الشرائح</h2><p>مصدرها v_visible_tiers</p></div></div><div class="tier-grid">${catalog.tiers.map((tierRow) => renderTierCard(tierRow, tierRow.tier_name === tier.tier_name)).join('') || '<div class="empty-state">لا توجد شرائح ظاهرة</div>'}</div></section></div>`;
    case 'cart':
      return `
        <div class="page-stack">
          <section class="page-section"><div class="page-section__head"><div><h2>السلة</h2><p>عناصر مباشرة من الذاكرة الحية</p></div></div><div class="cart-list">${state.commerce.cart.map((item) => renderCartLine(item)).join('') || '<div class="empty-state">السلة فارغة</div>'}</div></section>
          <section class="page-section"><div class="summary-box"><div><span>الإجمالي</span><strong>${formatMoney(totals.grand)} ج.م</strong></div><div><span>عدد القطع</span><strong>${totals.count}</strong></div><button class="btn btn--primary" type="button" data-action="nav" data-route="checkout">إتمام الشراء</button></div></section>
        </div>
      `;
    case 'checkout': {
      const customer = state.auth.selectedCustomer || session;
      const validation = validateCheckout(state, tier, totals);
      return `
        <div class="page-stack">
          <section class="page-section"><div class="page-section__head"><div><h2>مراجعة الطلب</h2><p>${validation.ok ? 'جاهز للإرسال' : escape(validation.message)}</p></div></div><div class="checkout-box"><div class="checkout-box__row"><span>الشريحة</span><strong>${escape(tier.display_name || tier.tier_name)}</strong></div><div class="checkout-box__row"><span>العميل</span><strong>${escape(customer?.name || 'غير محدد')}</strong></div><div class="checkout-box__row"><span>الإجمالي</span><strong>${formatMoney(totals.grand)} ج.م</strong></div><div class="checkout-box__row"><span>الحد الأدنى</span><strong>${formatMoney(tier.min_order || 0)} ج.م</strong></div><button class="btn btn--primary" type="button" data-action="submit-checkout" ${validation.ok ? '' : 'disabled'}>إرسال الطلب</button></div></section>
        </div>
      `;
    }
    case 'login':
      return `<div class="page-stack"><section class="page-section"><div class="auth-card"><h2>تسجيل الدخول</h2><form data-form="login" class="auth-form"><label><span>رقم الهاتف أو اسم المستخدم</span><input name="identifier" type="text" autocomplete="username" /></label><label><span>كلمة المرور</span><input name="password" type="password" autocomplete="current-password" /></label><button class="btn btn--primary" type="submit">دخول</button></form></div></section></div>`;
    case 'register':
      return `<div class="page-stack"><section class="page-section"><div class="auth-card"><h2>تسجيل عميل جديد</h2><form data-form="register" class="auth-form"><label><span>الاسم</span><input name="name" type="text" /></label><label><span>الهاتف</span><input name="phone" type="tel" /></label><label><span>كلمة المرور</span><input name="password" type="password" /></label><label><span>العنوان</span><input name="address" type="text" /></label><label><span>الموقع</span><input name="location" type="text" /></label><button class="btn btn--primary" type="submit">إنشاء حساب</button></form></div></section></div>`;
    case 'customers':
      return `<div class="page-stack"><section class="page-section"><div class="page-section__head"><div><h2>العملاء</h2><p>${session?.userType === 'rep' ? 'قائمة المندوب' : 'يتطلب تسجيل دخول مندوب'}</p></div></div><div class="customer-grid">${(state.commerce.customers || []).map((customer) => `<article class="customer-card ${state.auth.selectedCustomer?.id === customer.id ? 'is-selected' : ''}" data-action="select-customer" data-customer-id="${escape(customer.id)}"><div class="customer-card__top"><div><h3>${escape(customer.name || '')}</h3><p>${escape(customer.phone || '')}</p></div>${state.auth.selectedCustomer?.id === customer.id ? '<span class="badge">مختار</span>' : ''}</div><div class="customer-card__address">${escape(customer.address || '')}</div><button class="btn btn--ghost" type="button">اختيار</button></article>`).join('') || '<div class="empty-state">لا توجد بيانات عملاء</div>'}</div></section></div>`;
    case 'invoices':
      return `<div class="page-stack"><section class="page-section"><div class="page-section__head"><div><h2>الفواتير</h2><p>طلبات تم تحميلها من قاعدة البيانات</p></div></div><div class="invoice-grid">${(state.commerce.invoices || []).map((invoice) => `<article class="invoice-card" data-action="open-invoice" data-invoice-id="${escape(invoice.id)}"><div class="invoice-card__top"><div><h3>#${escape(invoice.id || invoice.order_number || '')}</h3><p>${escape(formatDate(invoice.created_at))}</p></div><strong>${formatMoney(invoice.total_amount || 0)} ج.م</strong></div><div class="invoice-card__meta"><span class="badge">${escape(invoice.status || 'pending')}</span><span class="badge">${escape(invoice.user_type || '')}</span></div></article>`).join('') || '<div class="empty-state">لا توجد فواتير</div>'}</div></section></div>`;
    case 'account':
      return `<div class="page-stack"><section class="page-section"><div class="account-card"><h2>الحساب</h2><div class="account-card__row"><span>الاسم</span><strong>${escape(session?.name || '')}</strong></div><div class="account-card__row"><span>النوع</span><strong>${escape(session?.userType || '')}</strong></div><div class="account-card__row"><span>الهاتف</span><strong>${escape(session?.phone || '')}</strong></div><div class="account-card__row"><span>الشريحة</span><strong>${escape(tier.display_name || tier.tier_name)}</strong></div></div></section></div>`;
    default:
      return `<div class="page-stack"><section class="page-section"><div class="empty-state">الصفحة غير متاحة</div></section></div>`;
  }
}

function renderDrawer(state) {
  if (!state.ui.drawerOpen) return '';
  const totals = computeCartTotals(state.commerce.cart);
  return `
    <aside class="drawer-panel is-open">
      <div class="drawer-panel__head">
        <strong>السلة السريعة</strong>
        <button type="button" data-action="close-drawer">إغلاق</button>
      </div>
      <div class="drawer-panel__body">${state.commerce.cart.map((item) => renderCartLine(item)).join('') || '<div class="empty-state">السلة فارغة</div>'}</div>
      <div class="drawer-panel__foot"><span>${formatMoney(totals.grand)} ج.م</span><button class="btn btn--primary" type="button" data-action="nav" data-route="checkout">الانتقال للطلب</button></div>
    </aside>
  `;
}

function renderModal(state) {
  const type = state.ui.activeModal;
  if (!type) return '';
  const tier = getSelectedTierSafe(state);
  if (type === 'product') {
    const product = state.commerce.catalog.productIndex[state.ui.selectedProductId] || null;
    if (!product) return '';
    const variantRows = product.variants.filter((variant) => variant.tier_name === tier.tier_name);
    return `<div class="modal-backdrop" data-action="close-modal"><div class="modal-frame" role="dialog" aria-modal="true"><div class="modal-frame__head"><strong>${escape(product.product_name)}</strong><button type="button" data-action="close-modal">×</button></div><div class="modal-frame__body"><p>${escape(product.company_name || '')}</p>${variantRows.map((variant) => `<div class="variant-row"><span>${escape(labelForUnit(variant.unit_code))}</span><strong>${formatMoney(variant.final_price)} ج.م</strong><button class="btn btn--ghost" type="button" data-action="add-to-cart" data-product-id="${escape(product.product_id)}" data-tier-name="${escape(tier.tier_name)}" data-unit-code="${escape(variant.unit_code)}">إضافة</button></div>`).join('')}</div></div></div>`;
  }
  if (type === 'invoice') {
    const invoice = (state.commerce.invoices || []).find((row) => String(row.id) === String(state.ui.invoiceOpenId)) || null;
    return `<div class="modal-backdrop" data-action="close-modal"><div class="modal-frame" role="dialog" aria-modal="true"><div class="modal-frame__head"><strong>فاتورة ${escape(invoice?.id || '')}</strong><button type="button" data-action="close-modal">×</button></div><div class="modal-frame__body"><p>الحالة: ${escape(invoice?.status || '')}</p><p>الإجمالي: ${formatMoney(invoice?.total_amount || 0)} ج.م</p><p>التاريخ: ${escape(formatDate(invoice?.created_at))}</p></div></div></div>`;
  }
  if (type === 'login' || type === 'register') {
    return '';
  }
  return '';
}

function renderToasts(state) {
  return state.ui.toastQueue.map((toast) => `<div class="toast toast--${escape(toast.type || 'info')}"><strong>${escape(toast.title || '')}</strong><p>${escape(toast.message || '')}</p></div>`).join('');
}

function applyShell(root) {
  root.innerHTML = shellHtml();
}

function syncBodyTheme(theme) {
  document.body.dataset.theme = theme || 'premium-dark';
}

function persistSelections(state) {
  persistRuntimeTier(state.commerce.selectedTierName);
  persistRuntimeUnitPrefs(state.commerce.unitPrefs);
  persistRuntimeQtyPrefs(state.commerce.qtyPrefs);
  persistRuntimeCart(state.commerce.cart);
  persistRuntimeCustomer(state.auth.selectedCustomer);
  saveJSON(storageKeys.theme, state.ui.theme);
}

function notify(store, type, title, message) {
  const current = store.getState();
  const queue = [...current.ui.toastQueue, { id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`, type, title, message }].slice(-4);
  store.patch({ ui: { ...current.ui, toastQueue: queue } });
}

function closeMenus(store) {
  const state = store.getState();
  store.patch({ ui: { ...state.ui, accountMenuOpen: false, activeModal: null, drawerOpen: false } });
}

function getInvoiceSequence() {
  return Number(localStorage.getItem(storageKeys.invoiceSequence) || 20000);
}

function setInvoiceSequence(value) {
  localStorage.setItem(storageKeys.invoiceSequence, String(value));
}

async function loadInvoices(api, session) {
  const rows = await api.get('orders', { select: '*', order: 'created_at.desc', limit: '20' }).catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

async function loadInitialData(store, api, render) {
  const state = store.getState();
  store.patch({ runtime: { ...state.runtime, loading: { ...state.runtime.loading, catalog: true } } });
  render();
  try {
    const [products, tiers, settings, offers] = await Promise.all([
      loadRuntimeProducts(api),
      loadRuntimeTiers(api),
      loadRuntimeSettings(api),
      loadRuntimeOffers(api),
    ]);

    const catalog = buildRuntimeCatalog({
      runtimeRows: products.runtimeRows,
      catalogProducts: products.catalogProducts,
      companies: products.companies,
      tiers,
      settings: settings.settings || {},
      daily: offers.daily,
      flash: offers.flash,
    });

    const selectedTier = store.getState().commerce.selectedTierName || getDefaultTier(catalog.tiers)?.tier_name || catalog.tiers[0]?.tier_name || 'base';
    const session = store.getState().auth.session;
    const selectedCustomer = store.getState().auth.selectedCustomer;

    store.patch({
      commerce: {
        ...store.getState().commerce,
        selectedTierName: catalog.tiers.some((tier) => tier.tier_name === selectedTier) ? selectedTier : getDefaultTier(catalog.tiers)?.tier_name || catalog.tiers[0]?.tier_name || selectedTier,
        catalog,
      },
      ui: { ...store.getState().ui, selectedTierName: selectedTier },
      runtime: { ...store.getState().runtime, loading: { ...store.getState().runtime.loading, catalog: false }, lastSync: isoNow() },
    });

    const tierState = getSelectedTierSafe(store.getState());
    if (selectedCustomer && session?.userType !== 'rep') {
      persistRuntimeCustomer(null);
      store.patch({ auth: { ...store.getState().auth, selectedCustomer: null } });
    }

    if (session?.userType === 'rep') {
      store.patch({ runtime: { ...store.getState().runtime, loading: { ...store.getState().runtime.loading, customers: true } } });
      const customers = await loadRepCustomers(api, session.id);
      store.patch({ commerce: { ...store.getState().commerce, customers }, runtime: { ...store.getState().runtime, loading: { ...store.getState().runtime.loading, customers: false } } });
    }

    const invoices = await loadInvoices(api, session);
    store.patch({ commerce: { ...store.getState().commerce, invoices } });
    render();
    return catalog;
  } catch (error) {
    store.patch({ runtime: { ...store.getState().runtime, loading: { ...store.getState().runtime.loading, catalog: false } }, app: { ...store.getState().app, error: String(error?.message || error) } });
    render();
    return null;
  }
}

function bindInteractions(store, api, render) {
  document.addEventListener('click', async (event) => {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.getAttribute('data-action');
    const state = store.getState();
    const tier = getSelectedTierSafe(state);

    if (action === 'nav') {
      const route = actionEl.getAttribute('data-route') || 'home';
      const companyId = actionEl.getAttribute('data-company-id');
      if (route === 'company') {
        store.patch({ ui: { ...state.ui, selectedCompanyId: companyId || '', accountMenuOpen: false, drawerOpen: false } });
        navigate('company', { companyId: companyId || '' });
      } else {
        store.patch({ ui: { ...state.ui, accountMenuOpen: false, drawerOpen: false } });
        navigate(route);
      }
      render();
      return;
    }

    if (action === 'toggle-account') {
      store.patch({ ui: { ...state.ui, accountMenuOpen: !state.ui.accountMenuOpen } });
      render();
      return;
    }

    if (action === 'clear-search') {
      store.patch({ ui: { ...state.ui, search: '' } });
      render();
      return;
    }

    if (action === 'open-product') {
      const productId = actionEl.getAttribute('data-product-id');
      store.patch({ ui: { ...state.ui, activeModal: 'product', selectedProductId: productId } });
      await trackRuntimeEvent(api, { event_type: 'product_click', entity_type: 'product', entity_id: productId, payload: { tier_name: tier.tier_name } });
      render();
      return;
    }

    if (action === 'select-tier') {
      const tierName = actionEl.getAttribute('data-tier-name');
      const nextTier = state.commerce.catalog.tiers.find((row) => row.tier_name === tierName) || getDefaultTier(state.commerce.catalog.tiers);
      if (nextTier) {
        store.patch({ commerce: { ...state.commerce, selectedTierName: nextTier.tier_name }, ui: { ...state.ui, selectedTierName: nextTier.tier_name } });
        persistRuntimeTier(nextTier.tier_name);
        await trackRuntimeEvent(api, { event_type: 'tier_change', entity_type: 'tier', entity_id: tierName, payload: { display_name: nextTier.display_name } });
      }
      render();
      return;
    }

    if (action === 'set-unit') {
      const productId = actionEl.getAttribute('data-product-id');
      const unitCode = actionEl.getAttribute('data-unit-code');
      store.patch({ commerce: { ...state.commerce, unitPrefs: { ...state.commerce.unitPrefs, [productId]: unitCode } } });
      persistRuntimeUnitPrefs({ ...state.commerce.unitPrefs, [productId]: unitCode });
      await trackRuntimeEvent(api, { event_type: 'unit_change', entity_type: 'product', entity_id: productId, payload: { unit_code: unitCode } });
      render();
      return;
    }

    if (action === 'add-to-cart') {
      const productId = actionEl.getAttribute('data-product-id');
      const tierName = actionEl.getAttribute('data-tier-name');
      const unitCode = actionEl.getAttribute('data-unit-code');
      const product = state.commerce.catalog.productIndex[productId];
      const variant = product?.variants.find((item) => item.tier_name === tierName && item.unit_code === unitCode);
      if (!variant) return;
      const qty = Number(state.commerce.qtyPrefs[productId] || 1);
      const nextCart = addVariantToCart(state.commerce.cart, { product_id: productId, product_name: product.product_name, unit_code: unitCode, final_price: variant.final_price, tier_name: tierName }, qty);
      store.patch({ commerce: { ...state.commerce, cart: nextCart }, ui: { ...state.ui, drawerOpen: true } });
      persistRuntimeCart(nextCart);
      await trackRuntimeEvent(api, { event_type: 'add_to_cart', entity_type: 'product', entity_id: productId, payload: { unit_code: unitCode, tier_name: tierName, qty } });
      notify(store, 'success', 'تمت الإضافة', product?.product_name || '');
      render();
      return;
    }

    if (action === 'remove-cart-line') {
      const lineKey = actionEl.getAttribute('data-line-key');
      const nextCart = removeCartLine(state.commerce.cart, lineKey);
      store.patch({ commerce: { ...state.commerce, cart: nextCart } });
      persistRuntimeCart(nextCart);
      await trackRuntimeEvent(api, { event_type: 'remove_from_cart', action: 'remove' });
      render();
      return;
    }

    if (action === 'cart-qty-up' || action === 'cart-qty-down') {
      const lineKey = actionEl.getAttribute('data-line-key');
      const item = state.commerce.cart.find((row) => cartLineKey(row) === lineKey);
      if (!item) return;
      const nextQty = action === 'cart-qty-up' ? Number(item.qty || 1) + 1 : Math.max(1, Number(item.qty || 1) - 1);
      const nextCart = updateCartQty(state.commerce.cart, lineKey, nextQty);
      store.patch({ commerce: { ...state.commerce, cart: nextCart } });
      persistRuntimeCart(nextCart);
      await trackRuntimeEvent(api, { event_type: 'qty_change', action, payload: { line_key: lineKey, qty: nextQty } });
      render();
      return;
    }

    if (action === 'close-drawer') {
      store.patch({ ui: { ...state.ui, drawerOpen: false } });
      render();
      return;
    }

    if (action === 'logout') {
      logout();
      persistRuntimeCustomer(null);
      store.patch({ auth: { ...state.auth, session: null, selectedCustomer: null }, ui: { ...state.ui, accountMenuOpen: false } });
      await trackRuntimeEvent(api, { event_type: 'login', action: 'logout' });
      render();
      return;
    }

    if (action === 'select-customer') {
      const customerId = actionEl.getAttribute('data-customer-id');
      const customer = state.commerce.customers.find((row) => String(row.id) === String(customerId)) || null;
      store.patch({ auth: { ...state.auth, selectedCustomer: customer } });
      persistRuntimeCustomer(customer);
      await trackRuntimeEvent(api, { event_type: 'customer_change', entity_type: 'customer', entity_id: customerId });
      render();
      return;
    }

    if (action === 'submit-checkout') {
      const totals = computeCartTotals(state.commerce.cart);
      const validation = validateCheckout(state, tier, totals);
      if (!validation.ok) {
        notify(store, 'warning', 'تعذر الإرسال', validation.message);
        render();
        return;
      }
      try {
        const result = await submitOrder(api, state, tier, totals);
        const nextSequence = getInvoiceSequence() + 1;
        setInvoiceSequence(nextSequence);
        await trackRuntimeEvent(api, { event_type: 'checkout', entity_type: 'order', entity_id: result.order.id, payload: { total_amount: totals.grand } });
        const nextInvoice = { ...result.order, created_at: result.order.created_at || isoNow() };
        store.patch({ commerce: { ...state.commerce, cart: clearCart(), invoices: [nextInvoice, ...state.commerce.invoices] } });
        persistRuntimeCart([]);
        notify(store, 'success', 'تم إنشاء الطلب', `#${result.order.id}`);
        render();
        return;
      } catch (error) {
        notify(store, 'error', 'فشل إنشاء الطلب', String(error?.message || error));
        render();
        return;
      }
    }

    if (action === 'open-invoice') {
      const invoiceId = actionEl.getAttribute('data-invoice-id');
      store.patch({ ui: { ...state.ui, activeModal: 'invoice', invoiceOpenId: invoiceId } });
      await trackRuntimeEvent(api, { event_type: 'invoice_open', entity_type: 'invoice', entity_id: invoiceId });
      render();
      return;
    }

    if (action === 'close-modal') {
      closeMenus(store);
      render();
      return;
    }
  });

  document.addEventListener('input', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const state = store.getState();
    if (target.id === 'runtimeSearch') {
      const value = target.value || '';
      store.patch({ ui: { ...state.ui, search: value } });
      await trackRuntimeEvent(api, { event_type: 'search', payload: { query: value.slice(0, 80) } });
      render();
      return;
    }
    if (target.getAttribute('data-role') === 'product-qty') {
      const productId = target.getAttribute('data-product-id');
      const qty = Math.max(1, Number(String(target.value || '1').replace(/[^0-9]/g, '') || 1));
      store.patch({ commerce: { ...state.commerce, qtyPrefs: { ...state.commerce.qtyPrefs, [productId]: qty } } });
      persistRuntimeQtyPrefs({ ...state.commerce.qtyPrefs, [productId]: qty });
      return;
    }
    if (target.getAttribute('data-role') === 'cart-qty') {
      const lineKey = target.getAttribute('data-line-key');
      const qty = Math.max(1, Number(String(target.value || '1').replace(/[^0-9]/g, '') || 1));
      const nextCart = updateCartQty(state.commerce.cart, lineKey, qty);
      store.patch({ commerce: { ...state.commerce, cart: nextCart } });
      persistRuntimeCart(nextCart);
      await trackRuntimeEvent(api, { event_type: 'qty_change', payload: { line_key: lineKey, qty } });
      render();
      return;
    }
  });

  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const formType = form.getAttribute('data-form');
    if (!formType) return;
    event.preventDefault();

    if (formType === 'login') {
      const identifier = String(form.identifier?.value || '').trim();
      const password = String(form.password?.value || '').trim();
      try {
        const session = await login(api, identifier, password);
        store.patch({ auth: { ...store.getState().auth, session } });
        await trackRuntimeEvent(api, { event_type: 'login', action: 'success', user_id: session.id });
        if (session.userType === 'rep') {
          const customers = await loadRepCustomers(api, session.id);
          store.patch({ commerce: { ...store.getState().commerce, customers } });
        }
        navigate('home');
        render();
      } catch (error) {
        notify(store, 'error', 'فشل الدخول', 'راجع البيانات ثم حاول مرة أخرى');
        render();
      }
      return;
    }

    if (formType === 'register') {
      const payload = {
        name: String(form.name?.value || '').trim(),
        phone: String(form.phone?.value || '').trim(),
        password: String(form.password?.value || '').trim(),
        address: String(form.address?.value || '').trim(),
        location: String(form.location?.value || '').trim(),
      };
      try {
        const session = await registerCustomer(api, payload);
        store.patch({ auth: { ...store.getState().auth, session } });
        await trackRuntimeEvent(api, { event_type: 'login', action: 'register', user_id: session.id });
        navigate('home');
        render();
      } catch (error) {
        notify(store, 'error', 'فشل التسجيل', String(error?.message || '')); render();
      }
    }
  });

  window.addEventListener('hashchange', () => {
    store.patch({ app: { ...store.getState().app, route: parseRoute() } });
    render();
  });
}

function getSelectedTier(state) {
  return getSelectedTierSafe(state);
}

export async function bootstrapApp() {
  const root = document.getElementById('app');
  if (!root) throw new Error('APP_ROOT_MISSING');
  applyShell(root);

  const config = readConfig();
  const api = createApiClient(config);
  const store = createStore(createInitialState());

  function render() {
    const state = store.getState();
    syncBodyTheme(state.ui.theme);
    const shell = renderShell(state);
    dom.html(dom.q('#appHeader'), shell.header);
    dom.html(dom.q('#appBanner'), shell.banner);
    dom.html(dom.q('#appHero'), shell.hero);
    dom.html(dom.q('#appSearch'), shell.search);
    dom.html(dom.q('#appPage'), renderPage(state));
    dom.html(dom.q('#appFooter'), shell.footer);
    dom.html(dom.q('#appDrawerHost'), renderDrawer(state));
    dom.html(dom.q('#appModalHost'), renderModal(state));
    dom.html(dom.q('#appToastHost'), renderToasts(state));
    document.title = 'متجر الأهرام للتجارة والتوزيع';
    persistSelections(state);
  }

  bindInteractions(store, api, render);
  render();
  await loadInitialData(store, api, render);
  store.patch({ app: { ...store.getState().app, ready: true } });
  render();

  setInterval(() => {
    store.patch({ ui: { ...store.getState().ui, flashTick: Date.now() }, runtime: { ...store.getState().runtime, flashState: store.getState().runtime.flashState } });
  }, 1000);

  return { store, api };
}
