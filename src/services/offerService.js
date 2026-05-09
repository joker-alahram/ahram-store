function normalizeOffer(row, kind) {
  return {
    ...row,
    kind,
    id: row.id ?? row.offer_id ?? row.flash_offer_id ?? row.daily_deal_id,
    title: String(row.title ?? row.name ?? row.offer_title ?? '').trim(),
    description: String(row.description ?? row.offer_description ?? '').trim(),
    image: row.image || row.offer_image || '',
    price: Number(row.price ?? row.final_price ?? 0),
    stock: Number(row.stock ?? row.available_qty ?? 0),
    sold_count: Number(row.sold_count ?? row.total_sold ?? 0),
    can_buy: row.can_buy !== false,
    status: row.status || (kind === 'flash' ? 'pending' : 'active'),
    start_time: row.start_time || row.starts_at || null,
    end_time: row.end_time || row.ends_at || null,
    current_time: row.current_time || null,
  };
}

export function computeFlashState(offers = []) {
  const active = offers.find((offer) => offer.status === 'active' && offer.can_buy);
  const current = active || offers[0] || null;
  if (!current) return { offer: null, status: null, countdown: '', endedAt: '' };

  if (current.status === 'active' || current.can_buy) {
    const end = current.end_time ? new Date(current.end_time) : null;
    return {
      offer: current,
      status: 'active',
      countdown: end ? countdown(end.getTime()) : '',
      endedAt: end ? end.toISOString() : '',
    };
  }

  if (current.status === 'expired') {
    return { offer: current, status: 'expired', countdown: '', endedAt: current.end_time || '' };
  }

  return { offer: current, status: 'pending', countdown: current.start_time ? countdown(new Date(current.start_time).getTime()) : '', endedAt: current.start_time || '' };
}

export async function loadOffers(api) {
  const [daily, flash] = await Promise.allSettled([
    api.get('daily_deals', { select: '*', order: 'id.desc' }),
    api.get('flash_offers', { select: '*', order: 'start_time.desc' }),
  ]);
  return {
    daily: daily.status === 'fulfilled' && daily.value.length ? daily.value.map((row) => normalizeOffer(row, 'daily')) : [],
    flash: flash.status === 'fulfilled' && flash.value.length ? flash.value.map((row) => normalizeOffer(row, 'flash')) : [],
  };
}

export function countdown(targetTs) {
  const diff = Math.max(0, targetTs - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}ي ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
