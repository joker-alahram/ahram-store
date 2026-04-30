async function apiGet(path, params = {}) {
  const url = new URL(`${CONFIG.baseUrl}/${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), {
    headers: {
      apikey: CONFIG.apiKey,
      Authorization: `Bearer ${CONFIG.apiKey}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} failed: ${res.status} ${text}`);
  }
  return await res.json();
}
async function apiPost(path, body) {
  const res = await fetch(`${CONFIG.baseUrl}/${path}`, {
    method: 'POST',
    headers: {
      apikey: CONFIG.apiKey,
      Authorization: `Bearer ${CONFIG.apiKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed: ${res.status} ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}
async function apiPatch(path, body, params = {}) {
  const url = new URL(`${CONFIG.baseUrl}/${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), {
    method: 'PATCH',
    headers: {
      apikey: CONFIG.apiKey,
      Authorization: `Bearer ${CONFIG.apiKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PATCH ${path} failed: ${res.status} ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}
function ensureIsoNow() {
  return new Date().toISOString();
}
function localVisitorId() {
  const key = 'b2b_visitor_id';
  let value = localStorage.getItem(key);
  if (!value) {
    value = `v_${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(key, value);
  }
  return value;
}
function localSessionId() {
  const key = 'b2b_session_id';
  let value = sessionStorage.getItem(key);
  if (!value) {
    value = `s_${Math.random().toString(36).slice(2, 12)}`;
    sessionStorage.setItem(key, value);
  }
  return value;
}
async function safeTrack(path, payloads = []) {
  for (const payload of payloads) {
    try {
      return await apiPost(path, payload);
    } catch (error) {
      continue;
    }
  }
  return [];
}
function trimEmptyObject(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''));
}
async function trackRecommendationSignal({ source, entity_type, entity_id, signal_type, weight = 1, metadata = null }) {
  const now = Date.now();
  if (now - state.behavior.lastRecommendationSignalAt < 1200 && source === 'page_visit') return;
  state.behavior.lastRecommendationSignalAt = now;

  const payload = trimEmptyObject({
    visitor_id: localVisitorId(),
    session_id: localSessionId(),
    user_id: state.session?.id || null,
    customer_id: state.session?.userType === 'customer' ? state.session?.id || null : state.selectedCustomer?.id || null,
    rep_id: state.session?.userType === 'rep' ? state.session?.id || null : null,
    source: source || 'ui',
    entity_type: entity_type || null,
    entity_id: entity_id || null,
    signal_type: signal_type || 'view',
    weight: Number(weight || 1),
    metadata: metadata ? JSON.stringify(metadata) : null,
    created_at: ensureIsoNow(),
  });

  await safeTrack('recommendation_signals', [
    payload,
    trimEmptyObject({
      source: payload.source,
      entity_type: payload.entity_type,
      entity_id: payload.entity_id,
      signal_type: payload.signal_type,
      weight: payload.weight,
      created_at: payload.created_at,
    }),
    trimEmptyObject({
      entity_type: payload.entity_type,
      entity_id: payload.entity_id,
      weight: payload.weight,
      created_at: payload.created_at,
    }),
  ]);
}
async function trackPageVisit(extra = {}) {
  const hash = location.hash || '#home';
  if (state.behavior.lastTrackedHash === hash) return;
  state.behavior.lastTrackedHash = hash;

  const common = trimEmptyObject({
    visitor_id: localVisitorId(),
    session_id: localSessionId(),
    user_id: state.session?.id || null,
    customer_id: state.session?.userType === 'customer' ? state.session?.id || null : state.selectedCustomer?.id || null,
    rep_id: state.session?.userType === 'rep' ? state.session?.id || null : null,
    page_type: state.view?.type || 'home',
    page_key: state.view?.companyId || null,
    page_title: extra.page_title || document.title || 'store',
    path: hash,
    referrer: document.referrer || null,
    metadata: extra.metadata ? JSON.stringify(extra.metadata) : null,
    signal_type: extra.signal_type || 'view',
    created_at: ensureIsoNow(),
  });

  await safeTrack('page_visits', [
    common,
    trimEmptyObject({
      visitor_id: common.visitor_id,
      user_id: common.user_id,
      page_type: common.page_type,
      page_key: common.page_key,
      path: common.path,
      created_at: common.created_at,
    }),
    trimEmptyObject({
      page_type: common.page_type,
      page_key: common.page_key,
      path: common.path,
      created_at: common.created_at,
    }),
  ]);

  await trackRecommendationSignal({
    source: 'page_visit',
    entity_type: 'page',
    entity_id: common.page_key || common.page_type,
    signal_type: 'view',
    weight: 1,
    metadata: {
      hash,
      page_type: state.view?.type || 'home',
    },
  });
}
async function trackCartEvent(action, item = {}, extra = {}) {
  const payload = trimEmptyObject({
    visitor_id: localVisitorId(),
    session_id: localSessionId(),
    user_id: state.session?.id || null,
    customer_id: state.session?.userType === 'customer' ? state.session?.id || null : state.selectedCustomer?.id || null,
    rep_id: state.session?.userType === 'rep' ? state.session?.id || null : null,
    event_type: String(action || '').toUpperCase(),
    action: String(action || '').toUpperCase(),
    product_id: item?.id ?? item?.product_id ?? null,
    product_title: item?.title ?? item?.product_name ?? null,
    company_id: item?.company_id ?? item?.company ?? null,
    unit: item?.unit ?? null,
    qty: Number(item?.qty || extra.qty || 1),
    price: Number(item?.price || extra.price || 0),
    cart_total: Number(cartTotal().toFixed(2)),
    source: extra.source || 'ui',
    metadata: extra.metadata ? JSON.stringify(extra.metadata) : null,
    created_at: ensureIsoNow(),
  });

  await safeTrack('cart_events', [
    payload,
    trimEmptyObject({
      event_type: payload.event_type,
      product_id: payload.product_id,
      qty: payload.qty,
      price: payload.price,
      created_at: payload.created_at,
    }),
    trimEmptyObject({
      action: payload.action,
      product_id: payload.product_id,
      created_at: payload.created_at,
    }),
  ]);

  await trackRecommendationSignal({
    source: 'cart_event',
    entity_type: 'product',
    entity_id: payload.product_id || payload.product_title || 'cart',
    signal_type: action,
    weight: action === 'remove' ? -1 : action === 'update' ? 1 : 2,
    metadata: {
      unit: payload.unit,
      qty: payload.qty,
      price: payload.price,
    },
  });
}
async function trackPurchaseEvent(order, items = []) {
  const payload = trimEmptyObject({
    visitor_id: localVisitorId(),
    session_id: localSessionId(),
    user_id: state.session?.id || null,
    customer_id: order?.customer_id || state.selectedCustomer?.id || state.session?.id || null,
    rep_id: order?.sales_rep_id || (state.session?.userType === 'rep' ? state.session?.id || null : null),
    order_id: order?.id || null,
    order_number: order?.order_number || null,
    invoice_number: order?.invoice_number || null,
    customer_type: state.session?.userType || order?.user_type || null,
    tier_name: order?.tier_name || tierName() || null,
    total_amount: Number(order?.total_amount || cartTotal() || 0),
    item_count: items.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    source: 'checkout',
    created_at: ensureIsoNow(),
  });

  await safeTrack('purchase_events', [
    payload,
    trimEmptyObject({
      order_id: payload.order_id,
      order_number: payload.order_number,
      total_amount: payload.total_amount,
      created_at: payload.created_at,
    }),
    trimEmptyObject({
      order_number: payload.order_number,
      customer_id: payload.customer_id,
      created_at: payload.created_at,
    }),
  ]);

  await trackRecommendationSignal({
    source: 'purchase_event',
    entity_type: 'order',
    entity_id: payload.order_id || payload.order_number || 'purchase',
    signal_type: 'purchase',
    weight: 3,
    metadata: {
      total_amount: payload.total_amount,
      item_count: payload.item_count,
    },
  });
}
