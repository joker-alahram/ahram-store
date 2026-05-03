import { runtimeRegistry } from './runtime-registry.js';
const { state } = runtimeRegistry;
/* header.runtime.js — header rendering and shell sync */



function updateHeader() {
  const tier = getSelectedTierObject();
  const tierLabel = getSelectedTierLabel();
  const statusLine = tierStatusLine();
  const minimum = selectedTierMinimum();
  const eligible = Number(eligibleTierTotal() || 0);
  const remaining = tier ? Math.max(0, minimum - eligible) : 0;
  const progress = tier && minimum > 0 ? Math.max(0, Math.min(100, (eligible / minimum) * 100)) : 0;
  const discount = Number(tier?.discount_percent || 0);

  if (els.headerSearchInput) els.headerSearchInput.value = state.search;
  if (els.cartLabel) els.cartLabel.textContent = 'السلة';
  if (els.cartValue) els.cartValue.textContent = integer(cartTotal());
  if (els.cartBadge) els.cartBadge.textContent = integer(state.cart.reduce((sum, item) => sum + Number(item.qty || 1), 0));
  if (els.userBtnLabel) els.userBtnLabel.textContent = getSessionLabel();
  if (els.userBtnSub) els.userBtnSub.textContent = state.session ? 'حسابك التجاري' : 'تسجيل الدخول';

  if (els.tierBtn) {
    els.tierBtn.title = tier ? `${tierLabel} · تغيير الشريحة` : 'اختيار الشريحة التجارية';
    els.tierBtn.setAttribute('aria-label', tier ? `تغيير الشريحة الحالية ${tierLabel}` : 'اختيار الشريحة التجارية');
  }
  if (els.tierContextTitle) els.tierContextTitle.textContent = tier ? tierLabel : 'الشريحة الحالية';
  if (els.tierContextStatus) els.tierContextStatus.textContent = statusLine;
  if (els.tierDiscountState) els.tierDiscountState.textContent = tier ? `الخصم ${num(discount)}%` : 'الخصم —';
  if (els.tierMinState) els.tierMinState.textContent = tier ? `الحد الأدنى ${num(minimum)} ج.م` : 'الحد الأدنى —';
  if (els.tierCurrentEligible) els.tierCurrentEligible.textContent = tier ? `${num(eligible)} ج.م` : '—';
  if (els.tierRemaining) els.tierRemaining.textContent = tier ? `${num(remaining)} ج.م` : '—';
  if (els.tierProgressFill) els.tierProgressFill.style.width = `${progress}%`;

  updateSocialLinks();
  updateFlashHeader();
  syncCheckoutButton();
  updateOperationalNav();
}


function initHeaderRuntime() {
  updateHeader();
}



function updateSocialLinks() {
  if (els.socialCall) els.socialCall.setAttribute('href', 'tel:01040880002');
  if (els.socialWhatsapp) els.socialWhatsapp.setAttribute('href', `https://wa.me/${CONFIG.supportWhatsapp}`);
  if (els.socialFacebook) els.socialFacebook.setAttribute('href', 'https://www.facebook.com/alahram2014/');
}
