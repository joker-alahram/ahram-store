import type { AppSettingsDTO, AppUser, DailyDealDTO, FlashOfferDTO, ProductDTO, TierDTO } from '../types'

export const mockAppSettings: AppSettingsDTO = {
  banner_image: 'https://i.ibb.co/wNgLFs79/1776141908429.png',
  'tier_scope:million': { carton: true, pack: false },
  'tier_scope:vip gold': { carton: true, pack: false },
  'tier_scope:TIER_NAME': { carton: true, pack: true },
  'tier_scope:half_million': { carton: true, pack: false },
  enable_pack_tier_discount: false,
}

export const mockUsers: AppUser[] = [
  { id: '7a4d08f7-ea7d-4cca-9222-ca8dcbd8df58', user_type: 'admin', name: 'System Administrator', username: 'admin', login_code: 'admin', default_tier_name: 'base', is_active: true, is_blocked: false },
  { id: '14792bd4-bfb5-4054-942c-b8796b0995f0', user_type: 'sales_rep', name: 'أحمد السيد', phone: '01120000003', username: '01120000003', login_code: '01120000003', password: '123456' } as never,
  { id: 'c58ab123-3119-481b-8655-885b2f998d18', user_type: 'customer', name: 'محمد عبد الستار', phone: '01066197015', username: '01066197015', login_code: '01066197015' } as never,
]

export const mockTiers: TierDTO[] = [
  { tier_name: 'base', display_name: 'بدون خصم', min_order: 0, is_default: true, id: 'ecd5d974-d94c-47f1-9fb1-581d2622beb2' },
  { tier_name: 'half_million', display_name: 'الفضيه', min_order: 500000, is_default: false, id: '2949ea8b-49d8-45e0-a074-2a551b4a44ec' },
  { tier_name: 'million', display_name: 'الذهبية', min_order: 1000000, is_default: false, id: '8962ab89-7a59-4f3b-8fc1-d9ef150d1053' },
  { tier_name: 'vip gold', display_name: 'الماسية', min_order: 3000000, is_default: false, id: '392cef78-2457-4382-87eb-ecce88dbde70' },
]

export const mockProducts: ProductDTO[] = [
  { product_id: '1549', name: 'نفيا لابلو (24ق)', units: [{ unit_code: 'carton', tier_name: 'base', final_price: 1872, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true }] },
  { product_id: '1540', name: 'نفيا كريم سوفت عادي 50مل 30% (60ق)', units: [{ unit_code: 'carton', tier_name: 'base', final_price: 1530, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true }] },
  { product_id: '1542', name: 'نفيا كريم سوفت عادي 100مل خصم 30% (24ق)', units: [{ unit_code: 'carton', tier_name: 'base', final_price: 1104, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true }] },
  { product_id: '1517', name: 'هير كود جل برطمان 275مل موف (48ق)', units: [{ unit_code: 'carton', tier_name: 'base', final_price: 2070, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true }] },
  { product_id: '1502', name: 'فيانسية كورة كريم جل 2*1 كبير موف 225جم (48ق)', units: [{ unit_code: 'carton', tier_name: 'base', final_price: 1720, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true }] },
  { product_id: '1178', name: 'سنيور هاند ووش (اخضر) 500جم (12ق)', units: [{ unit_code: 'carton', tier_name: 'base', final_price: 514, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true }] },
  { product_id: '1526', name: 'ريد اكوا 300مل زاحف احمر (72ق)', units: [{ unit_code: 'carton', tier_name: 'base', final_price: 6040, available_qty: 1000, reserved_qty: 0, allow_backorder: true, runtime_healthy: true }] },
]

export const mockDailyDeals: DailyDealDTO[] = [
  { id: 1, title: 'عرض يومي تجريبي', description: 'عرض للتأكد من ظهور قسم العروض', image: '', price: 299, stock: 7, is_active: true, sold_count: 2, can_buy: true },
]

export const mockFlashOffers: FlashOfferDTO[] = [
  { id: 1, title: 'فلاش أوفر تجريبي', description: 'عرض مؤقت', image: '', price: 499, stock: 3, sold_count: 0, start_time: new Date(Date.now() - 60 * 1000).toISOString(), end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), is_active: true, current_time: new Date().toISOString(), status: 'active', can_buy: true },
]
