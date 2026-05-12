# POST-STABILIZATION DEFECT LIST — ROUND 2

## P0 — Critical
- Company list shows only 8 companies while 28 are valid.
- `localStorage` quota exceeded by `alahram_v1:companyRowsCache`.
- Flash offer in cart fails checkout; `order_items` insert returns 409 conflict.
- Flash offer countdown must use Cairo authority consistently.

## P1 — Runtime / UX
- Flash offer design must follow the provided hero-timer reference.
- Product cards hydrate too slowly.
- Company page hydration should be incremental and not block the page.
- Missing homepage commerce sections such as most requested / trending.

## P2 — PWA
- PWA install prompt should be available across browsers where supported.
- iPhone support must remain branded and fullscreen via standalone mode.
- App should open professionally after install.

## P3 — Interaction Layer
- Add tactile feedback and motion discipline.
- Keep transitions smooth and lightweight.

## Notes
- Do not reintroduce hardcoded company limits.
- Do not persist huge catalog rows in localStorage.
- Flash offers must be normalized into the canonical order pipeline.
