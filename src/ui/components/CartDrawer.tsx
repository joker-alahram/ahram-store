import { Link } from 'react-router-dom'
import { useApp } from '../../state/AppContext'
import { formatCurrency, formatNumber } from '../../utils/format'
import Button from './Button'

export default function CartDrawer() {
  const { cart, updateQty, removeFromCart } = useApp()
  const subtotal = cart.reduce((sum, item) => sum + item.final_price * item.quantity, 0)
  return (
    <aside className="card sticky-card">
      <div className="card-head">
        <h2>السلة</h2>
        <Link to="/cart" className="link">عرض كامل</Link>
      </div>
      {cart.length === 0 ? <p className="muted">السلة فارغة.</p> : <div className="cart-list">{cart.map((item) => (
        <div className="cart-item" key={`${item.product_id}-${item.unit_code}`}>
          <div>
            <strong>{item.name}</strong>
            <div className="muted">{item.unit_code} · {formatCurrency(item.final_price)}</div>
          </div>
          <div className="qty-actions">
            <Button className="btn-mini" onClick={() => updateQty(item.product_id, item.unit_code, item.quantity - 1)}>-</Button>
            <span>{formatNumber(item.quantity)}</span>
            <Button className="btn-mini" onClick={() => updateQty(item.product_id, item.unit_code, item.quantity + 1)}>+</Button>
            <Button className="btn-mini btn-danger" onClick={() => removeFromCart(item.product_id, item.unit_code)}>حذف</Button>
          </div>
        </div>
      ))}</div>}
      <div className="cart-total">الإجمالي: {formatCurrency(subtotal)}</div>
    </aside>
  )
}
