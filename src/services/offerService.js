function normalizeOffer(row, kind) {
  const runtimeStatus = String(row.runtime_status || row.status || (kind === 'flash' ? 'scheduled' : 'active') || '').trim().toLowerCase();
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
    can_buy: row.can_buy !== false && (kind === 'flash' ? runtimeStatus === 'active' : true),
    runtime_status: runtimeStatus,
    status: String(row.status || row.runtime_status || (kind === 'flash' ? 'scheduled' : 'active') || '').trim().toLowerCase(),
    start_time: row.start_time_cairo || row.start_time || null,
    end_time: row.end_time_cairo || row.end_time || null,
    current_time: row.current_time_cairo || row.current_time || null,
  };
}

function toDateParts(value) {
  const match = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?(?:\s?(Z|[+-]\d{2}:?\d{2}))?$/);
  if (!match) return null;
  const [, year, month, day, hour = '00', minute = '00', second = '00', ms = '0', zone = ''] = match;
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
    ms: Number(String(ms).padEnd(3, '0')),
    zone,
  };
}

function offsetMinutesForZone(date, timeZone = 'Africa/Cairo') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((asUTC - date.getTime()) / 60000);
}

function parseTimestampInCairo(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) {
    const direct = new Date(raw).getTime();
    return Number.isFinite(direct) ? direct : null;
  }
  const parts = toDateParts(raw);
  if (!parts) {
    const fallback = new Date(raw).getTime();
    return Number.isFinite(fallback) ? fallback : null;
  }
  const utcGuess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second, parts.ms);
  let adjusted = utcGuess;
  for (let i = 0; i < 2; i += 1) {
    const offset = offsetMinutesForZone(new Date(adjusted), 'Africa/Cairo');
    adjusted = utcGuess - (offset * 60_000);
  }
  return adjusted;
}

function formatCountdown(targetTs, nowTs = Date.now()) {
  if (!Number.isFinite(targetTs)) return '';
  const diff = Math.max(0, targetTs - nowTs);
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
  const endTs = parseTimestampInCairo(current.end_time);
  const startTs = parseTimestampInCairo(current.start_time);
  const nowTs = Date.now();

  if (runtimeStatus === 'active') {
    if (!Number.isFinite(endTs) || endTs <= nowTs) {
      return { offer: null, status: null, countdown: '', endedAt: '' };
    }
    return {
      offer: current,
      status: 'active',
      countdown: formatCountdown(endTs, nowTs),
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
      countdown: formatCountdown(startTs, nowTs),
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
    daily: daily.status === 'fulfilled' && Array.isArray(daily.value) && daily.value.length ? daily.value.map((row) => normalizeOffer(row, 'daily')) : [],
    flash: flash.status === 'fulfilled' && Array.isArray(flash.value) && flash.value.length ? flash.value.map((row) => normalizeOffer(row, 'flash')) : [],
  };
}

export function countdown(targetTs) {
  return formatCountdown(Number(targetTs));
}

export { normalizeOffer, parseTimestampInCairo };
