import { startApplication } from './app.core.js';

const boot = () => {
  startApplication().catch((error) => {
    console.error('startup.failed', error);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
