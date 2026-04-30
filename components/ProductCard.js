function companyStripHtml(companies = []) {
  return `
    <section class="section-card strip-card">
      <div class="section-head">
        <div>
          <h2>الشركات</h2>
          <div class="helper-text">اختر الشركة ثم انتقل للمنتجات</div>
        </div>
      </div>
      <div class="rail company-rail">
        ${companies.length ? companies.map((company) => `
          <article class="mini-company-card">
            <img class="mini-company-logo" src="${escapeHtml(company.company_logo || placeholderImage(company.company_name))}" alt="${escapeHtml(company.company_name)}" loading="lazy" />
            <div class="mini-company-name">${escapeHtml(company.company_name)}</div>
            <button class="ghost-btn mini-cta" data-action="open-company" data-company-id="${escapeHtml(company.company_id)}" type="button">فتح الشركة</button>
          </article>
        `).join('') : '<div class="empty-state">لا توجد شركات ظاهرة الآن</div>'}
      </div>
    </section>`;
}
function productRailSection(title, subtitle, products = [], { showCompany = true, cta = 'فتح المنتجات' } = {}) {
  return `
    <section class="section-card strip-card">
      <div class="section-head">
        <div>
          <h2>${escapeHtml(title)}</h2>
          ${subtitle ? `<div class="helper-text">${escapeHtml(subtitle)}</div>` : ''}
        </div>
      </div>
      <div class="rail product-rail">
        ${products.length ? products.map((product) => `
          <article class="rail-product-card">
            <img class="rail-product-image" src="${escapeHtml(product.product_image || placeholderImage(product.product_name))}" alt="${escapeHtml(product.product_name)}" loading="lazy" />
            <div class="rail-product-body">
              <div class="rail-product-title">${escapeHtml(product.product_name)}</div>
              ${showCompany ? `<div class="rail-product-sub">${escapeHtml(companyName(product.company_id))}</div>` : ''}
              <div class="rail-product-meta">${escapeHtml(getPriceLabel(product))}</div>
              <div class="card-actions">
                <button class="ghost-btn mini-cta" data-action="open-product" data-product-id="${escapeHtml(product.product_id)}" type="button">عرض المنتج</button>
                <button class="ghost-btn mini-cta" data-action="open-company" data-company-id="${escapeHtml(product.company_id)}" type="button">${escapeHtml(cta)}</button>
              </div>
            </div>
          </article>
        `).join('') : '<div class="empty-state">لا توجد عناصر للعرض</div>'}
      </div>
    </section>`;
}
function productGridSection(title, subtitle, products = []) {
  return `
    <section class="section-card">
      <div class="section-head">
        <div>
          <h2>${escapeHtml(title)}</h2>
          ${subtitle ? `<div class="helper-text">${escapeHtml(subtitle)}</div>` : ''}
        </div>
      </div>
      <section class="grid product-grid">
        ${products.length ? products.map(productCardHtml).join('') : '<div class="empty-state">لا توجد منتجات</div>'}
      </section>
    </section>`;
}
function getPriceLabel(product) {
  const unit = currentUnitForProduct(product);
  const price = resolveProductPrice(product, unit);
  return `${unit === 'carton' ? 'كرتونة' : 'دستة'} · ${num(price)} ج.م`;
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
    <article class="product-card">
      <img class="product-image" src="${escapeHtml(image)}" alt="${escapeHtml(product.product_name)}" loading="lazy" />
      <div class="product-body">
        <div>
          <div class="product-title">${escapeHtml(product.product_name)}</div>
        </div>
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
          <button class="ghost-btn" data-action="open-product" data-product-id="${escapeHtml(product.product_id)}" type="button">عرض المنتج</button>
          <button class="primary-btn" data-action="toggle-product" data-product-id="${escapeHtml(product.product_id)}" type="button">
            ${inCart ? 'إزالة' : 'شراء'}
          </button>
        </div>
      </div>
    </article>
  `;
}
function statusClass(status) {
  const value = String(status || '').toLowerCase();
  if (['submitted', 'confirmed', 'completed'].includes(value)) return 'status-active';
  if (['cancelled', 'rejected'].includes(value)) return 'status-danger';
  return 'status-muted';
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
      ? 'إزالة'
      : 'شراء';
  const buttonDisabled = !canBuy;
  const metaLine = type === 'flash'
    ? (item.status === 'active' ? `متبقي: ${countdownTo(item.end_time)}` : item.status === 'expired' ? `انتهى: ${formatDateTime(item.end_time)}` : `يبدأ: ${formatDateTime(item.start_time)}`)
    : `المخزون: ${integer(item.stock || 0)}`;

  return `
    <article class="deal-card">
      <img class="deal-image" src="${image}" alt="${title}" loading="lazy" />
      <div class="deal-body">
        <div class="badge-row">
          <span class="badge">${escapeHtml(status)}</span>
          <span class="badge">${escapeHtml(metaLine)}</span>
        </div>
        <h3 class="deal-title">${title}</h3>
        <p class="deal-desc">${desc}</p>
        <div class="price-wrap">
          <span class="price-main">${price} ج.م</span>
        </div>
        <div class="card-actions">
          <button class="primary-btn" data-action="toggle-${type}" data-id="${escapeHtml(item.id)}" ${buttonDisabled ? 'disabled' : ''}>${buttonText}</button>
        </div>
      </div>
    </article>
  `;
}
