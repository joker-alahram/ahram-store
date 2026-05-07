import { readConfig } from '../core/config.js';

function buildUrl(baseUrl, path, params = {}) {
  const url = new URL(`${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`);
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  return url;
}

export function createApiClient(customConfig = {}) {
  const config = { ...readConfig(), ...customConfig };

  async function request(method, path, params = {}, body = undefined) {
    const url = buildUrl(config.baseUrl, path, params);
    const response = await fetch(url.toString(), {
      method,
      headers: {
        apikey: config.apiKey,
        Authorization: `Bearer ${config.apiKey}`,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json', Prefer: 'return=representation' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      const error = new Error(`${method} ${path} failed (${response.status})`);
      error.status = response.status;
      error.details = text;
      throw error;
    }

    const text = await response.text();
    if (!text) return [];
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return {
    get: (path, params) => request('GET', path, params),
    post: (path, body, params) => request('POST', path, params, body),
    patch: (path, body, params) => request('PATCH', path, params, body),
    del: (path, params) => request('DELETE', path, params),
    config,
  };
}
