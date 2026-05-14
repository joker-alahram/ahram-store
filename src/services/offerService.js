export function isOfferActive(offer) {
  if (!offer) return false;
  const runtimeStatus = String(offer.runtime_status || offer.status || '').trim().toLowerCase();
  return runtimeStatus === 'active' && offer.is_checkout_available !== false;
}

function formatDuration(ms) {
  const total = Math.max(0, Math.floor(Number(ms || 0) / 1000));
  const hours = String(Math.floor(total / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function buildCountdownVisual(offer) {
  const nowTs = Date.now();
  const endTs = Date.parse(offer?.end_time || offer?.cairo_end_time || '');
  if (!Number.isFinite(endTs)) return '';
  return formatDuration(endTs - nowTs);
}

function normalizeOffer(row, kind) {
  const runtimeStatus = String(row.runtime_status || row.status || (kind === 'flash' ? 'scheduled' : 'active') || '').trim().toLowerCase();
  const isCheckoutAvailable = row.is_checkout_available !== false;
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
    can_buy: row.can_buy !== false && (kind === 'flash' ? isOfferActive({ runtime_status: runtimeStatus, status: row.status, is_checkout_available: isCheckoutAvailable }) : true),
    runtime_status: runtimeStatus,
    is_checkout_available: isCheckoutAvailable,
    status: String(row.status || row.runtime_status || (kind === 'flash' ? 'scheduled' : 'active') || '').trim().toLowerCase(),
    utc_now: row.utc_now || null,
    cairo_now: row.cairo_now || null,
    start_time: row.start_time_cairo || row.start_time || null,
    end_time: row.end_time_cairo || row.end_time || null,
    cairo_start_time: row.cairo_start_time || row.start_time_cairo || row.start_time || null,
    cairo_end_time: row.cairo_end_time || row.end_time_cairo || row.end_time || null,
    current_time: row.current_time_cairo || row.current_time || row.cairo_now || null,
  };
}

export function computeFlashState(offers = []) {
  const active = offers.find((offer) => isOfferActive(offer));
  const current = active || offers.find((offer) => String(offer.runtime_status || offer.status || '').trim().toLowerCase() === 'scheduled') || null;

  if (!current) {
    return { offer: null, status: null, countdown: '', endedAt: '' };
  }

  const runtimeStatus = String(current.runtime_status || current.status || '').trim().toLowerCase();
  return {
    offer: current,
    status: runtimeStatus === 'active' ? 'active' : runtimeStatus === 'scheduled' ? 'scheduled' : null,
    countdown: buildCountdownVisual(current),
    endedAt: String(current.end_time || current.cairo_end_time || current.start_time || current.cairo_start_time || '')
  };
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
  return String(targetTs || '');
}

export { normalizeOffer };
