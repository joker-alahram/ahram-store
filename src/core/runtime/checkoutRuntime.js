export function createCheckoutRuntime({ validateCheckout, submitOrder, buildWhatsAppInvoice, notify, navigate, getSelectedTier, computeCartTotals } = {}) {
  let busy = false;

  function isBusy() { return busy; }
  function setBusy(next) { busy = Boolean(next); }

  async function performCheckout({ store, api, schedule }) {
    if (busy) return false;
    const state = store.getState();
    const tier = typeof getSelectedTier === 'function' ? getSelectedTier(state) : null;
    const totals = typeof computeCartTotals === 'function' ? computeCartTotals(state) : { grand: 0 };
    const validation = typeof validateCheckout === 'function' ? validateCheckout(state, tier, totals) : { ok: false, message: 'INVALID_CHECKOUT' };
    if (!validation.ok) {
      if (typeof notify === 'function') notify(store, 'warning', 'تعذر الإرسال', validation.message);
      return false;
    }

    setBusy(true);
    let whatsappPopup = null;
    try {
      if (typeof window !== 'undefined') {
        try {
          whatsappPopup = window.open('', '_blank', 'noopener,noreferrer');
        } catch (popupError) {
          whatsappPopup = null;
        }
      }

      const result = await submitOrder(api, state, tier, totals);
      const cartSnapshot = Array.isArray(state.commerce.cart) ? state.commerce.cart.map((item) => ({ ...item })) : [];
      const invoice = {
        id: result.order.id,
        order_number: result.order.order_number,
        invoice_number: result.order.invoice_number,
        created_at: result.order.created_at || new Date().toISOString(),
        total_amount: result.order.total_amount,
        status: result.order.status,
        user_type: result.order.user_type,
        customer_id: result.order.customer_id,
        user_id: result.order.user_id,
        sales_rep_id: result.order.sales_rep_id,
        customer_name: result.customer?.name || state.auth.selectedCustomer?.name || state.auth.session?.name || '',
      };
      const whatsappUrl = typeof buildWhatsAppInvoice === 'function'
        ? buildWhatsAppInvoice({
            order: result.order,
            items: cartSnapshot,
            session: state.auth.session,
            customer: result.customer,
            tierLabel: tier?.visible_label || tier?.tier_name,
            supportWhatsapp: api.config.supportWhatsapp,
          })
        : null;

      if (whatsappPopup) {
        try {
          whatsappPopup.location.href = whatsappUrl;
        } catch (popupNavigateError) {
          try { whatsappPopup.close(); } catch (_) {}
          whatsappPopup = null;
          if (whatsappUrl && typeof window !== 'undefined') window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        }
      } else if (whatsappUrl && typeof window !== 'undefined') {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }

      store.update((draft) => {
        draft.commerce.cart = [];
        draft.commerce.invoices = [invoice, ...(draft.commerce.invoices || [])];
        if (!draft.commerce.invoiceItemsById) draft.commerce.invoiceItemsById = {};
        draft.commerce.invoiceItemsById[String(invoice.id)] = cartSnapshot;
        draft.ui.drawerOpen = false;
        draft.ui.activeModal = null;
        draft.ui.accountMenuOpen = false;
        draft.ui.pendingFlow = null;
        draft.ui.selectedInvoiceId = invoice.id;
      });
      if (typeof notify === 'function') notify(store, 'success', 'تم إرسال الطلب', `فاتورة ${invoice.order_number || invoice.invoice_number || invoice.id}`);
      if (typeof schedule === 'function') schedule('header', 'banner', 'page', 'drawer');
      if (typeof navigate === 'function') navigate(store, 'invoice', { invoiceId: invoice.id });
      return true;
    } catch (error) {
      console.error(error);
      if (whatsappPopup) {
        try { whatsappPopup.close(); } catch (_) {}
      }
      if (typeof notify === 'function') notify(store, 'error', 'فشل إرسال الطلب', '');
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { isBusy, setBusy, performCheckout };
}
