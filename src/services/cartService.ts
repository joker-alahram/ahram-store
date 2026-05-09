import type { CartItem } from '../types'
import { readJson, writeJson } from '../utils/storage'

const CART_KEY = 'runtime_cart'

export class CartService {
  get(): CartItem[] { return readJson<CartItem[]>(CART_KEY, []) }
  save(items: CartItem[]): void { writeJson(CART_KEY, items) }
  clear(): void { writeJson(CART_KEY, []) }
}

export const cartService = new CartService()
