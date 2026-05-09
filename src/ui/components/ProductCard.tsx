import type { ProductDTO } from '../../types'
import { formatCurrency, formatNumber } from '../../utils/format'
import Button from './Button'
import Badge from './Badge'

export default function ProductCard({ product, onAdd }: { product: ProductDTO; onAdd: (product: ProductDTO, unitCode: string) => void }) {
  const unit = product.units[0]
  return (
    <article className="product-card">
      <div className="product-head">
        <h3>{product.name}</h3>
        <Badge>{unit.tier_name}</Badge>
      </div>
      <div className="product-meta">
        <span>{unit.unit_code}</span>
        <span>متاح: {formatNumber(unit.available_qty)}</span>
      </div>
      <div className="product-price">{formatCurrency(unit.final_price)}</div>
      <Button onClick={() => onAdd(product, unit.unit_code)}>إضافة للسلة</Button>
    </article>
  )
}
