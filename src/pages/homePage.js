import { companyCard, productCard } from '../components/cards.js';
import { normalize, getVisibleCompanies } from '../state/selectors.js';

function shelf(title, subtitle, itemsHtml, extraClass = '', gridClass = 'section-grid') {
  return `
    <section class="page-section page-section--dense ${extraClass}">
      <div class="page-section__head page-section__head--tight">
        <div>
          <h2>${title}</h2>
          ${subtitle ? `<p>${subtitle}</p>` : ''}
        </div>
      </div>
      <div class="${gridClass}">${itemsHtml}</div>
    </section>
  `;
}

function skeletonGrid(count = 6, type = 'product') {
  return Array.from({ length: count }).map((_, index) => `
    <article class="${type === 'company' ? 'company-card' : 'product-card'} is-skeleton" aria-hidden="true">
      <div class="skeleton-box skeleton-box--media"></div>
      <div class="skeleton-box skeleton-box--line"></div>
      <div class="skeleton-box skeleton-box--line"></div>
      <div class="skeleton-box skeleton-box--line short"></div>
    </article>
  `).join('');
}

function pickProducts(state, list) {
  const q = normalize(state.ui.search);
  return (list || []).filter((product) => {
    if (!product) return false;
    if (!q) return true;
    return normalize(product.product_name).includes(q)
      || normalize(product.company_name).includes(q)
      || normalize(product.product_id).includes(q)
      || normalize(product.company_id).includes(q);
  });
}

function createProductLookup(products) {
  return new Map((Array.isArray(products) ? products : [])
    .filter((item) => item && item.product_id)
    .map((item) => [String(item.product_id), item]));
}

function topCompanyCards(state) {
  const visibleCompanies = getVisibleCompanies(state);
  if (visibleCompanies.length) return visibleCompanies.map(companyCard).join('');
  const topCompanies = (state.commerce.catalog.top?.companies || []).map((row) => ({
    company_id: row.company_id,
    company_name: row.company_name,
    company_logo: '',
  }));
  return topCompanies.length ? topCompanies.map(companyCard).join('') : '';
}

function renderProductSection(title, subtitle, products, tier, state, cartProductIds) {
  return products.length
    ? shelf(title, subtitle, products.map((product) => productCard(product, tier, {
        unit: state.commerce.unitPrefs[product.product_id],
        qty: state.commerce.qtyPrefs[product.product_id] || 1,
        inCart: cartProductIds.has(String(product.product_id)),
      })).join(''), 'page-section--products', 'product-grid')
    : shelf('جارٍ التحميل', subtitle, skeletonGrid(4, 'product'), 'page-section--products', 'product-grid');
}

export function renderHomePage(state) {
  const catalogReady = Boolean(state.runtime.lifecycle?.catalogReady);
  const q = normalize(state.ui.search);
  const companies = getVisibleCompanies(state).filter((company) => {
    if (!q) return true;
    return normalize(company.company_name).includes(q) || normalize(company.company_id).includes(q);
  });
  const tiers = Array.isArray(state.commerce.catalog.tiers) ? state.commerce.catalog.tiers : [];
  const currentTier = state.commerce.selectedTier ? tiers.find((tier) => tier.tier_name === state.commerce.selectedTier) || tiers[0] : tiers[0];
  const products = pickProducts(state, state.commerce.catalog.products || []);
  const productLookup = createProductLookup(products);
  const topRows = Array.isArray(state.commerce.catalog.top?.products) ? state.commerce.catalog.top.products.filter((row) => row && row.product_id) : [];
  const topProducts = topRows.map((row) => productLookup.get(String(row.product_id))).filter(Boolean);
  const cartItems = Array.isArray(state.commerce.cart) ? state.commerce.cart.filter(Boolean) : [];
  const cartCompanyIds = new Set(cartItems.map((item) => String(item.companyId || item.company_id || '')).filter(Boolean));
  const cartProductIds = new Set(cartItems.filter((item) => item.type === 'product').map((item) => String(item.id || item.product_id || '')).filter(Boolean));
  const basketProducts = products.filter((product) => cartCompanyIds.has(String(product.company_id || '')) || cartProductIds.has(String(product.product_id))).slice(0, 6);
  const featuredProducts = topProducts.slice(0, 6);
  const mostRequested = topRows.slice(0, 6).map((row) => productLookup.get(String(row.product_id))).filter(Boolean);
  const smartProducts = products.filter((product) => !basketProducts.includes(product)).slice(0, 6);

  if (!catalogReady) {
    return `
      <div class="page-stack">
        ${shelf('جارٍ التحميل', 'يتم تجهيز المنتجات والشركات', skeletonGrid(4, 'company'), 'page-section--products', 'company-grid')}
        ${shelf('جارٍ التحميل', 'يتم تجهيز الكتالوج', skeletonGrid(6, 'product'), 'page-section--products', 'product-grid')}
      </div>
    `;
  }

  return `
    <div class="page-stack">
      ${companies.length ? shelf('الشركات', 'شبكة التوريد الرئيسية', topCompanyCards(state), 'page-section--companies', 'company-grid') : ''}
      ${renderProductSection('الأكثر مبيعًا', 'أهم الأصناف المتاحة حاليًا', featuredProducts, currentTier || tiers[0], state, cartProductIds)}
      ${renderProductSection('الأكثر طلبًا', 'الأصناف الأكثر تداولًا', mostRequested, currentTier || tiers[0], state, cartProductIds)}
      ${basketProducts.length ? shelf('منتجات تناسب سلتك', 'اقتراحات مبنية على الطلب الحالي', basketProducts.map((product) => productCard(product, currentTier || tiers[0], {
        unit: state.commerce.unitPrefs[product.product_id],
        qty: state.commerce.qtyPrefs[product.product_id] || 1,
        inCart: cartProductIds.has(String(product.product_id)),
      })).join(''), 'page-section--products', 'product-grid') : shelf('جارٍ التحميل', 'يتم تجهيز اقتراحات السلة', skeletonGrid(4, 'product'), 'page-section--products', 'product-grid')}
      ${smartProducts.length ? shelf('الترشيحات الذكية', 'أصناف جاهزة للشراء السريع', smartProducts.map((product) => productCard(product, currentTier || tiers[0], {
        unit: state.commerce.unitPrefs[product.product_id],
        qty: state.commerce.qtyPrefs[product.product_id] || 1,
        inCart: cartProductIds.has(String(product.product_id)),
      })).join(''), 'page-section--products', 'product-grid') : shelf('جارٍ التحميل', 'يتم تجهيز الترشيحات', skeletonGrid(4, 'product'), 'page-section--products', 'product-grid')}
    </div>
  `;
}
