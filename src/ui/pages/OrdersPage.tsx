import { useEffect, useState } from 'react'
import { orderService, type OrderRecord } from '../../services/orderService'
import { Card } from '../components/Card'
import { formatCurrency } from '../../utils/format'

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([])
  useEffect(() => { void orderService.list().then(setOrders) }, [])
  return (
    <div className="page-stack">
      <Card>
        <h2>الطلبات</h2>
        {orders.length ? orders.map((o) => (
          <div className="mini-row" key={o.id}>
            <div>
              <strong>{o.order_number}</strong>
              <div className="muted">{o.status} · {o.payment_status}</div>
            </div>
            <span>{formatCurrency(o.grand_total)}</span>
          </div>
        )) : <p className="muted">لا توجد طلبات محفوظة بعد.</p>}
      </Card>
    </div>
  )
}
