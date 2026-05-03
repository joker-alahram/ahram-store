export function assertCart(cart) {
  if (!Array.isArray(cart)) {
    throw new TypeError('cart must be an array');
  }
}

export function assertItem(item) {
  if (item === null || typeof item !== 'object') {
    throw new TypeError('cart item must be an object');
  }
}

export function toFiniteNumber(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new TypeError(`${label} must be a finite number`);
  }
  return n;
}

export function lineTotal(item) {
  assertItem(item);
  const price = toFiniteNumber(item.price, 'item.price');
  const qty = toFiniteNumber(item.qty, 'item.qty');
  return price * qty;
}

export function cartTotal(cart) {
  assertCart(cart);
  let total = 0;
  for (const item of cart) {
    total += lineTotal(item);
  }
  return total;
}

export function eligibleTierTotal(cart) {
  assertCart(cart);
  let total = 0;
  for (const item of cart) {
    assertItem(item);
    if (String(item.type) === 'product') {
      total += lineTotal(item);
    }
  }
  return total;
}

export function cartTotals(cart) {
  assertCart(cart);
  let products = 0;
  let deals = 0;
  let flash = 0;

  for (const item of cart) {
    assertItem(item);
    const total = lineTotal(item);
    if (String(item.type) === 'product') {
      products += total;
    } else if (String(item.type) === 'deal') {
      deals += total;
    } else if (String(item.type) === 'flash') {
      flash += total;
    }
  }

  return {
    total: products + deals + flash,
    eligible: products,
    products,
    deals,
    flash,
  };
}
