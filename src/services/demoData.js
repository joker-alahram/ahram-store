export const demoData = {
  companies: [
    { company_id: 'C001', company_name: 'ALAHRAM Cosmetics', company_logo: '', visible: true, allow_discount: true },
    { company_id: 'C002', company_name: 'Nord Beauty', company_logo: '', visible: true, allow_discount: true },
    { company_id: 'C003', company_name: 'Metro Care', company_logo: '', visible: true, allow_discount: true },
    { company_id: 'C004', company_name: 'Dawn Lab', company_logo: '', visible: true, allow_discount: true },
  ],
  products: [
    { product_id: 'P1001', product_name: 'Daily Cream', company_id: 'C001', product_image: '', status: 'active', visible: true, has_carton: true, has_pack: true, has_half_pack: false, has_piece: false, carton_price: 240, pack_price: 24, half_pack_price: null, piece_price: null, allow_discount: true, category: 'skin', sellable_units: ['carton', 'pack'] },
    { product_id: 'P1002', product_name: 'Hydra Serum', company_id: 'C002', product_image: '', status: 'active', visible: true, has_carton: true, has_pack: true, has_half_pack: true, has_piece: false, carton_price: 360, pack_price: 36, half_pack_price: 20, piece_price: null, allow_discount: true, category: 'skin', sellable_units: ['carton', 'pack', 'half_pack'] },
    { product_id: 'P1003', product_name: 'Hair Oil', company_id: 'C003', product_image: '', status: 'active', visible: true, has_carton: true, has_pack: false, has_half_pack: false, has_piece: true, carton_price: 180, pack_price: null, half_pack_price: null, piece_price: 18, allow_discount: true, category: 'hair', sellable_units: ['carton', 'piece'] },
    { product_id: 'P1004', product_name: 'Body Wash', company_id: 'C004', product_image: '', status: 'active', visible: true, has_carton: true, has_pack: true, has_half_pack: false, has_piece: true, carton_price: 280, pack_price: 28, half_pack_price: null, piece_price: 14, allow_discount: true, category: 'bath', sellable_units: ['carton', 'pack', 'piece'] },
  ],
  tiers: [
    { tier_name: 'base', visible_label: 'الشريحة الرئيسية', min_order: 0, discount_percent: 0, visible: true, is_active: true, is_default: true, discount_carton: true, discount_pack: true },
    { tier_name: 'silver', visible_label: 'Silver', min_order: 500, discount_percent: 5, visible: true, is_active: true, is_default: false, discount_carton: true, discount_pack: true },
    { tier_name: 'gold', visible_label: 'Gold', min_order: 1200, discount_percent: 10, visible: true, is_active: true, is_default: false, discount_carton: true, discount_pack: true },
  ],
  settings: [
    { key: 'banner_image', value: '', updated_at: new Date().toISOString() },
    { key: 'support_whatsapp', value: '201040880002', updated_at: new Date().toISOString() },
  ],
  dailyDeals: [
    { id: 1, title: 'Deal Pack', description: 'عرض يومي محدود', image: '', price: 149, stock: 8, is_active: true, sold_count: 3, can_buy: true },
  ],
  flashOffers: [
    { id: 10, title: 'Flash Luxe', description: 'عرض ساعة فاخر', image: '', price: 99, stock: 5, start_time: new Date(Date.now() - 60000).toISOString(), end_time: new Date(Date.now() + 3600000).toISOString(), is_active: true, sold_count: 1, status: 'active', can_buy: true },
  ],
  customers: [
    { id: 'demo-customer-1', name: 'Demo Customer', phone: '01000000000', address: 'Cairo', location: '', username: 'demo', password: '1234', customer_type: 'direct', sales_rep_id: null, created_by: null, is_active: true, default_tier_name: 'base', is_blocked: false },
  ],
  salesReps: [
    { id: 'demo-rep-1', name: 'Demo Rep', phone: '01111111111', region: 'Cairo', username: 'rep', password: '1234', default_tier_name: 'gold', is_active: true, is_blocked: false },
  ],
};
