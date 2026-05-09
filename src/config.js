const env = typeof window !== 'undefined' ? window.__ENV__ || {} : {};

export const CONFIG = Object.freeze({
  appApiBaseUrl: env.APP_API_BASE_URL || 'https://upzuslyqfcvpbkqyzyxp.supabase.co/rest/v1',
  supabaseUrl: env.SUPABASE_URL || 'https://upzuslyqfcvpbkqyzyxp.supabase.co',
  supabaseAnonKey: env.SUPABASE_ANON_KEY || 'sb_publishable_vpqJxVuMbYbm0y3VvVhuJw_FBQkLvYg',
  supportWhatsapp: env.SUPPORT_WHATSAPP || (typeof localStorage !== 'undefined' ? localStorage.getItem('support_whatsapp') : null) || '201040880002',
  defaultCurrency: env.DEFAULT_CURRENCY || 'EGP',
  appName: 'Database-First Commerce Suite',
});

export const ROUTES = Object.freeze({
  login: '/login',
  home: '/',
  cart: '/cart',
  checkout: '/checkout',
  orders: '/orders',
  orderDetails: '/orders/:id',
  profile: '/profile',
  admin: '/admin',
  adminProducts: '/admin/products',
  adminPricing: '/admin/pricing',
  adminTiers: '/admin/tiers',
  adminCustomers: '/admin/customers',
  adminSalesReps: '/admin/sales-reps',
  adminOrders: '/admin/orders',
  adminOffers: '/admin/offers',
  adminSettings: '/admin/settings',
  adminHealth: '/admin/runtime-health',
  repDashboard: '/rep/dashboard',
  repCustomers: '/rep/customers',
  repCustomerNew: '/rep/customers/new',
  repOrders: '/rep/orders',
  repPerformance: '/rep/performance',
  myOrders: '/my-orders',
  myAccount: '/my-account',
});
