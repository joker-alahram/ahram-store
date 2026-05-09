import { storageKeys, saveJSON } from '../core/storage.js';
import { labelForUnit, resolvePrice, resolveProductUnit } from './pricingService.js';

export function hydrateCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKeys.cart) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistCart(cart) {
  saveJSON(storageKeys.cart, cart);
}

export function cartKey(item) {
  return `${item.type}:${item.id}:${item.unit || 'single'}`;
}

export function addProductToCart(cart, product, tier, unitPreference, quantity = 1) {
  const unit = resolveProductUnit(product, unitPreference);
  const key = cartKey({ type: 'product', id: product.product_id, unit });
  const existing = cart.find((item) => item.key === key);
  if (existing) return { cart: cart.filter((item) => item.key !== key), added: false, key };

  const price = resolvePrice(product, unit);
  const unitRow = Array.isArray(product.units) ? product.units.find((item) => String(item.unit_code) === String(unit)) : null;
  const next = [...cart, {
    key,
    type: 'product',
    id: product.product_id,
    title: product.product_name,
    image: product.product_image || '',
    companyId: product.company_id,
    companyName: product.company_name,
    categoryName: product.category_name,
    unit,
    unitLabel: labelForUnit(unit),
    qty: Math.max(1, Number(quantity || 1)),
    price: Number(price || 0),
    snapshot: {
      tierName: tier?.tier_name || null,
      unit,
      basePrice: Number(price || 0),
      availableQty: Number(unitRow?.available_qty || 0),
      productName: product.product_name,
      companyName: product.company_name,
      categoryName: product.category_name,
    },
  }];
  return { cart: next, added: true, key };
}

export function toggleOfferInCart(cart, offer, kind) {
  const key = `${kind}:${offer.id}:single`;
  const existing = cart.find((item) => item.key === key);
  if (existing) return { cart: cart.filter((item) => item.key !== key), added: false, key };
  return {
    cart: [...cart, {
      key,
      type: kind,
      id: offer.id,
      title: offer.title,
      image: offer.image || '',
      companyId: offer.company_id || null,
      companyName: kind === 'deal' ? 'صفقة اليوم' : 'عرض الساعة',
      unit: 'single',
      unitLabel: 'قطعة',
      qty: 1,
      price: Number(offer.price || 0),
      snapshot: { offerKind: kind, offerId: offer.id },
    }],
    added: true,
    key,
  };
}

export function updateQty(cart, key, qty) {
  return cart.map((item) => (item.key === key ? { ...item, qty: Math.max(1, Number(qty || 1)) } : item));
}

export function removeItem(cart, key) {
  return cart.filter((item) => item.key !== key);
}

export function clearCart() {
  saveJSON(storageKeys.cart, []);
  return [];
}

export function recalcCart(cart, productsById, tier) {
  return (cart || []).map((item) => {
    if (item.type !== 'product') return item;
    const product = productsById?.[item.id];
    if (!product) return item;
    const price = resolvePrice(product, item.unit);
    const unitRow = Array.isArray(product.units) ? product.units.find((row) => String(row.unit_code) === String(item.unit)) : null;
    return {
      ...item,
      price: Number((price ?? item.price) || 0),
      companyName: product.company_name,
      unitLabel: labelForUnit(item.unit),
      image: product.product_image || item.image || '',
      snapshot: {
        tierName: tier?.tier_name || null,
        unit: item.unit,
        basePrice: Number((price ?? item.price) || 0),
        availableQty: Number(unitRow?.available_qty || 0),
        productName: product.product_name,
        companyName: product.company_name,
        categoryName: product.category_name,
      },
    };
  });
}

export function computeTotals(cart) {
  return (cart || []).reduce((acc, item) => {
    const line = Number(item.price || 0) * Number(item.qty || 0);
    acc.grand += line;
    if (item.type === 'product') acc.products += line;
    if (item.type === 'deal') acc.deals += line;
    if (item.type === 'flash') acc.flash += line;
    acc.count += Number(item.qty || 0);
    return acc;
  }, { grand: 0, products: 0, deals: 0, flash: 0, count: 0 });
}
