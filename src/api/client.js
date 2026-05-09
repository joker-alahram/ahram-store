import { CONFIG } from '../config.js';
import { ERROR_CODES } from '../contracts.js';

class ApiError extends Error {
  constructor(code, message, details = []) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, headers = {}, auth = true } = {}) {
  const url = `${CONFIG.appApiBaseUrl.replace(/\/$/, '')}${path}`;
  const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };
  if (auth && localStorage.getItem('access_token')) {
    opts.headers.Authorization = `Bearer ${localStorage.getItem('access_token')}`;
  }
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const payload = data && data.error ? data.error : null;
    throw new ApiError(payload?.code || ERROR_CODES.INTERNAL_ERROR, payload?.message || `Request failed: ${res.status}`, payload?.details || []);
  }
  return data;
}

export const api = { request };
export { ApiError };
