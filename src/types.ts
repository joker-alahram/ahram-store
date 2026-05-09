export type UserType = 'admin' | 'sales_rep' | 'customer'
export type SessionStatus = 'active' | 'expired' | 'revoked'
export type OrderStatus = 'draft' | 'submitted' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'refunded' | 'cancelled'
export type PaymentMethod = 'COD' | 'invoice_later'
export type RuntimeMode = 'auto' | 'remote' | 'mock'

export interface AppUser {
  id: string
  user_type: UserType
  name: string
  phone?: string | null
  username?: string | null
  login_code?: string | null
  password?: string | null
  default_tier_name?: string | null
  is_active?: boolean | null
  is_blocked?: boolean | null
}

export interface SessionData {
  access_token: string
  user_id: string
  user_type: UserType
  expires_at: string
}

export interface TierDTO {
  tier_name: string
  display_name: string
  min_order: number
  is_default: boolean
  id?: string | null
}

export interface ProductUnitDTO {
  unit_code: string
  tier_name: string
  final_price: number
  available_qty: number
  reserved_qty: number
  allow_backorder: boolean
  runtime_healthy: boolean
}

export interface ProductDTO {
  product_id: string
  name: string
  company_id?: string | null
  category_id?: string | null
  units: ProductUnitDTO[]
}

export interface AppSettingsDTO {
  [key: string]: string | boolean | number | null | Record<string, unknown> | undefined
}

export interface DailyDealDTO {
  id: number
  title: string
  description?: string | null
  image?: string | null
  price: number
  stock: number
  is_active?: boolean | null
  sold_count?: number | null
  can_buy?: boolean | null
}

export interface FlashOfferDTO {
  id: number
  title: string
  description?: string | null
  image?: string | null
  price: number
  stock: number
  sold_count?: number | null
  start_time: string
  end_time: string
  is_active?: boolean | null
  current_time?: string | null
  status?: string | null
  can_buy?: boolean | null
}

export interface CartItem {
  product_id: string
  name: string
  unit_code: string
  tier_name: string
  final_price: number
  quantity: number
  available_qty?: number
  allow_backorder?: boolean
}

export interface LoginInput {
  login: string
  password: string
}

export interface RuntimeError {
  code: string
  message: string
  details?: unknown[]
}
