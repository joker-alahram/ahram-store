import { findProductVariant } from './catalogService.js';
import { buildPricingSnapshot } from './pricingService.js';

export function createCartService(store, eventLog) {
  function updateCart(updater, meta = {}) {
    store.setState((state) => ({ cart: updater(state.cart, state) }), meta);
  }

  function snapshotFromProduct(row) {
    return {
      key: `${row.product_id}:${row.unit_code}:${row.tier_name}`,
      product_id: row.product_id,
      product_name_snapshot: row.product_name,
      unit_code_snapshot: row.unit_code,
      tier_snapshot: row.tier_name,
      unit_price_snapshot: row.final_price,
      quantity: 1,
      line_total: row.final_price,
      pricing_snapshot: buildPricingSnapshot(row),
      kind: 'product'
    };
  }

  return {
    reconcilePricing() {
      const state = store.getState();
      const cart = state.cart;
      const items = cart.items.map((item) => {
        if (item.kind !== 'product') return item;
        const row = findProductVariant(state.data.products, item.product_id, item.unit_code_snapshot, item.tier_snapshot) || state.data.products.find((p) => p.product_id === item.product_id);
        if (!row) return item;
        const base = snapshotFromProduct(row);
        return { ...item, unit_price_snapshot: base.unit_price_snapshot, tier_snapshot: row.tier_name, pricing_snapshot: base.pricing_snapshot, line_total: base.unit_price_snapshot * item.quantity };
      });
      updateCart((current) => ({ ...current, items }));
    },
    addProduct(row, quantity = 1) {
      const state = store.getState();
      const existing = state.cart.items.find((item) => item.kind === 'product' && item.product_id === row.product_id && item.unit_code_snapshot === row.unit_code && item.tier_snapshot === row.tier_name);
      let items;
      if (existing) {
        items = state.cart.items.map((item) => item === existing ? { ...item, quantity: item.quantity + quantity, line_total: item.unit_price_snapshot * (item.quantity + quantity) } : item);
      } else {
        items = [...state.cart.items, { ...snapshotFromProduct(row), quantity, line_total: row.final_price * quantity }];
      }
      updateCart((current) => ({ ...current, items, updated_at: new Date().toISOString() }), { action: 'add_to_cart' });
      eventLog('add_to_cart', { actor_id: state.auth.user?.id, actor_type: state.auth.user?.user_type || state.auth.role, session_id: state.auth.session?.session_id, payload: { product_id: row.product_id, quantity } });
    },
    addOffer(offer, kind) {
      const state = store.getState();
      const key = `${kind}:${offer.id}`;
      const existing = state.cart.items.find((item) => item.key === key);
      const item = {
        key,
        kind: 'offer',
        offer_kind: kind,
        offer_id: offer.id,
        product_id: `offer-${kind}-${offer.id}`,
        product_name_snapshot: offer.title,
        unit_code_snapshot: 'offer',
        tier_snapshot: 'base',
        unit_price_snapshot: Number(offer.price || 0),
        quantity: 1,
        line_total: Number(offer.price || 0),
        pricing_snapshot: { final_price: Number(offer.price || 0), title: offer.title }
      };
      const items = existing ? state.cart.items : [...state.cart.items, item];
      updateCart((current) => ({ ...current, items, updated_at: new Date().toISOString() }), { action: 'add_offer' });
      eventLog('add_to_cart', { actor_id: state.auth.user?.id, actor_type: state.auth.user?.user_type || state.auth.role, session_id: state.auth.session?.session_id, payload: { offer_id: offer.id, kind } });
    },
    setQuantity(key, quantity) {
      updateCart((current) => {
        const items = current.items.map((item) => item.key === key ? { ...item, quantity: Math.max(1, quantity), line_total: item.unit_price_snapshot * Math.max(1, quantity) } : item);
        return { ...current, items, updated_at: new Date().toISOString() };
      }, { action: 'quantity_change' });
      eventLog('quantity_change', { actor_id: store.getState().auth.user?.id, actor_type: store.getState().auth.user?.user_type || store.getState().auth.role, session_id: store.getState().auth.session?.session_id, payload: { key, quantity } });
    },
    remove(key) {
      updateCart((current) => ({ ...current, items: current.items.filter((item) => item.key !== key), updated_at: new Date().toISOString() }), { action: 'remove_from_cart' });
      eventLog('remove_from_cart', { actor_id: store.getState().auth.user?.id, actor_type: store.getState().auth.user?.user_type || store.getState().auth.role, session_id: store.getState().auth.session?.session_id, payload: { key } });
    },
    clear() {
      updateCart((current) => ({ ...current, items: [], updated_at: new Date().toISOString() }), { action: 'clear_cart' });
    }
  };
}
