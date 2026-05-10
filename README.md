# ALAHRAM Commerce Platform Rebuild

Vanilla JS mobile-first rebuild of the B2B commerce runtime.

## Run
Open `index.html` in a browser or serve the folder with a static HTTP server.

## Architecture
- `core`: config, router, storage, DOM helpers, events
- `state`: store, default state, selectors
- `services`: Supabase API, catalog, pricing, auth, cart, orders, invoices, customers, offers, analytics
- `layout`: shell, header, search, hero, footer, overlays
- `pages`: home, companies, company products, offers, tiers, cart, checkout, login, register, customers, invoices, account
- `styles`: tokens, base, layout, components, utilities, theme

## Notes
- The frontend uses the existing Supabase REST contracts.
- Live auth currently follows the existing tables contract for compatibility with the current system.
- `localStorage` is used only as hydration/cache/persistence support.
