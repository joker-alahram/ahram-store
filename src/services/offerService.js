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
    runtime_status: String(row.runtime_status || row.status || (kind === 'flash' ? 'scheduled' : 'active') || '').trim().toLowerCase(),
    status: String(row.status || row.runtime_status || (kind === 'flash' ? 'scheduled' : 'active') || '').trim().toLowerCase(),
    start_time: row.start_time_cairo || row.start_time || null,
    end_time: row.end_time_cairo || row.end_time || null,
    current_time: row.current_time_cairo || row.current_time || null,
  };
}

function parseTimestamp(value) {
  if (!value) return null;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function formatCountdown(targetTs) {
  if (!Number.isFinite(targetTs)) return '';
  const diff = Math.max(0, targetTs - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const body = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return days > 0 ? `${days}ي ${body}` : body;
}

export function computeFlashState(offers = []) {
  const active = offers.find((offer) => String(offer.runtime_status || offer.status || '').trim().toLowerCase() === 'active');
  const current = active || offers.find((offer) => String(offer.runtime_status || offer.status || '').trim().toLowerCase() !== 'expired') || null;

  if (!current) {
    return { offer: null, status: null, countdown: '', endedAt: '' };
  }

  const runtimeStatus = String(current.runtime_status || current.status || '').trim().toLowerCase();
  const endTs = parseTimestamp(current.end_time);
  const startTs = parseTimestamp(current.start_time);

  if (runtimeStatus === 'active') {
    if (!Number.isFinite(endTs) || endTs <= Date.now()) {
      return { offer: null, status: null, countdown: '', endedAt: '' };
    }
    return {
      offer: current,
      status: 'active',
      countdown: formatCountdown(endTs),
      endedAt: new Date(endTs).toISOString(),
    };
  }

  if (runtimeStatus === 'expired') {
    return { offer: null, status: null, countdown: '', endedAt: '' };
  }

  if (runtimeStatus === 'scheduled') {
    if (!Number.isFinite(startTs)) {
      return { offer: null, status: null, countdown: '', endedAt: '' };
    }
    return {
      offer: current,
      status: 'scheduled',
      countdown: formatCountdown(startTs),
      endedAt: new Date(startTs).toISOString(),
    };
  }

  return { offer: null, status: null, countdown: '', endedAt: '' };
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
  return formatCountdown(Number(targetTs));
}
