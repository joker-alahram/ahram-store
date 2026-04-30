function renderRegisterPage() {
  const target = els.registerPage || els.pageContent;
  if (!target) return;

  target.innerHTML = `
    <section class="register-shell">
      <div class="section-card register-card">
        <div class="register-hero">
          <h1>تسجيل عميل جديد</h1>
          <p>سجّل عميلك مباشرة من الموبايل، من غير مودال، ومن غير تعقيد. الحساب بيتنشأ فورًا وبعدها يدخل تلقائي على المتجر.</p>
        </div>

        <form class="register-form" id="registerForm" autocomplete="on">
          <div class="register-grid">
            <label class="field">
              <span>الاسم الكامل</span>
              <input id="registerName" type="text" placeholder="الاسم رباعي أو ثنائي على الأقل" autocomplete="name" />
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
              <input id="registerBusinessName" type="text" placeholder="اسم المحل أو الشركة" autocomplete="organization" />
            </label>

            <div class="field">
              <span>الموقع (اختياري)</span>
              <div class="location-row">
                <input id="registerLocation" type="text" placeholder="اضغط تحديد الموقع" autocomplete="off" />
                <button class="ghost-btn" id="registerLocateBtn" data-action="register-locate" type="button">تحديد الموقع</button>
              </div>
            </div>
          </div>

          <div class="register-actions">
            <button class="primary-btn" id="registerSubmitBtn" data-action="register-submit" type="submit">تحقق وسجل</button>
            <button class="ghost-btn" id="backToLoginBtn" data-action="back-login" type="button">رجوع للدخول</button>
          </div>
        </form>
      </div>
    </section>
  `;
}
function renderHomePage() {
  const banner = appBannerImage();
  const companies = filteredCompanies();
  const heroProducts = getHeroProducts(4);
  const recommended = getRecommendedProducts(8);
  const popular = getPopularProducts(8);
  const viewed = getFrequentlyViewedProducts(8);
  const affinity = getCartAffinityProducts(8);
  const bannerHtml = banner
    ? `<img class="banner-image" src="${escapeHtml(banner)}" alt="بانر الصفحة الرئيسية" loading="eager" />`
    : `<div class="banner-fallback">لا توجد صورة بانر</div>`;

  if (els.banner) {
    els.banner.innerHTML = `
      <section class="banner-card hero-banner">
        <div class="hero-copy">
          <div class="hero-kicker">متجر الجملة الذكي</div>
          <h1>تسوق أسرع. قارن أدق. أرسل الطلب من أول مرة.</h1>
          <p>واجهة مبنية للتصفح السريع، العروض الواضحة، والتوصيات العملية دون كسر تدفق الطلب أو تغيير الحقيقة الموجودة في قاعدة البيانات.</p>
          <div class="hero-actions">
            <button class="primary-btn" type="button" data-action="focus-search">ابدأ البحث</button>
            <button class="ghost-btn" type="button" data-action="cart">افتح السلة</button>
          </div>
        </div>
        <div class="hero-art">
          ${bannerHtml}
        </div>
      </section>
    `;
  }

  setSearchBarHtml(`
    <section class="section-card search-card">
      ${contactStripHtml()}
      <div class="search-row">
        <input id="searchInput" type="search" placeholder="ابحث باسم الشركة أو المنتج" value="${escapeHtml(state.search)}" />
        <button class="mini-btn icon-btn" id="clearSearchBtn" data-action="clear-search" type="button">×</button>
      </div>
    </section>
  `);

  els.pageContent.innerHTML = `
    <div class="page-stack">
      ${productRailSection('المنتجات الموصى بها', 'مبنية على حركة التصفح والإشارات السابقة', heroProducts, { cta: 'تسوق الآن' })}
      ${productRailSection('الأكثر مشاهدة', 'العناصر التي تكررت زيارتها داخل الجلسة', viewed, { cta: 'فتح المنتج' })}
      ${productRailSection('الأكثر مبيعًا', 'المنتجات الأعلى أداءً من قاعدة البيانات', popular, { cta: 'استعراض' })}
      ${productRailSection('ملائمة السلة', 'عناصر مرتبطة بما أضفته بالفعل', affinity, { cta: 'مراجعة' })}
      ${companyStripHtml(companies)}
      ${productGridSection('منتجات مختارة', 'أقرب ما يكون للشراء السريع', recommended)}
      <section class="section-card">
        <div class="section-head">
          <div>
            <h2>صفقات وعروض</h2>
            <div class="helper-text">العروض اليومية وعروض الساعة في مكان واحد</div>
          </div>
        </div>
        <div class="home-deals-grid">
          <div class="home-deals-col">
            <div class="section-head"><h3>صفقة اليوم</h3></div>
            ${state.dailyDeals.length ? state.dailyDeals.map((deal) => dealCardHtml(deal, 'deal')).join('') : '<div class="empty-state">لا توجد صفقة اليوم الآن</div>'}
          </div>
          <div class="home-deals-col">
            <div class="section-head"><h3>عرض الساعة</h3></div>
            ${state.flashOffers.length ? state.flashOffers.map((offer) => dealCardHtml(offer, 'flash', state.flashOffers.find((item) => item.status === 'active') || null)).join('') : '<div class="empty-state">لا توجد عروض الساعة</div>'}
          </div>
        </div>
      </section>
      <section class="grid company-grid">
        ${companies.length ? companies.map((company) => `
          <article class="company-card">
            <img class="company-logo" src="${escapeHtml(company.company_logo || placeholderImage(company.company_name))}" alt="${escapeHtml(company.company_name)}" loading="lazy" />
            <div class="company-name">${escapeHtml(company.company_name)}</div>
            <button class="ghost-btn mini-cta" data-action="open-company" data-company-id="${escapeHtml(company.company_id)}" type="button">فتح الشركة</button>
          </article>
        `).join('') : `<div class="empty-state">لا توجد شركات ظاهرة الآن</div>`}
      </section>
    </div>
  `;
}
function renderCompanyPage() {
  const title = companyName(state.view.companyId);
  const products = filteredProducts();
  bumpViewCounts(products.map((product) => product.product_id));
  const related = getCartAffinityProducts(6).filter((product) => String(product.company_id) === String(state.view.companyId));

  setSearchBarHtml(`
    <section class="section-card search-card">
      ${contactStripHtml()}
      <div class="section-head">
        <div>
          <h2>${escapeHtml(title || 'المنتجات')}</h2>
          <div class="helper-text">${escapeHtml(getSelectedTierLabel())}</div>
        </div>
      </div>
      <div class="search-row">
        <input id="searchInput" type="search" placeholder="ابحث باسم المنتج أو الكود" value="${escapeHtml(state.search)}" />
        <button class="mini-btn icon-btn" id="clearSearchBtn" data-action="clear-search" type="button">×</button>
      </div>
    </section>
  `);

  els.pageContent.innerHTML = `
    <div class="page-stack">
      ${productRailSection('من هذه الشركة', 'عناصر متوافقة مع القسم الحالي', related.length ? related : products.slice(0, 6), { cta: 'عرض المزيد' })}
      <section class="section-card">
        <div class="section-head">
          <div>
            <h2>منتجات ${escapeHtml(title || '')}</h2>
            <div class="helper-text">الأسعار تتبع الشريحة الحالية والبيانات المباشرة</div>
          </div>
        </div>
        <section class="grid product-grid">
          ${products.length ? products.map(productCardHtml).join('') : `<div class="empty-state">لا توجد منتجات تطابق البحث أو الشركة المحددة</div>`}
        </section>
      </section>
    </div>
  `;
}
function renderTierPage() {
  const current = tierName();
  els.pageContent.innerHTML = `
    <div class="page-stack">
      <section class="section-card">
        <div class="section-head">
          <div>
            <h2>الشرائح</h2>
            <div class="helper-text">اختر الشريحة المناسبة ثم عد إلى الصفحة الرئيسية</div>
          </div>
        </div>
      </section>
      <section class="tier-grid">
        ${state.tiers.length ? state.tiers.map((tier) => `
          <article class="tier-card">
            <div class="bad-line">
              <div>
                <div class="tier-name">${escapeHtml(tierDisplayLabel(tier))}</div>
                <div class="tier-visible">${escapeHtml(tierDisplayLabel(tier))}</div>
              </div>
              <span class="badge">${num(tier.discount_percent || 0)}%</span>
            </div>
            <div class="tier-min">الحد الأدنى: ${num(tier.min_order || 0)}</div>
            <button class="primary-btn" data-action="select-tier" data-tier-name="${escapeHtml(tier.tier_name)}" data-visible-label="${escapeHtml(tierDisplayLabel(tier))}">
              ${current === tier.tier_name ? 'خروج' : 'اختيار'}
            </button>
          </article>
        `).join('') : `<div class="empty-state">لا توجد شرائح معرفة</div>`}
      </section>
    </div>
  `;
}
function renderApp() {
  const active = document.activeElement;
  const preserveSearch = active && active.id === 'searchInput' ? { start: active.selectionStart, end: active.selectionEnd } : null;
  updateHeader();
  state.view = parseHash();
  const isRegister = state.view.type === 'register';

  if (els.mainHeader) els.mainHeader.classList.toggle('hidden', isRegister);
  if (els.banner) els.banner.classList.toggle('hidden', isRegister);
  if (els.searchBar) els.searchBar.classList.toggle('hidden', isRegister);
  if (els.pageContent) els.pageContent.classList.toggle('hidden', isRegister);
  if (els.registerPage) els.registerPage.classList.toggle('hidden', !isRegister);

  if (els.searchBar) els.searchBar.innerHTML = '';

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

  if (preserveSearch) {
    const input = document.getElementById('searchInput');
    if (input) {
      input.focus();
      try {
        input.setSelectionRange(preserveSearch.start ?? input.value.length, preserveSearch.end ?? input.value.length);
      } catch {}
    }
  }
}
function wirePageEvents() {}
