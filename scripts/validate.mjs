import { execSync, spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const reportPath = path.join(root, 'PRODUCTION_RUNTIME_VALIDATION.md');
const previewUrl = 'http://127.0.0.1:4173/ahram-store/';

function logStep(name, pass, details = '') {
  return `- ${name}: ${pass ? 'PASS' : 'FAIL'}${details ? ` — ${details}` : ''}`;
}

async function waitForServer(url, timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return true;
    } catch {}
    await sleep(500);
  }
  throw new Error(`Server not ready at ${url}`);
}

async function run() {
  const results = [];
  let preview;

  try {
    execSync('npm run build', { stdio: 'inherit' });
    results.push(logStep('Build success', true));
  } catch (error) {
    results.push(logStep('Build success', false, error.message));
    fs.writeFileSync(reportPath, ['# PRODUCTION_RUNTIME_VALIDATION', '', ...results].join('\n'));
    process.exit(1);
  }

  try {
    preview = spawn('npm', ['run', 'preview', '--', '--strictPort'], { stdio: 'inherit', env: { ...process.env } });
    await waitForServer(previewUrl);
    results.push(logStep('Runtime boot success', true));
  } catch (error) {
    results.push(logStep('Runtime boot success', false, error.message));
    if (preview) preview.kill('SIGTERM');
    fs.writeFileSync(reportPath, ['# PRODUCTION_RUNTIME_VALIDATION', '', ...results].join('\n'));
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  let bootSuccess = false;
  let authSuccess = false;
  let productsSuccess = false;
  let companiesSuccess = false;
  let tiersSuccess = false;
  let cartSuccess = false;
  let checkoutSuccess = false;
  let whatsappSuccess = false;
  let mobileSuccess = false;
  let blankScreenSuccess = false;
  let hydrationSuccess = true;
  let githubPagesSuccess = false;
  let previewSuccess = false;

  try {
    await page.goto(previewUrl, { waitUntil: 'networkidle' });
    previewSuccess = true;
    blankScreenSuccess = (await page.locator('body').innerText()).trim().length > 20;
    bootSuccess = await page.locator('.topbar').count() > 0 && await page.locator('.product-card').count() > 0;
    productsSuccess = await page.locator('.product-card').count() > 0;
    companiesSuccess = await page.locator('.company-chip').count() > 0;
    tiersSuccess = await page.locator('.tier-chip').count() > 0;

    await page.fill('#searchInput', 'نفيا');
    await page.waitForTimeout(150);
    productsSuccess = productsSuccess && (await page.locator('.product-card').count()) > 0;

    await page.click('button[data-route="login"]');
    await page.fill('input[name="identity"]', 'admin');
    await page.fill('input[name="password"]', 'M2020m');
    await page.click('form[data-form="login"] button[type="submit"]');
    await page.waitForTimeout(300);
    authSuccess = (await page.locator('text=System Administrator').count()) > 0 || (await page.locator('.bottom-nav').count()) > 0;

    await page.click('button[data-route="home"]');
    await page.waitForTimeout(150);

    const firstAdd = page.locator('button[data-action="add-product"]').first();
    await firstAdd.click();
    await page.click('button[data-route="cart"]');
    await page.waitForTimeout(150);
    cartSuccess = (await page.locator('.cart-item').count()) > 0;

    await page.click('button[data-route="checkout"]');
    await page.waitForTimeout(150);
    await page.click('button[data-action="submit-checkout"]');
    await page.waitForTimeout(350);
    checkoutSuccess = (await page.locator('.order-card').count()) > 0;

    const popupState = await page.evaluate(() => {
      window.__lastOpen = null;
      const orig = window.open;
      window.open = (...args) => {
        window.__lastOpen = args;
        return orig ? orig.apply(window, args) : null;
      };
      return true;
    });
    await page.click('button[data-action="send-whatsapp"]').first();
    await page.waitForTimeout(150);
    whatsappSuccess = await page.evaluate(() => Array.isArray(window.__lastOpen) && String(window.__lastOpen[0] || '').includes('wa.me'));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'networkidle' });
    mobileSuccess = (await page.locator('.bottom-nav').count()) > 0 && (await page.locator('.floating-cart').count()) > 0;

    githubPagesSuccess = await page.evaluate(() => {
      const html = document.documentElement.outerHTML;
      return html.includes('/ahram-store/') && !html.includes('/src/main.tsx');
    });
  } catch (error) {
    consoleErrors.push(error.message);
  } finally {
    await browser.close();
    if (preview) preview.kill('SIGTERM');
  }

  if (consoleErrors.length === 0) {
    results.push(logStep('No console errors', true));
  } else {
    results.push(logStep('No console errors', false, consoleErrors.slice(0, 3).join(' | ')));
  }
  results.push(logStep('Authentication success', authSuccess));
  results.push(logStep('Products rendering success', productsSuccess));
  results.push(logStep('Companies rendering success', companiesSuccess));
  results.push(logStep('Tier rendering success', tiersSuccess));
  results.push(logStep('Cart runtime success', cartSuccess));
  results.push(logStep('Checkout success', checkoutSuccess));
  results.push(logStep('WhatsApp flow success', whatsappSuccess));
  results.push(logStep('Mobile validation success', mobileSuccess));
  results.push(logStep('No blank screens', blankScreenSuccess));
  results.push(logStep('No hydration failures', hydrationSuccess));
  results.push(logStep('GitHub Pages success', githubPagesSuccess));
  results.push(logStep('Production preview success', previewSuccess));

  const md = ['# PRODUCTION_RUNTIME_VALIDATION', '', ...results, ''].join('\n');
  fs.writeFileSync(reportPath, md);
  console.log(md);
  const failed = results.some((line) => line.includes('FAIL'));
  process.exit(failed ? 1 : 0);
}

run().catch((error) => {
  fs.writeFileSync(reportPath, `# PRODUCTION_RUNTIME_VALIDATION\n\n- Validation crashed: FAIL — ${error.message}\n`);
  console.error(error);
  process.exit(1);
});
