import { el } from '../utils/dom.js';
import { money, dateTime } from '../utils/format.js';
import { CONFIG, ROUTES } from '../config.js';

export function shell({ session, route, content, onNavigate, onLogout, onSearch, onCreateOrder, cartCount = 0, bannerImage = '', searchValue = '' }) {
  const role = session?.user?.user_type || 'guest';
  const title = role === 'admin' ? 'Admin Dashboard' : role === 'sales_rep' ? 'Sales Representative Interface' : 'Store Application';
  const nav = [
    [ROUTES.home, 'Store'],
    [ROUTES.cart, `Cart (${cartCount})`],
    [ROUTES.orders, 'Orders'],
    [ROUTES.profile, 'Profile'],
  ];
  if (role === 'admin') {
    nav.push([ROUTES.admin, 'Admin'], [ROUTES.adminProducts, 'Products'], [ROUTES.adminOrders, 'Management']);
  }
  if (role === 'sales_rep') {
    nav.push([ROUTES.repDashboard, 'Rep Dashboard'], [ROUTES.repCustomers, 'Customers']);
  }

  return el('div', { class: 'app-shell' },
    el('header', { class: 'topbar' },
      el('div', { class: 'brand' },
        el('div', { class: 'brand-mark' }, 'DB'),
        el('div', {},
          el('div', { class: 'brand-title' }, CONFIG.appName),
          el('div', { class: 'brand-subtitle' }, title),
        ),
      ),
      el('div', { class: 'topbar-actions' },
        el('input', { class: 'search', type: 'search', placeholder: 'Search products, customers, orders…', value: searchValue, oninput: (e) => onSearch?.(e.target.value) }),
        el('button', { class: 'btn btn-secondary', onclick: onCreateOrder }, 'New Order'),
        session ? el('button', { class: 'btn btn-ghost', onclick: onLogout }, `Logout ${session.user?.name || ''}`) : el('button', { class: 'btn btn-primary', onclick: () => onNavigate(ROUTES.login) }, 'Login'),
      )
    ),
    bannerImage ? el('div', { class: 'banner', style: { backgroundImage: `linear-gradient(90deg, rgba(8,15,27,.88), rgba(8,15,27,.5)), url(${bannerImage})` } },
      el('div', { class: 'banner-copy' },
        el('div', { class: 'eyebrow' }, 'Database-first runtime'),
        el('h1', {}, 'Single source of truth, no client-side pricing.'),
        el('p', {}, 'All prices, tiers, inventory and workflow states are read from the database contract.')
      )
    ) : null,
    el('div', { class: 'page-frame' },
      el('aside', { class: 'sidebar' },
        el('nav', { class: 'navlist' }, ...nav.map(([href, label]) => el('a', { href: `#${href}`, class: route === href ? 'navlink active' : 'navlink', onclick: (e) => { e.preventDefault(); onNavigate(href); } }, label))),
        el('div', { class: 'card compact' },
          el('div', { class: 'muted' }, 'Session'),
          el('div', { class: 'value' }, session?.user?.user_type || 'guest'),
          el('div', { class: 'small' }, session?.expires_at ? `Expires ${dateTime(session.expires_at)}` : 'Not signed in'),
        ),
        el('div', { class: 'card compact' },
          el('div', { class: 'muted' }, 'Support WhatsApp'),
          el('div', { class: 'value' }, CONFIG.supportWhatsapp),
        ),
      ),
      el('main', { class: 'content' }, content)
    )
  );
}
