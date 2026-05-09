import { el } from '../utils/dom.js';

export function loginScreen({ onSubmit, error, demoHint }) {
  return el('section', { class: 'panel auth-panel' },
    el('div', { class: 'grid-2' },
      el('div', { class: 'card hero-card' },
        el('h2', {}, 'Login'),
        el('p', { class: 'muted' }, 'Role is resolved by the database user_type. No local permission branching is used for pricing or order logic.'),
        el('form', { class: 'form', onsubmit: (e) => { e.preventDefault(); onSubmit?.(new FormData(e.currentTarget)); } },
          el('label', {}, 'Login', el('input', { name: 'login', required: true, autocomplete: 'username', placeholder: 'phone / username / login_code' })),
          el('label', {}, 'Password', el('input', { name: 'password', type: 'password', required: true, autocomplete: 'current-password', placeholder: 'password' })),
          error ? el('div', { class: 'alert error' }, error) : null,
          el('button', { class: 'btn btn-primary', type: 'submit' }, 'Sign in'),
        )
      ),
      el('div', { class: 'card' },
        el('h3', {}, 'Contract notes'),
        el('ul', { class: 'bullets' },
          el('li', {}, 'Products are read from v_runtime_products.'),
          el('li', {}, 'Tiers are read from v_visible_tiers.'),
          el('li', {}, 'Final price is displayed as received.'),
          el('li', {}, 'Invoices are generated from order snapshots only.'),
        ),
        demoHint ? el('div', { class: 'alert info' }, demoHint) : null,
      )
    )
  );
}
