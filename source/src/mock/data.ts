import type {
  AppSettings,
  Customer,
  Offer,
  Order,
  Product,
  RuntimeHealth,
  SalesRep,
  Tier,
} from '@/contracts/types';

export const appSettings: AppSettings = {
  banner_image: 'https://i.ibb.co/wNgLFs79/1776141908429.png',
  enable_pack_tier_discount: false,
  tier_scope: {
    base: { carton: true, pack: true },
    half_million: { carton: true, pack: false },
    million: { carton: true, pack: false },
    'vip gold': { carton: true, pack: false },
  },
  currency: 'EGP',
  support_whatsapp: '+201100000000',
};

export const tiers: Tier[] = [
  { id: 't-base', tier_name: 'base', display_name: 'بدون خصم', min_order: 0, is_default: true },
  { id: 't-half', tier_name: 'half_million', display_name: 'الفضيه', min_order: 500000, is_default: false },
  { id: 't-million', tier_name: 'million', display_name: 'الذهبية', min_order: 1000000, is_default: false },
  { id: 't-vip', tier_name: 'vip gold', display_name: 'الماسية', min_order: 3000000, is_default: false },
];

const company = [
  { id: 'c1', name: 'Nivea', logo_url: 'https://placehold.co/128x128/png?text=N', is_active: true },
  { id: 'c2', name: 'Trizeme', logo_url: 'https://placehold.co/128x128/png?text=T', is_active: true },
  { id: 'c3', name: 'Senior', logo_url: 'https://placehold.co/128x128/png?text=S', is_active: true },
  { id: 'c4', name: 'BOMBASTIC', logo_url: 'https://placehold.co/128x128/png?text=B', is_active: true },
];

export const products: Product[] = [
  {
    id: 'p1',
    product_id: '1549',
    product_name: 'نفيا لابلو (24ق)',
    company_id: 'c1',
    company_name: 'Nivea',
    category_id: 'cat1',
    category_name: 'Lip Care',
    image_url: 'https://placehold.co/600x400/png?text=Product+1549',
    badges: ['runtime healthy'],
    units: [
      { unit_code: 'carton', tier_name: 'base', final_price: 1872, available_qty: 1000, reserved_qty: 0, allow_backorder: false, runtime_healthy: true, minimum_sell_qty: 1, is_sellable: true },
      { unit_code: 'pack', tier_name: 'base', final_price: 96, available_qty: 1000, reserved_qty: 0, allow_backorder: false, runtime_healthy: true, minimum_sell_qty: 1, is_sellable: true },
    ],
  },
  {
    id: 'p2',
    product_id: '709',
    product_name: 'دوف شامبو 180مل ضد تساقط الشعر (24ق)',
    company_id: 'c2',
    company_name: 'Trizeme',
    category_id: 'cat2',
    category_name: 'Hair Care',
    image_url: 'https://placehold.co/600x400/png?text=Product+709',
    badges: ['offer-ready'],
    units: [
      { unit_code: 'carton', tier_name: 'base', final_price: 1220, available_qty: 1000, reserved_qty: 0, allow_backorder: false, runtime_healthy: true, minimum_sell_qty: 1, is_sellable: true },
    ],
  },
  {
    id: 'p3',
    product_id: '1178',
    product_name: 'سنيور هاند ووش (اخضر) 500جم (12ق)',
    company_id: 'c3',
    company_name: 'Senior',
    category_id: 'cat3',
    category_name: 'Home Care',
    image_url: 'https://placehold.co/600x400/png?text=Product+1178',
    badges: ['fast-moving'],
    units: [
      { unit_code: 'carton', tier_name: 'base', final_price: 514, available_qty: 1000, reserved_qty: 0, allow_backorder: false, runtime_healthy: true, minimum_sell_qty: 1, is_sellable: true },
    ],
  },
  {
    id: 'p4',
    product_id: '1381',
    product_name: 'بومباستيك هير جل نايت 360مل (36ق)',
    company_id: 'c4',
    company_name: 'BOMBASTIC',
    category_id: 'cat2',
    category_name: 'Hair Care',
    image_url: 'https://placehold.co/600x400/png?text=Product+1381',
    badges: ['flash-ready'],
    units: [
      { unit_code: 'carton', tier_name: 'base', final_price: 1760, available_qty: 1000, reserved_qty: 0, allow_backorder: false, runtime_healthy: true, minimum_sell_qty: 1, is_sellable: true },
    ],
  },
  {
    id: 'p5',
    product_id: '1487',
    product_name: 'ريد جهاز بدون رائحة (12ق)',
    company_id: 'c3',
    company_name: 'Senior',
    category_id: 'cat3',
    category_name: 'Home Care',
    image_url: 'https://placehold.co/600x400/png?text=Product+1487',
    badges: ['inventory stable'],
    units: [
      { unit_code: 'carton', tier_name: 'base', final_price: 1550, available_qty: 1000, reserved_qty: 0, allow_backorder: false, runtime_healthy: true, minimum_sell_qty: 1, is_sellable: true },
    ],
  },
  {
    id: 'p6',
    product_id: '1274',
    product_name: 'تمارا كريم بشرة كولد برائحة الياسمين 100جم (24ق)',
    company_id: 'c2',
    company_name: 'Trizeme',
    category_id: 'cat4',
    category_name: 'Skin Care',
    image_url: 'https://placehold.co/600x400/png?text=Product+1274',
    badges: ['tier aligned'],
    units: [
      { unit_code: 'carton', tier_name: 'base', final_price: 381, available_qty: 1000, reserved_qty: 0, allow_backorder: false, runtime_healthy: true, minimum_sell_qty: 1, is_sellable: true },
    ],
  },
  {
    id: 'p7',
    product_id: '1505',
    product_name: 'فيانسية بخاخ صبار وعسل 240مل (60ق)',
    company_id: 'c1',
    company_name: 'Nivea',
    category_id: 'cat2',
    category_name: 'Hair Care',
    image_url: 'https://placehold.co/600x400/png?text=Product+1505',
    badges: ['new'],
    units: [
      { unit_code: 'carton', tier_name: 'base', final_price: 2649, available_qty: 1000, reserved_qty: 0, allow_backorder: false, runtime_healthy: true, minimum_sell_qty: 1, is_sellable: true },
    ],
  },
  {
    id: 'p8',
    product_id: '1496',
    product_name: 'كريست معجون اسنان 3*1 ابيض (12ق)',
    company_id: 'c3',
    company_name: 'Senior',
    category_id: 'cat5',
    category_name: 'Oral Care',
    image_url: 'https://placehold.co/600x400/png?text=Product+1496',
    badges: ['core'],
    units: [
      { unit_code: 'carton', tier_name: 'base', final_price: 840, available_qty: 1000, reserved_qty: 0, allow_backorder: false, runtime_healthy: true, minimum_sell_qty: 1, is_sellable: true },
    ],
  },
];

export const offers: Offer[] = [
  {
    id: 'o1',
    type: 'daily_deal',
    title: 'عرض يومي - دوف شامبو',
    description: 'سعر مستقل لا يدخل في tier logic',
    price: 1160,
    product_id: 'p2',
    valid_from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    valid_to: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    inventory_qty: 200,
    is_active: true,
  },
  {
    id: 'o2',
    type: 'flash_offer',
    title: 'Flash - بومباستيك هير جل',
    description: 'عد تنازلي مستقل',
    price: 1490,
    product_id: 'p4',
    valid_from: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    valid_to: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    inventory_qty: 50,
    is_active: true,
  },
];

export const salesReps: SalesRep[] = [
  { id: 'r1', user_type: 'sales_rep', name: 'أحمد السيد', phone: '01120000003', username: '01120000003', login_code: '01120000003', is_active: true, is_blocked: false },
  { id: 'r2', user_type: 'sales_rep', name: 'إبراهيم عادل', phone: '01120000008', username: '01120000008', login_code: '01120000008', is_active: true, is_blocked: false },
  { id: 'r3', user_type: 'sales_rep', name: 'مصطفى زكي', phone: '01120000009', username: '01120000009', login_code: '01120000009', is_active: true, is_blocked: false },
];

export const customers: Customer[] = [
  { id: 'u1', user_type: 'customer', name: 'محمد عبد الستار', phone: '01066197015', username: '01066197015', customer_type: 'direct', sales_rep_id: null, is_active: true, is_blocked: false },
  { id: 'u2', user_type: 'customer', name: 'شركة النور للتجارة', phone: '01110000001', username: '01110000001', customer_type: 'rep_customer', sales_rep_id: 'r1', is_active: true, is_blocked: false },
  { id: 'u3', user_type: 'customer', name: 'مؤسسة السلام', phone: '01110000002', username: '01110000002', customer_type: 'rep_customer', sales_rep_id: 'r1', is_active: true, is_blocked: false },
  { id: 'u4', user_type: 'customer', name: 'Yasser ElJoKeR', phone: '01666197010', username: '01666197010', customer_type: 'direct', sales_rep_id: null, is_active: true, is_blocked: false },
];

export const runtimeHealth: RuntimeHealth = {
  runtime_healthy: true,
  pricing_healthy: true,
  inventory_healthy: true,
  auth_healthy: true,
  last_checked_at: new Date().toISOString(),
};

export interface SeedData {
  settings: AppSettings;
  tiers: Tier[];
  products: Product[];
  offers: Offer[];
  customers: Customer[];
  reps: SalesRep[];
  orders: Order[];
  health: RuntimeHealth;
}

export const seed: SeedData = {
  settings: appSettings,
  tiers,
  products,
  offers,
  customers,
  reps: salesReps,
  orders: [],
  health: runtimeHealth,
};

export const companies = company;
