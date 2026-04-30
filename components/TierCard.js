function tierCardHtml(tier) {
  if (!tier) return '';
  return `
    <article class="tier-card" data-action="select-tier" data-tier-name="${escapeHtml(tier.tier_name || '')}" data-visible-label="${escapeHtml(tier.visible_label || '')}">
      <div class="tier-title">${escapeHtml(tierDisplayLabel(tier))}</div>
      <div class="tier-meta">${escapeHtml(num(tier.min_order || 0))} ج.م</div>
    </article>
  `;
}
