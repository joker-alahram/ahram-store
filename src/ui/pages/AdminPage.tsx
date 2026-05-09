import { Card } from '../components/Card'

export default function AdminPage() {
  return (
    <div className="page-stack">
      <Card>
        <h2>لوحة الأدمن</h2>
        <p className="muted">عرض إعدادات النظام، المستخدمين، والعروض يتم من خلال الـ runtime views الرسمية.</p>
      </Card>
    </div>
  )
}
