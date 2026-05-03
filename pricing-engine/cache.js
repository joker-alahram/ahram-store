export class TTLCache {
  constructor(ttlMs = 300000) {
    this.ttlMs = Math.max(1000, Number(ttlMs) || 300000);
    this.map = new Map();
  }

  _now() {
    return Date.now();
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this._now()) {
      this.map.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value, ttlMs = this.ttlMs) {
    this.map.set(key, {
      value,
      expiresAt: this._now() + Math.max(1000, Number(ttlMs) || this.ttlMs),
    });
    return value;
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  delete(key) {
    return this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }

  sweep() {
    const now = this._now();
    for (const [key, entry] of this.map.entries()) {
      if (entry.expiresAt <= now) this.map.delete(key);
    }
  }
}

export function makePriceCacheKey({ productId, tierName, unit, kind = 'product' }) {
  return [String(productId), String(tierName || ''), String(unit || ''), String(kind || '')].join('|');
}
