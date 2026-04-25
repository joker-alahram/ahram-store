/* global supabase */
const SUPABASE_URL = "https://upzuslyqfcvpbkqyzyxp.supabase.co";
const SUPABASE_KEY = "sb_publishable_vpqJxVuMbYbm0y3VvVhuJw_FBQkLvYg";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (id) => document.getElementById(id);

const state = {
  user: null,
  customer: null,
  settings: null,
  companies: [],
  products: [],
  deals: [],
  flashOffers: [],
  prices: { carton: [], pack: [], piece: [] },
  search: "",
  companyFilter: "all",
  currentSection: "home",
  cart: loadCart(),
  orders: [],
  customers: [],
  loading: false,
};

function log(...args) {
  console.log("[B2B]", ...args);
}

function notify(message, type = "info") {
  const el = $("toast");
  el.textContent = message;
  el.style.display = "block";
  el.style.background = type === "error" ? "#b91c1c" : type === "success" ? "#065f46" : "#111827";
  clearTimeout(notify._t);
  notify._t = setTimeout(() => { el.style.display = "none"; }, 3200);
}

function saveCart() {
  localStorage.setItem("b2b_cart_v1", JSON.stringify(state.cart));
  updateCartCount();
}

function loadCart() {
  try {
    const raw = localStorage.getItem("b2b_cart_v1");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to load cart", err);
    return [];
  }
}

function formatMoney(value) {
  const n = Number(value || 0);
  return `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP`;
}

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function normalizePhone(phone) {
  return safeText(phone).replace(/[^\d]/g, "");
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function uniqueByKey(items, key) {
  const map = new Map();
  items.forEach((item) => map.set(item[key], item));
  return [...map.values()];
}

function currentRole() {
  return state.user?.role || "guest";
}

function isRep() {
  return currentRole() === "rep";
}

function isCustomer() {
  return currentRole() === "customer";
}

function activeTierName() {
  return safeText(state.customer?.tier_name || "base").trim().toLowerCase() || "base";
}

function setStatus(text) {
  $("statusText").textContent = text;
}

function showModal(show) {
  $("authModal").style.display = show ? "flex" : "none";
}

function setActiveSection(section) {
  state.currentSection = section;
  document.querySelectorAll(".nav button[data-section]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === section);
  });
  document.querySelectorAll("main > section").forEach((sec) => sec.classList.add("hidden"));
  const target = $(`section-${section}`);
  if (target) target.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderSectionVisibility();
}

function renderSectionVisibility() {
  $("customersNavBtn").classList.toggle("hidden", !isRep());
  $("ordersNavBtn").classList.toggle("hidden", !state.user);
  $("authNavBtn").textContent = state.user ? "Account" : "Login/Register";
  $("heroLoginBtn").textContent = state.user ? "My Account" : "Login / Register";
  $("heroTitle").textContent = state.user
    ? `Welcome ${state.user.name || ""}`
    : "Wholesale store for reps and customers";
  $("heroText").textContent = state.user
    ? `Logged in as ${state.user.role}. Use the store, your orders, and role-specific modules.`
    : "Browse real catalog data from Supabase, build a cart locally, and submit orders with WhatsApp handoff after checkout.";
  $("ordersHint").textContent = state.user
    ? `Current role: ${state.user.role}${state.customer ? ` | Customer ID: ${state.customer.customer_id}` : ""}`
    : "Login to see your order history.";
}

function getPriceMatch(productId, tierName, table) {
  const tier = safeText(tierName || "base").trim().toLowerCase();
  const base = table.find((row) => safeText(row.product_id) === safeText(productId) && safeText(row.tier_name).trim().toLowerCase() === "base");
  const exact = table.find((row) => safeText(row.product_id) === safeText(productId) && safeText(row.tier_name).trim().toLowerCase() === tier);
  return exact || base || null;
}

function resolveProductPricing(product) {
  const tier = activeTierName();
  const carton = product.has_carton ? getPriceMatch(product.product_id, tier, state.prices.carton) : null;
  const pack = product.has_pack ? getPriceMatch(product.product_id, tier, state.prices.pack) : null;
  const piece = getPriceMatch(product.product_id, tier, state.prices.piece);
  const units = [];
  if (piece && Number(piece.price) > 0) units.push({ unit: "piece", price: Number(piece.price) });
  if (pack && Number(pack.price) > 0) units.push({ unit: "pack", price: Number(pack.price) });
  if (carton && Number(carton.price) > 0) units.push({ unit: "carton", price: Number(carton.price) });
  return units.sort((a, b) => {
    const order = { piece: 1, pack: 2, carton: 3 };
    return order[a.unit] - order[b.unit];
  });
}

function priceForItem(item) {
  if (item.kind === "product") return Number(item.price || 0) * Number(item.qty || 1);
  return Number(item.price || 0) * Number(item.qty || 1);
}

function cartSummary() {
  const sums = { products: 0, deals: 0, flash: 0, total: 0 };
  for (const item of state.cart) {
    const subtotal = priceForItem(item);
    if (item.kind === "product") sums.products += subtotal;
    if (item.kind === "deal") sums.deals += subtotal;
    if (item.kind === "flash") sums.flash += subtotal;
    sums.total += subtotal;
  }
  return sums;
}

function updateCartCount() {
  $("cartCount").textContent = `(${state.cart.reduce((n, it) => n + Number(it.qty || 1), 0)})`;
}

function saveDraft() {
  saveCart();
  notify("Cart draft saved locally.", "success");
}

function addToCart(item) {
  console.log("addToCart", item);
  const key = item.key || `${item.kind}:${item.id}:${item.unit || "na"}`;
  const existing = state.cart.find((row) => row.key === key);
  if (existing) {
    existing.qty += Number(item.qty || 1);
  } else {
    state.cart.push({
      key,
      kind: item.kind,
      id: safeText(item.id),
      product_id: safeText(item.product_id || item.id),
      title: safeText(item.title || item.product_name || item.name),
      unit: safeText(item.unit || "piece"),
      price: Number(item.price || 0),
      qty: Number(item.qty || 1),
      image: safeText(item.image || ""),
      meta: item.meta || {},
    });
  }
  saveCart();
  renderCart();
  notify("Added to cart.", "success");
}

function removeFromCart(key) {
  state.cart = state.cart.filter((row) => row.key !== key);
  saveCart();
  renderCart();
}

function updateCartQty(key, qty) {
  const row = state.cart.find((x) => x.key === key);
  if (!row) return;
  row.qty = Math.max(1, Number(qty || 1));
  saveCart();
  renderCart();
}

function clearCart() {
  state.cart = [];
  saveCart();
  renderCart();
  notify("Cart cleared.", "success");
}

function moneyFromCartKey(item) {
  return Number(item.price || 0) * Number(item.qty || 1);
}

function renderCart() {
  const list = $("cartList");
  if (!state.cart.length) {
    list.innerHTML = `<div class="notice">Cart is empty. Add products, deals, or flash offers from the store.</div>`;
  } else {
    list.innerHTML = state.cart.map((item) => `
      <div class="cart-item">
        <div>
          <div class="title">${escapeHtml(item.title)}</div>
          <div class="sub">${escapeHtml(item.kind)} • ${escapeHtml(item.unit || "-")} • ${formatMoney(item.price)}</div>
        </div>
        <div style="text-align:left">
          <button class="close-btn" onclick="removeFromCart('${escapeJs(item.key)}')" type="button">✕</button>
        </div>
        <div class="qty-controls" style="grid-column:1/-1">
          <button type="button" onclick="updateCartQty('${escapeJs(item.key)}', ${Math.max(1, Number(item.qty) - 1)})">−</button>
          <input type="number" min="1" value="${Number(item.qty || 1)}" onchange="updateCartQty('${escapeJs(item.key)}', this.value)" />
          <button type="button" onclick="updateCartQty('${escapeJs(item.key)}', ${Number(item.qty) + 1})">+</button>
          <span style="margin-inline-start:auto;font-weight:700">${formatMoney(moneyFromCartKey(item))}</span>
        </div>
      </div>
    `).join("");
  }

  const sums = cartSummary();
  $("cartTotals").textContent = formatMoney(sums.total);
  $("cartBreakdown").textContent = `Products: ${formatMoney(sums.products)} | Deals: ${formatMoney(sums.deals)} | Flash: ${formatMoney(sums.flash)}`;
  updateCartCount();
}

function escapeHtml(str) {
  return safeText(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeJs(str) {
  return safeText(str).replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

function productCard(product) {
  const units = resolveProductPricing(product);
  const initialUnit = units[0] || null;
  const displayPrice = initialUnit ? formatMoney(initialUnit.price) : "N/A";
  const companyName = state.companies.find((c) => safeText(c.company_id) === safeText(product.company_id))?.company_name || product.company_id || "";
  const unitOptions = units.map((u) => `<option value="${u.unit}" data-price="${u.price}">${u.unit} - ${formatMoney(u.price)}</option>`).join("");
  const unitSelect = units.length > 1 ? `
    <select id="unit-${escapeJs(product.product_id)}">${unitOptions}</select>
  ` : `
    <input type="hidden" id="unit-${escapeJs(product.product_id)}" value="${units[0]?.unit || "piece"}" />
  `;
  return `
    <div class="card">
      <div class="img">
        ${product.product_image ? `<img src="${escapeHtml(product.product_image)}" alt="${escapeHtml(product.product_name)}" />` : `<div style="font-size:40px">📦</div>`}
      </div>
      <div class="body">
        <div class="tag">${escapeHtml(companyName || "Unknown company")}</div>
        <h4>${escapeHtml(product.product_name)}</h4>
        <div class="meta">ID: ${escapeHtml(product.product_id)}</div>
        <div class="price-row">
          <div class="price">${displayPrice}</div>
          <div class="meta">${units.length ? `${units.length} unit(s)` : "No price"}</div>
        </div>
        <div>${unitSelect}</div>
        <button class="small-btn" type="button" ${!units.length ? "disabled" : `onclick="addProductToCart('${escapeJs(product.product_id)}')"`}>Add to cart</button>
      </div>
    </div>
  `;
}

function dealCard(item, kind) {
  const canBuy = kind === "deal" ? item.can_buy : item.can_buy;
  const badgeClass = canBuy ? "tag" : "tag red";
  const label = kind === "deal" ? (canBuy ? "Can buy" : "Not available") : item.status;
  return `
    <div class="card">
      <div class="img">
        ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" />` : `<div style="font-size:40px">🔥</div>`}
      </div>
      <div class="body">
        <div class="${badgeClass}">${escapeHtml(label)}</div>
        <h4>${escapeHtml(item.title)}</h4>
        <div class="meta">${escapeHtml(item.description || "")}</div>
        <div class="price-row">
          <div class="price">${formatMoney(item.price)}</div>
          <div class="meta">Stock: ${escapeHtml(item.stock)}</div>
        </div>
        <button class="small-btn" type="button" ${!canBuy ? "disabled" : `onclick="addDealToCart('${kind}', '${escapeJs(item.id)}')"`}>Add to cart</button>
      </div>
    </div>
  `;
}

function renderCompanyChips() {
  const chips = [`<button class="chip ${state.companyFilter === "all" ? "active" : ""}" onclick="setCompanyFilter('all')">All</button>`];
  state.companies.forEach((company) => {
    chips.push(`<button class="chip ${state.companyFilter === safeText(company.company_id) ? "active" : ""}" onclick="setCompanyFilter('${escapeJs(company.company_id)}')">${escapeHtml(company.company_name)}</button>`);
  });
  $("companiesChips").innerHTML = chips.join("");
  $("quickChips").innerHTML = chips.slice(0, 6).join("");
}

function renderProducts() {
  const query = state.search.trim().toLowerCase();
  const filtered = state.products.filter((p) => {
    const company = state.companies.find((c) => safeText(c.company_id) === safeText(p.company_id));
    const matchesSearch = !query || safeText(p.product_name).toLowerCase().includes(query) || safeText(company?.company_name).toLowerCase().includes(query) || safeText(p.product_id).toLowerCase().includes(query);
    const matchesCompany = state.companyFilter === "all" || safeText(p.company_id) === safeText(state.companyFilter);
    return matchesSearch && matchesCompany;
  });
  $("productsGrid").innerHTML = filtered.length
    ? filtered.map(productCard).join("")
    : `<div class="notice">No products matched the current filters.</div>`;
}

function renderDeals() {
  const query = state.search.trim().toLowerCase();
  const filteredDeals = state.deals.filter((d) => !query || safeText(d.title).toLowerCase().includes(query) || safeText(d.description).toLowerCase().includes(query));
  const filteredFlash = state.flashOffers.filter((d) => !query || safeText(d.title).toLowerCase().includes(query) || safeText(d.description).toLowerCase().includes(query));
  $("dealsGrid").innerHTML = filteredDeals.length ? filteredDeals.map((d) => dealCard(d, "deal")).join("") : `<div class="notice">No daily deals found.</div>`;
  $("flashGrid").innerHTML = filteredFlash.length ? filteredFlash.map((d) => dealCard(d, "flash")).join("") : `<div class="notice">No flash offers found.</div>`;
}

function renderStats() {
  $("statProducts").textContent = String(state.products.length);
  $("statCompanies").textContent = String(state.companies.length);
  $("statDeals").textContent = String(state.deals.length);
  $("statFlash").textContent = String(state.flashOffers.length);
}

function renderOrders() {
  const list = $("ordersList");
  if (!state.user) {
    list.innerHTML = `<div class="notice">Login to see your order history.</div>`;
    return;
  }
  if (!state.orders.length) {
    list.innerHTML = `<div class="notice">No orders loaded yet.</div>`;
    return;
  }
  const itemsByOrder = state.orderItems || {};
  list.innerHTML = state.orders.map((o) => {
    const items = itemsByOrder[o.id] || [];
    return `
      <div class="cart-item" style="grid-template-columns:1fr">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <div>
            <div class="title">${escapeHtml(o.order_number)}</div>
            <div class="sub">Status: ${escapeHtml(o.status)} • ${new Date(o.created_at).toLocaleString()}</div>
          </div>
          <div class="tag">${formatMoney(o.total_amount)}</div>
        </div>
        <div class="footer-note">
          Products: ${formatMoney(o.products_total)} | Deals: ${formatMoney(o.deals_total)} | Flash: ${formatMoney(o.flash_total)}
        </div>
        <div class="notice">
          ${items.map((it) => `• ${escapeHtml(it.type)} | ${escapeHtml(it.product_id || "-")} | ${escapeHtml(it.unit || "-")} × ${it.qty} = ${formatMoney(it.price * it.qty)}`).join("<br>") || "No items"}
        </div>
      </div>
    `;
  }).join("");
}

function renderCustomers() {
  const list = $("customersList");
  if (!isRep()) {
    list.innerHTML = `<div class="notice">This module is visible for reps only.</div>`;
    return;
  }
  if (!state.customers.length) {
    list.innerHTML = `<div class="notice">No customers found for this rep.</div>`;
    return;
  }
  list.innerHTML = state.customers.map((c) => `
    <div class="cart-item" style="grid-template-columns:1fr">
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <div>
          <div class="title">${escapeHtml(c.trader_name || c.customer_name)}</div>
          <div class="sub">${escapeHtml(c.phone)} • ${escapeHtml(c.address || "")}</div>
        </div>
        <div class="tag">${escapeHtml(c.status || "active")}</div>
      </div>
      <div class="footer-note">Customer ID: ${escapeHtml(c.customer_id)} • Tier: ${escapeHtml(c.tier_name || "base")} • Created by: ${escapeHtml(c.created_by)}</div>
    </div>
  `).join("");
}

async function loadSettings() {
  console.log("loadSettings()");
  try {
    const { data, error } = await db.from("app_settings").select("*").limit(1).maybeSingle();
    if (error) throw error;
    state.settings = data || null;
    if (state.settings?.company_name) {
      $("brandName").textContent = state.settings.company_name;
      $("brandSub").textContent = state.settings.address || "Supabase connected wholesale platform";
      $("heroTitle").textContent = state.settings.company_name;
    }
    setStatus("Ready");
    log("settings", state.settings);
  } catch (err) {
    console.error("loadSettings failed", err);
    setStatus("Ready with limited settings");
  }
}

async function loadCompanies() {
  console.log("loadCompanies()");
  const { data, error } = await db.from("companies").select("*").order("company_name", { ascending: true });
  if (error) {
    console.error("loadCompanies failed", error);
    notify(error.message, "error");
    return [];
  }
  state.companies = (data || []).filter((x) => x.visible !== false);
  log("companies", state.companies.length, state.companies);
  renderCompanyChips();
  renderStats();
  renderProducts();
  return state.companies;
}

async function loadPrices() {
  console.log("loadPrices()");
  const [carton, pack, piece] = await Promise.all([
    db.from("prices_carton").select("*"),
    db.from("prices_pack").select("*"),
    db.from("prices_piece").select("*"),
  ]);
  if (carton.error) console.error("prices_carton error", carton.error);
  if (pack.error) console.error("prices_pack error", pack.error);
  if (piece.error) console.error("prices_piece error", piece.error);
  state.prices.carton = carton.data || [];
  state.prices.pack = pack.data || [];
  state.prices.piece = piece.data || [];
  log("prices loaded", { carton: state.prices.carton.length, pack: state.prices.pack.length, piece: state.prices.piece.length });
}

async function loadProducts() {
  console.log("loadProducts()");
  const { data, error } = await db.from("v_products").select("*").order("product_name", { ascending: true });
  if (error) {
    console.error("loadProducts failed", error);
    notify(error.message, "error");
    return [];
  }
  state.products = data || [];
  log("products", state.products.length);
  renderStats();
  renderProducts();
  return state.products;
}

async function loadDeals() {
  console.log("loadDeals()");
  const { data, error } = await db.from("v_daily_deals").select("*").order("id", { ascending: false });
  if (error) {
    console.error("loadDeals failed", error);
    notify(error.message, "error");
    return [];
  }
  state.deals = data || [];
  log("daily deals", state.deals.length);
  renderStats();
  renderDeals();
  return state.deals;
}

async function loadFlashOffers() {
  console.log("loadFlashOffers()");
  const { data, error } = await db.from("v_flash_offers").select("*").order("start_time", { ascending: false });
  if (error) {
    console.error("loadFlashOffers failed", error);
    notify(error.message, "error");
    return [];
  }
  state.flashOffers = data || [];
  log("flash offers", state.flashOffers.length);
  renderStats();
  renderDeals();
  return state.flashOffers;
}

async function loginUser() {
  console.log("loginUser()");
  const code = $("loginCode").value.trim();
  const password = $("loginPassword").value;
  if (!code || !password) return notify("Enter login code and password.", "error");
  try {
    const { data, error } = await db.rpc("login_user", { p_code: code, p_password: password });
    if (error) throw error;
    state.user = {
      id: safeText(data.id),
      name: safeText(data.name),
      role: safeText(data.role),
      rep_id: data.rep_id ? safeText(data.rep_id) : null,
      code,
    };
    localStorage.setItem("b2b_user_v1", JSON.stringify(state.user));
    await syncCustomerProfile();
    renderAfterAuth();
    notify(`Logged in as ${state.user.role}.`, "success");
    return state.user;
  } catch (err) {
    console.error("loginUser error", err);
    notify(err.message || "Login failed", "error");
    throw err;
  }
}

async function registerCustomer() {
  console.log("registerCustomer()");
  const name = $("regName").value.trim();
  const phone = normalizePhone($("regPhone").value);
  const password = $("regPassword").value;
  const address = $("regAddress").value.trim();
  if (!name || !phone || !password || !address) return notify("All fields are required.", "error");
  try {
    const { data, error } = await db.rpc("register_customer", {
      p_name: name,
      p_phone: phone,
      p_password: password,
      p_address: address,
      p_lat: null,
      p_lng: null,
    });
    if (error) throw error;
    const customerId = data?.customer_id ? String(data.customer_id) : null;
    if (customerId && state.user?.role === "rep" && state.user.rep_id) {
      const upd = await db.from("customers").update({ created_by: state.user.rep_id, status: "active" }).eq("customer_id", customerId);
      if (upd.error) console.error("Failed to assign rep to customer", upd.error);
    }
    notify("Customer registered successfully.", "success");
    return data;
  } catch (err) {
    console.error("registerCustomer error", err);
    notify(err.message || "Registration failed", "error");
    throw err;
  }
}

async function syncCustomerProfile() {
  if (!state.user) return;
  if (state.user.role !== "customer") {
    state.customer = null;
    return;
  }
  try {
    const code = safeText(state.user.code).trim();
    const { data, error } = await db.from("customers").select("*").eq("phone", code).maybeSingle();
    if (error) throw error;
    state.customer = data || null;
    if (!state.customer) {
      console.warn("Customer profile not found for phone", code);
    }
    log("customer profile", state.customer);
  } catch (err) {
    console.error("syncCustomerProfile error", err);
  }
}

async function loadMyCustomers() {
  console.log("loadMyCustomers()");
  if (!isRep() || !state.user?.rep_id) {
    state.customers = [];
    renderCustomers();
    return [];
  }
  try {
    const { data, error } = await db.from("v_my_customers").select("*");
    if (error) throw error;
    let rows = data || [];
    if (!rows.length) {
      const fallback = await db.from("customers").select("*").eq("created_by", state.user.rep_id).order("created_at", { ascending: false });
      if (fallback.error) throw fallback.error;
      rows = fallback.data || [];
    }
    state.customers = rows;
    log("my customers", rows.length);
    renderCustomers();
    return rows;
  } catch (err) {
    console.error("loadMyCustomers error", err);
    notify(err.message || "Failed to load customers", "error");
    return [];
  }
}

async function loadMyOrders() {
  console.log("loadMyOrders()");
  if (!state.user) {
    state.orders = [];
    state.orderItems = {};
    renderOrders();
    return [];
  }
  try {
    let ordersQuery = db.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
    if (isCustomer() && state.customer?.customer_id) {
      ordersQuery = ordersQuery.eq("customer_id", state.customer.customer_id);
    } else if (isRep() && state.user.rep_id) {
      const { data: customersData, error: customersErr } = await db.from("customers").select("customer_id").eq("created_by", state.user.rep_id);
      if (customersErr) throw customersErr;
      const ids = (customersData || []).map((r) => String(r.customer_id));
      if (!ids.length) {
        state.orders = [];
        state.orderItems = {};
        renderOrders();
        return [];
      }
      ordersQuery = ordersQuery.in("customer_id", ids);
    } else {
      ordersQuery = ordersQuery.eq("user_id", state.user.id);
    }

    const { data: ordersData, error: ordersErr } = await ordersQuery;
    if (ordersErr) throw ordersErr;
    state.orders = ordersData || [];
    const orderIds = state.orders.map((o) => String(o.id));
    state.orderItems = {};
    if (orderIds.length) {
      const { data: itemsData, error: itemsErr } = await db.from("order_items").select("*").in("order_id", orderIds);
      if (itemsErr) throw itemsErr;
      for (const item of itemsData || []) {
        const key = String(item.order_id);
        if (!state.orderItems[key]) state.orderItems[key] = [];
        state.orderItems[key].push(item);
      }
    }
    log("orders", state.orders.length, state.orders);
    renderOrders();
    return state.orders;
  } catch (err) {
    console.error("loadMyOrders error", err);
    notify(err.message || "Failed to load orders", "error");
    return [];
  }
}

function renderAfterAuth() {
  renderSectionVisibility();
  if (isRep()) {
    $("customersNavBtn").classList.remove("hidden");
  }
  if (state.user) {
    $("authNavBtn").textContent = `${state.user.name || "Account"} • ${state.user.role}`;
  }
  loadMyOrders();
  if (isRep()) loadMyCustomers();
  if (state.currentSection === "auth") setActiveSection("orders");
}

function buildOrderMessage(orderNumber, totals, items) {
  const lines = [];
  lines.push(`Order: ${orderNumber}`);
  lines.push(`Customer: ${state.customer?.customer_name || state.user?.name || "N/A"}`);
  lines.push("");
  items.forEach((item) => {
    lines.push(`- ${item.title} | ${item.unit || item.type} | Qty: ${item.qty} | ${formatMoney(item.price * item.qty)}`);
  });
  lines.push("");
  lines.push(`Products: ${formatMoney(totals.products)}`);
  lines.push(`Deals: ${formatMoney(totals.deals)}`);
  lines.push(`Flash: ${formatMoney(totals.flash)}`);
  lines.push(`Total: ${formatMoney(totals.total)}`);
  return lines.join("\n");
}

function getWhatsappNumber() {
  return normalizePhone(state.settings?.whatsapp_number || state.settings?.phone || "");
}

async function createOrder() {
  console.log("createOrder()");
  if (!state.user) {
    showModal(true);
    notify("Login required before checkout.", "error");
    return null;
  }
  if (!state.cart.length) return notify("Cart is empty.", "error");
  if (isCustomer() && !state.customer) {
    await syncCustomerProfile();
  }
  const totals = cartSummary();
  const orderNumber = `ORD-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}-${Math.floor(Math.random() * 900 + 100)}`;
  const items = state.cart.map((item) => ({
    product_id: item.kind === "product" ? safeText(item.product_id) : `${item.kind}:${item.id}`,
    type: item.kind === "product" ? "product" : item.kind === "deal" ? "daily_deal" : "flash_offer",
    qty: Number(item.qty || 1),
    price: Number(item.price || 0),
    unit: item.unit || (item.kind === "product" ? "piece" : "unit"),
    title: item.title,
  }));

  const payload = {
    order_number: orderNumber,
    user_type: state.user.role,
    user_id: state.user.id,
    customer_id: state.customer?.customer_id ? String(state.customer.customer_id) : null,
    total_amount: totals.total,
    products_total: totals.products,
    deals_total: totals.deals,
    flash_total: totals.flash,
    status: "submitted",
  };

  try {
    let result;
    try {
      result = await db.rpc("create_order_with_items", {
        p_order: payload,
        p_items: items,
      });
      if (result.error) throw result.error;
      log("create_order_with_items result", result.data);
    } catch (rpcErr) {
      console.warn("RPC order creation failed, falling back to direct inserts.", rpcErr);
      const orderInsert = await db.from("orders").insert(payload).select("*").single();
      if (orderInsert.error) throw orderInsert.error;
      const orderId = orderInsert.data.id;
      const itemRows = items.map((it) => ({
        order_id: orderId,
        product_id: it.product_id,
        type: it.type,
        qty: it.qty,
        price: it.price,
        unit: it.unit,
      }));
      const itemInsert = await db.from("order_items").insert(itemRows);
      if (itemInsert.error) throw itemInsert.error;
      result = { data: { order: orderInsert.data } };
    }

    const whatsappNumber = getWhatsappNumber();
    const message = buildOrderMessage(orderNumber, totals, state.cart);
    const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    state.cart = [];
    saveCart();
    renderCart();
    await loadMyOrders();
    notify("Order created successfully.", "success");
    if (whatsappNumber) {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } else {
      notify("Order saved, but WhatsApp number is missing in app_settings.", "error");
    }
    return result;
  } catch (err) {
    console.error("createOrder error", err);
    notify(err.message || "Order failed", "error");
    throw err;
  }
}

function addProductToCart(productId) {
  const product = state.products.find((p) => safeText(p.product_id) === safeText(productId));
  if (!product) return notify("Product not found.", "error");
  const select = document.getElementById(`unit-${CSS.escape(productId)}`);
  const unit = select?.value || "piece";
  const units = resolveProductPricing(product);
  const selected = units.find((u) => u.unit === unit) || units[0];
  if (!selected) return notify("No price available.", "error");
  addToCart({
    kind: "product",
    id: product.product_id,
    product_id: product.product_id,
    title: product.product_name,
    unit: selected.unit,
    price: selected.price,
    image: product.product_image,
    meta: { company_id: product.company_id },
    key: `product:${product.product_id}:${selected.unit}`,
  });
}

function addDealToCart(kind, id) {
  const source = kind === "deal" ? state.deals : state.flashOffers;
  const item = source.find((x) => safeText(x.id) === safeText(id));
  if (!item) return notify("Item not found.", "error");
  if (kind === "deal" && !item.can_buy) return notify("This deal is not available.", "error");
  if (kind === "flash" && !item.can_buy) return notify("This flash offer is not available.", "error");
  addToCart({
    kind,
    id: item.id,
    title: item.title,
    unit: "piece",
    price: Number(item.price || 0),
    image: item.image,
    key: `${kind}:${item.id}`,
  });
}

function setCompanyFilter(companyId) {
  state.companyFilter = safeText(companyId);
  renderCompanyChips();
  renderProducts();
}

function resetFilters() {
  state.search = "";
  state.companyFilter = "all";
  $("searchInput").value = "";
  renderCompanyChips();
  renderProducts();
  renderDeals();
}

async function checkout() {
  console.log("checkout()");
  if (!state.cart.length) return notify("Cart is empty.", "error");
  if (!state.user) {
    showModal(true);
    return notify("Please login or register before checkout.", "error");
  }
  await createOrder();
}

async function bootstrap() {
  console.log("bootstrap()");
  state.user = loadUserFromStorage();
  updateCartCount();
  renderCart();
  bindEvents();
  setStatus("Connecting to Supabase...");
  await Promise.allSettled([loadSettings(), loadCompanies(), loadPrices(), loadProducts(), loadDeals(), loadFlashOffers()]);
  if (state.user?.role === "customer") await syncCustomerProfile();
  renderSectionVisibility();
  renderStats();
  renderProducts();
  renderDeals();
  renderCart();
  if (state.user) {
    await loadMyOrders();
    if (isRep()) await loadMyCustomers();
  }
  setStatus("Ready");
  console.log("bootstrap done", state);
}

function loadUserFromStorage() {
  try {
    const raw = localStorage.getItem("b2b_user_v1");
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("loadUserFromStorage error", err);
    return null;
  }
}

function bindEvents() {
  $("navBar").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-section]");
    if (!btn) return;
    const section = btn.dataset.section;
    if (section === "customers" && !isRep()) return notify("Rep module only.", "error");
    if (section === "orders" && !state.user) return showModal(true);
    setActiveSection(section);
  });

  $("heroShopBtn").addEventListener("click", () => setActiveSection("products"));
  $("heroLoginBtn").addEventListener("click", () => state.user ? setActiveSection("orders") : showModal(true));
  $("clearSearchBtn").addEventListener("click", () => {
    $("searchInput").value = "";
    state.search = "";
    renderProducts();
    renderDeals();
  });
  $("searchInput").addEventListener("input", (e) => {
    state.search = e.target.value;
    renderProducts();
    renderDeals();
  });
  $("loginBtn").addEventListener("click", loginUser);
  $("registerBtn").addEventListener("click", registerCustomer);
  $("checkoutBtn").addEventListener("click", checkout);
  $("saveDraftBtn").addEventListener("click", saveDraft);
  $("clearCartBtn").addEventListener("click", clearCart);
  $("resetFiltersBtn").addEventListener("click", resetFilters);
  $("reloadOrdersBtn").addEventListener("click", loadMyOrders);
  $("reloadCustomersBtn").addEventListener("click", loadMyCustomers);
  $("closeAuthModal").addEventListener("click", () => showModal(false));
  $("gotoLoginBtn").addEventListener("click", () => { showModal(false); setActiveSection("auth"); });
  $("gotoRegisterBtn").addEventListener("click", () => { showModal(false); setActiveSection("auth"); });
  $("authNavBtn").addEventListener("click", () => state.user ? setActiveSection("orders") : showModal(true));
}

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQty = updateCartQty;
window.addProductToCart = addProductToCart;
window.addDealToCart = addDealToCart;
window.setCompanyFilter = setCompanyFilter;
window.loginUser = loginUser;
window.registerCustomer = registerCustomer;
window.loadProducts = loadProducts;
window.loadCompanies = loadCompanies;
window.loadDeals = loadDeals;
window.loadFlashOffers = loadFlashOffers;
window.checkout = checkout;
window.createOrder = createOrder;
window.loadMyCustomers = loadMyCustomers;
window.loadMyOrders = loadMyOrders;
window.state = state;

document.addEventListener("DOMContentLoaded", () => {
  bootstrap().catch((err) => {
    console.error("bootstrap fatal", err);
    notify(err.message || "Initialization failed", "error");
    setStatus("Initialization failed");
  });
});
