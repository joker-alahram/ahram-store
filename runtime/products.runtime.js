/* products.runtime.js — product feeds, cards, and deal surfaces */



function productScore(product) {
  const { productStats } = getBehaviorStats();
  const row = productStats.get(String(product.product_id)) || {};
  const backendMap = getBackendProductMap();
  const backendRow = backendMap.get(String(product.product_id)) || {};

  const views = Number(row.views || 0);
  const details = Number(row.details || 0);
  const adds = Number(row.adds || 0);
  const removes = Number(row.removes || 0);
  const checkout = Number(row.checkout || 0);
  const backendSales = Number(
    backendRow.total_qty ||
    backendRow.qty ||
    backendRow.sold_count ||
    backendRow.sales_count ||
    backendRow.sales ||
    backendRow.total_sales ||
    0
  );

  const sameCompanyBonus = currentCartCompanyIds().has(String(product.company_id)) ? 2.5 : 0;
  const recencyBonus = row.lastTs ? Math.max(0, 4 - ((Date.now() - row.lastTs) / 86400000)) : 0;

  return (views * 1.2) + (details * 2.1) + (adds * 4.2) + (checkout * 5.5) + (backendSales * 3.5) - (removes * 1.5) + sameCompanyBonus + recencyBonus;
}


function normalizedProductRows(rows) {
  return (rows || [])
    .map((row) => getProductById(row.product_id || row.id || row.product || row.productId))
    .filter(Boolean);
}


function renderProductShelf(title, subLabel, products, options = {}) {
  const {
    kind = 'recommended',
    moreHash = '#home',
    moreLabel = 'عرض الكل',
    badge = '',
    actionLabel = 'شراء',
    compact = true,
  } = options;

  const items = (products || []).filter(Boolean);
  return `
    <section class="shelf-card">
      <div class="shelf-head">
        <div>
          <h2>${escapeHtml(title)}</h2>
          ${subLabel ? `<div class="helper-text">${escapeHtml(subLabel)}</div>` : ''}
        </div>
        ${moreLabel ? `<button class="ghost-btn shelf-more" type="button" data-action="shelf-more" data-hash="${escapeHtml(moreHash)}">${escapeHtml(moreLabel)}</button>` : ''}
      </div>
      <div class="shelf-grid shelf-grid-${escapeHtml(kind)}">
        ${items.length ? items.map((product) => compact ? compactProductCardHtml(product, { badge, actionLabel }) : productCardHtml(product)).join('') : `<div class="empty-state">لا توجد عناصر بعد</div>`}
      </div>
    </section>
  `;
}


function compactProductCardHtml(product, options = {}) {
  const actionLabel = options.actionLabel || 'شراء';
  const unit = currentUnitForProduct(product);
  const key = cartKey({ type: 'product', id: product.product_id, unit });
  const inCart = Boolean(findCartItem(key));
  const image = product.product_image || placeholderImage(product.product_name);
  const priceText = displayPriceText(product, unit);

  return `
    <article class="product-tile" data-product-id="${escapeHtml(product.product_id)}">
      <button class="tile-image-wrap" type="button" data-action="open-product" data-product-id="${escapeHtml(product.product_id)}">
        <img class="product-image" src="${escapeHtml(image)}" alt="${escapeHtml(product.product_name)}" loading="lazy" />
      </button>
      <div class="product-body compact">
        <div class="product-title">${escapeHtml(product.product_name)}</div>
        <div class="badge-row product-badge-row"><span class="badge badge-tier">يحتسب ضمن الشريحة</span></div>
        <div class="price-wrap">
          <span class="price-main">${escapeHtml(priceText)} ج.م</span>
        </div>
        <div class="card-actions compact-actions">
          <button class="primary-btn" data-action="toggle-product" data-product-id="${escapeHtml(product.product_id)}">${inCart ? 'إزالة من السلة' : escapeHtml(actionLabel)}</button>
        </div>
      </div>
    </article>
  `;
}


function contactStripHtml() {
  return `
    <div class="contact-strip" aria-label="وسائل التواصل السريع">
      <a class="contact-icon-btn" href="tel:01040880002" aria-label="اتصال مباشر" title="اتصال مباشر">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8c1.4 2.8 3.4 4.8 6.2 6.2l2.1-2.1c.3-.3.7-.4 1.1-.3 1.2.4 2.6.6 3.9.6.6 0 1 .4 1 1v3.3c0 .6-.4 1-1 1C10.8 20.5 3.5 13.2 3.5 4c0-.6.4-1 1-1h3.3c.6 0 1 .4 1 1 0 1.4.2 2.7.6 3.9.1.4 0 .8-.3 1.1l-1.5 1.8z"/></svg>
      </a>
      <a class="contact-icon-btn" href="https://wa.me/201040880002" target="_blank" rel="noopener noreferrer" aria-label="واتساب مباشر" title="واتساب مباشر">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a9.9 9.9 0 0 0-8.6 14.8L2 22l5.4-1.4A10 10 0 1 0 12 2zm5.7 14.5c-.2.6-1 1-1.5 1.1-.4.1-.9.1-1.5 0-.3-.1-.7-.2-1.2-.4-2-.9-3.3-2.2-4.2-4.2-.2-.5-.3-.9-.4-1.2-.1-.6-.1-1.1 0-1.5.1-.5.5-1.3 1.1-1.5l.8-.2c.3-.1.6 0 .8.2l1 1c.2.2.3.6.2.9l-.4 1c-.1.2-.1.4 0 .6.4.8.9 1.4 1.7 1.7.2.1.4.1.6 0l1-.4c.3-.1.7 0 .9.2l1 1c.2.2.2.5.2.8l-.1.8z"/></svg>
      </a>
      <a class="contact-icon-btn" href="https://www.facebook.com/alahram2014/" target="_blank" rel="noopener noreferrer" aria-label="فيسبوك" title="فيسبوك">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.2 22v-8.1h2.7l.4-3.1h-3.1V8.8c0-.9.3-1.5 1.6-1.5h1.6V4.5c-.8-.1-1.7-.2-2.6-.2-2.6 0-4.4 1.6-4.4 4.5v2H6.6v3.1h2.8V22h3.8z"/></svg>
      </a>
    </div>`;
}


function filteredProducts() {
  let items = [...state.products];
  const q = normalizeText(state.search);

  if (q) {
    items = items.filter((product) => {
      return normalizeText(product.product_name).includes(q)
        || normalizeText(product.product_id).includes(q)
        || normalizeText(companyName(product.company_id)).includes(q)
        || normalizeText(product.company_id).includes(q);
    });
  } else if (state.view.type === 'company' && state.view.companyId) {
    items = items.filter((product) => product.company_id === state.view.companyId);
  }

  return sortProducts(items);
}


function matchesHomeSearch(product, q) {
  const query = normalizeText(q || state.search);
  if (!query) return true;
  return normalizeText(product.product_name).includes(query)
    || normalizeText(product.product_id).includes(query)
    || normalizeText(companyName(product.company_id)).includes(query)
    || normalizeText(product.company_id).includes(query)
    || normalizeText(product.category || '').includes(query);
}


function matchesDealSearch(item, q) {
  const query = normalizeText(q || state.search);
  if (!query) return true;
  return normalizeText(item.title).includes(query)
    || normalizeText(item.description).includes(query)
    || normalizeText(String(item.id)).includes(query)
    || normalizeText(item.company_id).includes(query);
}


function filteredDailyDeals() {
  const q = normalizeText(state.search);
  return q ? state.dailyDeals.filter((item) => matchesDealSearch(item, q)) : state.dailyDeals;
}


function filteredFlashOffers() {
  const q = normalizeText(state.search);
  return q ? state.flashOffers.filter((item) => matchesDealSearch(item, q)) : state.flashOffers;
}


function productCardHtml(product) {
  const unit = currentUnitForProduct(product);
  const units = availableUnits(product);
  const key = cartKey({ type: 'product', id: product.product_id, unit });
  const inCart = Boolean(findCartItem(key));
  const image = product.product_image || placeholderImage(product.product_name);
  const qty = getProductQty(product.product_id);
  const unitHtml = units.length
    ? units.map((itemUnit) => `
        <button class="unit-chip ${itemUnit === unit ? 'active' : ''}" data-action="set-unit" data-product-id="${escapeHtml(product.product_id)}" data-unit="${escapeHtml(itemUnit)}">
          ${itemUnit === 'carton' ? 'كرتونة' : 'دستة'}
        </button>
      `).join('')
    : `<span class="product-sub">لا توجد وحدة</span>`;

  return `
    <article class="product-card" data-product-id="${escapeHtml(product.product_id)}">
      <button class="product-image-wrap" type="button" data-action="open-product" data-product-id="${escapeHtml(product.product_id)}">
        <img class="product-image" src="${escapeHtml(image)}" alt="${escapeHtml(product.product_name)}" loading="lazy" />
      </button>
      <div class="product-body">
        <div class="product-topline">
          <div class="product-title">${escapeHtml(product.product_name)}</div>
        </div>
        <div class="badge-row product-badge-row"><span class="badge badge-tier">يحتسب ضمن الشريحة</span></div>
        ${displayPriceBlock(product, unit)}
        <label class="qty-pick">
          <span class="qty-label">الكمية</span>
          <input
            type="number"
            min="1"
            value="${integer(qty)}"
            class="qty-input"
            data-role="product-qty"
            data-product-id="${escapeHtml(product.product_id)}"
            inputmode="numeric"
          />
        </label>
        <div class="unit-strip">${unitHtml}</div>
        <div class="card-actions">
          <button class="primary-btn" data-action="toggle-product" data-product-id="${escapeHtml(product.product_id)}">
            ${inCart ? 'إزالة من السلة' : 'شراء'}
          </button>
        </div>
      </div>
    </article>
  `;
}


function renderDealsPage() {
  setPersistentHtml(els.pageContent, `
    <div class="page-stack">
      <section class="section-card">
        <div class="section-head">
          <div>
            <h2>صفقة اليوم</h2>
            <div class="helper-text">صفقة اليوم فرص لا تتكرر</div>
          </div>
        </div>
      </section>
      <section class="deal-list">
        ${filteredDailyDeals().length ? filteredDailyDeals().map((deal) => dealCardHtml(deal, 'deal')).join('') : `<div class="empty-state">لا توجد صفقة اليوم الآن</div>`}
      </section>
    </div>
  `);
}


function renderInvoicesPage() {
  const rows = state.invoices;
  setPersistentHtml(els.pageContent, `
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
}


function renderInvoiceCard(order) {
  return `
    <article class="invoice-card">
      <div class="invoice-top">
        <div>
          <div class="invoice-number">${escapeHtml(order.order_number)}</div>
          <div class="invoice-meta">
            <span>${escapeHtml(formatDateTime(order.created_at))}</span>
            <span>الحالة: ${escapeHtml(getStatusLabel(order.status))}</span>
          </div>
        </div>
        <span class="invoice-amount mono">${num(order.total_amount)} </span>
      </div>
      <div class="bad-line">
        <span class="status-pill">${escapeHtml(order.user_type || '')}</span>
        <span class="status-pill ${statusClass(order.status)}">${escapeHtml(getStatusLabel(order.status))}</span>
      </div>
    </article>
  `;
}


function statusClass(status) {
  const value = String(status || '').toLowerCase();
  if (['submitted', 'confirmed', 'processing', 'shipped', 'delivered', 'paid', 'completed'].includes(value)) return 'status-active';
  if (['cancelled', 'rejected'].includes(value)) return 'status-danger';
  return 'status-muted';
}


function renderSearchablePageWrapper(title, subtitle) {
  return `
    <section class="section-card">
      <div class="section-head">
        <div>
          <h2>${escapeHtml(title)}</h2>
          ${subtitle ? `<div class="helper-text">${escapeHtml(subtitle)}</div>` : ''}
        </div>
      </div>
      <div class="search-row">
        <input id="headerSearchInput" type="search" placeholder="ابحث باسم المنتج أو الشركة" value="${escapeHtml(state.search)}" />
        <button class="mini-btn icon-btn" id="headerClearSearchBtn" type="button">×</button>
      </div>
    </section>
  `;
}


function dealCardHtml(item, type, activeFlash = null) {
  const title = escapeHtml(item.title);
  const desc = escapeHtml(item.description || '');
  const image = escapeHtml(item.image || placeholderImage(item.title));
  const price = num(item.price);
  const key = `${type}:${item.id}:single`;
  const inCart = Boolean(findCartItem(key));
  const canBuy = type === 'deal' ? Boolean(item.can_buy) : Boolean(item.can_buy);
  const status = type === 'flash'
    ? (item.status === 'active' ? 'نشط الآن' : item.status === 'pending' ? 'قريبًا' : 'منتهي')
    : (item.can_buy ? 'متاح' : 'غير متاح');
  const buttonText = !canBuy
    ? 'انتهى العرض'
    : inCart
      ? 'إزالة من السلة'
      : (type === 'deal' ? 'شراء الآن' : 'شراء الآن');
  const buttonDisabled = !canBuy;
  const metaLine = type === 'flash'
    ? (item.status === 'active' ? `متبقي: ${countdownTo(item.end_time)}` : item.status === 'expired' ? `انتهى: ${formatDateTime(item.end_time)}` : `يبدأ: ${formatDateTime(item.start_time)}`)
    : `المخزون: ${integer(item.stock || 0)}`;

  return `
    <article class="deal-card">
      <button class="deal-image-wrap" type="button" data-action="open-offer" data-offer-type="${escapeHtml(type)}" data-id="${escapeHtml(item.id)}">
        <img class="deal-image" src="${image}" alt="${title}" loading="lazy" />
      </button>
      <div class="deal-body">
        <div class="badge-row">
          <span class="badge">${escapeHtml(status)}</span>
          <span class="badge">${escapeHtml(metaLine)}</span>
        </div>
        <h3 class="deal-title">${title}</h3>
        <p class="deal-desc">${desc}</p>
        <div class="badge-row product-badge-row"><span class="badge badge-deal">سعر خاص · غير محتسب ضمن هدف الشريحة</span></div>
        <div class="price-wrap">
          <span class="price-main">${price} ج.م</span>
        </div>
        <div class="card-actions">
          <button class="primary-btn" data-action="${type === 'deal' ? 'toggle-deal' : 'toggle-flash'}" data-id="${escapeHtml(item.id)}" ${buttonDisabled ? 'disabled' : ''}>${buttonText}</button>
          <button class="ghost-btn" type="button" data-action="open-offer" data-offer-type="${escapeHtml(type)}" data-id="${escapeHtml(item.id)}">تفاصيل</button>
        </div>
      </div>
    </article>
  `;
}



function toggleProductFromCard(productId) {
  const product = state.products.find((item) => item.product_id === productId);
  if (!product) return;
  if (!state.selectedTier) {
    const card = document.querySelector(`.product-card[data-product-id="${CSS.escape(productId)}"]`);
    const unit = card?.querySelector('.unit-chip.active')?.getAttribute('data-unit') || currentUnitForProduct(product);
    const qtyInput = card?.querySelector('.qty-input');
    const qty = setProductQty(productId, qtyInput ? qtyInput.value : getProductQty(productId));
    state.pendingTierAction = { kind: 'product', productId, unit, qty };
    closeProductModal();
    openTierModal(state.pendingTierAction);
    smartToast('tier.missing', 'اختر الشريحة أولاً لتثبيت التسعير', true);
    return;
  }
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
    recordUiEvent('cart.remove', { productId, unit, qty, companyId: product.company_id });
    smartToast('cart.remove', 'تمت الإزالة من السلة', true);
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
  recordUiEvent('cart.add', { productId, unit, qty, companyId: product.company_id });
  smartToast('cart.add', 'تمت الإضافة للسلة', true);
}


function toggleDeal(type, id) {
  const source = type === 'deal' ? state.dailyDeals : state.flashOffers;
  const item = source.find((row) => String(row.id) === String(id));
  if (!item) return;
  if (type === 'deal' && !item.can_buy) return toast('صفقة اليوم غير متاحة');
  if (type === 'flash' && !item.can_buy) return toast('العرض غير متاح');
  if (!state.selectedTier) {
    state.pendingTierAction = { kind: type, id };
    openTierModal(state.pendingTierAction);
    smartToast('tier.missing', 'اختر الشريحة أولاً لتثبيت التسعير', true);
    return;
  }

  const key = `${type}:${item.id}:single`;
  const existing = findCartItem(key);
  if (existing) {
    state.cart = state.cart.filter((row) => row.key !== key);
    persistCart();
    resetCheckoutStage();
    renderCart();
    renderApp();
    state.behavior.lastCartActivity = Date.now();
    recordUiEvent('cart.remove', { offerId: item.id, offerType: type });
    smartToast('cart.remove', 'تمت الإزالة من السلة', true);
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
  recordUiEvent('cart.add', { offerId: item.id, offerType: type });
  smartToast('cart.add', 'تمت الإضافة للسلة', true);
}
