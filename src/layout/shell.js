export function shellTemplate() {
  return `
    <div class="app-shell">
      <header class="app-header" id="appHeader"></header>
      <section class="app-banner" id="appBanner"></section>
      <section class="app-hero" id="appHero"></section>
      <section class="app-search" id="appSearch"></section>
      <main class="app-main" id="appPage" role="main"></main>
      <footer class="app-footer" id="appFooter"></footer>
      <div class="app-overlays">
        <div id="appDrawerHost"></div>
        <div id="appModalHost"></div>
        <div id="appToastHost" aria-live="polite" aria-atomic="true"></div>
      </div>
    </div>
  `;
}
