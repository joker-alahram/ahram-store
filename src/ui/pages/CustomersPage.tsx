import { Card } from '../components/Card'

export default function CustomersPage() {
  return (
    <div className="page-stack">
      <Card>
        <h2>العملاء</h2>
        <p className="muted">قسم إدارة العملاء معزول كطبقة مستقلة ويمكن توصيله لاحقًا مباشرةً بـ customers / v_rep_customers.</p>
      </Card>
    </div>
  )
}
