import { Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider, useApp } from './state/AppContext'
import AppShell from './ui/layouts/AppShell'
import StorePage from './ui/pages/StorePage'
import LoginPage from './ui/pages/LoginPage'
import CartPage from './ui/pages/CartPage'
import OrdersPage from './ui/pages/OrdersPage'
import RepPage from './ui/pages/RepPage'
import AdminPage from './ui/pages/AdminPage'
import CustomersPage from './ui/pages/CustomersPage'

function AppRoutes() {
  const { loading } = useApp()
  if (loading) return <div className="loading-screen">جاري تحميل الـ runtime...</div>
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<StorePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/rep" element={<RepPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}
