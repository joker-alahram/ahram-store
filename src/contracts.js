export const ROLES = Object.freeze(['admin', 'sales_rep', 'customer']);

export const READ_VIEWS = Object.freeze([
  'v_app_settings',
  'v_auth_users',
  'v_visible_tiers',
  'v_runtime_products',
  'v_runtime_commerce_health',
  'products_with_category',
  'v_rep_customers',
  'v_orders_status',
  'v_rep_sales',
]);

export const WRITE_TABLES = Object.freeze([
  'customers',
  'sales_reps',
  'orders',
  'order_items',
  'customer_assignments',
  'admins',
  'companies',
  'categories',
  'products',
  'product_units',
  'pricing_product_prices',
  'tiers',
  'tier_company_discounts',
  'daily_deals',
  'flash_offers',
]);

export const ORDER_STATES = Object.freeze(['draft', 'submitted', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);
export const PAYMENT_STATES = Object.freeze(['unpaid', 'partially_paid', 'paid', 'refunded', 'cancelled']);

export const ERROR_CODES = Object.freeze({
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_BLOCKED_USER: 'AUTH_BLOCKED_USER',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  PRODUCT_NOT_SELLABLE: 'PRODUCT_NOT_SELLABLE',
  INVENTORY_INSUFFICIENT: 'INVENTORY_INSUFFICIENT',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_ALREADY_FINALIZED: 'ORDER_ALREADY_FINALIZED',
  CONCURRENCY_CONFLICT: 'CONCURRENCY_CONFLICT',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
});

export const DEMO = Object.freeze({
  users: [
    { id: '7a4d08f7-ea7d-4cca-9222-ca8dcbd8df58', user_type: 'admin', name: 'System Administrator', phone: 'admin', username: 'admin', login_code: 'admin', password: 'M2020m', default_tier_name: 'base', is_active: true, is_blocked: false },
    { id: '00e37d53-bcf9-437c-9911-869fbe8d4b55', user_type: 'sales_rep', name: 'شريف جمال', phone: '01120000005', username: '01120000005', login_code: '01120000005', password: '123456', default_tier_name: 'base', is_active: true, is_blocked: false },
    { id: 'b7340efa-4eff-4d68-9b13-a912b66e062b', user_type: 'sales_rep', name: 'خالد محمود', phone: '01120000001', username: '01120000001', login_code: '01120000001', password: '123456', default_tier_name: 'base', is_active: true, is_blocked: false },
    { id: 'c58ab123-3119-481b-8655-885b2f998d18', user_type: 'customer', name: 'محمد عبد الستار', phone: '01066197015', username: '01066197015', login_code: '01066197015', password: '123456', default_tier_name: 'base', is_active: true, is_blocked: false },
  ],
  tiers: [
    { tier_name: 'base', display_name: 'بدون خصم', min_order: 0, is_default: true },
    { tier_name: 'half_million', display_name: 'الفضيه', min_order: 500000, is_default: false },
    { tier_name: 'million', display_name: 'الذهبية', min_order: 1000000, is_default: false },
    { tier_name: 'vip gold', display_name: 'الماسية', min_order: 3000000, is_default: false },
  ],
  settings: [
    { settings: { banner_image: 'https://i.ibb.co/wNgLFs79/1776141908429.png', 'tier_scope:half_million': '{"carton":true,"pack":false}', 'tier_scope:million': '{"carton":true,"pack":false}', 'tier_scope:vip gold': '{"carton":true,"pack":false}', enable_pack_tier_discount: 'false' } },
  ],
  products: [
    { product_id: '1549', product_name: 'نفيا لابلو ( 24ق)', unit_code: 'carton', tier_name: 'base', final_price: 1872.0, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, company_name: 'نيفيا', category_name: 'عناية شخصية' },
    { product_id: '1540', product_name: 'نفيا كريم سوفت عادي 50مل 30% (60ق)', unit_code: 'carton', tier_name: 'base', final_price: 1530.0, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, company_name: 'نيفيا', category_name: 'عناية شخصية' },
    { product_id: '1517', product_name: 'هير كود جل برطمان 275مل موف (48ق)', unit_code: 'carton', tier_name: 'base', final_price: 2070.0, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, company_name: 'هير كود', category_name: 'العناية بالشعر' },
    { product_id: '1307', product_name: 'كلير شامبو اكياس رجالي 5مل حماية من التساقط (240ق)', unit_code: 'carton', tier_name: 'base', final_price: 320.0, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, company_name: 'كلير', category_name: 'العناية بالشعر' },
    { product_id: '615', product_name: 'دوف مزيل رول اون الاصلى50ملى(12ق)', unit_code: 'carton', tier_name: 'base', final_price: 750.0, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, company_name: 'دوف', category_name: 'عناية شخصية' },
    { product_id: '1474', product_name: 'وينديكس منظف زجاج 500مل غيار ازرق (12ق)', unit_code: 'carton', tier_name: 'base', final_price: 495.0, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, company_name: 'وينديكس', category_name: 'منظفات' },
  ],
  customers: [
    { id: 'bea0b7ec-60db-41bb-820a-cb0d8ea03f02', name: 'أسامة محمد', phone: '01041154144', username: '01041154144', customer_type: 'rep_customer', sales_rep_id: '00e37d53-bcf9-437c-9911-869fbe8d4b55', is_active: true, is_blocked: false },
    { id: 'f3342965-02a9-4a07-ac71-6857e847aae9', name: 'شركة النور للتجارة', phone: '01110000001', username: '01110000001', customer_type: 'direct', sales_rep_id: null, is_active: true, is_blocked: false },
  ],
  orders: [
    { id: 'e1ea48e1-0c9c-4fc8-a445-1f6bb2f201ed', order_number: '20180', customer_id: '305dcb30-7ed6-495e-a9e1-7968354191fd', sales_rep_id: 'b7340efa-4eff-4d68-9b13-a912b66e062b', status: 'paid', payment_status: 'paid', currency: 'EGP', subtotal: 1714.0, discount_total: 0, grand_total: 1714.0, tier_name: 'base', inventory_status: 'not_reserved', workflow_status: 'قيد التنفيذ', items: [] },
  ],
});
