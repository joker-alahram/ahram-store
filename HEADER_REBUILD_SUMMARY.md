# Header rebuild summary

## Architecture
- Replaced the mobile header shell with a three-surface flow: branding banner, operational header bar, and a separate social actions row.
- Kept the operational bar strictly horizontal: menu, brand, search, cart, profile.
- Removed the profile dropdown path from the visible flow and replaced it with a centered account modal.

## Removed legacy constraints
- Removed the old header content stack from the page shell.
- Removed header-internal social actions.
- Removed header-internal flash/tier chips from the rebuilt mobile header path.
- Neutralized the user-menu dependency so the profile interaction no longer depends on a tiny popup.

## Search behavior
- Search now lives in the header as the primary CTA.
- It spans the widest available horizontal slot in the top row.
- The value is synchronized with application state and remains mobile-safe without clipping.

## Account modal
- Profile opens a centered operational modal.
- The modal exposes account data plus operational actions.
- For rep accounts, it surfaces customers, invoices, orders, tier status, and logout.

## Mobile viewport stability
- The banner uses a contained image surface with a bounded mobile height.
- The operational row uses row-only flex layout with `min-width: 0`.
- Social actions are isolated below the header bar in a dedicated horizontal row.
- Bottom navigation is untouched.
