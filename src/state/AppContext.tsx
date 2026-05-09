import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { AppSettingsDTO, AppUser, CartItem, DailyDealDTO, FlashOfferDTO, ProductDTO, SessionData, TierDTO } from '../types'
import { authService } from '../services/authService'
import { cartService } from '../services/cartService'
import { offerService } from '../services/offerService'
import { productService } from '../services/productService'
import { runtimeService } from '../services/runtimeService'
import { tierService } from '../services/tierService'

interface AppState {
  settings: AppSettingsDTO
  tiers: TierDTO[]
  products: ProductDTO[]
  dailyDeals: DailyDealDTO[]
  flashOffers: FlashOfferDTO[]
  cart: CartItem[]
  session: SessionData | null
  user: AppUser | null
  loading: boolean
  reload: () => Promise<void>
  addToCart: (item: CartItem) => void
  updateQty: (productId: string, unitCode: string, quantity: number) => void
  removeFromCart: (productId: string, unitCode: string) => void
  clearCart: () => void
  login: (login: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<AppSettingsDTO>({})
  const [tiers, setTiers] = useState<TierDTO[]>([])
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [dailyDeals, setDailyDeals] = useState<DailyDealDTO[]>([])
  const [flashOffers, setFlashOffers] = useState<FlashOfferDTO[]>([])
  const [cart, setCart] = useState<CartItem[]>(() => cartService.get())
  const [session, setSession] = useState<SessionData | null>(null)
  const [user, setUser] = useState<AppUser | null>(null)

  useEffect(() => { cartService.save(cart) }, [cart])

  const reload = async () => {
    setLoading(true)
    try {
      const [settingsData, tiersData, productsData, dailyDealsData, flashOffersData, sessionData] = await Promise.all([
        runtimeService.settings,
        tierService.list(),
        productService.list(),
        offerService.dailyDeals(),
        offerService.flashOffers(),
        authService.session(),
      ])
      setSettings(settingsData)
      setTiers(tiersData)
      setProducts(productsData)
      setDailyDeals(dailyDealsData)
      setFlashOffers(flashOffersData)
      setSession(sessionData.session)
      setUser(sessionData.user)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void reload() }, [])

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const found = prev.find((x) => x.product_id === item.product_id && x.unit_code === item.unit_code)
      if (found) {
        return prev.map((x) => x.product_id === item.product_id && x.unit_code === item.unit_code ? { ...x, quantity: x.quantity + item.quantity } : x)
      }
      return [...prev, item]
    })
  }

  const updateQty = (productId: string, unitCode: string, quantity: number) => {
    setCart((prev) => prev.map((x) => x.product_id === productId && x.unit_code === unitCode ? { ...x, quantity: Math.max(1, quantity) } : x))
  }

  const removeFromCart = (productId: string, unitCode: string) => {
    setCart((prev) => prev.filter((x) => !(x.product_id === productId && x.unit_code === unitCode)))
  }

  const clearCart = () => setCart([])

  const login = async (loginValue: string, password: string) => {
    const { session: nextSession, user: nextUser } = await authService.login(loginValue, password)
    setSession(nextSession)
    setUser(nextUser)
  }

  const logout = async () => {
    await authService.logout()
    setSession(null)
    setUser(null)
  }

  const value = useMemo<AppState>(() => ({
    settings, tiers, products, dailyDeals, flashOffers, cart, session, user, loading,
    reload, addToCart, updateQty, removeFromCart, clearCart, login, logout,
  }), [settings, tiers, products, dailyDeals, flashOffers, cart, session, user, loading])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('AppProvider missing')
  return ctx
}
