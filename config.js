export const CONFIG = Object.freeze({
  baseUrl: 'https://upzuslyqfcvpbkqyzyxp.supabase.co/rest/v1',
  apiKey: 'sb_publishable_vpqJxVuMbYbm0y3VvVhuJw_FBQkLvYg',
  supportWhatsapp: typeof localStorage !== 'undefined'
    ? (localStorage.getItem('support_whatsapp') || '201040880002')
    : '201040880002',
  cacheTtlMs: 5 * 60 * 1000,
});

export const STORAGE_KEYS = Object.freeze({
  session: 'b2b_session',
  cart: 'b2b_cart',
  tier: 'selected_tier',
  unitPrefs: 'b2b_unit_prefs',
  productQtyPrefs: 'b2b_product_qty_prefs',
  behavior: 'b2b_ui_behavior',
  dataCache: 'b2b_data_cache',
  pricingCache: 'b2b_pricing_cache',
  selectedCustomer: 'b2b_selected_customer',
  invoiceCounter: 'b2b_invoice_counter',
});
