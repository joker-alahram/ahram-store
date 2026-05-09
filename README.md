# ALAHRAM Commerce Platform Rebuild

This package is a database-first frontend runtime aligned to the current production contracts.

## Source of truth
- Auth: `v_auth_users`
- Settings: `v_app_settings`
- Tiers: `v_visible_tiers`
- Runtime products: `v_runtime_products`
- Company/category enrichment: `products_with_category`
- Order read model: `v_orders_status`
- Rep customers: `v_rep_customers`
- Rep analytics: `v_rep_sales`
- Runtime health: `v_runtime_commerce_health`
- Offers: `daily_deals`, `flash_offers`

## Key runtime rules
- Final price is read from `v_runtime_products.final_price`.
- No frontend discount calculation is performed.
- Session restore uses the auth view and sliding expiration.
- Orders are created from persisted snapshots only.
- Products without stock visibility are hidden.
- Companies with no visible products are not shown.

## Run
Open `index.html` in a browser or serve the folder with any static server.

## Included routes
- `/`
- `/companies`
- `/company/:companyId`
- `/offers`
- `/tiers`
- `/cart`
- `/checkout`
- `/login`
- `/register`
- `/customers`
- `/invoices`
- `/account`
- `/admin`
- `/rep/dashboard`
- `/rep/customers`
- `/rep/performance`
- `/rep/orders`
- `/my-orders`

## Notes
- The package keeps the existing UI shell and replaces the data/auth/runtime contracts only.
- `.env.example` is provided for deployment overrides.
