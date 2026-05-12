import { bootstrapApp } from './src/runtime/bootstrap.js';

window.__alahramInstallPrompt = null;
window.__alahramIsIosSafari = /iP(hone|od|ad)/.test(navigator.platform) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  window.__alahramInstallPrompt = event;
});
window.addEventListener('appinstalled', () => {
  window.__alahramInstallPrompt = null;
});

bootstrapApp();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
