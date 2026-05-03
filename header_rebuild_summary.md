# Header Rebuild Summary

## Header architecture
- Replaced the old mobile header layout with a three-surface structure: branding banner, operational header bar, and a separate social actions row.
- Kept the header bar strictly horizontal: menu, brand, search, cart, profile.
- Removed the flash CTA from the header so the hero surface remains the only place that carries flash urgency.

## Removed legacy constraints
- Eliminated the old multi-row commerce header composition from the visible markup.
- Removed vertical social layout from the search area and moved it into its own row.
- Removed the old banner-as-overlay behavior from the header slot and switched to a branding-only surface.
- Avoided new nested wrappers for the header bar; the layout now relies on one row per surface.

## Search behavior
- The search field remains the primary horizontal CTA inside the header bar.
- Search input is now isolated from social actions and render state.
- The search slot is width-flexed and constrained to a single readable row on mobile.

## Account modal
- The profile button continues to open the centered account modal.
- Account access remains modal-based rather than a drawer or tiny popup.
- The modal content still exposes account data, invoices, customers, and login/logout actions.

## Mobile viewport stability
- The banner is full width and uses a bounded mobile-safe height.
- The header bar and social row are row-based and avoid column stacking.
- The social row uses compact text actions only, which prevents vertical icon stacks and viewport clipping.
