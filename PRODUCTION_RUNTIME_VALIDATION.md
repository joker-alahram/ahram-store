# Production Runtime Validation

## Build
- `npm install` ✅
- `npm run build` ✅

## Preview
- `npm run preview -- --host 0.0.0.0 --port 4176` ✅
- Root preview URL: `http://172.26.36.27:4176/ahram-store/` ✅
- Asset URLs under `/ahram-store/assets/` return HTTP 200 ✅

## Deployment contract
- `vite.config.ts` base path set to `/ahram-store/` ✅
- `dist/index.html` references bundled assets only; no `/src/main.tsx` reference remains ✅
- `HashRouter` used for route stability on GitHub Pages ✅

## Runtime checks
- Dist HTML loads successfully over preview HTTP ✅
- Bundled JS/CSS assets load successfully over preview HTTP ✅
- No source-runtime reference found in built output ✅

## Notes
- Browser screenshot capture could not be produced in this container because Chromium blocks local/private/data origins in this environment.
- The production package itself is deployable as-is: publish the root of this zip contents to GitHub Pages (or its extracted folder).
