function renderFlashPage() {
  const flashState = getFlashState();
  const active = flashState.status === 'active' ? flashState.offer : null;
  const heroTitle = flashState.status === 'active'
    ? 'متبقي من الوقت على انتهاء العرض'
    : flashState.status === 'expired'
      ? 'انتهى العرض'
      : 'العرض قادم قريبًا';
  const heroNote = flashState.status === 'active'
    ? 'الدفع مقدمًا'
    : flashState.status === 'expired'
      ? `تاريخ الانتهاء: ${flashState.endedAt}`
      : `يبدأ في: ${flashState.endedAt}`;
  const heroCountdown = flashState.status === 'active'
    ? flashState.remaining
    : flashState.status === 'expired'
      ? flashState.endedAt
      : flashState.remaining || '';

  els.pageContent.innerHTML = `
    <div class="page-stack">
      <section class="flash-hero">
        <div class="flash-copy">${escapeHtml(heroTitle)}</div>
        <div class="flash-countdown mono">${escapeHtml(heroCountdown || '--:--:--')}</div>
        <div class="flash-note">${escapeHtml(heroNote)}</div>
      </section>
      <section class="deal-list">
        ${state.flashOffers.length ? state.flashOffers.map((offer) => dealCardHtml(offer, 'flash', active)).join('') : `<div class="empty-state">لا توجد عروض الساعة</div>`}
      </section>
    </div>
  `;
}
