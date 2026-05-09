export function readConfig() {
  const runtime = window.__B2B_CONFIG__ || {};
  return {
    baseUrl: runtime.baseUrl || 'local://runtime',
    apiKey: runtime.apiKey || '',
    supportWhatsapp: runtime.supportWhatsapp || '201040880002',
    appName: runtime.appName || 'الأهرام B2B Commerce',
    basePath: runtime.basePath || '/ahram-store/',
    theme: runtime.theme || 'dark'
  };
}
