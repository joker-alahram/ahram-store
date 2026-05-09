const company = (company_id, company_name, color) => ({
  company_id,
  company_name,
  company_logo: null,
  color
});

const companies = [
  company('nivea', 'نـيڤيا', '#1e88e5'),
  company('haircode', 'هير كود', '#8e24aa'),
  company('senyor', 'سنيور', '#ff7043'),
  company('starky', 'استاركي', '#26a69a'),
  company('red', 'ريد', '#ef5350'),
  company('sparkle', 'سباركل', '#7e57c2'),
  company('windex', 'وينديكس', '#29b6f6'),
  company('garnier', 'غارنييه', '#66bb6a')
];

const p = (row) => ({
  ...row,
  product_image: null,
  category: row.category || 'haircare',
  visible: true
});

export const demoData = {
  settings: {
    banner_image: null,
    support_whatsapp: '201040880002',
    hero_title: 'توزيع B2B سريع، واضح، ومضبوط على الأسعار الحية',
    hero_subtitle: 'تصفح الشرائح، أضف للسلة، وأرسل الفاتورة عبر واتساب من نسخة تشغيلية واحدة.',
    theme_mode: 'dark',
    enable_pack_tier_discount: false
  },
  tiers: [
    { id: 'tier-base', tier_name: 'base', display_name: 'بدون خصم', min_order: 0, is_default: true },
    { id: 'tier-half', tier_name: 'half_million', display_name: 'الفضيه', min_order: 500000, is_default: false },
    { id: 'tier-million', tier_name: 'million', display_name: 'الذهبية', min_order: 1000000, is_default: false },
    { id: 'tier-vip', tier_name: 'vip gold', display_name: 'الماسية', min_order: 3000000, is_default: false }
  ],
  companies,
  products: [
    p({ product_id: '1549', product_name: 'نفيا لابلو (24ق)', company_id: 'nivea', company_name: 'نـيڤيا', unit_code: 'carton', tier_name: 'base', final_price: 1872, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, category: 'skin' }),
    p({ product_id: '1540', product_name: 'نفيا كريم سوفت عادي 50مل 30% (60ق)', company_id: 'nivea', company_name: 'نـيڤيا', unit_code: 'carton', tier_name: 'base', final_price: 1530, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, category: 'skin' }),
    p({ product_id: '1517', product_name: 'هير كود جل برطمان 275مل موف (48ق)', company_id: 'haircode', company_name: 'هير كود', unit_code: 'carton', tier_name: 'base', final_price: 2070, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, category: 'hair' }),
    p({ product_id: '1523', product_name: 'هير كود جل انبوبة 250مل ازرق -فري (48ق)', company_id: 'haircode', company_name: 'هير كود', unit_code: 'carton', tier_name: 'base', final_price: 1296, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, category: 'hair' }),
    p({ product_id: '1157', product_name: 'سنيور كريم للشعر هير فود 225جم (48ق)', company_id: 'senyor', company_name: 'سنيور', unit_code: 'carton', tier_name: 'base', final_price: 1776, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, category: 'hair' }),
    p({ product_id: '1179', product_name: 'سنيور شامبو بالكرياتين 450مل (24ق)', company_id: 'senyor', company_name: 'سنيور', unit_code: 'carton', tier_name: 'base', final_price: 1524, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, category: 'hair' }),
    p({ product_id: '1148', product_name: 'استاركي مخمرية 50مل الف ليلة (48ق)', company_id: 'starky', company_name: 'استاركي', unit_code: 'carton', tier_name: 'base', final_price: 1050, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, category: 'beauty' }),
    p({ product_id: '1119', product_name: 'استاركي ماسك 100مل دهبي (60ق)', company_id: 'starky', company_name: 'استاركي', unit_code: 'carton', tier_name: 'base', final_price: 1240, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, category: 'beauty' }),
    p({ product_id: '1526', product_name: 'ريد اكوا 300مل زاحف احمر (72ق)', company_id: 'red', company_name: 'ريد', unit_code: 'carton', tier_name: 'base', final_price: 6040, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, category: 'home' }),
    p({ product_id: '1475', product_name: 'وينديكس منظف زجاج 500مل رشاش ازرق (12ق)', company_id: 'windex', company_name: 'وينديكس', unit_code: 'carton', tier_name: 'base', final_price: 618, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, category: 'home' }),
    p({ product_id: '1419', product_name: 'سباركل شامبو 600 مل متقصف (12ق)', company_id: 'sparkle', company_name: 'سباركل', unit_code: 'carton', tier_name: 'base', final_price: 824, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, category: 'hair' }),
    p({ product_id: '1421', product_name: 'سباركل شامبو 600 مل لامع (12ق)', company_id: 'sparkle', company_name: 'سباركل', unit_code: 'carton', tier_name: 'base', final_price: 824, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, category: 'hair' }),
    p({ product_id: '615', product_name: 'دوف مزيل رول اون الاصلى 50 ملى (12ق)', company_id: 'nivea', company_name: 'دوف', unit_code: 'carton', tier_name: 'base', final_price: 750, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, category: 'skin' }),
    p({ product_id: '709', product_name: 'دوف شامبو 180مل ضد تساقط الشعر (24ق)', company_id: 'nivea', company_name: 'دوف', unit_code: 'carton', tier_name: 'base', final_price: 1220, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, category: 'hair' }),
    p({ product_id: '963', product_name: 'غارنييه صبغة 7.1 (12ق)', company_id: 'garnier', company_name: 'غارنييه', unit_code: 'carton', tier_name: 'base', final_price: 1180, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, category: 'hair' }),
    p({ product_id: '956', product_name: 'غارنييه سيروم اشراقة فاست برايت 30مل خصم 15% (12ق)', company_id: 'garnier', company_name: 'غارنييه', unit_code: 'carton', tier_name: 'base', final_price: 2540, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true, category: 'skin' }),
    p({ product_id: '1549', product_name: 'نفيا لابلو (24ق)', company_id: 'nivea', company_name: 'نـيڤيا', unit_code: 'carton', tier_name: 'half_million', final_price: 1810, available_qty: 800, reserved_qty: 40, allow_backorder: true, runtime_healthy: true, category: 'skin' }),
    p({ product_id: '1517', product_name: 'هير كود جل برطمان 275مل موف (48ق)', company_id: 'haircode', company_name: 'هير كود', unit_code: 'carton', tier_name: 'half_million', final_price: 2010, available_qty: 760, reserved_qty: 12, allow_backorder: true, runtime_healthy: true, category: 'hair' }),
    p({ product_id: '1179', product_name: 'سنيور شامبو بالكرياتين 450مل (24ق)', company_id: 'senyor', company_name: 'سنيور', unit_code: 'carton', tier_name: 'million', final_price: 1478, available_qty: 540, reserved_qty: 9, allow_backorder: true, runtime_healthy: true, category: 'hair' }),
    p({ product_id: '1475', product_name: 'وينديكس منظف زجاج 500مل رشاش ازرق (12ق)', company_id: 'windex', company_name: 'وينديكس', unit_code: 'carton', tier_name: 'vip gold', final_price: 590, available_qty: 430, reserved_qty: 5, allow_backorder: true, runtime_healthy: true, category: 'home' }),
  ],
  dailyDeals: [
    { id: 1, title: 'عرض اليوم: رصيد تسويقي سريع', description: 'منتج مختار بعرض تشغيل يومي.', image: null, price: 299, stock: 24, is_active: true, sold_count: 10, can_buy: true },
    { id: 2, title: 'Bundle الرف العائلي', description: 'حزمة مبيعات سريعة للشحنات الصغيرة.', image: null, price: 499, stock: 18, is_active: true, sold_count: 7, can_buy: true }
  ],
  flashOffers: [
    { id: 1, title: 'Flash: دعم افتتاح الطلب', description: 'سعر خاص بوقت محدود.', image: null, price: 399, stock: 15, sold_count: 5, start_time: new Date(Date.now() - 3600000).toISOString(), end_time: new Date(Date.now() + 86400000).toISOString(), is_active: true, status: 'active', can_buy: true },
    { id: 2, title: 'Flash: نفاد قريب', description: 'عرض ينتهي قريباً.', image: null, price: 555, stock: 3, sold_count: 12, start_time: new Date(Date.now() - 7200000).toISOString(), end_time: new Date(Date.now() + 5400000).toISOString(), is_active: true, status: 'active', can_buy: true }
  ],
  authUsers: [
    { id: 'admin-1', user_type: 'admin', name: 'System Administrator', phone: '', username: 'admin', login_code: 'admin', password: 'M2020m', default_tier_name: 'base', is_active: true, is_blocked: false },
    { id: 'rep-1', user_type: 'sales_rep', name: 'أحمد السيد', phone: '01120000003', username: '01120000003', login_code: '01120000003', password: '123456', default_tier_name: 'base', is_active: true, is_blocked: false },
    { id: 'rep-2', user_type: 'sales_rep', name: 'إبراهيم عادل', phone: '01120000008', username: '01120000008', login_code: '01120000008', password: '123456', default_tier_name: 'base', is_active: true, is_blocked: false },
    { id: 'cust-1', user_type: 'customer', name: 'شركة النور للتجارة', phone: '01110000001', username: '01110000001', login_code: '01110000001', password: '1234', default_tier_name: 'base', is_active: true, is_blocked: false, sales_rep_id: 'rep-1' },
    { id: 'cust-2', user_type: 'customer', name: 'مؤسسة السلام', phone: '01110000002', username: '01110000002', login_code: '01110000002', password: '1234', default_tier_name: 'base', is_active: true, is_blocked: false, sales_rep_id: 'rep-1' },
    { id: 'cust-3', user_type: 'customer', name: 'هايبر المدينة', phone: '01110000005', username: '01110000005', login_code: '01110000005', password: '1234', default_tier_name: 'base', is_active: true, is_blocked: false, sales_rep_id: 'rep-2' }
  ],
  customers: [
    { id: 'cust-1', name: 'شركة النور للتجارة', phone: '01110000001', address: 'القاهرة', location: 'القاهرة', username: '01110000001', password: '1234', created_at: new Date().toISOString(), sales_rep_id: 'rep-1', created_by: 'admin-1', customer_type: 'rep_customer', created_by_rep_id: 'rep-1', is_active: true, default_tier_name: 'base', is_blocked: false, blocked_reason: null },
    { id: 'cust-2', name: 'مؤسسة السلام', phone: '01110000002', address: 'الجيزة', location: 'الجيزة', username: '01110000002', password: '1234', created_at: new Date().toISOString(), sales_rep_id: 'rep-1', created_by: 'admin-1', customer_type: 'rep_customer', created_by_rep_id: 'rep-1', is_active: true, default_tier_name: 'base', is_blocked: false, blocked_reason: null },
    { id: 'cust-3', name: 'هايبر المدينة', phone: '01110000005', address: 'المنصورة', location: 'الدقهلية', username: '01110000005', password: '1234', created_at: new Date().toISOString(), sales_rep_id: 'rep-2', created_by: 'admin-1', customer_type: 'rep_customer', created_by_rep_id: 'rep-2', is_active: true, default_tier_name: 'base', is_blocked: false, blocked_reason: null },
    { id: 'cust-4', name: 'مكتبة الإيمان', phone: '01110000003', address: 'الإسكندرية', location: 'الإسكندرية', username: '01110000003', password: '1234', created_at: new Date().toISOString(), sales_rep_id: null, created_by: 'admin-1', customer_type: 'direct', created_by_rep_id: null, is_active: true, default_tier_name: 'base', is_blocked: false, blocked_reason: null }
  ],
  orders: [
    {
      id: 'order-sample-1',
      order_number: 'ORD-2026-0001',
      customer_id: 'cust-1',
      sales_rep_id: 'rep-1',
      status: 'submitted',
      payment_status: 'unpaid',
      currency: 'EGP',
      subtotal: 3168,
      discount_total: 0,
      grand_total: 3168,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      version: 1,
      items: [
        {
          product_id: '1549',
          product_name_snapshot: 'نفيا لابلو (24ق)',
          unit_code_snapshot: 'carton',
          tier_snapshot: 'base',
          unit_price_snapshot: 1872,
          quantity: 1,
          line_total: 1872,
          pricing_snapshot: { final_price: 1872 }
        },
        {
          product_id: '1475',
          product_name_snapshot: 'وينديكس منظف زجاج 500مل رشاش ازرق (12ق)',
          unit_code_snapshot: 'carton',
          tier_snapshot: 'base',
          unit_price_snapshot: 618,
          quantity: 2,
          line_total: 1236,
          pricing_snapshot: { final_price: 618 }
        }
      ],
      audit: []
    }
  ],
  uiEvents: []
};
