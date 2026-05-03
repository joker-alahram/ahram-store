import { runtimeRegistry } from './runtime-registry.js';
const { state } = runtimeRegistry;
/* tiers.runtime.js — tier surfaces and pricing tier helpers */



function renderTierModalBody() {
  if (!els.tierModalBody) return;
  const current = tierName();
  const tierRows = Array.isArray(state.tiers) ? state.tiers : [];

  const cards = tierRows.length
    ? tierRows.map((tier) => {
        const isCurrent = current === tier.tier_name;
        const discount = Number(tier.discount_percent || 0);
        const minimum = Number(tier.min_order || 0);
        const description = discount > 0
          ? `خصم ${num(discount)}% · الحد الأدنى ${num(minimum)} ج.م`
          : `بدون خصم · الحد الأدنى ${num(minimum)} ج.م`;

        return [
          '<article class="tier-card tier-card-modal', isCurrent ? ' is-current' : '', '">',
          '<div class="bad-line">',
          '<div>',
          `<div class="tier-name">${escapeHtml(tierDisplayLabel(tier))}</div>`,
          `<div class="tier-visible">${escapeHtml(description)}</div>`,
          '</div>',
          isCurrent ? '<span class="badge">الحالية</span>' : `<span class="badge">${num(discount)}%</span>`,
          '</div>',
          `<div class="tier-min">${escapeHtml(tier.description || 'شريحة تسعير تجارية')}</div>`,
          `<button class="primary-btn" data-action="select-tier" data-tier-name="${escapeHtml(tier.tier_name)}" data-visible-label="${escapeHtml(tierDisplayLabel(tier))}">`,
          isCurrent ? 'الحالية' : 'اختيار',
          '</button>',
          '</article>',
        ].join('');
      }).join('')
    : '<div class="empty-state">لا توجد شرائح معرفة</div>';

  setPersistentHtml(els.tierModalBody, `
    <div class="tier-modal-copy">
      <div class="helper-text">اختر الشريحة المناسبة. عند أول إضافة ستُثبت الشريحة ثم تُضاف العملية تلقائيًا.</div>
    </div>
    <div class="tier-grid tier-grid-modal">
      ${cards}
    </div>
    <div class="tier-modal-foot">
      <button class="ghost-btn" data-action="open-tiers-page" type="button">عرض الصفحة الكاملة</button>
    </div>
  `);
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


function settingValue(key, fallback = '') {
  return state.settingMap.get(key) ?? fallback;
}


function pickSetting(keys, fallback = '') {
  for (const key of keys) {
    const value = state.settingMap.get(key);
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return fallback;
}


function currentUnitForProduct(product) {
  const saved = state.unitPrefs[product.product_id];
  const available = availableUnits(product);
  if (saved && available.includes(saved)) return saved;
  if (available.includes('carton')) return 'carton';
  if (available.includes('pack')) return 'pack';
  return 'carton';
}


function availableUnits(product) {
  const units = [];
  if (product.has_carton || Number(product.carton_price) > 0) units.push('carton');
  if (product.has_pack || Number(product.pack_price) > 0) units.push('pack');
  return units;
}


function baseUnitPrice(product, unit) {
  const snapshot = typeof getPricingSnapshotForProduct === 'function'
    ? getPricingSnapshotForProduct(product, unit)
    : (product?.pricingPreview || null);
  return Number(snapshot?.breakdown?.base ?? snapshot?.unit ?? 0);
}


function tierUnitPrice(product, unit) {
  const snapshot = typeof getPricingSnapshotForProduct === 'function'
    ? getPricingSnapshotForProduct(product, unit)
    : (product?.pricingPreview || null);
  const finalPrice = Number(snapshot?.breakdown?.tier ?? snapshot?.unit ?? snapshot?.breakdown?.final ?? 0);
  return finalPrice > 0 ? finalPrice : null;
}


function displayPriceBlock(product, unit) {
  const snapshot = getPricingSnapshotForProduct(product, unit) || product.pricingPreview || null;
  const unitLabel = unit === 'carton' ? 'كرتونة' : 'دستة';
  return typeof pricingBoxHtml === 'function'
    ? pricingBoxHtml(snapshot, {
        compact: true,
        className: 'pricing-box--product',
        title: `${unitLabel} · التسعير`,
        subtitle: product.allow_discount === false ? 'غير قابل للخصم' : 'تسعير مباشر حسب الشريحة',
      })
    : `<div class="price-wrap"><span class="price-main">—</span><span class="product-sub">${unitLabel}</span></div>`;
}



function displayPriceText(product, unit) {
  const price = resolveProductPrice(product, unit);
  return num(price);
}


function pickTierPrice(rows = [], tierName = null) {
  const byProduct = new Map();
  const preferred = String(tierName || '').trim();
  for (const row of rows || []) {
    if (!row || row.visible === false) continue;
    const productId = String(row.product_id || '').trim();
    if (!productId) continue;
    const nextPrice = Number(row.price || 0);
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) continue;

    const current = byProduct.get(productId);
    if (!current) {
      byProduct.set(productId, nextPrice);
      continue;
    }

    const currentTier = String(current.tier_name || '').trim();
    const rowTier = String(row.tier_name || '').trim();
    if (preferred && rowTier === preferred && currentTier !== preferred) {
      byProduct.set(productId, nextPrice);
      continue;
    }

    if (!preferred && nextPrice < current) {
      byProduct.set(productId, nextPrice);
    }
  }
  return byProduct;
}


function renderTierPage() {
  const current = tierName();
  const rows = Array.isArray(state.tiers) ? state.tiers : [];

  const cards = rows.length
    ? rows.map((tier) => {
        const isCurrent = current === tier.tier_name;
        const discount = Number(tier.discount_percent || 0);
        const minimum = Number(tier.min_order || 0);
        return [
          `<article class="tier-card${isCurrent ? ' is-current' : ''}">`,
          '<div class="bad-line">',
          '<div>',
          `<div class="tier-name">${escapeHtml(tierDisplayLabel(tier))}</div>`,
          `<div class="tier-visible">خصم ${num(discount)}% · الحد الأدنى ${num(minimum)} ج.م</div>`,
          '</div>',
          isCurrent ? '<span class="badge">الحالية</span>' : `<span class="badge">${num(discount)}%</span>`,
          '</div>',
          `<div class="tier-min">${escapeHtml(tier.description || 'شريحة تسعير تجارية')}</div>`,
          `<button class="primary-btn" data-action="select-tier" data-tier-name="${escapeHtml(tier.tier_name)}" data-visible-label="${escapeHtml(tierDisplayLabel(tier))}">${isCurrent ? 'الحالية' : 'اختيار'}</button>`,
          '</article>',
        ].join('');
      }).join('')
    : '<div class="empty-state">لا توجد شرائح معرفة</div>';

  setPersistentHtml(els.pageContent, `
    <div class="page-stack">
      <section class="section-card">
        <div class="section-head">
          <div>
            <h2>أختار شريحتك</h2>
            <div class="helper-text">اختر الشريحة المناسبة ثم عد إلى الصفحة الرئيسية. هذه الشريحة هي سياق التسعير وليست مجرد تبويب.</div>
          </div>
        </div>
      </section>
      <section class="tier-grid">
        ${cards}
      </section>
    </div>
  `);
}

function setSelectedTier(tier, persist = true) {
  state.selectedTier = tier;
  if (persist) saveJSON(STORAGE.tier, tier);
  updateHeader();
}


async function handleSelectTier(tier) {
  const current = tierName();
  if (current === tier.tier_name) {
    recordUiEvent('tier.clear', { tierName: tier.tier_name });
    state.selectedTier = null;
    saveJSON(STORAGE.tier, null);
    state.tierPrices = { carton: new Map(), pack: new Map() };
    resetCheckoutStage();
    syncCartPricesFromCurrentState();
    renderCart();
    updateHeader();
    renderApp();
    closeTierModal();
    state.pendingScrollTarget = 'companies-shelf';
    navigate('#home');
    smartToast('tier.missing', 'تم الخروج من الشريحة', true);
    return;
  }
  setSelectedTier(tier, true);
  recordUiEvent('tier.select', { tierName: tier.tier_name, visibleLabel: tier.visible_label || tier.tier_name });
  await loadTierPrices(tier);
  resetCheckoutStage();
  syncCartPricesFromCurrentState();
  await fulfillPendingTierAction();
  renderCart();
  updateHeader();
  renderApp();
  closeTierModal();
  state.pendingScrollTarget = 'companies-shelf';
  navigate('#home');
  smartToast('tier.selected', `تم اختيار ${tierDisplayLabel(tier)}`, true);
}
