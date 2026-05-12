import { bootstrapApp } from './src/runtime/bootstrap.js';

bootstrapApp();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
