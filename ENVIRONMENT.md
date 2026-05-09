# Environment Setup

## Optional runtime config
Set `window.__B2B_CONFIG__` before `app.js` loads if you need to override defaults:

```html
<script>
  window.__B2B_CONFIG__ = {
    baseUrl: 'https://upzuslyqfcvpbkqyzyxp.supabase.co/rest/v1',
    apiKey: 'YOUR_SUPABASE_PUBLISHABLE_KEY',
    supportWhatsapp: '201040880002'
  };
</script>
```

## Default behavior
- Uses the provided Supabase REST endpoint by default.
- Falls back to bundled demo data when remote requests fail.
- Persists session, cart, tier, customer selection, and UI preferences in `localStorage`.

## Run
Open `index.html` directly or serve the folder from any static server.
