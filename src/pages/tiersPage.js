import { tierCard } from '../components/cards.js';
import { getSelectedTier } from '../state/selectors.js';

function tierSortWeight(tier) {
  const label = String(tier.visible_label || tier.tier_name || '').toLowerCase();
  if (label.includes('الماس') || label.includes('diamond')) return 0;
  if (label.includes('ذهب') || label.includes('gold')) return 1;
  if (label.includes('فض') || label.includes('silver')) return 2;
  if (label.includes('برون') || label.includes('bronze')) return 3;
  return 4;
}

export function renderTiersPage(state) {
  const active = getSelectedTier(state).tier_name;
  const tiers = [...(state.commerce.catalog.tiers || [])].sort((a, b) => tierSortWeight(a) - tierSortWeight(b));
  return `
    <div class="page-stack">
      <section class="page-section">
        <div class="page-section__head"><div><h2>اختيار الشريحة</h2><p>تؤثر على التسعير والحد الأدنى</p></div></div>
        <div class="tier-grid">${tiers.map((tier) => tierCard(tier, tier.tier_name === active)).join('') || '<div class="empty-state">لا توجد شرائح</div>'}</div>
      </section>
    </div>
  `;
}
