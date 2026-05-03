import { startApplication } from './app.core.js';

let booted = false;

const boot = () => {
  if (booted) return;
  booted = true;
  startApplication().catch((error) => {
    console.error('startup.failed', error);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
