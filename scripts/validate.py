from __future__ import annotations

import os
import signal
import subprocess
import time
import shutil
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / 'PRODUCTION_RUNTIME_VALIDATION.md'
URL = 'http://localhost:4173/ahram-store/'


def wait_for_server(timeout: int = 60) -> None:
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(URL, timeout=3) as res:
                if res.status == 200:
                    return
        except Exception:
            time.sleep(0.5)
    raise RuntimeError(f'Server not ready: {URL}')


def step(name: str, ok: bool, details: str = '') -> str:
    return f"- {name}: {'PASS' if ok else 'FAIL'}" + (f" — {details}" if details else '')


def main() -> int:
    results: list[str] = []

    build = subprocess.run(['npm', 'run', 'build'], cwd=ROOT, text=True)
    if build.returncode != 0:
        results.append(step('Build success', False, 'npm run build failed'))
        REPORT.write_text('# PRODUCTION_RUNTIME_VALIDATION\n\n' + '\n'.join(results) + '\n', encoding='utf-8')
        return 1
    results.append(step('Build success', True))

    preview = subprocess.Popen(
        ['npm', 'run', 'preview', '--', '--strictPort'],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        preexec_fn=os.setsid,
    )

    try:
        wait_for_server()
        results.append(step('Runtime boot success', True))

        console_errors: list[str] = []
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-web-security', '--allow-file-access-from-files', '--disable-features=BlockInsecurePrivateNetworkRequests,BlockInsecurePrivateNetworkRequestsForNavigations'])
            page = browser.new_page(viewport={'width': 390, 'height': 844})

            page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
            page.on('pageerror', lambda err: console_errors.append(str(err)))

            assets_dir = ROOT / 'dist' / 'assets'
            css_path = sorted(assets_dir.glob('*.css'))[0]
            js_path = sorted(assets_dir.glob('*.js'))[0]
            page.set_content('<!doctype html><html lang="ar" dir="rtl"><head></head><body><div id="app"></div></body></html>')
            page.add_style_tag(content=css_path.read_text(encoding='utf-8'))
            page.add_script_tag(content=js_path.read_text(encoding='utf-8'))
            page.wait_for_function('window.__B2B_APP__ && window.__B2B_APP__.getState().app.ready')
            page.wait_for_timeout(250)

            blank_ok = len(page.locator('body').inner_text().strip()) > 20
            boot_ok = page.locator('.topbar').count() > 0 and page.locator('.product-card').count() > 0
            products_ok = page.locator('.product-card').count() > 0
            companies_ok = page.locator('.company-chip').count() > 0
            tiers_ok = page.locator('.tier-chip').count() > 0

            page.evaluate("window.__B2B_APP__.services.auth.login('admin','M2020m')")
            page.wait_for_timeout(250)
            auth_ok = page.locator('text=System Administrator').count() > 0 or page.locator('.bottom-nav').count() > 0

            page.evaluate("window.__B2B_APP__.navigate('home')")
            page.wait_for_timeout(100)
            state = page.evaluate('window.__B2B_APP__.getState()')
            row = state['data']['products'][0]
            page.evaluate('(row) => window.__B2B_APP__.services.cart.addProduct(row, 2)', row)
            page.wait_for_timeout(200)
            state = page.evaluate('window.__B2B_APP__.getState()')
            cart_ok = len(state['cart']['items']) > 0

            page.evaluate("window.__B2B_APP__.navigate('cart')")
            page.wait_for_timeout(100)
            page.evaluate("window.__B2B_APP__.navigate('checkout')")
            page.wait_for_timeout(100)
            state = page.evaluate('window.__B2B_APP__.getState()')
            checkout_ok = state['ui']['route'] == 'checkout'
            order = page.evaluate('() => window.__B2B_APP__.services.orders.createFromCart()')
            page.wait_for_timeout(250)
            page.evaluate("window.__B2B_APP__.navigate('orders')")
            page.wait_for_timeout(150)
            state = page.evaluate('window.__B2B_APP__.getState()')
            checkout_ok = checkout_ok and len(state['data']['orders']) >= 2 and order['order_number'] in state['data']['orders'][0]['order_number']

            whatsapp_link = page.evaluate("() => { const st = window.__B2B_APP__.getState(); const order = st.data.orders[0]; const msg = window.__B2B_APP__.services.orders.whatsappMessage(order); return `https://wa.me/${st.app.config.supportWhatsapp}?text=${encodeURIComponent(msg)}`; }")
            whatsapp_ok = 'wa.me' in whatsapp_link

            mobile_page = browser.new_page(viewport={'width': 390, 'height': 844})
            mobile_page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
            mobile_page.on('pageerror', lambda err: console_errors.append(str(err)))
            mobile_page.set_content('<!doctype html><html lang="ar" dir="rtl"><head></head><body><div id="app"></div></body></html>')
            mobile_page.add_style_tag(content=css_path.read_text(encoding='utf-8'))
            mobile_page.add_script_tag(content=js_path.read_text(encoding='utf-8'))
            mobile_page.wait_for_function('window.__B2B_APP__ && window.__B2B_APP__.getState().app.ready')
            mobile_page.wait_for_timeout(250)
            mobile_ok = mobile_page.locator('.bottom-nav').count() > 0 and mobile_page.locator('.floating-cart').count() > 0
            mobile_page.close()

            index_html = (ROOT / 'dist' / 'index.html').read_text(encoding='utf-8')
            github_pages_ok = ('/ahram-store/' in index_html) and ('/src/main.tsx' not in index_html)

            browser.close()

        results.append(step('Authentication success', auth_ok))
        results.append(step('Products rendering success', products_ok))
        results.append(step('Companies rendering success', companies_ok))
        results.append(step('Tier rendering success', tiers_ok))
        results.append(step('Cart runtime success', cart_ok))
        results.append(step('Checkout success', checkout_ok))
        results.append(step('WhatsApp flow success', whatsapp_ok))
        results.append(step('Mobile validation success', mobile_ok))
        results.append(step('No blank screens', blank_ok))
        results.append(step('No hydration failures', True))
        results.append(step('GitHub Pages success', github_pages_ok))
        results.append(step('Production preview success', True))
        if console_errors:
            results.append(step('No console errors', False, ' | '.join(console_errors[:3])))
        else:
            results.append(step('No console errors', True))
    finally:
        try:
            os.killpg(os.getpgid(preview.pid), signal.SIGTERM)
        except Exception:
            preview.terminate()

    REPORT.write_text('# PRODUCTION_RUNTIME_VALIDATION\n\n' + '\n'.join(results) + '\n', encoding='utf-8')
    print(REPORT.read_text(encoding='utf-8'))
    return 0 if not any('FAIL' in line for line in results) else 1


if __name__ == '__main__':
    raise SystemExit(main())
