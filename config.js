import { dom } from '../core/dom.js';
import { computeDisplayPrice, labelForUnit } from '../services/pricingService.js';
import { formatMoney } from '../services/invoiceService.js';

export function companyCard(company) {
  return `
    <article class="company-card" data-action="open-company" data-company-id="${dom.escape(company.company_id)}">
      <div class="company-card__logo">${company.company_logo ? `<img src="${dom.escape(company.company_logo)}" alt="${dom.escape(company.company_name)}" loading="lazy" />` : `<span>${dom.escape((company.company_name || '').slice(0, 1) || 'A')}</span>`}</div>
      <h3 class="company-card__title">${dom.escape(company.company_name)}</h3>
      <button class="btn btn--ghost company-card__action" type="button">تصفح المنتجات</button>
    </article>
  `;
}

export function productCard(product, tier, { unit, qty, inCart } = {}) {
  const selectedUnit = unit || product.defaultUnit || product.sellable_units?.[0] || 'carton';
  const display = computeDisplayPrice(product, selectedUnit, tier);
  const units = (product.sellable_units || []).map((u) => `<button class="unit-chip ${u === selectedUnit ? 'is-active' : ''}" data-action="set-unit" data-product-id="${dom.escape(product.product_id)}" data-unit="${dom.escape(u)}">${dom.escape(labelForUnit(u))}</button>`).join('');
  const image = product.product_image ? `<img src="${dom.escape(product.product_image)}" alt="${dom.escape(product.product_name)}" loading="lazy" />` : `<div class="product-card__image-fallback">${dom.escape(product.product_name.slice(0, 1) || 'P')}</div>`;

  return `
    <article class="product-card" data-product-id="${dom.escape(product.product_id)}">
      <button class="product-card__media" data-action="open-product" data-product-id="${dom.escape(product.product_id)}" type="button">
        ${image}
      </button>
      <div class="product-card__body">
        <div class="product-card__title">${dom.escape(product.product_name)}</div>
        <div class="product-card__meta">${dom.escape(product.company_name || '')}</div>
        <div class="product-card__price-row">
          ${display.final < display.base ? `<span class="price price--old">${formatMoney(display.base)} ج.م</span><span class="price price--new">${formatMoney(display.final)} ج.م</span>` : `<span class="price price--main">${formatMoney(display.final ?? display.base)} ج.م</span>`}
          <span class="unit-label">${dom.escape(labelForUnit(selectedUnit))}</span>
        </div>
        <label class="qty-field">
          <span>الكمية</span>
          <input type="text" inputmode="numeric" pattern="[0-9]*" value="${String(Number(qty || 1))}" data-role="product-qty" data-product-id="${dom.escape(product.product_id)}" autocomplete="off" spellcheck="false" />
        </label>
        <div class="unit-group">${units}</div>
        <button class="btn btn--primary product-card__cta" type="button" data-action="toggle-product" data-product-id="${dom.escape(product.product_id)}">${inCart ? 'إزالة من السلة' : 'شراء'}</button>
      </div>
    </article>
  `;
}

export function offerCard(offer, kind, inCart = false) {
  const status = kind === 'flash' ? offer.status : (offer.can_buy ? 'متاح' : 'غير متاح');
  return `
    <article class="offer-card ${kind === 'flash' ? 'offer-card--flash' : 'offer-card--deal'}">
      <button class="offer-card__media" type="button" data-action="open-offer" data-offer-type="${kind}" data-id="${offer.id}">
        ${offer.image ? `<img src="${dom.escape(offer.image)}" alt="${dom.escape(offer.title)}" loading="lazy" />` : `<div class="offer-card__image-fallback">${dom.escape(offer.title.slice(0, 1) || 'O')}</div>`}
      </button>
      <div class="offer-card__body">
        <div class="badge-row">
          <span class="badge">${dom.escape(status)}</span>
          <span class="badge">${dom.escape(formatMoney(offer.price))} ج.م</span>
        </div>
        <h3 class="offer-card__title">${dom.escape(offer.title)}</h3>
        <p class="offer-card__desc">${dom.escape(offer.description || '')}</p>
        <div class="offer-card__actions">
          <button class="btn btn--primary" type="button" data-action="${kind === 'deal' ? 'toggle-deal' : 'toggle-flash'}" data-id="${offer.id}" ${offer.can_buy === false ? 'disabled' : ''}>${offer.can_buy === false ? 'غير متاح' : (inCart ? 'إزالة من السلة' : 'إضافة')}</button>
          <button class="btn btn--ghost" type="button" data-action="open-offer" data-offer-type="${kind}" data-id="${offer.id}">تفاصيل</button>
        </div>
      </div>
    </article>
  `;
}

export function tierCard(tier, active = false) {
  return `
    <article class="tier-card ${active ? 'is-active' : ''}">
      <div class="tier-card__head">
        <div>
          <h3>${dom.escape(tier.visible_label || tier.tier_name)}</h3>
          <p>حد أدنى ${formatMoney(tier.min_order || 0)} ج.م</p>
        </div>
        <span class="badge">${formatMoney(tier.discount_percent || 0)}%</span>
      </div>
      <button class="btn btn--primary" type="button" data-action="select-tier" data-tier-name="${dom.escape(tier.tier_name)}">${active ? 'إلغاء الاختيار' : 'اختيار'}</button>
    </article>
  `;
}

export function invoiceCard(invoice) {
  return `
    <article class="invoice-card">
      <div class="invoice-card__top">
        <div>
          <h3>فاتورة #${dom.escape(invoice.order_number || invoice.invoice_number || invoice.id)}</h3>
          <p>${dom.escape(new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(invoice.created_at || Date.now())))}</p>
        </div>
        <strong>${formatMoney(invoice.total_amount || 0)} ج.م</strong>
      </div>
      <div class="invoice-card__meta">
        <span class="chip">${dom.escape(invoice.user_type || '')}</span>
        <span class="chip">${dom.escape(invoice.status || '')}</span>
      </div>
    </article>
  `;
}

export function customerCard(customer, selected = false) {
  return `
    <article class="customer-card ${selected ? 'is-selected' : ''}" data-action="select-customer" data-customer-id="${dom.escape(customer.id)}">
      <div class="customer-card__top">
        <div>
          <h3>${dom.escape(customer.name || '')}</h3>
          <p>${dom.escape(customer.phone || 'بدون هاتف')}</p>
        </div>
        ${selected ? '<span class="badge">مختار</span>' : ''}
      </div>
      <div class="customer-card__address">${dom.escape(customer.address || 'بدون عنوان')}</div>
      <button class="btn btn--ghost customer-card__action" type="button">${selected ? 'محدد' : 'اختيار'}</button>
    </article>
  `;
}
