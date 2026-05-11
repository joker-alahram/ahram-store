function parseTimestamp(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    const ts = value.getTime();
    return Number.isFinite(ts) ? ts : null;
  }
  if (typeof value === 'number') {
    const ts = Number.isFinite(value) ? value : null;
    if (ts === null) return null;
    return ts < 1e12 ? ts * 1000 : ts;
  }
  const raw = Date.parse(String(value));
  return Number.isFinite(raw) ? raw : null;
}

function resolveTimestamp(...values) {
  for (const value of values) {
    const ts = parseTimestamp(value);
    if (ts !== null) return ts;
  }
  return null;
}

function normalizeOffer(row, kind) {
  return {
    ...row,
    kind,
    id: row.id,
    title: String(row.title ?? '').trim(),
    description: String(row.description ?? '').trim(),
    image: row.image || '',
    price: Number(row.price ?? 0),
    stock: Number(row.stock ?? 0),
    sold_count: Number(row.sold_count ?? 0),
    can_buy: row.can_buy !== false,
    status: row.runtime_status || row.status || (kind === 'flash' ? 'scheduled' : 'active'),
    start_time: row.start_time_cairo || row.start_time || null,
    end_time: row.end_time_cairo || row.end_time || null,
    current_time: row.current_time_cairo || row.current_time || null,
  };
}

function offerSortScore(offer, index) {
  const startTs = resolveTimestamp(offer.start_time, offer.current_time, offer.end_time);
  const endTs = resolveTimestamp(offer.end_time, offer.current_time, offer.start_time);
  return {
    active: offer.status === 'active' && offer.can_buy !== false,
    scheduled: offer.status === 'scheduled' && offer.can_buy !== false,
    expired: offer.status === 'expired',
    startTs: startTs ?? Number.POSITIVE_INFINITY,
    endTs: endTs ?? Number.POSITIVE_INFINITY,
    index,
  };
}

export function computeFlashState(offers = []) {
  const normalized = (Array.isArray(offers) ? offers : [])
    .filter(Boolean)
    .map((offer, index) => ({ offer, score: offerSortScore(offer, index) }));

  const active = normalized
    .filter(({ score }) => score.active)
    .sort((a, b) => a.score.startTs - b.score.startTs || a.score.endTs - b.score.endTs || a.score.index - b.score.index)[0];
  const scheduled = normalized
    .filter(({ score }) => score.scheduled)
    .sort((a, b) => a.score.startTs - b.score.startTs || a.score.index - b.score.index)[0];
  const expired = normalized
    .filter(({ score }) => score.expired)
    .sort((a, b) => a.score.endTs - b.score.endTs || a.score.index - b.score.index)[0];
  const current = active || scheduled || expired || normalized[0] || null;

  if (!current) {
    return { offer: null, status: null, countdown: '', endedAt: '' };
  }

  if (current.score.active) {
    const endTs = resolveTimestamp(current.offer.end_time, current.offer.current_time, current.offer.start_time);
    return {
      offer: current.offer,
      status: 'active',
      countdown: endTs !== null ? countdown(endTs) : '',
      endedAt: endTs !== null ? new Date(endTs).toISOString() : '',
    };
  }

  if (current.score.expired) {
    const endTs = resolveTimestamp(current.offer.end_time, current.offer.current_time, current.offer.start_time);
    return {
      offer: current.offer,
      status: 'expired',
      countdown: '',
      endedAt: endTs !== null ? new Date(endTs).toISOString() : String(current.offer.end_time || ''),
    };
  }

  const startTs = resolveTimestamp(current.offer.start_time, current.offer.current_time, current.offer.end_time);
  return {
    offer: current.offer,
    status: 'scheduled',
    countdown: startTs !== null ? countdown(startTs) : '',
    endedAt: startTs !== null ? new Date(startTs).toISOString() : String(current.offer.start_time || ''),
  };
}

export async function loadOffers(api) {
  const [daily, flash] = await Promise.allSettled([
    api.get('v_daily_deals', { select: '*', order: 'id.desc' }),
    api.get('v_flash_offers_runtime', { select: '*', order: 'start_time.desc' }),
  ]);

  return {
    daily: daily.status === 'fulfilled' && daily.value.length ? daily.value.map((row) => normalizeOffer(row, 'daily')) : [],
    flash: flash.status === 'fulfilled' && flash.value.length ? flash.value.map((row) => normalizeOffer(row, 'flash')) : [],
  };
}

export function countdown(targetTs) {
  if (!Number.isFinite(targetTs)) return '';
  const diff = Math.max(0, targetTs - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) {
    return `${days}ي ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
