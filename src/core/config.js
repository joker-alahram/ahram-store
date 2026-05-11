const DEFAULT_CONFIG = {
  baseUrl: 'https://upzuslyqfcvpbkqyzyxp.supabase.co/rest/v1',
  apiKey: 'sb_publishable_vpqJxVuMbYbm0y3VvVhuJw_FBQkLvYg',
  supportWhatsapp: '201040880002',
  theme: 'premium-dark',
  appName: 'متجر الأهرام للتجارة والتوزيع',
  storageVersion: '1',
};

export function readConfig() {
  const runtime = window.__B2B_CONFIG__ || {};
  const supportWhatsapp = localStorage.getItem('support_whatsapp') || runtime.supportWhatsapp || DEFAULT_CONFIG.supportWhatsapp;

  return {
    ...DEFAULT_CONFIG,
    ...runtime,
    supportWhatsapp,
  };
}

export function isProdLike() {
  return location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}
