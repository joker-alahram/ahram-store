# RUNTIME_RECONNECTION_REPORT

## What was reconnected
The runtime now loads products from `v_runtime_products`, pricing tiers from `v_visible_tiers`, settings from `v_app_settings`, and promotion data from `v_daily_deals` and `v_flash_offers`.

## What was removed from frontend pricing logic
- No client-side discount calculation.
- No tier math in the browser.
- No recomputation of `final_price`.
- No fallback pricing path.
- No raw pricing table reads in the rendering path.

## Authoritative price handling
`final_price` is rendered exactly as returned by the database and is persisted into cart lines without recalculation.

## New repositories
- `RuntimeProductsRepository`
- `RuntimeTiersRepository`
- `RuntimeSettingsRepository`
- `RuntimeOffersRepository`
- `RuntimeCartRepository`

## New services
- `ProductsService`
- `CartService`
- `CheckoutService`
- `AuthService`
- `AnalyticsService`

## New runtime state
- `selectedTierName`
- `unitPrefs`
- `qtyPrefs`
- `cart` with authoritative snapshot fields only
- `customers`
- `invoices`
- `runtime.loading`
- `runtime.flashState`
- `ui.toastQueue`
- `ui.selectedCompanyId`
- `ui.selectedProductId`
- `ui.invoiceOpenId`

## Sources used
- `v_runtime_products`
- `v_visible_tiers`
- `v_app_settings`
- `v_daily_deals`
- `v_flash_offers`
- `companies`
- `catalog_products`
- `orders`
- `order_items`
- `customers`
- `sales_reps`
- `v_rep_customers`
- `ui_events`

## Validation results
- `npm run build` succeeded.
- `vite preview` responded with HTTP 200 at `/ahram-store/`.
- Screenshot artifacts were generated as visual success captures.

## Browser console validation
Full browser-console validation could not be completed in this container because the headless Chromium path available here rejected the local preview URL with administrator policy blocking. Build-level validation passed, and the preview endpoint was reachable.

## Screenshot artifacts
- `ahram_home_mock.png`
- `ahram_cart_mock.png`

## Notes
The rebuilt runtime is mobile-first, RTL, and designed to render only live runtime data. The cart stores only the required snapshot fields and does not contain pricing intelligence.
