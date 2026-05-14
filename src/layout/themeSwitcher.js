import { dom } from '../core/dom.js';

export const AVAILABLE_THEMES = [
  { name: 'orange-theme', label: 'Orange', preview: 'linear-gradient(135deg, #ffb347 0%, #ff7a00 100%)' },
  { name: 'sky-blue-theme', label: 'Sky Blue', preview: 'linear-gradient(135deg, #8bd3ff 0%, #2b8cff 100%)' },
  { name: 'white-theme', label: 'White', preview: 'linear-gradient(135deg, #ffffff 0%, #e9eef5 100%)' },
  { name: 'green-yellow-theme', label: 'Green Yellow', preview: 'linear-gradient(135deg, #1fbf75 0%, #f3cf3c 100%)' },
  { name: 'amazon-inspired-theme', label: 'Amazon', preview: 'linear-gradient(135deg, #131a22 0%, #ff9900 100%)' },
  { name: 'vip-light-theme', label: 'VIP', preview: 'linear-gradient(135deg, #fff7e8 0%, #f2d9a6 48%, #d9b56a 100%)' },
];

export function renderThemeSwitcher(state) {
  if (state.app.route.name !== 'home') return '';

  return `
    <section class="theme-switcher" aria-label="اختيار الشكل اللوني والبحث">
      ${AVAILABLE_THEMES.map((theme) => `
        <button
          type="button"
          class="theme-switcher__button ${state.ui.theme === theme.name ? 'is-active' : ''}"
          data-action="set-theme"
          data-theme="${dom.escape(theme.name)}"
          aria-label="${dom.escape(theme.label)}"
          title="${dom.escape(theme.label)}"
          style="--theme-preview:${theme.preview};"
        >
          <span class="theme-switcher__swatch" aria-hidden="true"></span>
        </button>
      `).join('')}
      <button class="theme-switcher__button theme-switcher__button--search" type="button" data-action="go-search" aria-label="البحث" title="البحث">
        <span aria-hidden="true">⌕</span>
      </button>
      <button class="theme-switcher__button theme-switcher__button--install" type="button" data-action="install-app" aria-label="تثبيت التطبيق" title="تثبيت التطبيق">
        <span aria-hidden="true">⇩</span>
      </button>
    </section>
  `;
}
