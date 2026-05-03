function pricingMoney(value) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

function pricingInteger(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

function pricingSafeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch]);
}

function pricingSnapshotFromSource(source) {
  if (!source) return null;
  const snapshot = source && typeof source === 'object' && source.pricing ? source.pricing : source;
  if (!snapshot || typeof snapshot !== 'object') return null;

  const breakdown = snapshot.breakdown && typeof snapshot.breakdown === 'object' ? snapshot.breakdown : {};
  const context = snapshot.context && typeof snapshot.context === 'object' ? snapshot.context : {};
  const base = Number(breakdown.base ?? breakdown.original ?? breakdown.raw ?? 0);
  const tier = Number(breakdown.tier ?? 0);
  const deals = Number(breakdown.deals ?? 0);
  const flash = Number(breakdown.flash ?? 0);
  const final = Number(breakdown.final ?? snapshot.unit ?? snapshot.total ?? 0);
  const unit = Number(snapshot.unit ?? final ?? 0);
  const total = Number(snapshot.total ?? unit ?? 0);

  return {
    unit: Number.isFinite(unit) ? unit : 0,
    total: Number.isFinite(total) ? total : 0,
    breakdown: {
      base: Number.isFinite(base) ? base : 0,
      tier: Number.isFinite(tier) ? tier : 0,
      deals: Number.isFinite(deals) ? deals : 0,
      flash: Number.isFinite(flash) ? flash : 0,
      final: Number.isFinite(final) ? final : 0,
    },
    context: {
      tier: context.tier ?? null,
      appliedDeals: Array.isArray(context.appliedDeals) ? [...context.appliedDeals] : [],
      flashId: context.flashId ?? null,
    },
    timestamp: Number.isFinite(Number(snapshot.timestamp)) ? Number(snapshot.timestamp) : Date.now(),
  };
}

function pricingBoxBadge(label, variant = 'neutral') {
  if (!label) return '';
  return `<span class="pricing-box__badge pricing-box__badge--${pricingSafeHtml(variant)}">${pricingSafeHtml(label)}</span>`;
}

function pricingBoxRow(label, value, variant = '') {
  const classes = ['pricing-box__row'];
  if (variant) classes.push(`pricing-box__row--${variant}`);
  return `
    <div class="${classes.join(' ')}">
      <span class="pricing-box__row-label">${pricingSafeHtml(label)}</span>
      <strong class="pricing-box__row-value">${pricingSafeHtml(value)}</strong>
    </div>
  `;
}

function pricingBoxHtml(source, options = {}) {
  const snapshot = pricingSnapshotFromSource(source);

  const compact = Boolean(options.compact);
  const open = Boolean(options.open);
  const title = options.title || (compact ? 'تسعير مختصر' : 'تفاصيل التسعير');
  const subtitle = options.subtitle || '';
  const currency = options.currency || 'ج.م';
  const classNames = [
    'pricing-box',
    compact ? 'pricing-box--compact' : '',
    options.summary ? 'pricing-box--summary' : '',
    options.className || '',
  ].filter(Boolean).join(' ');

  if (!snapshot) {
    return `
      <details class="${classNames} pricing-box--empty" ${open ? 'open' : ''}>
        <summary class="pricing-box__summary">
          <div class="pricing-box__summary-head">
            <span class="pricing-box__eyebrow">${pricingSafeHtml(title)}</span>
            <strong class="pricing-box__headline">لا توجد بيانات تسعير</strong>
          </div>
        </summary>
        <div class="pricing-box__details">
          <div class="pricing-box__empty">السعر سيظهر بعد تثبيت التسعير.</div>
        </div>
      </details>
    `;
  }

  const base = Number(snapshot.breakdown.base || 0);
  const tier = Number(snapshot.breakdown.tier || 0);
  const deals = Number(snapshot.breakdown.deals || 0);
  const flash = Number(snapshot.breakdown.flash || 0);
  const final = Number(snapshot.breakdown.final ?? snapshot.unit ?? snapshot.total ?? 0);
  const total = Number(snapshot.total ?? final ?? 0);
  const savings = Math.max(0, base - final);
  const hasTier = Boolean(snapshot.context?.tier);
  const appliedDeals = Array.isArray(snapshot.context?.appliedDeals) ? snapshot.context.appliedDeals.filter(Boolean) : [];
  const hasFlash = Boolean(snapshot.context?.flashId);
  const badges = [
    hasTier ? pricingBoxBadge(`الشريحة: ${snapshot.context.tier}`, 'tier') : '',
    appliedDeals.length ? pricingBoxBadge(`العروض: ${pricingInteger(appliedDeals.length)}`, 'deal') : '',
    hasFlash ? pricingBoxBadge('عرض الساعة', 'flash') : '',
    savings > 0 ? pricingBoxBadge(`وفّرت ${pricingMoney(savings)} ${currency}`, 'save') : '',
  ].filter(Boolean).join('');

  const rows = [
    pricingBoxRow('السعر الأساسي', `${pricingMoney(base)} ${currency}`, 'base'),
  ];

  if (tier) rows.push(pricingBoxRow('خصم الشريحة', `-${pricingMoney(Math.abs(tier))} ${currency}`, 'discount'));
  if (deals) rows.push(pricingBoxRow('خصم العروض', `-${pricingMoney(Math.abs(deals))} ${currency}`, 'discount'));
  if (flash) rows.push(pricingBoxRow('تعديل عرض الساعة', `-${pricingMoney(Math.abs(flash))} ${currency}`, 'discount'));
  rows.push(pricingBoxRow('السعر النهائي', `${pricingMoney(final)} ${currency}`, 'final'));

  const summaryValue = compact ? final : total;

  return `
    <details class="${classNames}" ${open ? 'open' : ''}>
      <summary class="pricing-box__summary">
        <div class="pricing-box__summary-head">
          <span class="pricing-box__eyebrow">${pricingSafeHtml(title)}</span>
          <strong class="pricing-box__headline">${pricingSafeHtml(pricingMoney(summaryValue))} ${pricingSafeHtml(currency)}</strong>
          ${subtitle ? `<span class="pricing-box__subline">${pricingSafeHtml(subtitle)}</span>` : ''}
        </div>
        <div class="pricing-box__summary-body">
          <div class="pricing-box__main-price">
            <span class="pricing-box__currency">${pricingSafeHtml(currency)}</span>
            <strong class="pricing-box__amount">${pricingSafeHtml(pricingMoney(summaryValue))}</strong>
          </div>
          ${base > final ? `
            <div class="pricing-box__secondary">
              <span class="pricing-box__old">${pricingSafeHtml(pricingMoney(base))} ${pricingSafeHtml(currency)}</span>
              <span class="pricing-box__save">وفّرت ${pricingSafeHtml(pricingMoney(savings))} ${pricingSafeHtml(currency)}</span>
            </div>
          ` : `<div class="pricing-box__secondary pricing-box__secondary--empty">سعر مباشر بدون خصم إضافي</div>`}
          <div class="pricing-box__badges">${badges}</div>
        </div>
        <span class="pricing-box__toggle">عرض تفاصيل التسعير</span>
      </summary>
      <div class="pricing-box__details">
        ${rows.join('')}
      </div>
    </details>
  `;
}
