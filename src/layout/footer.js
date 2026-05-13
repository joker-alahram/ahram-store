import { getSelectedTier } from '../state/selectors.js';

export function renderFooter(container, state) {
  const tier = getSelectedTier(state);
  const label = tier?.visible_label || tier?.tier_name || 'اختر شريحتك';

  container.innerHTML = `
    <nav class="footer-nav" aria-label="التنقل السفلي">
      <button type="button" data-action="navigate-home" class="footer-nav__item">الرئيسية</button>
      <button type="button" data-action="go-companies" class="footer-nav__item">الشركات</button>
      <button type="button" data-action="go-offers" class="footer-nav__item">العروض</button>
      <button type="button" data-action="open-cart-drawer" class="footer-nav__item footer-nav__item--strong">إتمام الشراء</button>
      <button type="button" data-action="go-tiers" class="footer-nav__item footer-nav__item--tier">${label}</button>
    </nav>
  `;
}
