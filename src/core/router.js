export function parseRoute(hash = window.location.hash) {
  const clean = hash.replace(/^#/, '');
  const [path = 'home', query = ''] = clean.split('?');
  const params = new URLSearchParams(query);
  return { path: path || 'home', params };
}

export function navigate(path, params = {}) {
  const query = new URLSearchParams(params).toString();
  window.location.hash = `#${path}${query ? `?${query}` : ''}`;
}
