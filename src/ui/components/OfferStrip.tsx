import type { DailyDealDTO, FlashOfferDTO } from '../../types'
import { formatCurrency } from '../../utils/format'

export function OfferStrip({ dailyDeals, flashOffers }: { dailyDeals: DailyDealDTO[]; flashOffers: FlashOfferDTO[] }) {
  return (
    <div className="offer-grid">
      <section className="card">
        <h2>عروض يومية</h2>
        {dailyDeals.length ? dailyDeals.map((item) => <div className="mini-row" key={item.id}><strong>{item.title}</strong><span>{formatCurrency(item.price)}</span></div>) : <p className="muted">لا توجد عروض يومية الآن.</p>}
      </section>
      <section className="card">
        <h2>Flash Offers</h2>
        {flashOffers.length ? flashOffers.map((item) => <div className="mini-row" key={item.id}><strong>{item.title}</strong><span>{item.status ?? 'pending'}</span></div>) : <p className="muted">لا توجد عروض فلاش الآن.</p>}
      </section>
    </div>
  )
}
