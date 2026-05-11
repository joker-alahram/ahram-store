import { tierCard } from '../components/cards.js';
import { getSelectedTier } from '../state/selectors.js';

export function renderTiersPage(state) {
  const active = getSelectedTier(state).tier_name;
  return `
    <div class="page-stack">
      <section class="page-section">
        <div class="page-section__head"><div><h2>اختيار الشريحة</h2><p>تؤثر على التسعير والحد الأدنى</p></div></div>
        <div class="tier-grid">${state.commerce.catalog.tiers.map((tier) => tierCard(tier, tier.tier_name === active)).join('') || '<div class="empty-state">لا توجد شرائح</div>'}</div>
      </section>
    </div>
  `;
}
