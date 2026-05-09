import { NavLink } from 'react-router-dom'

export default function BottomNav() {
  const cls = ({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={cls}>المتجر</NavLink>
      <NavLink to="/cart" className={cls}>السلة</NavLink>
      <NavLink to="/orders" className={cls}>الطلبات</NavLink>
      <NavLink to="/rep" className={cls}>المندوب</NavLink>
      <NavLink to="/admin" className={cls}>الأدمن</NavLink>
    </nav>
  )
}
