/* hero.runtime.js — home and flash hero rendering */



function updateFlashHeader() {
  const flashState = getFlashState();
  const isActive = flashState.status === 'active' && Boolean(flashState.offer);

  if (els.flashBtnText) els.flashBtnText.textContent = 'عرض الساعة';

  if (els.flashBtn) {
    els.flashBtn.classList.toggle('status-active', isActive);
    els.flashBtn.classList.toggle('status-danger', flashState.status === 'expired' && Boolean(flashState.offer));
    els.flashBtn.classList.toggle('is-live', isActive);
    els.flashBtn.classList.toggle('is-idle', !isActive);
  }

  if (els.flashCountdownCapsule) {
    els.flashCountdownCapsule.classList.toggle('hidden', !isActive);
    els.flashCountdownCapsule.classList.toggle('is-live', isActive);
  }

  if (els.flashCountdownValue) {
    els.flashCountdownValue.textContent = isActive ? flashState.remaining : '';
  }
}


function homeHeroState() {
  const flashState = getFlashState();
  const selectedTier = getSelectedTierObject();
  const eligible = Number(CART_ENGINE.eligibleTierTotal(state.cart) || 0);
  const tierMin = selectedTier ? Number(selectedTier.min_order || 0) : 0;
  const remaining = selectedTier ? Math.max(0, tierMin - eligible) : 0;
  const tierProgress = tierMin > 0 ? Math.min(100, Math.max(0, (eligible / tierMin) * 100)) : 0;
  const banner = appBannerImage();
  const activeFlash = flashState.status === 'active' ? flashState.offer : null;

  if (activeFlash) {
    return {
      mode: 'flash',
      title: activeFlash.title || 'عرض الساعة',
      subtitle: flashState.remaining ? `ينتهي خلال ${flashState.remaining}` : 'عرض مباشر الآن',
      note: activeFlash.description || (activeFlash.stock ? `المتبقي ${integer(activeFlash.stock)} عروض` : 'عرض محدود للشراء السريع'),
      badge: `خصم ${num(Number(activeFlash.discount_percent || activeFlash.discount_rate || activeFlash.discount || 0))}%`,
      actionLabel: 'افتح عرض الساعة',
      actionHash: '#flash',
      secondaryLabel: 'الصفقة التالية',
      secondaryHash: '#deals',
      image: activeFlash.image || banner,
      metricLabel: 'نسبة الخصم',
      metricValue: `${num(Number(activeFlash.discount_percent || activeFlash.discount_rate || activeFlash.discount || 0))}%`,
      progress: 0,
      accent: 'flash',
    };
  }

  if (selectedTier) {
    return {
      mode: 'tier',
      title: tierDisplayLabel(selectedTier),
      subtitle: 'الشريحة الحالية',
      note: `المؤهل ${num(eligible)} ج.م · المتبقي ${num(remaining)} ج.م للوصول إلى الشريحة`,
      badge: `Tier Hero · خصم ${num(selectedTier.discount_percent || 0)}%`,
      actionLabel: 'تغيير الشريحة',
      actionHash: '#tiers',
      secondaryLabel: 'عرض اليوم',
      secondaryHash: '#deals',
      image: banner,
      metricLabel: 'الحد الأدنى',
      metricValue: `${num(tierMin)} ج.م`,
      progress: tierProgress,
      accent: 'tier',
    };
  }

  return {
    mode: 'banner',
    title: 'الأهرام للتجارة والتوزيع',
    subtitle: 'واجهة تجارة سريعة للتجار والمندوبين',
    note: 'الوصول السريع للشراء والشريحة وصفقة اليوم والشركات من مكان واحد',
    badge: 'B2B Commerce',
    actionLabel: 'تسوق الآن',
    actionHash: '#home-recommended',
    secondaryLabel: 'العروض القوية',
    secondaryHash: '#deals',
    image: banner,
    metricLabel: 'البداية السريعة',
    metricValue: 'جاهز للشراء',
    progress: 0,
    accent: 'banner',
  };
}


function homeBannerStripHtml(hero) {
  const bannerImage = appBannerImage();
  const isFlash = hero?.mode === 'flash';
  const isTier = hero?.mode === 'tier';
  const stripTitle = isFlash ? 'عرض الساعة مباشر' : (isTier ? 'الشريحة الحالية' : 'الأهرام للتجارة والتوزيع');
  const stripSubtitle = isFlash
    ? 'ملخص سريع للعرض قبل الدخول إلى الهيرو الرئيسي'
    : isTier
      ? 'اطّلع على حالة الشريحة قبل بدء التسوق'
      : 'شريكك في النجاح عبر التوزيع السريع';
  const stripCta = isFlash ? 'اعرف العرض' : 'اعرف المزيد';

  return `
    <section class="banner-strip-surface" aria-label="شريط تعريفي ثانوي">
      <div class="banner-strip-copy">
        <span class="banner-strip-kicker">${escapeHtml(stripTitle)}</span>
        <strong>${escapeHtml(hero?.subtitle || 'شريكك في النجاح')}</strong>
        <span class="banner-strip-subtitle">${escapeHtml(stripSubtitle)}</span>
      </div>
      <div class="banner-strip-art" aria-hidden="true">
        <img class="banner-strip-image" src="${escapeHtml(bannerImage)}" alt="" loading="eager" />
      </div>
      <button class="ghost-btn banner-strip-cta" type="button" data-action="home-cta" data-hash="${escapeHtml(hero?.mode === 'flash' ? '#flash' : '#home')}">${escapeHtml(stripCta)}</button>
    </section>
  `;
}


function homeHeroSurfaceHtml(hero) {
  const heroImage = hero?.image || appBannerImage();
  return `
    <section class="hero-surface">
      <section class="banner-card home-hero home-hero-${escapeHtml(hero.mode)}">
        <div class="home-hero-copy">
          <div class="hero-kicker-row">
            <span class="hero-kicker">${escapeHtml(hero.badge)}</span>
            <span class="hero-kicker hero-kicker-soft">${escapeHtml(hero.subtitle)}</span>
          </div>
          <h1>${escapeHtml(hero.title)}</h1>
          <p>${escapeHtml(hero.note)}</p>
          <div class="hero-actions">
            <button class="primary-btn hero-cta" type="button" data-action="home-cta" data-hash="${escapeHtml(hero.actionHash || '#home')}">${escapeHtml(hero.actionLabel)}</button>
            <button class="ghost-btn" type="button" data-action="shelf-more" data-hash="${escapeHtml(hero.secondaryHash)}">${escapeHtml(hero.secondaryLabel)}</button>
          </div>
          <div class="hero-focus-strip">
            <span class="hero-focus-pill">${escapeHtml(hero.metricLabel)}</span>
            <span class="hero-focus-pill hero-focus-strong">${escapeHtml(hero.metricValue)}</span>
            ${hero.progress > 0 ? `
              <span class="hero-progress-wrap">
                <span class="hero-progress-track"><span class="hero-progress-fill" style="width:${hero.progress}%"></span></span>
              </span>
            ` : ''}
          </div>
        </div>
        <div class="home-hero-art">
          <img class="banner-image hero-art-image" src="${escapeHtml(heroImage)}" alt="${escapeHtml(hero.title)}" loading="eager" />
        </div>
      </section>
    </section>
  `;
}


function categoryCards(limit = 8) {
  const counts = new Map();
  for (const product of state.products || []) {
    const category = String(product.category || '').trim();
    if (!category) continue;
    counts.set(category, (counts.get(category) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || compareNatural(a[0], b[0]))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}


function renderCategoryShelf(categories, title = 'الأقسام', subLabel = 'تصفح المنتجات حسب التصنيف') {
  const items = Array.isArray(categories) ? categories : [];
  return `
    <section id="categories-shelf" class="shelf-card category-shelf">
      <div class="shelf-head">
        <div>
          <h2>${escapeHtml(title)}</h2>
          ${subLabel ? `<div class="helper-text">${escapeHtml(subLabel)}</div>` : ''}
        </div>
        <button class="ghost-btn shelf-more" type="button" data-action="shelf-more" data-hash="#home">عرض الكل</button>
      </div>
      <div class="category-grid">
        ${items.length ? items.map((item) => `
          <button class="category-card" type="button" data-action="filter-category" data-category="${escapeHtml(item.name)}">
            <span class="category-name">${escapeHtml(item.name)}</span>
            <span class="category-count">${num(item.count, 0)} صنف</span>
          </button>
        `).join('') : `<div class="empty-state">لا توجد أقسام ظاهرة الآن</div>`}
      </div>
    </section>
  `;
}


function renderHomePage() {
  const q = normalizeText(state.search);
  const hero = homeHeroState();
  const companyRows = q ? filteredCompanies() : sortCompanies(state.companies);
  const dailyDeals = q ? filteredDailyDeals() : (state.dailyDeals || []).slice(0, 4);
  const recommended = topRecommendedProducts(8);
  const bestSelling = topBestSellingProducts(8);
  const categories = categoryCards(8);

  if (els.banner) {
    els.banner.innerHTML = companyBannerHtml();
  }

  els.pageContent.innerHTML = `
    <div class="home-shell">
      ${homeHeroSurfaceHtml(hero)}
      <div class="home-surface">
        <section class="banner-strip-surface home-banner-strip" aria-label="شريط تعريفي ثانوي">
          <div class="banner-strip-copy">
            <span class="banner-strip-kicker">${escapeHtml(hero.mode === 'flash' ? 'عرض الساعة مباشر' : hero.mode === 'tier' ? 'الشريحة الحالية' : 'الأهرام للتجارة والتوزيع')}</span>
            <strong>${escapeHtml(hero.subtitle || 'شريكك في النجاح')}</strong>
            <span class="banner-strip-subtitle">${escapeHtml(hero.mode === 'flash' ? 'ملخص سريع للعرض قبل الدخول إلى الهيرو الرئيسي' : hero.mode === 'tier' ? 'اطّلع على حالة الشريحة قبل بدء التسوق' : 'شريكك في النجاح عبر التوزيع السريع')}</span>
          </div>
          <div class="banner-strip-art" aria-hidden="true">
            <img class="banner-strip-image" src="${escapeHtml(appBannerImage())}" alt="" loading="eager" />
          </div>
          <button class="ghost-btn banner-strip-cta" type="button" data-action="home-cta" data-hash="${escapeHtml(hero.mode === 'flash' ? '#flash' : '#home')}" >${escapeHtml(hero.mode === 'flash' ? 'افتح عرض الساعة' : 'اعرف المزيد')}</button>
        </section>

        <div class="page-stack home-stack">
        <section id="home-deals-shelf" class="shelf-card home-deals-shelf">
          <div class="shelf-head">
            <div>
              <h2>صفقة اليوم</h2>
              <div class="helper-text">الباكدج الأقوى اليوم</div>
            </div>
            <button class="ghost-btn shelf-more" type="button" data-action="shelf-more" data-hash="#deals">عرض الصفقات</button>
          </div>
          <div class="deal-list deal-list-home">
            ${dailyDeals.length ? dailyDeals.map((deal) => dealCardHtml(deal, 'deal')).join('') : `<div class="empty-state">لا توجد صفقة اليوم الآن</div>`}
          </div>
        </section>

        <section id="companies-shelf" class="shelf-card">
          <div class="shelf-head">
            <div>
              <h2>الشركات المتاحة</h2>
              <div class="helper-text">تشكيل متنوع من أكبر شركات مستحضرات التجميل</div>
            </div>
          </div>
          <div class="company-shelf">
            ${companyRows.length ? companyRows.map((company) => `
              <article class="company-card company-card-home" data-action="open-company" data-company-id="${escapeHtml(company.company_id)}">
                <img class="company-logo" src="${escapeHtml(company.company_logo || placeholderImage(company.company_name))}" alt="${escapeHtml(company.company_name)}" loading="lazy" />
                <div class="company-name">${escapeHtml(company.company_name)}</div>
                <button class="ghost-btn company-btn" type="button">تصفح المنتجات</button>
              </article>
            `).join('') : `<div class="empty-state">لا توجد شركات ظاهرة الآن</div>`}
          </div>
        </section>

        ${renderCategoryShelf(categories, 'الأقسام', 'تصفح المنتجات حسب التصنيف')}

        <section id="home-bestselling">
          ${renderProductShelf(
            'الأكثر مبيعًا',
            'الأعلى طلبًا من العملاء',
            q ? bestSelling.filter((p) => matchesHomeSearch(p, q)) : bestSelling,
            { kind: 'bestseller', moreHash: '#home-bestselling', moreLabel: 'عرض المزيد', badge: 'الأكثر مبيعًا', actionLabel: 'شراء' }
          )}
        </section>

        <section id="home-recommended">
          ${renderProductShelf(
            'موصى به لك',
            'مختارة بناءً على نشاطك',
            q ? recommended.filter((p) => matchesHomeSearch(p, q)) : recommended,
            { kind: 'recommended', moreHash: '#home-recommended', moreLabel: 'عرض المزيد', badge: 'موصى به', actionLabel: 'شراء' }
          )}
        </section>
      </div>
    </div>
  `;
}


function renderFlashPage() {
  const flashState = getFlashState();
  const active = flashState.status === 'active' ? flashState.offer : null;
  const activeOffer = flashState.status === 'active' ? flashState.offer : null;
  const flashDiscount = Number(activeOffer?.discount_percent || activeOffer?.discount_rate || activeOffer?.discount || 0);
  const heroTitle = flashState.status === 'active'
    ? 'عرض الساعة شغّال الآن'
    : flashState.status === 'expired'
      ? 'انتهى العرض'
      : 'العرض قادم قريبًا';
  const heroCountdown = flashState.status === 'active'
    ? flashState.remaining
    : flashState.status === 'expired'
      ? flashState.endedAt
      : flashState.remaining || '';

  els.pageContent.innerHTML = `
    <div class="page-stack flash-page-stack">
      <section class="flash-hero-surface">
        <div class="flash-hero-core">
          <span class="flash-hero-kicker">${escapeHtml(flashDiscount > 0 ? `خصم ${num(flashDiscount)}%` : 'عرض مباشر')}</span>
          <h1>${escapeHtml(heroTitle)}</h1>
          <div class="flash-hero-countdown mono">${escapeHtml(heroCountdown || '--:--:--')}</div>
          <div class="flash-hero-meta">
            <span class="badge">${escapeHtml(activeOffer?.stock ? `متبقي ${integer(activeOffer.stock)} عروض` : 'متبقي X عروض')}</span>
          </div>
          <div class="flash-hero-actions">
            <button class="primary-btn" type="button" data-action="home-cta" data-hash="#flash">ابدأ الشراء</button>
          </div>
        </div>
      </section>
      <section id="flash-offers" class="deal-list">
        ${filteredFlashOffers().length ? filteredFlashOffers().map((offer) => dealCardHtml(offer, 'flash', active)).join('') : `<div class="empty-state">لا توجد عروض الساعة</div>`}
      </section>
    </div>
  `;
}


function initHeroRuntime() {
  updateFlashHeader();
}
