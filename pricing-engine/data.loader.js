import { CONFIG, STORAGE_KEYS } from '../config.js';
import { TTLCache } from './cache.js';
import { PricingError, ERROR_CODES } from './errors.js';
import { normalizeArray, normalizeString } from './validators.js';

function memoryStorage() {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); },
  };
}

function getStorage(storage) {
  if (storage) return storage;
  if (typeof localStorage !== 'undefined') return localStorage;
  return memoryStorage();
}

function mergeByKey(primary = [], secondary = [], key = 'id') {
  const out = [];
  const secondaryMap = new Map();
  for (const row of normalizeArray(secondary)) {
    secondaryMap.set(String(row?.[key]), row);
  }
  for (const row of normalizeArray(primary)) {
    const match = secondaryMap.get(String(row?.[key]));
    out.push(match ? { ...match, ...row } : { ...row });
    secondaryMap.delete(String(row?.[key]));
  }
  for (const row of secondaryMap.values()) {
    out.push({ ...row });
  }
  return out;
}

function createMap(rows, keyFn) {
  const map = new Map();
  for (const row of normalizeArray(rows)) {
    const key = keyFn(row);
    if (key !== null && key !== undefined && String(key).trim() !== '') {
      map.set(String(key), row);
    }
  }
  return map;
}

function buildRequestUrl(baseUrl, table, params = {}) {
  const url = new URL(`${baseUrl}/${table}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, value);
  });
  return url.toString();
}

function defaultFetch() {
  if (typeof fetch === 'function') return fetch.bind(globalThis);
  throw new Error('fetch is not available in this environment');
}

function defaultHeaders(apiKey) {
  return {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
  };
}

export function createDataLoader(options = {}) {
  const baseUrl = options.baseUrl || CONFIG.baseUrl;
  const apiKey = options.apiKey || CONFIG.apiKey;
  const fetchImpl = options.fetchImpl || defaultFetch();
  const storage = getStorage(options.storage);
  const cache = options.cache || new TTLCache(options.cacheTtlMs || CONFIG.cacheTtlMs);
  const datasetCacheKey = options.datasetCacheKey || STORAGE_KEYS.dataCache;
  const requestInflight = new Map();

  let catalogPromise = null;
  let catalog = null;

  function readCachedDataset() {
    try {
      const raw = storage.getItem(datasetCacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function saveCachedDataset(payload) {
    try {
      storage.setItem(datasetCacheKey, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }

  async function fetchJson(table, params = {}, requestOptions = {}) {
    const url = buildRequestUrl(baseUrl, table, params);
    const cacheKey = requestOptions.cacheKey || url;
    if (requestInflight.has(cacheKey)) {
      return requestInflight.get(cacheKey);
    }

    const cached = cache.get(cacheKey);
    if (cached !== undefined) return cached;

    const task = (async () => {
      const {
        timeoutMs = 15000,
        retries = 2,
        method = 'GET',
        body = null,
      } = requestOptions;

      let lastError = null;
      for (let attempt = 0; attempt <= retries; attempt += 1) {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
        try {
          const response = await fetchImpl(url, {
            method,
            headers: {
              ...defaultHeaders(apiKey),
              ...(method === 'GET' ? {} : {
                'Content-Type': 'application/json',
                Prefer: 'return=representation',
              }),
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: controller?.signal,
          });
          if (timer) clearTimeout(timer);
          if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new PricingError(
              ERROR_CODES.INVALID_INPUT,
              `Request failed: ${method} ${table} (${response.status})`,
              { table, status: response.status, text }
            );
          }
          const json = await response.json();
          cache.set(cacheKey, json);
          return json;
        } catch (error) {
          if (timer) clearTimeout(timer);
          lastError = error;
          const aborted = error?.name === 'AbortError' || error?.name === 'TimeoutError';
          if (attempt < retries && (aborted || true)) {
            const delay = Math.min(650, 220 * (attempt + 1));
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          break;
        }
      }
      throw lastError;
    })();

    requestInflight.set(cacheKey, task.finally(() => requestInflight.delete(cacheKey)));
    return requestInflight.get(cacheKey);
  }

  async function loadTable(table, params = {}) {
    return normalizeArray(await fetchJson(table, params));
  }

  function normalizeCatalog(raw) {
    const products = mergeByKey(raw.products, raw.v_products, 'product_id');
    const deals = mergeByKey(raw.daily_deals, raw.v_daily_deals, 'id');
    const flashOffers = mergeByKey(raw.flash_offers, raw.v_flash_offers, 'id');

    const tiers = normalizeArray(raw.tiers);
    const companies = normalizeArray(raw.companies);
    const pricesCarton = normalizeArray(raw.prices_carton);
    const pricesPack = normalizeArray(raw.prices_pack);
    const customers = normalizeArray(raw.customers);

    const productsById = createMap(products, (row) => row.product_id);
    const productsViewById = createMap(raw.v_products, (row) => row.product_id);
    const dealsById = createMap(deals, (row) => row.id);
    const flashById = createMap(flashOffers, (row) => row.id);
    const tiersByName = createMap(tiers, (row) => row.tier_name);
    const companiesById = createMap(companies, (row) => row.company_id);

    const cartonPriceByKey = new Map();
    for (const row of pricesCarton) {
      const key = [String(row.product_id), String(row.tier_name), 'carton'].join('|');
      cartonPriceByKey.set(key, row);
    }

    const packPriceByKey = new Map();
    for (const row of pricesPack) {
      const key = [String(row.product_id), String(row.tier_name), 'pack'].join('|');
      packPriceByKey.set(key, row);
    }

    const defaultTier = tiers.find((tier) => tier?.is_default) || tiers.find((tier) => tier?.is_active) || tiers[0] || null;

    return {
      loadedAt: Date.now(),
      raw,
      products,
      productsById,
      productsViewById,
      deals,
      dealsById,
      flashOffers,
      flashById,
      tiers,
      tiersByName,
      defaultTier,
      companies,
      companiesById,
      pricesCarton,
      pricesPack,
      cartonPriceByKey,
      packPriceByKey,
      customers,
      customersById: createMap(customers, (row) => row.id),
      customersByUsername: createMap(customers, (row) => row.username),
      customersByPhone: createMap(customers, (row) => row.phone),
    };
  }

  async function loadCatalog({ force = false } = {}) {
    if (catalog && !force) return catalog;
    if (catalogPromise && !force) return catalogPromise;

    catalogPromise = (async () => {
      const cached = !force ? readCachedDataset() : null;
      if (cached && cached.loadedAt && (Date.now() - cached.loadedAt) < (options.datasetTtlMs || CONFIG.cacheTtlMs)) {
        catalog = normalizeCatalog(cached.data || cached);
        return catalog;
      }

      const raw = {
        products: await loadTable('products', { select: '*' }),
        companies: await loadTable('companies', { select: '*' }),
        tiers: await loadTable('tiers', { select: '*' }),
        prices_carton: await loadTable('prices_carton', { select: '*' }),
        prices_pack: await loadTable('prices_pack', { select: '*' }),
        daily_deals: await loadTable('daily_deals', { select: '*' }),
        flash_offers: await loadTable('flash_offers', { select: '*' }),
        customers: await loadTable('customers', { select: '*' }),
        v_products: await loadTable('v_products', { select: '*' }).catch(() => []),
        v_daily_deals: await loadTable('v_daily_deals', { select: '*' }).catch(() => []),
        v_flash_offers: await loadTable('v_flash_offers', { select: '*' }).catch(() => []),
      };

      const normalized = normalizeCatalog(raw);
      catalog = normalized;
      saveCachedDataset({ loadedAt: normalized.loadedAt, data: raw });
      return normalized;
    })();

    try {
      return await catalogPromise;
    } finally {
      catalogPromise = null;
    }
  }

  function requireCatalog() {
    if (!catalog) {
      throw new PricingError(ERROR_CODES.NO_CATALOG, 'Catalog has not been loaded', {});
    }
    return catalog;
  }

  function getCatalog() {
    return requireCatalog();
  }

  async function ensureCatalog() {
    return loadCatalog();
  }

  function getProduct(productId) {
    const key = String(productId);
    return catalog?.productsById.get(key) || null;
  }

  function getViewProduct(productId) {
    const key = String(productId);
    return catalog?.productsViewById.get(key) || null;
  }

  function getTier(tierName) {
    if (!catalog) return null;
    const key = String(tierName || '');
    return catalog.tiersByName.get(key) || null;
  }

  function getDefaultTier() {
    return catalog?.defaultTier || null;
  }

  function getCompany(companyId) {
    return catalog?.companiesById.get(String(companyId)) || null;
  }

  function getPriceRow(productId, tierName, unit) {
    if (!catalog) return null;
    const key = [String(productId), String(tierName || ''), String(unit || '')].join('|');
    const source = String(unit) === 'carton' ? catalog.cartonPriceByKey : catalog.packPriceByKey;
    return source.get(key) || null;
  }

  function getFallbackViewPrice(productId, unit) {
    const viewRow = getViewProduct(productId);
    if (!viewRow) return null;
    const raw = String(unit) === 'carton' ? viewRow.carton_price : viewRow.pack_price;
    if (raw === undefined || raw === null || raw === '') return null;
    return {
      product_id: String(productId),
      tier_name: getDefaultTier()?.tier_name || '',
      price: Number(raw),
      visible: true,
      fallback: true,
    };
  }

  function getDeal(dealId) {
    return catalog?.dealsById.get(String(dealId)) || null;
  }

  function getFlash(flashId) {
    return catalog?.flashById.get(String(flashId)) || null;
  }

  function getCustomer(identifier) {
    if (!catalog) return null;
    const key = normalizeString(identifier);
    if (!key) return null;
    return catalog.customersByUsername.get(key) || catalog.customersByPhone.get(key) || catalog.customersById.get(key) || null;
  }

  async function refreshCatalog() {
    return loadCatalog({ force: true });
  }

  function invalidateCache(key) {
    if (!key) {
      cache.clear();
      return;
    }
    cache.delete(key);
  }

  async function insert(table, rows) {
    const payload = Array.isArray(rows) ? rows : [rows];
    const url = buildRequestUrl(baseUrl, table, { select: '*' });
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        ...defaultHeaders(apiKey),
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new PricingError(ERROR_CODES.INVALID_INPUT, `Insert failed for ${table}`, { table, text });
    }
    return response.json();
  }

  async function update(table, matchParams, row) {
    const url = buildRequestUrl(baseUrl, table, matchParams);
    const response = await fetchImpl(url, {
      method: 'PATCH',
      headers: {
        ...defaultHeaders(apiKey),
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(row),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new PricingError(ERROR_CODES.INVALID_INPUT, `Update failed for ${table}`, { table, text });
    }
    return response.json();
  }

  return {
    baseUrl,
    apiKey,
    fetchJson,
    loadCatalog,
    ensureCatalog,
    refreshCatalog,
    getCatalog,
    invalidateCache,
    getProduct,
    getViewProduct,
    getTier,
    getDefaultTier,
    getCompany,
    getPriceRow,
    getFallbackViewPrice,
    getDeal,
    getFlash,
    getCustomer,
    insert,
    update,
    cache,
  };
}
