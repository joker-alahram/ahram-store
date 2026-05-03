/* app.bootstrap.js — runtime startup, dependency order, lifecycle */

async function startApplication() {
  initHeaderRuntime();
  initSearchRuntime();
  initHeroRuntime();
  initModalRuntime();
  initNavigationRuntime();

  await loadData();
  initCartRuntime();
  handleRoute();
}

function init() {
  startApplication().catch((error) => {
    console.error('startup.failed', error);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
