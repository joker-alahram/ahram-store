# Architecture Notes

This rebuild uses a bounded-render approach:
- shell renders once
- page renderer owns only its route subtree
- header/search/hero/footer have isolated renderers
- drawer/modals/toasts have dedicated overlays
- Supabase access is centralized in `services/apiClient.js`
- pricing resolves through `services/pricingService.js`
- checkout snapshots orders from current cart state

## Important constraints
- no reparenting of header controls into footer
- no global layout overrides in feature components
- no cache overwrite without fresh data merge
- no component may own `body`, `html`, or app shell selectors
