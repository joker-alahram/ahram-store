export const dom = {
  q(selector, root = document) {
    return root.querySelector(selector);
  },
  qa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  },
  html(el, value) {
    if (el) el.innerHTML = value;
  },
  text(el, value) {
    if (el) el.textContent = value;
  },
  show(el, visible = true) {
    if (!el) return;
    el.classList.toggle('is-hidden', !visible);
    el.setAttribute('aria-hidden', String(!visible));
  },
  escape(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  },
  clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  },
};
