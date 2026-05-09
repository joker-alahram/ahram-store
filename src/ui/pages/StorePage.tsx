import { useMemo, useState } from 'react'
import { useApp } from '../../state/AppContext'
import ProductCard from '../components/ProductCard'
import { OfferStrip } from '../components/OfferStrip'
import CartDrawer from '../components/CartDrawer'
import Input from '../components/Input'
import Select from '../components/Select'
import { Card } from '../components/Card'
import Badge from '../components/Badge'
import { formatCurrency } from '../../utils/format'

export default function StorePage() {
  const { settings, tiers, products, dailyDeals, flashOffers, addToCart } = useApp()
  const [query, setQuery] = useState('')
  const [tier, setTier] = useState(tiers.find((t) => t.is_default)?.tier_name ?? 'base')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.product_id.includes(q)).filter((p) => p.units.some((u) => u.tier_name === tier || tier === 'base'))
  }, [products, query, tier])

  const banner = typeof settings.banner_image === 'string' ? settings.banner_image : ''

  return (
    <div className="page-stack">
      {banner ? <Card className="banner-card"><img src={banner} alt="banner" className="banner-img" /></Card> : null}

      <section className="filters">
        <Input placeholder="بحث سريع بالاسم أو الكود" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={tier} onChange={(e) => setTier(e.target.value)}>
          {tiers.map((t) => <option key={t.tier_name} value={t.tier_name}>{t.display_name}</option>)}
        </Select>
      </section>

      <div className="tier-strip">
        {tiers.map((t) => <button key={t.tier_name} className={`tier-pill ${tier === t.tier_name ? 'active' : ''}`} onClick={() => setTier(t.tier_name)}>{t.display_name} <Badge>{formatCurrency(t.min_order)}</Badge></button>)}
      </div>

      <OfferStrip dailyDeals={dailyDeals} flashOffers={flashOffers} />

      <section className="grid-title">
        <h2>المنتجات</h2>
        <span className="muted">{filtered.length} عنصر</span>
      </section>

      <section className="product-grid">
        {filtered.map((product) => <ProductCard key={product.product_id} product={product} onAdd={(p, unitCode) => {
          const unit = p.units.find((u) => u.unit_code === unitCode) ?? p.units[0]
          addToCart({
            product_id: p.product_id,
            name: p.name,
            unit_code: unit.unit_code,
            tier_name: unit.tier_name,
            final_price: unit.final_price,
            quantity: 1,
            available_qty: unit.available_qty,
            allow_backorder: unit.allow_backorder,
          })
        }} />)}
      </section>

      <CartDrawer />
    </div>
  )
}
