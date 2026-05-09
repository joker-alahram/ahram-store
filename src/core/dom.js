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
  escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};
