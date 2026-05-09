import { dom } from '../core/dom.js';

export function toastStack(queue = []) {
  return queue.map((item) => `
    <article class="toast-item toast-item--${dom.escape(item.type || 'info')}">
      <div class="toast-item__mark" aria-hidden="true">${dom.escape(item.icon || '•')}</div>
      <div class="toast-item__body">
        ${item.title ? `<h4>${dom.escape(item.title)}</h4>` : ''}
        ${item.message ? `<p>${dom.escape(item.message)}</p>` : ''}
      </div>
      ${item.action ? `<button class="btn btn--ghost toast-item__action" type="button" data-action="toast-action">${dom.escape(item.action.label)}</button>` : ''}
    </article>
  `).join('');
}

export function modalFrame(title, body, actions = '') {
  return `
    <section class="modal-frame">
      <header class="modal-frame__head">
        <h3>${dom.escape(title)}</h3>
        <button class="icon-btn" type="button" data-action="close-modal">×</button>
      </header>
      <div class="modal-frame__body">${body}</div>
      ${actions ? `<footer class="modal-frame__foot">${actions}</footer>` : ''}
    </section>
  `;
}
