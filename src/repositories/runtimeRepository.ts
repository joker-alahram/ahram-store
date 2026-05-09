import { supabase } from '../core/supabase/client'
import { isMockMode } from '../core/runtime'
import { mockAppSettings, mockDailyDeals, mockFlashOffers, mockProducts, mockTiers, mockUsers } from '../runtime/mockData'
import type { AppSettingsDTO, AppUser, DailyDealDTO, FlashOfferDTO, ProductDTO, TierDTO } from '../types'

async function remoteOrFallback(remote: () => Promise<any>, fallback: () => Promise<any>): Promise<any> {
  if (isMockMode) return fallback()
  try {
    return await remote()
  } catch {
    return fallback()
  }
}

export class RuntimeRepository {
  async getSettings(): Promise<AppSettingsDTO> {
    return remoteOrFallback(async () => {
      const { data, error } = await supabase.from('v_app_settings').select('settings').maybeSingle()
      if (error) throw error
      return (data?.settings ?? {}) as AppSettingsDTO
    }, async () => mockAppSettings)
  }

  async getTiers(): Promise<TierDTO[]> {
    return remoteOrFallback(async () => {
      const { data, error } = await supabase.from('v_visible_tiers').select('*').order('min_order', { ascending: true })
      if (error) throw error
      return (data ?? []).map((row: any) => ({
        tier_name: String(row.tier_name ?? ''),
        display_name: String(row.display_name ?? row.tier_name ?? ''),
        min_order: Number(row.min_order ?? 0),
        is_default: Boolean(row.is_default),
        id: row.id ?? null,
      }))
    }, async () => mockTiers)
  }

  async getProducts(): Promise<ProductDTO[]> {
    return remoteOrFallback(async () => {
      const { data, error } = await supabase.from('v_runtime_products').select('*').order('product_name', { ascending: true })
      if (error) throw error
      const grouped = new Map<string, ProductDTO>()
      for (const row of data ?? []) {
        const id = String(row.product_id)
        const existing = grouped.get(id)
        const unit = {
          unit_code: String(row.unit_code ?? 'carton'),
          tier_name: String(row.tier_name ?? 'base'),
          final_price: Number(row.final_price ?? 0),
          available_qty: Number(row.available_qty ?? 0),
          reserved_qty: Number(row.reserved_qty ?? 0),
          allow_backorder: Boolean(row.allow_backorder),
          runtime_healthy: Boolean(row.runtime_healthy),
        }
        if (existing) existing.units.push(unit)
        else grouped.set(id, { product_id: id, name: String(row.product_name ?? ''), units: [unit] })
      }
      return [...grouped.values()]
    }, async () => mockProducts)
  }

  async getDailyDeals(): Promise<DailyDealDTO[]> {
    return remoteOrFallback(async () => {
      const { data, error } = await supabase.from('v_daily_deals').select('*').order('id', { ascending: false })
      if (error) throw error
      return (data ?? []).map((row: any) => ({
        id: Number(row.id),
        title: String(row.title ?? ''),
        description: row.description ?? null,
        image: row.image ?? null,
        price: Number(row.price ?? 0),
        stock: Number(row.stock ?? 0),
        is_active: Boolean(row.is_active),
        sold_count: Number(row.sold_count ?? 0),
        can_buy: Boolean(row.can_buy),
      }))
    }, async () => mockDailyDeals)
  }

  async getFlashOffers(): Promise<FlashOfferDTO[]> {
    return remoteOrFallback(async () => {
      const { data, error } = await supabase.from('v_flash_offers').select('*').order('start_time', { ascending: false })
      if (error) throw error
      return (data ?? []).map((row: any) => ({
        id: Number(row.id),
        title: String(row.title ?? ''),
        description: row.description ?? null,
        image: row.image ?? null,
        price: Number(row.price ?? 0),
        stock: Number(row.stock ?? 0),
        sold_count: Number(row.sold_count ?? 0),
        start_time: String(row.start_time ?? ''),
        end_time: String(row.end_time ?? ''),
        is_active: Boolean(row.is_active),
        current_time: row.current_time ?? null,
        status: String(row.status ?? ''),
        can_buy: Boolean(row.can_buy),
      }))
    }, async () => mockFlashOffers)
  }

  async getUsers(): Promise<AppUser[]> {
    return remoteOrFallback(async () => {
      const { data, error } = await supabase.from('v_auth_users').select('*')
      if (error) throw error
      return (data ?? []).map((row: any) => ({
        id: String(row.id),
        user_type: row.user_type,
        name: String(row.name ?? ''),
        phone: row.phone ?? null,
        username: row.username ?? null,
        login_code: row.login_code ?? null,
        default_tier_name: row.default_tier_name ?? null,
        is_active: row.is_active ?? null,
        is_blocked: row.is_blocked ?? null,
      }))
    }, async () => mockUsers)
  }
}
