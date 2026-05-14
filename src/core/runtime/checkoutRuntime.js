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
    let waWindow = null;
    let whatsappDelivered = false;
    try {
      if (typeof window !== 'undefined' && typeof window.open === 'function') {
        waWindow = window.open('', '_blank');
        if (waWindow) {
          try { waWindow.opener = null; } catch (error) { void error; }
        }
      }

      const result = await submitOrder(api, state, tier, totals);
      const whatsappUrl = typeof buildWhatsAppInvoice === 'function'
        ? buildWhatsAppInvoice({
            order: result.order,
            items: state.commerce.cart,
            session: state.auth.session,
            customer: result.customer,
            tierLabel: tier?.visible_label || tier?.tier_name,
            supportWhatsapp: api.config.supportWhatsapp,
          })
        : null;

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
        whatsapp_url: whatsappUrl,
        whatsapp_delivery_status: waWindow ? 'pending' : 'blocked',
        whatsapp_delivery_blocked: !waWindow,
      };

      store.update((draft) => {
        draft.commerce.cart = [];
        draft.commerce.invoices = [invoice, ...(draft.commerce.invoices || [])];
        draft.ui.drawerOpen = false;
        draft.ui.activeModal = null;
        draft.ui.accountMenuOpen = false;
        draft.ui.pendingFlow = null;
      });

      if (whatsappUrl && waWindow) {
        try {
          waWindow.location.replace(whatsappUrl);
          whatsappDelivered = true;
        } catch (deliveryError) {
          console.warn('WhatsApp redirect failed, falling back to direct open', deliveryError);
          try { if (!waWindow.closed) waWindow.close(); } catch (closeError) { void closeError; }
          try {
            const fallbackWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            whatsappDelivered = Boolean(fallbackWindow);
          } catch (fallbackError) {
            console.warn('WhatsApp fallback open failed', fallbackError);
            whatsappDelivered = false;
          }
        }
      } else if (whatsappUrl && typeof window !== 'undefined' && typeof window.open === 'function') {
        try {
          const directWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
          whatsappDelivered = Boolean(directWindow);
        } catch (directError) {
          console.warn('Direct WhatsApp open failed', directError);
          whatsappDelivered = false;
        }
      }

      store.update((draft) => {
        const targetInvoice = (draft.commerce.invoices || []).find((item) => String(item.id) === String(invoice.id));
        if (targetInvoice) {
          targetInvoice.whatsapp_delivery_status = whatsappDelivered ? 'sent' : 'blocked';
          targetInvoice.whatsapp_delivery_blocked = !whatsappDelivered;
        }
      });

      if (typeof notify === 'function') {
        notify(store, whatsappDelivered ? 'success' : 'warning', whatsappDelivered ? 'تم إرسال الطلب' : 'تم حفظ الفاتورة، وفتح واتساب متاح من فواتيري', `فاتورة ${invoice.order_number || invoice.invoice_number || invoice.id}`);
      }
      if (typeof schedule === 'function') schedule('header', 'banner', 'page', 'drawer');
      if (typeof navigate === 'function') navigate(store, 'invoices');
      return true;
    } catch (error) {
      try { if (waWindow && !waWindow.closed) waWindow.close(); } catch (closeError) { void closeError; }
      console.error(error);
      if (typeof notify === 'function') notify(store, 'error', 'فشل إرسال الطلب', '');
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { isBusy, setBusy, performCheckout };
}
