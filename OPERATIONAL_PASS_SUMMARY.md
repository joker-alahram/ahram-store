# Operational UX Correction Pass Summary

## Button audit
- `الأقسام` in bottom navigation and drawer was converted to `الشرائح` and now routes to `#tiers`.
- `حسابي` now opens the center account modal directly instead of a dropdown-style user menu.
- `افتح عرض الساعة` now navigates to `#flash` and focuses the Flash Offers section.
- Cart access remains on `السلة` and now uses a clearer cart icon.

## Navigation correction
- Bottom navigation now contains only: الرئيسية، الشرائح، العروض، السلة، حسابي.
- Tier selection returns the user to home and scrolls directly to the companies shelf.
- Account navigation is modal-based and does not depend on a side sheet.

## Flash hero rebuild
- Flash hero now emphasizes live status, countdown, discount, and remaining offers.
- CTA opens the Flash Offers section directly.

## Account modal
- The account modal now shows account status, tier state, cart state, and order count.
- It includes direct actions for review, login, and logout.

## WhatsApp routing
- Rep orders route to `01552670465`.
- Direct customer orders route to `01040880002`.

## Mobile UX stabilization
- Company banner renders first at the top as a full-width surface.
- Search sits below the operational header, with social icons last.
- Product, deal, company, modal, and banner images use safer fit rules.
