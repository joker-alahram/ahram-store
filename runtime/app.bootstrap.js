const RUNTIME_KEY = '__B2B_RUNTIME__';
const MODULE_FILES = [
  'runtime/helpers.runtime.js',
  'runtime/state.runtime.js',
  'runtime/runtime-registry.js',
  'runtime/render.runtime.js',
  'pricing/pricing.engine.js',
  'core/guards.js',
  'cart/cart.service.js',
  'cart.engine.js',
  'ui/pricing-box.js',
  'runtime/app.core.js',
  'runtime/header.runtime.js',
  'runtime/hero.runtime.js',
  'runtime/modal.runtime.js',
  'runtime/cart.runtime.js',
  'runtime/products.runtime.js',
  'runtime/companies.runtime.js',
  'runtime/tiers.runtime.js',
  'runtime/search.runtime.js',
  'runtime/navigation.runtime.js',
  'runtime/events.runtime.js',
  'runtime/utils.runtime.js',
  'runtime/render-orchestrator.runtime.js',
];

const bootState = window[RUNTIME_KEY] = window[RUNTIME_KEY] || {
  started: false,
  loaded: false,
  runtime: {},
};

function parseImports(source) {
  const imports = [];
  const importRE = /^\s*import\s+([\s\S]*?)\s+from\s+['\"]([^'\"]+)['\"];?\s*$/gm;
  let match;
  while ((match = importRE.exec(source))) {
    const spec = match[1].trim();
    const from = match[2].trim();
    const names = [];
    const star = spec.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/);
    if (star) {
      names.push(star[1]);
    } else {
      const named = spec.match(/^\{([\s\S]*)\}$/);
      if (named) {
        named[1].split(',').map((s) => s.trim()).filter(Boolean).forEach((part) => {
          const alias = part.split(/\s+as\s+/i).map((s) => s.trim());
          names.push(alias[1] || alias[0]);
        });
      } else {
        names.push(spec.replace(/^default\s*,\s*/, '').trim());
      }
    }
    imports.push({ from, names });
  }
  return imports;
}

function stripImportsAndExports(source) {
  let out = source
    .replace(/^\s*import\s+[\s\S]*?from\s+['\"][^'\"]+['\"];?\s*$/gm, '')
    .replace(/^\s*export\s+default\s+/gm, 'runtime.default = ')
    .replace(/^\s*export\s+(async\s+function\s+)/gm, '$1')
    .replace(/^\s*export\s+(function\s+)/gm, '$1')
    .replace(/^\s*export\s+(const\s+)/gm, '$1')
    .replace(/^\s*export\s+(let\s+)/gm, '$1')
    .replace(/^\s*export\s+(class\s+)/gm, '$1')
    .replace(/^\s*export\s*\{[\s\S]*?\};?\s*$/gm, '');
  return out;
}

function collectLocalNames(source) {
  const names = new Set();
  const declPatterns = [
    /^(?:\s*)(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm,
    /^(?:\s*)const\s+([A-Za-z_$][\w$]*)\s*=/gm,
    /^(?:\s*)let\s+([A-Za-z_$][\w$]*)\s*=/gm,
    /^(?:\s*)var\s+([A-Za-z_$][\w$]*)\s*=/gm,
    /^(?:\s*)class\s+([A-Za-z_$][\w$]*)\b/gm,
  ];
  for (const re of declPatterns) {
    let match;
    while ((match = re.exec(source))) names.add(match[1]);
  }
  return [...names];
}

function buildModuleFactory(source, filePath) {
  const imports = parseImports(source);
  const locals = collectLocalNames(source);
  const body = stripImportsAndExports(source);
  return new Function('runtime', `with (runtime) {\n${body}\n;${locals.map((name) => `if (typeof ${name} !== 'undefined') runtime[${JSON.stringify(name)}] = ${name};`).join('\n')}\n}`);
}

async function loadText(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load module: ${path}`);
  return response.text();
}

async function loadModule(path) {
  const source = await loadText(path);
  const factory = buildModuleFactory(source, path);
  factory(bootState.runtime);
}

function finalizeRuntime() {
  const runtime = bootState.runtime;
  if (runtime.state && !runtime.state.view) runtime.state.view = { type: 'home' };
  if (runtime.state && !runtime.state.productMap) runtime.state.productMap = new Map();
  if (typeof runtime.state?.cart !== 'undefined' && !Array.isArray(runtime.state.cart)) runtime.state.cart = [];
  runtime.startApplication = startApplication;
  window.startApplication = startApplication;
}

async function startApplication() {
  if (bootState.started) return;
  bootState.started = true;

  for (const path of MODULE_FILES) {
    await loadModule(path);
  }

  finalizeRuntime();
  const runtime = bootState.runtime;

  const initOrder = [
    'initHeaderRuntime',
    'initHeroRuntime',
    'initModalRuntime',
    'initCartRuntime',
    'initSearchRuntime',
    'initNavigationRuntime',
  ];

  for (const name of initOrder) {
    if (typeof runtime[name] === 'function') {
      try { runtime[name](); } catch (error) { console.warn(`${name}.failed`, error); }
    }
  }

  if (typeof runtime.loadData === 'function') {
    await runtime.loadData();
  }

  if (typeof runtime.handleRoute === 'function') {
    await runtime.handleRoute();
  } else if (typeof runtime.renderApp === 'function') {
    runtime.renderApp();
  }
}

const boot = () => {
  if (bootState.loaded) return;
  bootState.loaded = true;
  startApplication().catch((error) => {
    console.error('startup.failed', error);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
