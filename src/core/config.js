const DEFAULT_CONFIG = {
  baseUrl: 'https://upzuslyqfcvpbkqyzyxp.supabase.co/rest/v1',
  apiKey: 'sb_publishable_vpqJxVuMbYbm0y3VvVhuJw_FBQkLvYg',
  supportWhatsapp: '201040880002',
  theme: 'premium-dark',
  appName: 'متجر الأهرام للتجارة والتوزيع',
  storageVersion: '1',
};

function readGlobalConfig() {
  if (typeof window === 'undefined') return {};
  return window.__B2B_CONFIG__ || {};
}

function readStoredSupportWhatsapp() {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem('support_whatsapp');
  } catch {
    return null;
  }
}

export function readConfig() {
  const runtime = readGlobalConfig();
  const supportWhatsapp = readStoredSupportWhatsapp() || runtime.supportWhatsapp || DEFAULT_CONFIG.supportWhatsapp;

  return {
    ...DEFAULT_CONFIG,
    ...runtime,
    supportWhatsapp,
  };
}

export function isProdLike() {
  if (typeof location === 'undefined') return false;
  return location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}
