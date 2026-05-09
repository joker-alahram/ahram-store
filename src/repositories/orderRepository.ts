import { isMockMode } from '../core/runtime'
import { supabase } from '../core/supabase/client'
import type { CartItem, OrderStatus, PaymentMethod, PaymentStatus } from '../types'
import { readJson, writeJson } from '../utils/storage'

export interface OrderRecord {
  id: string
  order_number: string
  customer_id: string
  sales_rep_id?: string | null
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method: PaymentMethod
  subtotal: number
  discount_total: number
  grand_total: number
  items: CartItem[]
  created_at: string
}

const ORDERS_KEY = 'runtime_orders'

export class OrderRepository {
  async list(): Promise<OrderRecord[]> {
    if (!isMockMode) {
      try {
        const { data, error } = await supabase.from('v_orders_status').select('*').order('created_at', { ascending: false })
        if (!error && data) {
          return data.map((row: any) => ({
            id: String(row.id ?? row.order_id ?? crypto.randomUUID()),
            order_number: String(row.order_number ?? row.id ?? ''),
            customer_id: String(row.customer_id ?? ''),
            sales_rep_id: row.sales_rep_id ?? null,
            status: String(row.status ?? 'submitted') as OrderStatus,
            payment_status: String(row.payment_status ?? 'unpaid') as PaymentStatus,
            payment_method: String(row.payment_method ?? 'COD') as PaymentMethod,
            subtotal: Number(row.subtotal ?? 0),
            discount_total: Number(row.discount_total ?? 0),
            grand_total: Number(row.grand_total ?? 0),
            items: Array.isArray(row.items) ? row.items : [],
            created_at: String(row.created_at ?? new Date().toISOString()),
          }))
        }
      } catch {
        // fallback below
      }
    }
    return readJson<OrderRecord[]>(ORDERS_KEY, [])
  }

  async create(payload: Omit<OrderRecord, 'id' | 'order_number' | 'created_at'>): Promise<OrderRecord> {
    const order: OrderRecord = {
      ...payload,
      id: crypto.randomUUID(),
      order_number: `ORD-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    if (!isMockMode) {
      try {
        const { error } = await supabase.from('orders').insert({
          customer_id: order.customer_id,
          sales_rep_id: order.sales_rep_id,
          status: order.status,
          payment_status: order.payment_status,
          payment_method: order.payment_method,
          subtotal: order.subtotal,
          discount_total: order.discount_total,
          grand_total: order.grand_total,
        } as any)
        if (error) throw error
        if (order.items.length) {
          const { error: itemsError } = await supabase.from('order_items').insert(order.items.map((item) => ({
            order_id: order.id,
            product_id: item.product_id,
            unit_code: item.unit_code,
            quantity: item.quantity,
            unit_price: item.final_price,
            line_total: item.final_price * item.quantity,
            pricing_snapshot: item,
          })) as any)
          if (itemsError) throw itemsError
        }
      } catch {
        // local fallback
      }
    }
    const existing = readJson<OrderRecord[]>(ORDERS_KEY, [])
    writeJson(ORDERS_KEY, [order, ...existing])
    return order
  }
}
