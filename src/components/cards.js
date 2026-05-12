import { dom } from '../core/dom.js';
import {
  computeDisplayPrice,
  labelForUnit,
} from '../services/pricingService.js';

import { formatMoney } from '../services/invoiceService.js';

export function companyCard(company) {
  return `
    <article
      class="company-card"
      data-action="open-company"
      data-company-id="${dom.escape(
        company.company_id
      )}"
    >
      <div class="company-card__logo">
        ${
          company.company_logo
            ? `
              <img
                src="${dom.escape(
                  company.company_logo
                )}"
                alt="${dom.escape(
                  company.company_name
                )}"
                loading="lazy"
              />
            `
            : `
              <span>
                ${dom.escape(
                  (
                    company.company_name || ''
                  ).slice(0, 1) || 'A'
                )}
              </span>
            `
        }
      </div>

      <h3 class="company-card__title">
        ${dom.escape(company.company_name)}
      </h3>

      <button
        class="btn btn--ghost company-card__action"
        type="button"
      >
        تصفح المنتجات
      </button>
    </article>
  `;
}

function renderUnitChips(
  product,
  selectedUnit
) {
  const units =
    product._sortedUnits || [];

  return units
    .map((unit) => {
      const active =
        unit.unit_code === selectedUnit;

      const disabled =
        unit.runtime_healthy === false ||
        unit.is_sellable === false ||
        unit.unit_active === false ||
        Number(unit.final_price ?? 0) <=
          0;

      return `
        <button
          class="unit-chip ${
            active ? 'is-active' : ''
          }"
          data-action="set-unit"
          data-product-id="${dom.escape(
            product.product_id
          )}"
          data-unit="${dom.escape(
            unit.unit_code
          )}"
          ${disabled ? 'disabled' : ''}
        >
          ${dom.escape(
            labelForUnit(unit.unit_code)
          )}
        </button>
      `;
    })
    .join('');
}

function formatTierMinimum(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n >= 1000000) {
    const m = n / 1000000;
    return `${Number.isInteger(m) ? m.toFixed(0) : m.toFixed(1)} مليون`;
  }
  if (n >= 1000) {
    const k = n / 1000;
    return `${Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1)} ألف`;
  }
  return `${n.toLocaleString('ar-EG')}`;
}

function getTierVisual(tier) {
  const label = String(tier.visible_label || tier.tier_name || '').toLowerCase();
  if (label.includes('الماس') || label.includes('diamond')) return { icon: '◆', description: 'أعلى أولوية تسعيرية' };
  if (label.includes('ذهب') || label.includes('gold')) return { icon: '⬢', description: 'مستوى مرتفع ومميز' };
  if (label.includes('فض') || label.includes('silver')) return { icon: '◈', description: 'توازن جيد للتوريد' };
  if (label.includes('برون') || label.includes('bronze')) return { icon: '⬡', description: 'نقطة بداية نمو' };
  return { icon: '○', description: 'المدخل الأساسي للحساب' };
}

export function productCard(
  product,
  tier,
  {
    unit,
    qty,
    inCart,
  } = {}
) {
  const sortedUnits =
    product._sortedUnits ||
    Object.values(product.units || {})
      .filter((unit) => unit?.unit_code)
      .sort(
        (a, b) =>
          Number(a.display_order ?? 0) - Number(b.display_order ?? 0) ||
          String(a.unit_code).localeCompare(String(b.unit_code), 'ar')
      );

  product._sortedUnits = sortedUnits;

  const selectedUnit =
    unit ||
    product.defaultUnit ||
    sortedUnits
      .map((u) => u.unit_code)
      .find((key) => Number(product.units?.[key]?.final_price ?? 0) > 0) ||
    'carton';

  const display = computeDisplayPrice(product, selectedUnit, tier);
  const currentUnit = product.units?.[selectedUnit] || null;
  const canBuy =
    product.can_buy !== false &&
    Number(currentUnit?.final_price ?? display.final ?? 0) > 0 &&
    currentUnit?.unit_active !== false &&
    currentUnit?.is_sellable !== false;
  const quantity = Math.max(1, Number(qty || 1));

  const image =
    product.product_image
      ? `
          <img
            src="${dom.escape(product.product_image)}"
            alt="${dom.escape(product.product_name)}"
            loading="lazy"
          />
        `
      : `
          <div class="product-card__image-fallback">
            ${dom.escape(product.product_name.slice(0, 1) || 'P')}
          </div>
        `;

  const ctaLabel = !canBuy
    ? product.availability_reason === 'missing_price'
      ? 'غير متاح حاليًا'
      : 'نفذت الكمية'
    : inCart
    ? 'إزالة من السلة'
    : 'شراء';

  return `
    <article
      class="product-card ${canBuy ? '' : 'product-card--disabled'}"
      data-product-id="${dom.escape(product.product_id)}"
    >
      <button
        class="product-card__media"
        data-action="open-product"
        data-product-id="${dom.escape(product.product_id)}"
        type="button"
      >
        ${image}
      </button>

      <div class="product-card__body">
        <div class="product-card__title">
          ${dom.escape(product.product_name)}
        </div>

        <div class="product-card__meta">
          ${dom.escape(product.company_name || '')}
        </div>

        <div class="product-card__price-row">
          <span class="price price--main">${formatMoney(display.final ?? 0)} ج.م</span>
          <span class="unit-label">${dom.escape(labelForUnit(selectedUnit))}</span>
        </div>

        <div class="qty-stepper ${inCart ? 'is-in-cart' : ''}">
          <button class="qty-stepper__btn" type="button" data-action="product-qty-down" data-product-id="${dom.escape(product.product_id)}" aria-label="إنقاص الكمية">-</button>
          <label class="qty-field qty-field--inline">
            <span>الكمية</span>
            <input
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              value="${String(quantity)}"
              data-role="product-qty"
              data-product-id="${dom.escape(product.product_id)}"
              autocomplete="off"
              spellcheck="false"
            />
          </label>
          <button class="qty-stepper__btn" type="button" data-action="product-qty-up" data-product-id="${dom.escape(product.product_id)}" aria-label="زيادة الكمية">+</button>
        </div>

        <div class="unit-group">
          ${renderUnitChips(product, selectedUnit)}
        </div>

        <button
          class="btn btn--primary product-card__cta"
          type="button"
          data-action="toggle-product"
          data-product-id="${dom.escape(product.product_id)}"
          ${canBuy ? '' : 'disabled'}
        >
          ${ctaLabel}
        </button>
      </div>
    </article>
  `;
}

export function offerCard(

  offer,
  kind,
  inCart = false
) {
  const runtimeStatus = String(offer.runtime_status || offer.status || '').trim().toLowerCase();
  const status =
    kind === 'flash'
      ? (runtimeStatus === 'active' ? 'متاح' : runtimeStatus === 'scheduled' ? 'قريبًا' : 'منتهي')
      : offer.can_buy
      ? 'متاح'
      : 'غير متاح';

  return `
    <article
      class="offer-card ${
        kind === 'flash'
          ? 'offer-card--flash'
          : 'offer-card--deal'
      }"
    >
      <button
        class="offer-card__media"
        type="button"
        data-action="open-offer"
        data-offer-type="${kind}"
        data-id="${offer.id}"
      >
        ${
          offer.image
            ? `
              <img
                src="${dom.escape(
                  offer.image
                )}"
                alt="${dom.escape(
                  offer.title
                )}"
                loading="lazy"
              />
            `
            : `
              <div class="offer-card__image-fallback">
                ${dom.escape(
                  offer.title.slice(
                    0,
                    1
                  ) || 'O'
                )}
              </div>
            `
        }
      </button>

      <div class="offer-card__body">

        <div class="badge-row">
          <span class="badge">
            ${dom.escape(status)}
          </span>

          <span class="badge">
            ${dom.escape(
              formatMoney(offer.price)
            )} ج.م
          </span>
        </div>

        <h3 class="offer-card__title">
          ${dom.escape(offer.title)}
        </h3>

        <p class="offer-card__desc">
          ${dom.escape(
            offer.description || ''
          )}
        </p>

        <div class="offer-card__actions">
          <button
            class="btn btn--primary"
            type="button"
            data-action="${
              kind === 'deal'
                ? 'toggle-deal'
                : 'toggle-flash'
            }"
            data-id="${offer.id}"
            ${
              offer.can_buy === false
                ? 'disabled'
                : ''
            }
          >
            ${
              kind === 'flash' && runtimeStatus !== 'active'
                ? 'منتهي'
                : offer.can_buy === false
                ? 'غير متاح'
                : inCart
                ? 'إزالة من السلة'
                : 'شراء'
            }
          </button>

          <button
            class="btn btn--ghost"
            type="button"
            data-action="open-offer"
            data-offer-type="${kind}"
            data-id="${offer.id}"
          >
            تفاصيل
          </button>
        </div>
      </div>
    </article>
  `;
}

export function tierCard(
  tier,
  active = false
) {
  const visual = getTierVisual(tier);
  return `
    <article class="tier-card ${active ? 'is-active' : ''}">
      <div class="tier-card__head">
        <div class="tier-card__icon" aria-hidden="true">${visual.icon}</div>
        <div class="tier-card__copy">
          <h3>${dom.escape(tier.visible_label || tier.tier_name)}</h3>
          <p>${dom.escape(visual.description)}</p>
        </div>
      </div>

      <div class="tier-card__stats tier-card__stats--single">
        <div class="tier-card__stat">
          <span>الحد الأدنى</span>
          <strong>${dom.escape(formatTierMinimum(tier.min_order || 0))}</strong>
        </div>
      </div>

      <button class="btn btn--primary" type="button" data-action="select-tier" data-tier-name="${dom.escape(tier.tier_name)}">
        ${active ? 'إلغاء الاختيار' : 'اختيار'}
      </button>
    </article>
  `;
}

export function invoiceCard(
invoice) {
  return `
    <article class="invoice-card">

      <div class="invoice-card__top">
        <div>

          <h3>
            فاتورة #
            ${dom.escape(
              invoice.order_number ||
                invoice.invoice_number ||
                invoice.id
            )}
          </h3>

          <p>
            ${dom.escape(
              new Intl.DateTimeFormat(
                'ar-EG',
                {
                  dateStyle:
                    'medium',
                  timeStyle:
                    'short',
                }
              ).format(
                new Date(
                  invoice.created_at ||
                    Date.now()
                )
              )
            )}
          </p>

          ${
            invoice.customer_name
              ? `
                <p class="invoice-card__customer">
                  ${dom.escape(
                    invoice.customer_name
                  )}
                </p>
              `
              : ''
          }
        </div>

        <strong>
          ${formatMoney(
            invoice.total_amount || 0
          )} ج.م
        </strong>
      </div>

      <div class="invoice-card__meta">

        <span class="chip">
          ${dom.escape(
            invoice.user_type || ''
          )}
        </span>

        <span class="chip">
          ${dom.escape(
            invoice.status || ''
          )}
        </span>

        <button
          class="btn btn--ghost invoice-card__action"
          type="button"
          data-action="view-invoice"
          data-invoice-id="${dom.escape(
            invoice.id
          )}"
        >
          عرض الفاتورة
        </button>
      </div>
    </article>
  `;
}

export function customerCard(
  customer,
  selected = false
) {
  return `
    <article
      class="customer-card ${
        selected
          ? 'is-selected'
          : ''
      }"
      data-action="select-customer"
      data-customer-id="${dom.escape(
        customer.id
      )}"
    >
      <div class="customer-card__top">
        <div>

          <h3>
            ${dom.escape(
              customer.name || ''
            )}
          </h3>

          <p>
            ${dom.escape(
              customer.phone ||
                'بدون هاتف'
            )}
          </p>
        </div>

        ${
          selected
            ? `
              <span class="badge">
                مختار
              </span>
            `
            : ''
        }
      </div>

      <div class="customer-card__address">
        ${dom.escape(
          customer.address ||
            'بدون عنوان'
        )}
      </div>

      <button
        class="btn btn--ghost customer-card__action"
        type="button"
      >
        ${
          selected
            ? 'محدد'
            : 'اختيار'
        }
      </button>
    </article>
  `;
}
