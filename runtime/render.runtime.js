const EMPTY_FRAGMENT = document.createDocumentFragment();

function toFragment(nodeOrHtml) {
  if (nodeOrHtml instanceof Node) {
    const fragment = document.createDocumentFragment();
    fragment.appendChild(nodeOrHtml);
    return fragment;
  }

  const html = String(nodeOrHtml ?? '');
  if (!html.trim()) return EMPTY_FRAGMENT.cloneNode();

  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

export function replaceSurface(surface, nodeOrHtml) {
  const target = surface instanceof Element ? surface : document.getElementById(String(surface || ''));
  if (!target) return null;
  const fragment = toFragment(nodeOrHtml);
  target.replaceChildren(fragment);
  return target;
}

export function renderSurface(name, data) {
  return replaceSurface(name, data);
}

export function renderApp(state) {
  return state;
}
