import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../state/AppContext'
import Button from '../components/Button'
import { Card } from '../components/Card'
import { formatCurrency, formatNumber } from '../../utils/format'
import Input from '../components/Input'
import { orderService } from '../../services/orderService'

export default function CartPage() {
  const { cart, updateQty, removeFromCart, clearCart, user } = useApp()
  const navigate = useNavigate()
  const [customerId, setCustomerId] = useState(user?.id ?? '')
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.final_price * item.quantity, 0), [cart])

  const checkout = async () => {
    if (!customerId) return
    await orderService.create({
      customer_id: customerId,
      sales_rep_id: user?.user_type === 'sales_rep' ? user.id : null,
      status: 'submitted',
      payment_status: 'unpaid',
      payment_method: 'COD',
      subtotal,
      discount_total: 0,
      grand_total: subtotal,
      items: cart,
    })
    clearCart()
    navigate('/orders')
  }

  return (
    <div className="page-stack">
      <Card>
        <h2>Checkout</h2>
        <div className="form-stack">
          <Input placeholder="Customer UUID" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
        </div>
      </Card>
      <Card>
        {cart.length === 0 ? <p className="muted">السلة فارغة.</p> : cart.map((item) => (
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
        ))}
        <div className="cart-total">الإجمالي: {formatCurrency(subtotal)}</div>
        <Button disabled={!cart.length} onClick={() => void checkout()}>تأكيد الطلب</Button>
      </Card>
    </div>
  )
}
