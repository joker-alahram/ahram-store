import { companyCard } from '../components/cards.js';
import { normalize } from '../state/selectors.js';

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

function counterCard(label, value) {
  return `<article class="counter-card"><strong>${value}</strong><span>${label}</span></article>`;
}

export function renderHomePage(state) {
  const q = normalize(state.ui.search);
  const companies = (state.commerce.catalog.companies || []).filter((company) => {
    if (!q) return true;
    return normalize(company.company_name).includes(q) || normalize(company.company_id).includes(q);
  });
  const counters = state.commerce.catalog.counters || {
    companies: companies.length,
    tiers: (state.commerce.catalog.tiers || []).length,
    deals: (state.commerce.catalog.offers?.daily || []).length,
    flash: (state.commerce.catalog.offers?.flash || []).length,
  };

  return `
    <div class="page-stack page-stack--home">
      <section class="page-section page-section--dense">
        <div class="page-section__head page-section__head--tight">
          <div>
            <h2>مؤشرات سريعة</h2>
            <p>بيانات خفيفة فقط في الصفحة الرئيسية</p>
          </div>
        </div>
        <div class="counter-grid">
          ${counterCard('الشركات', counters.companies || 0)}
          ${counterCard('الشرائح', counters.tiers || 0)}
          ${counterCard('العروض اليومية', counters.deals || 0)}
          ${counterCard('عروض الساعة', counters.flash || 0)}
        </div>
      </section>
      ${shelf('الشركات', 'تصفح الشركات المتاحة', companies.map(companyCard).join(''), 'page-section--companies', 'company-grid')}
    </div>
  `;
}
