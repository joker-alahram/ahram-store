import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/ui/layouts/AppShell';
import { ScreenPage } from '@/ui/pages/ScreenPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<ScreenPage />} />
        <Route path="/companies" element={<ScreenPage />} />
        <Route path="/products" element={<ScreenPage />} />
        <Route path="/offers" element={<ScreenPage />} />
        <Route path="/search" element={<ScreenPage />} />
        <Route path="/login" element={<ScreenPage />} />
        <Route path="/register" element={<ScreenPage />} />
        <Route path="/cart" element={<ScreenPage />} />
        <Route path="/checkout" element={<ScreenPage />} />
        <Route path="/orders" element={<ScreenPage />} />
        <Route path="/invoices" element={<ScreenPage />} />
        <Route path="/profile" element={<ScreenPage />} />
        <Route path="/rep/customers" element={<ScreenPage />} />
        <Route path="/rep/orders" element={<ScreenPage />} />
        <Route path="/rep/create-customer" element={<ScreenPage />} />
        <Route path="/rep/portfolio" element={<ScreenPage />} />
        <Route path="/admin" element={<ScreenPage />} />
        <Route path="/admin/products" element={<ScreenPage />} />
        <Route path="/admin/pricing" element={<ScreenPage />} />
        <Route path="/admin/orders" element={<ScreenPage />} />
        <Route path="/admin/customers" element={<ScreenPage />} />
        <Route path="/admin/reps" element={<ScreenPage />} />
        <Route path="/admin/offers" element={<ScreenPage />} />
        <Route path="/admin/analytics" element={<ScreenPage />} />
        <Route path="/admin/audit" element={<ScreenPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
