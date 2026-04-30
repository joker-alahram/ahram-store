function renderDealsPage() {
  els.pageContent.innerHTML = `
    <div class="page-stack">
      <section class="section-card">
        <div class="section-head">
          <div>
            <h2>صفقة اليوم</h2>
            <div class="helper-text">بطاقة واحدة في كل صف</div>
          </div>
        </div>
      </section>
      <section class="deal-list">
        ${state.dailyDeals.length ? state.dailyDeals.map((deal) => dealCardHtml(deal, 'deal')).join('') : `<div class="empty-state">لا توجد صفقة اليوم الآن</div>`}
      </section>
    </div>
  `;
}
