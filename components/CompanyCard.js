function renderMyDataContent() {
  const s = state.session || {};
  const rows = [
    ['نوع الحساب', s.userType === 'rep' ? 'مندوب' : s.userType === 'customer' ? 'عميل' : 'غير معروف'],
    ['الاسم', s.name || s.username || 'غير متاح'],
    ['رقم الهاتف', s.phone || 'غير متاح'],
    ['العنوان', s.address || s.location || 'غير متاح'],
    ['اسم المستخدم', s.username || 'غير متاح'],
  ];
  if (!els.myDataContent) return;
  els.myDataContent.innerHTML = rows.map(([label, value]) => `
    <div class="profile-item">
      <span class="profile-label">${escapeHtml(label)}</span>
      <span class="profile-value">${escapeHtml(value)}</span>
    </div>
  `).join('');
}
function openMyData() {
  if (!state.session) {
    toast('سجّل الدخول أولًا');
    return;
  }
  renderMyDataContent();
  setOverlay(els.myDataModal, true);
}
function closeMyData() {
  setOverlay(els.myDataModal, false);
}
function openMyCustomers() {
  if (!state.session) {
    toast('سجّل الدخول أولًا');
    openLogin();
    return;
  }
  if (state.session.userType !== 'rep') {
    toast('هذه الصفحة للمندوب فقط');
    return;
  }
  navigate('#my-customers');
}
function closeAddCustomer() {
  setOverlay(els.addCustomerModal, false);
}
function openAddCustomer() {
  if (!state.session) {
    toast('سجّل الدخول أولًا');
    openLogin();
    return;
  }
  if (state.session.userType !== 'rep') {
    toast('إضافة العملاء متاحة للمندوب فقط');
    return;
  }
  const nameEl = document.getElementById('custName');
  const phoneEl = document.getElementById('custPhone');
  const addressEl = document.getElementById('custAddress');
  if (nameEl) nameEl.value = '';
  if (phoneEl) phoneEl.value = '';
  if (addressEl) addressEl.value = '';
  setOverlay(els.addCustomerModal, true);
  setTimeout(() => nameEl?.focus(), 50);
}
function persistSelectedCustomer() {
  if (state.selectedCustomer) {
    saveJSON('b2b_selected_customer', state.selectedCustomer);
  } else {
    localStorage.removeItem('b2b_selected_customer');
  }
}
function selectCustomer(id) {
  const customer = state.customers.find((c) => c.id === id);
  if (!customer) return;
  state.selectedCustomer = customer;
  persistSelectedCustomer();
  closeAddCustomer();
  toast(`تم اختيار العميل: ${customer.name}`);
  navigate('#home');
}
async function loadMyCustomers() {
  if (!state.session || state.session.userType !== 'rep') {
    state.customers = [];
    state.customersLoaded = true;
    return;
  }

  const repId = state.session.id;
  const res = await apiGet('customers', {
    select: 'id,name,phone,address,username,password,created_at,sales_rep_id,created_by,customer_type',
    sales_rep_id: `eq.${repId}`,
    customer_type: 'eq.rep',
    order: 'created_at.desc',
  }).catch(() => []);

  state.customers = Array.isArray(res) ? res : [];
  state.customersLoaded = true;

  if (state.selectedCustomer) {
    const exists = state.customers.some((c) => c.id === state.selectedCustomer.id);
    if (!exists) {
      state.selectedCustomer = null;
      persistSelectedCustomer();
    }
  }
}
async function saveCustomer() {
  if (!state.session || state.session.userType !== 'rep') {
    toast('هذه العملية للمندوب فقط');
    return;
  }

  const name = document.getElementById('custName')?.value.trim();
  const phone = document.getElementById('custPhone')?.value.trim();
  const address = document.getElementById('custAddress')?.value.trim();

  if (!name) {
    toast('اسم العميل مطلوب');
    return;
  }

  const payload = {
    name,
    phone: phone || null,
    address: address || null,
    customer_type: 'rep',
    created_by: state.session.id,
    sales_rep_id: state.session.id,
  };

  try {
    const created = (await apiPost('customers', payload))[0] || null;
    toast('تم إضافة العميل');
    closeAddCustomer();
    await loadMyCustomers();
    if (created?.id) {
      state.selectedCustomer = created;
      persistSelectedCustomer();
      toast(`تم اختيار العميل: ${created.name}`);
    }
    renderApp();
  } catch (error) {
    console.error(error);
    toast('تعذر إضافة العميل');
  }
}
function renderMyCustomersPage() {
  const repMode = state.session?.userType === 'rep';
  const selected = state.selectedCustomer;
  if (!repMode) {
    els.pageContent.innerHTML = `
      <div class="page-stack">
        <section class="section-card">
          <div class="section-head">
            <div>
              <h2>عملائي</h2>
              <div class="helper-text">هذه الصفحة متاحة للمندوب فقط</div>
            </div>
          </div>
        </section>
      </div>
    `;
    return;
  }

  const rows = state.customersLoaded ? state.customers : [];
  els.pageContent.innerHTML = `
    <div class="page-stack">
      <section class="section-card">
        <div class="section-head customers-head">
          <div>
            <h2>عملائي</h2>
            <div class="helper-text">اختر العميل قبل بدء الطلب</div>
          </div>
          <button class="primary-btn" data-action="open-add-customer" type="button">➕ إضافة عميل</button>
        </div>
        ${selected ? `
          <div class="selected-customer">
            <span class="selected-customer-label">العميل المختار</span>
            <strong>${escapeHtml(selected.name)}</strong>
            <small>${escapeHtml(selected.phone || '')}</small>
          </div>
        ` : ''}
      </section>
      <section class="customer-list">
        ${!state.customersLoaded ? `<div class="empty-state">جاري تحميل العملاء...</div>` : rows.length ? rows.map((customer) => `
          <article class="customer-card" data-action="select-customer" data-customer-id="${escapeHtml(customer.id)}">
            <div class="customer-card-top">
              <div>
                <h3 class="customer-name">${escapeHtml(customer.name)}</h3>
                <div class="customer-meta">${escapeHtml(customer.phone || 'بدون هاتف')}</div>
              </div>
              ${selected && selected.id === customer.id ? '<span class="badge">مختار</span>' : ''}
            </div>
            <div class="customer-address">${escapeHtml(customer.address || 'بدون عنوان')}</div>
          </article>
        `).join('') : `<div class="empty-state">لا توجد عملاء مرتبطة بهذا المندوب</div>`}
      </section>
    </div>
  `;
}
