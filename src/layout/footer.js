import { dom } from '../core/dom.js';

export function renderFooter(container, state) {
  container.innerHTML = `
    <nav class="footer-nav" aria-label="التنقل السفلي">
      <button type="button" data-action="navigate-home" class="footer-nav__item">الرئيسية</button>
      <button type="button" data-action="go-companies" class="footer-nav__item">الشركات</button>
      <button type="button" data-action="go-offers" class="footer-nav__item">العروض</button>
      <button type="button" data-action="open-cart-drawer" class="footer-nav__item footer-nav__item--strong">السلة <span>${state.commerce.cart.length}</span></button>
      <button type="button" data-action="go-account" class="footer-nav__item">الحساب</button>
    </nav>
  `;
}
