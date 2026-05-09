import { el } from '../utils/dom.js';

export function profileScreen({ session }) {
  const user = session?.user || session?.data?.user || null;
  return el('section', { class: 'panel' },
    el('div', { class: 'card' },
      el('h2', {}, 'Profile'),
      user ? el('div', { class: 'profile-grid' },
        el('div', {}, 'Name', el('strong', {}, user.name || '—')),
        el('div', {}, 'Role', el('strong', {}, user.user_type || '—')),
        el('div', {}, 'Username', el('strong', {}, user.username || '—')),
        el('div', {}, 'Phone', el('strong', {}, user.phone || '—')),
      ) : el('p', {}, 'Not signed in.'),
    )
  );
}
