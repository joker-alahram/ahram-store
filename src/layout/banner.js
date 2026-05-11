import { dom } from '../core/dom.js';
import { THEME_OPTIONS } from '../core/theme.js';

function resolveBannerImage(state) {
  const settings = state.commerce?.catalog?.settingsMap || {};
  return settings.company_banner_image
    || settings.company_banner
    || settings.banner_image
    || settings.home_banner_image
    || settings.hero_banner
    || settings.main_banner
    || '';
}


function renderThemePicker(state) {
  const current = String(state.ui?.theme || 'premium-dark').trim().toLowerCase();
  return `
    <div class="theme-strip" role="toolbar" aria-label="اختيار لون المتجر">
      <div class="theme-strip__label">ألوان المتجر</div>
      <div class="theme-strip__scroller">
        ${THEME_OPTIONS.map((theme) => `
          <button
            type="button"
            class="theme-swatch ${theme.name === current ? 'is-active' : ''}"
            aria-pressed="${theme.name === current ? 'true' : 'false'}"
            data-action="set-theme"
            data-theme="${dom.escape(theme.name)}"
            aria-label="${dom.escape(theme.label)}"
            title="${dom.escape(theme.label)}"
            style="--theme-swatch: ${dom.escape(theme.swatch)};"
          ></button>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderBanner(container, state) {
  if (!container) return;
  if (state.app.route.name !== 'home') {
    container.innerHTML = '';
    return;
  }

  const banner = resolveBannerImage(state);
  container.innerHTML = `
    <section class="banner-shell banner-shell--home">
      ${banner ? `<img class="banner-shell__image" src="${dom.escape(banner)}" alt="بانر الشركة" loading="eager" />` : ''}
      ${renderThemePicker(state)}
    </section>
  `;
}
