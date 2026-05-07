import { companyCard, productCard } from '../components/cards.js';
import { cartItemKey } from '../services/cartService.js';
import { getVisibleCompanies, getVisibleProducts, normalize } from '../state/selectors.js';

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

function productShelf(title, subtitle, products, state, extraClass = '', gridClass = 'product-grid') {
  const tier = state.commerce.catalog.tiers.find((t) => t.tier_name === state.commerce.selectedTier) || state.commerce.catalog.tiers.find((t) => t.is_default) || state.commerce.catalog.tiers[0] || null;
  return shelf(title, subtitle, products.map((product) => productCard(product, tier, {
    unit: state.commerce.unitPrefs[product.product_id],
    qty: state.commerce.qtyPrefs[product.product_id] || 1,
    inCart: state.commerce.cart.some((item) => cartItemKey(item) === `${product.product_id}::${String(state.commerce.unitPrefs[product.product_id] || product.sellable_units?.[0] || 'single')}::${String(state.commerce.selectedTier || '')}`),
  })).join(''), extraClass, gridClass);
}

function resolveTopProducts(state) {
  const indexed = state.commerce.catalog.productIndex || {};
  const top = (state.commerce.catalog.top?.products || []).map((row) => indexed[row.product_id] || null).filter(Boolean);
  if (top.length) return top;
  return Object.values(indexed).slice().sort((a, b) => String(a.product_name).localeCompare(String(b.product_name), 'ar'));
}

export function renderHomePage(state) {
  const q = normalize(state.ui.search);
  const visibleCompanies = getVisibleCompanies(state);
  const allVisibleProducts = getVisibleProducts(state);
  const topProducts = resolveTopProducts(state).filter((product) => !q || normalize(product.product_name).includes(q) || normalize(product.company_name).includes(q)).slice(0, 8);
  const searchableProducts = allVisibleProducts.filter((product) => !q || normalize(product.product_name).includes(q) || normalize(product.company_name).includes(q)).slice(0, 8);
  const basketCompanions = allVisibleProducts.filter((product) => !state.commerce.cart.some((item) => item.productId === product.product_id)).slice(0, 8);

  return `
    <div class="page-stack page-stack--home">
      ${shelf('الشركات', 'جميع الشركات المتاحة', visibleCompanies.map(companyCard).join(''), 'page-section--companies', 'company-grid')}
      ${productShelf('الأكثر مبيعًا', 'المنتجات الأعلى طلبًا', topProducts, state, 'page-section--products')}
      ${productShelf('الأكثر طلبًا', 'اختيارات مناسبة للبحث الحالي', searchableProducts, state, 'page-section--products')}
      ${productShelf('منتجات تناسب سلتك', 'مقترحات تكمل الطلب الحالي', basketCompanions, state, 'page-section--products')}
    </div>
  `;
}
