import { el } from '../utils/dom.js';
import { money, integer, escapeHtml } from '../utils/format.js';
import { buildWhatsAppInvoice, whatsappLink } from '../services/invoice.js';

function productCard(product, { onAdd, onOpen, selectedTier }) {
  return el('article', { class: 'product-card card' },
    el('div', { class: 'product-media' },
      el('div', { class: 'badge' }, product.unit_code || 'unit'),
      el('div', { class: 'product-company' }, product.company_name || product.company || '—'),
    ),
    el('div', { class: 'product-body' },
      el('h3', { class: 'product-title' }, product.product_name || product.name || 'Unnamed product'),
      el('div', { class: 'product-meta' },
        el('span', {}, `Tier: ${product.tier_name || selectedTier || 'base'}`),
        el('span', {}, `Stock: ${integer(product.available_qty ?? 0)}`),
      ),
      el('div', { class: 'price-row' },
        el('div', { class: 'price' }, money(product.final_price ?? 0)),
        el('button', { class: 'btn btn-secondary', onclick: () => onOpen?.(product) }, 'Details'),
      ),
      el('button', { class: 'btn btn-primary full', onclick: () => onAdd?.(product) }, 'Add to cart'),
    )
  );
}

export function storeScreen({ products = [], tiers = [], settings = [], search = '', selectedTier = 'base', cart = [], onAdd, onOpen, onTierChange, onCheckout, onShareInvoice, selectedProduct = null }) {
  const filtered = products.filter(p => {
    const blob = `${p.product_name || ''} ${p.company_name || ''} ${p.category_name || ''} ${p.unit_code || ''}`.toLowerCase();
    return blob.includes(String(search || '').toLowerCase());
  });
  const banner = settings?.[0]?.settings?.banner_image || settings?.[0]?.banner_image || '';

  return el('section', {},
    el('div', { class: 'section-head' },
      el('div', {}, el('h2', {}, 'Store Home'), el('p', { class: 'muted' }, 'Read-only store view backed by the runtime product view.')), 
      el('div', { class: 'toolbar' },
        el('label', { class: 'select-wrap' }, 'Tier', el('select', { onchange: (e) => onTierChange?.(e.target.value) }, ...tiers.map(t => el('option', { value: t.tier_name, selected: t.tier_name === selectedTier }, `${t.display_name || t.tier_name}`)))),
        el('button', { class: 'btn btn-primary', onclick: onCheckout }, `Checkout (${cart.length})`),
      )
    ),
    banner ? el('div', { class: 'hero-banner', style: { backgroundImage: `linear-gradient(180deg, rgba(9,15,26,.15), rgba(9,15,26,.65)), url(${banner})` } },
      el('div', { class: 'hero-banner-copy' },
        el('div', { class: 'eyebrow' }, 'Operational banner'),
        el('div', { class: 'hero-title' }, 'Tier-aware catalog with database-driven prices'),
      )
    ) : null,
    el('div', { class: 'grid-products' }, ...filtered.map(p => productCard(p, { onAdd, onOpen, selectedTier }))),
    selectedProduct ? el('div', { class: 'drawer card' },
      el('h3', {}, escapeHtml(selectedProduct.product_name || 'Product')),
      el('div', { class: 'kv' }, el('span', {}, 'Final price'), el('strong', {}, money(selectedProduct.final_price ?? 0))),
      el('div', { class: 'kv' }, el('span', {}, 'Available qty'), el('strong', {}, integer(selectedProduct.available_qty ?? 0))),
      el('div', { class: 'kv' }, el('span', {}, 'Runtime healthy'), el('strong', {}, String(selectedProduct.runtime_healthy ?? true))),
      el('button', { class: 'btn btn-primary', onclick: () => onAdd?.(selectedProduct) }, 'Add to cart'),
      el('button', { class: 'btn btn-secondary', onclick: () => onShareInvoice?.(buildWhatsAppInvoice({ order_number: 'preview', status: 'preview', items: [{ product_name_snapshot: selectedProduct.product_name, quantity: 1, line_total: selectedProduct.final_price }] })) }, 'Preview WhatsApp text')
    ) : null,
  );
}
