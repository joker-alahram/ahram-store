import { dom } from '../core/dom.js';
import { getSessionLabel, getSelectedTier } from '../state/selectors.js';

export function renderHeader(container, state) {
  const tier = getSelectedTier(state);
  const sessionLabel = getSessionLabel(state);

  container.innerHTML = `
    <div class="header-shell">
      <div class="header-row header-row--primary">
        <button class="btn btn--ghost header-chip" type="button" data-action="navigate-home">الرئيسية</button>
        <button class="btn btn--ghost header-chip" type="button" data-action="go-tiers">${dom.escape(tier.visible_label || 'الشريحة')}</button>
        <button class="btn btn--ghost header-chip" type="button" data-action="go-offers">العروض</button>
        <button class="btn btn--ghost header-chip header-chip--account" type="button" data-action="toggle-account-menu">${dom.escape(sessionLabel)}</button>
      </div>
      <div class="header-menu ${state.ui.accountMenuOpen ? 'is-open' : ''}" data-role="account-menu">
        ${state.auth.session ? `
          <button type="button" data-action="go-account">حسابي</button>
          <button type="button" data-action="go-customers">عملائي</button>
          <button type="button" data-action="go-invoices">فواتيري</button>
          <button type="button" data-action="logout">تسجيل الخروج</button>
        ` : `
          <button type="button" data-action="go-login">تسجيل الدخول</button>
          <button type="button" data-action="go-register">تسجيل عميل جديد</button>
        `}
      </div>
    </div>
  `;
}
