import { Link } from 'react-router-dom'
import { useApp } from '../../state/AppContext'
import { formatCurrency, formatNumber } from '../../utils/format'
import Button from './Button'

export default function TopBar() {
  const { user, cart, logout } = useApp()
  const totalQty = cart.reduce((n, item) => n + item.quantity, 0)
  const total = cart.reduce((sum, item) => sum + item.final_price * item.quantity, 0)
  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">منصة التوزيع</div>
        <h1 className="title">B2B Commerce Runtime</h1>
      </div>
      <div className="topbar-actions">
        <div className="user-chip">{user ? user.name : 'زائر'}</div>
        <Link className="btn btn-secondary" to="/cart">السلة ({formatNumber(totalQty)})</Link>
        <div className="summary">{formatCurrency(total)}</div>
        {user ? <Button className="btn-secondary" onClick={() => void logout()}>خروج</Button> : <Link className="btn btn-secondary" to="/login">دخول</Link>}
      </div>
    </header>
  )
}
