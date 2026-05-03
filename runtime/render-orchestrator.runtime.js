/* render-orchestrator.runtime.js — governed surface rendering */

function htmlToFragment(html) {
  const template = document.createElement('template');
  template.innerHTML = String(html || '').trim();
  return template.content;
}

function mountSurface(surface, html) {
  if (!surface) return;
  surface.replaceChildren(htmlToFragment(html));
}

function surfaceVisible(surface, visible) {
  if (!surface) return;
  surface.classList.toggle('hidden', !visible);
}

function renderHeroSurface() {
  const target = els.heroSurface;
  if (!target) return;
  const isHome = state.view?.type === 'home';
  const hero = homeHeroState();
  surfaceVisible(target, isHome);
  if (!isHome) {
    mountSurface(target, '');
    return;
  }

  mountSurface(target, `
    <section class="banner-strip-surface home-banner-strip" aria-label="شريط تعريفي ثانوي">
      <div class="banner-strip-copy">
        <span class="banner-strip-kicker">${escapeHtml(hero.mode === 'flash' ? 'عرض الساعة مباشر' : hero.mode === 'tier' ? 'الشريحة الحالية' : 'الأهرام للتجارة والتوزيع')}</span>
        <strong>${escapeHtml(hero.subtitle || 'شريكك في النجاح')}</strong>
        <span class="banner-strip-subtitle">${escapeHtml(hero.mode === 'flash' ? 'ملخص سريع للعرض قبل الدخول إلى الهيرو الرئيسي' : hero.mode === 'tier' ? 'اطّلع على حالة الشريحة قبل بدء التسوق' : 'شريكك في النجاح عبر التوزيع السريع')}</span>
      </div>
      <div class="banner-strip-art" aria-hidden="true">
        <img class="banner-strip-image" src="${escapeHtml(appBannerImage())}" alt="" loading="eager" />
      </div>
      <button class="ghost-btn banner-strip-cta" type="button" data-action="home-cta" data-hash="${escapeHtml(hero.mode === 'flash' ? '#flash' : '#home')}">${escapeHtml(hero.mode === 'flash' ? 'افتح عرض الساعة' : 'اعرف المزيد')}</button>
    </section>

    <section class="banner-card home-hero home-hero-${escapeHtml(hero.mode)}">
      <div class="hero-copy">
        <div class="hero-kicker">${escapeHtml(hero.kicker || 'الأهرام للتجارة والتوزيع')}</div>
        <h1>${escapeHtml(hero.title || 'تجارة أسرع. تسعير أدق. تحكم تشغيلي ثابت.')}</h1>
        <p>${escapeHtml(hero.subtitle || '')}</p>
      </div>
      <div class="hero-art">
        <img class="banner-image hero-art-image" src="${escapeHtml(hero.image || appBannerImage())}" alt="${escapeHtml(hero.title || 'hero')}" loading="eager" />
      </div>
      <div class="hero-actions">
        <button class="primary-btn" type="button" data-action="home-cta" data-hash="#home">تصفح الآن</button>
        <button class="ghost-btn" type="button" data-action="home-cta" data-hash="#tiers">الشرائح</button>
      </div>
    </section>
  `);
}

function renderTierSurface() {
  const target = els.tierSurface;
  if (!target) return;
  const isHome = state.view?.type === 'home';
  const isTiers = state.view?.type === 'tiers';
  surfaceVisible(target, isHome || isTiers);
  if (!(isHome || isTiers)) {
    mountSurface(target, '');
    return;
  }

  const tierRows = Array.isArray(state.tiers) ? state.tiers : [];
  const current = getSelectedTierObject();
  mountSurface(target, `
    <section class="section-card tier-surface-card">
      <div class="section-head">
        <div>
          <h2>الشريحة التجارية</h2>
          <div class="helper-text">${escapeHtml(current ? tierStatusLine() : 'اختر شريحة تجارية لبدء التسعير')}</div>
        </div>
        <button class="primary-btn" type="button" data-action="open-tier-modal">${current ? 'تغيير الشريحة' : 'اختيار الشريحة'}</button>
      </div>
      <div class="tier-grid tier-grid-surface">
        ${isTiers ? tierRows.map((tier) => {
          const isCurrent = current?.tier_name === tier.tier_name;
          const discount = Number(tier.discount_percent || 0);
          const minimum = Number(tier.min_order || 0);
          return `
            <article class="tier-card tier-card-surface ${isCurrent ? 'is-current' : ''}">
              <div class="bad-line">
                <div>
                  <div class="tier-name">${escapeHtml(tierDisplayLabel(tier))}</div>
                  <div class="tier-visible">خصم ${num(discount)}% · الحد الأدنى ${num(minimum)} ج.م</div>
                </div>
                ${isCurrent ? '<span class="badge">الحالية</span>' : `<span class="badge">${num(discount)}%</span>`}
              </div>
              <div class="tier-min">${escapeHtml(tier.description || 'شريحة تسعير تجارية')}</div>
              <button class="primary-btn" data-action="select-tier" data-tier-name="${escapeHtml(tier.tier_name)}" data-visible-label="${escapeHtml(tierDisplayLabel(tier))}">${isCurrent ? 'الحالية' : 'اختيار'}</button>
            </article>
          `;
        }).join('') : (current ? `
          <article class="tier-card tier-card-surface is-current">
            <div class="bad-line">
              <div>
                <div class="tier-name">${escapeHtml(tierDisplayLabel(current))}</div>
                <div class="tier-visible">${escapeHtml(tierStatusLine())}</div>
              </div>
              <span class="badge">${num(Number(current.discount_percent || 0))}%</span>
            </div>
            <div class="tier-min">الحد الأدنى ${num(Number(current.min_order || 0))} ج.م</div>
            <button class="primary-btn" type="button" data-action="open-tier-modal">تغيير الشريحة</button>
          </article>
        ` : `<div class="empty-state">لا توجد شريحة محددة بعد</div>`)}
      </div>
    </section>
  `);
}

function renderDailyDealSurface() {
  const target = els.dailyDealSurface;
  if (!target) return;
  const isHome = state.view?.type === 'home';
  const deals = isHome ? filteredDailyDeals().slice(0, 4) : [];
  surfaceVisible(target, isHome);
  if (!isHome) {
    mountSurface(target, '');
    return;
  }

  mountSurface(target, `
    <section id="flash-offers" class="shelf-card home-deals-shelf">
      <div class="shelf-head">
        <div>
          <h2>صفقة اليوم</h2>
          <div class="helper-text">الباكدج الأقوى اليوم</div>
        </div>
        <button class="ghost-btn shelf-more" type="button" data-action="shelf-more" data-hash="#deals">عرض الصفقات</button>
      </div>
      <div class="deal-list deal-list-home">
        ${deals.length ? deals.map((deal) => dealCardHtml(deal, 'deal')).join('') : `<div class="empty-state">لا توجد صفقة اليوم الآن</div>`}
      </div>
    </section>
  `);
}

function renderCompaniesSurface() {
  const target = els.companiesSurface;
  if (!target) return;
  const isHome = state.view?.type === 'home';
  const q = normalizeText(state.search);
  const rows = q ? filteredCompanies() : sortCompanies(state.companies);
  surfaceVisible(target, isHome);
  if (!isHome) {
    mountSurface(target, '');
    return;
  }

  mountSurface(target, `
    <section id="companies-shelf" class="shelf-card">
      <div class="shelf-head">
        <div>
          <h2>الشركات المتاحة</h2>
          <div class="helper-text">تشكيل متنوع من أكبر شركات مستحضرات التجميل</div>
        </div>
      </div>
      <div class="company-shelf">
        ${rows.length ? rows.map((company) => `
          <article class="company-card company-card-home" data-action="open-company" data-company-id="${escapeHtml(company.company_id)}">
            <img class="company-logo" src="${escapeHtml(company.company_logo || placeholderImage(company.company_name))}" alt="${escapeHtml(company.company_name)}" loading="lazy" />
            <div class="company-name">${escapeHtml(company.company_name)}</div>
            <button class="ghost-btn company-btn" type="button">تصفح المنتجات</button>
          </article>
        `).join('') : `<div class="empty-state">لا توجد شركات ظاهرة الآن</div>`}
      </div>
    </section>
  `);
}

function renderCategoriesSurface() {
  const target = els.categoriesSurface;
  if (!target) return;
  const isHome = state.view?.type === 'home';
  surfaceVisible(target, isHome);
  if (!isHome) {
    mountSurface(target, '');
    return;
  }
  mountSurface(target, renderCategoryShelf(categoryCards(8), 'الأقسام', 'تصفح المنتجات حسب التصنيف'));
}

function renderProductsSurface() {
  const target = els.productsSurface;
  if (!target) return;
  const route = state.view?.type || 'home';
  const q = normalizeText(state.search);

  if (route === 'register') {
    surfaceVisible(target, true);
    mountSurface(target, `
      <section class="register-shell">
        <div class="section-card register-card">
          <div class="register-hero">
            <h1>تسجيل عميل جديد</h1>
            <p>سجل حسابك الشخصى لتتمكن من أرسال طلبات الشراء ومتابعة كل طلباتك السابقه</p>
          </div>
          <form class="register-form" id="registerForm" autocomplete="on">
            <div class="register-grid">
              <label class="field"><span>الاسم الكامل</span><input id="registerName" type="text" placeholder="الاسم ثنائي على الأقل" autocomplete="name" /></label>
              <label class="field"><span>رقم الموبايل</span><input id="registerPhone" type="tel" placeholder="01xxxxxxxxx" inputmode="numeric" autocomplete="tel" /></label>
              <label class="field"><span>كلمة المرور</span><input id="registerPassword" type="password" placeholder="4 أرقام أو أكتر" autocomplete="new-password" /></label>
              <label class="field"><span>العنوان</span><input id="registerAddress" type="text" placeholder="العنوان بالتفصيل" autocomplete="street-address" /></label>
              <label class="field"><span>اسم النشاط (اختياري)</span><input id="registerBusinessName" type="text" placeholder="اسم المحل أو النشاط" autocomplete="organization" /></label>
              <div class="field"><span>الموقع (اختياري)</span><div class="location-row"><input id="registerLocation" type="text" placeholder="اضغط تحديد الموقع" autocomplete="off" /><button class="ghost-btn" id="registerLocateBtn" type="button">تحديد الموقع</button></div></div>
            </div>
            <div class="register-actions"><button class="primary-btn" id="registerSubmitBtn" type="submit">تحقق وسجل</button><button class="ghost-btn" id="backToLoginBtn" type="button">رجوع للدخول</button></div>
          </form>
        </div>
      </section>
    `);
    return;
  }

  if (route === 'my-customers') {
    surfaceVisible(target, true);
    if (!state.session || state.session.userType !== 'rep') {
      mountSurface(target, `
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
      `);
      return;
    }
    const rows = state.customersLoaded ? state.customers : [];
    const selected = state.selectedCustomer;
    mountSurface(target, `
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
    `);
    return;
  }

  if (route === 'invoices') {
    surfaceVisible(target, true);
    const rows = state.invoices;
    mountSurface(target, `
      <div class="page-stack">
        <section class="section-card">
          <div class="section-head">
            <div>
              <h2>فواتيري</h2>
              <div class="helper-text">رقم الطلب، التاريخ، القيمة، والحالة</div>
            </div>
            <button class="ghost-btn" data-action="refresh-invoices" type="button">تحديث</button>
          </div>
        </section>
        <section class="invoice-list">
          ${!state.session ? `<div class="empty-state">سجّل الدخول لعرض الفواتير</div>` : rows.length ? rows.map(renderInvoiceCard).join('') : `<div class="empty-state">لا توجد فواتير مرتبطة بهذا الحساب</div>`}
        </section>
      </div>
    `);
    return;
  }

  if (route === 'tiers') {
    surfaceVisible(target, true);
    const tierRows = Array.isArray(state.tiers) ? state.tiers : [];
    const current = getSelectedTierObject();
    mountSurface(target, `
      <div class="page-stack">
        <section class="section-card">
          <div class="section-head">
            <div>
              <h2>الشرائح التجارية</h2>
              <div class="helper-text">اختر الشريحة المناسبة لتثبيت التسعير</div>
            </div>
            <button class="primary-btn" type="button" data-action="open-tier-modal">اختيار الشريحة</button>
          </div>
          ${current ? `<div class="selected-customer"><span class="selected-customer-label">الحالية</span><strong>${escapeHtml(tierDisplayLabel(current))}</strong><small>${escapeHtml(tierStatusLine())}</small></div>` : ''}
        </section>
        <section class="tier-grid tier-grid-surface">
          ${tierRows.length ? tierRows.map((tier) => {
            const isCurrent = current?.tier_name === tier.tier_name;
            const discount = Number(tier.discount_percent || 0);
            const minimum = Number(tier.min_order || 0);
            return `
              <article class="tier-card tier-card-surface ${isCurrent ? 'is-current' : ''}">
                <div class="bad-line">
                  <div>
                    <div class="tier-name">${escapeHtml(tierDisplayLabel(tier))}</div>
                    <div class="tier-visible">خصم ${num(discount)}% · الحد الأدنى ${num(minimum)} ج.م</div>
                  </div>
                  ${isCurrent ? '<span class="badge">الحالية</span>' : `<span class="badge">${num(discount)}%</span>`}
                </div>
                <div class="tier-min">${escapeHtml(tier.description || 'شريحة تسعير تجارية')}</div>
                <button class="primary-btn" data-action="select-tier" data-tier-name="${escapeHtml(tier.tier_name)}" data-visible-label="${escapeHtml(tierDisplayLabel(tier))}">${isCurrent ? 'الحالية' : 'اختيار'}</button>
              </article>
            `;
          }).join('') : `<div class="empty-state">لا توجد شرائح معرفة</div>`}
        </section>
      </div>
    `);
    return;
  }

  if (route === 'deals' || route === 'flash') {
    surfaceVisible(target, true);
    const items = route === 'deals' ? filteredDailyDeals() : filteredFlashOffers();
    const kind = route === 'deals' ? 'deal' : 'flash';
    mountSurface(target, `
      <div class="page-stack">
        <section class="section-card">
          <div class="section-head">
            <div>
              <h2>${route === 'deals' ? 'صفقة اليوم' : 'عرض الساعة'}</h2>
              <div class="helper-text">${route === 'deals' ? 'صفقة اليوم فرص لا تتكرر' : 'العرض المحدود يتحدث تلقائيًا'}</div>
            </div>
          </div>
        </section>
        <section class="deal-list">
          ${items.length ? items.map((item) => dealCardHtml(item, kind)).join('') : `<div class="empty-state">لا توجد عناصر الآن</div>`}
        </section>
      </div>
    `);
    return;
  }

  if (route === 'company' && state.view.companyId) {
    surfaceVisible(target, true);
    const companyId = state.view.companyId;
    const company = state.companyMap.get(companyId) || state.companies.find((row) => row.company_id === companyId) || null;
    const rows = filteredProducts().filter((product) => product.company_id === companyId);
    mountSurface(target, `
      <div class="page-stack">
        <section class="section-card">
          <div class="section-head">
            <div>
              <h2>${escapeHtml(company?.company_name || 'الشركة')}</h2>
              <div class="helper-text">${escapeHtml(company?.company_desc || 'تصفح منتجات الشركة')}</div>
            </div>
            <button class="ghost-btn" type="button" data-action="home-cta" data-hash="#home">العودة للرئيسية</button>
          </div>
        </section>
        ${renderProductShelf('منتجات الشركة', 'المنتجات المتاحة حاليًا', rows, { kind: 'company', moreHash: '#home', moreLabel: '', badge: 'يحتسب ضمن الشريحة', actionLabel: 'شراء' })}
      </div>
    `);
    return;
  }

  surfaceVisible(target, true);
  const recommended = topRecommendedProducts(8);
  const bestSelling = topBestSellingProducts(8);
  mountSurface(target, `
    <div class="page-stack">
      <section id="home-bestselling">
        ${renderProductShelf('الأكثر مبيعًا', 'الأعلى طلبًا من العملاء', q ? bestSelling.filter((p) => matchesHomeSearch(p, q)) : bestSelling, { kind: 'bestseller', moreHash: '#home-bestselling', moreLabel: 'عرض المزيد', badge: 'الأكثر مبيعًا', actionLabel: 'شراء' })}
      </section>
      <section id="home-recommended">
        ${renderProductShelf('موصى به لك', 'مختارة بناءً على نشاطك', q ? recommended.filter((p) => matchesHomeSearch(p, q)) : recommended, { kind: 'recommended', moreHash: '#home-recommended', moreLabel: 'عرض المزيد', badge: 'موصى به', actionLabel: 'شراء' })}
      </section>
    </div>
  `);
}

function renderApp() {
  const active = document.activeElement;
  const preserveSearch = active && active.id === 'headerSearchInput' ? { start: active.selectionStart, end: active.selectionEnd } : null;
  updateHeader();
  const isRegister = state.view?.type === 'register';
  surfaceVisible(els.headerSurface, !isRegister);
  surfaceVisible(els.bottomNav, !isRegister);
  renderHeroSurface();
  renderTierSurface();
  renderDailyDealSurface();
  renderCompaniesSurface();
  renderCategoriesSurface();
  renderProductsSurface();
  updateOperationalNav();
  if (typeof wirePageEvents === "function") wirePageEvents();

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
