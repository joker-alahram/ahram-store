export function createOfferService(store, eventLog) {
  return {
    daily() {
      return store.getState().data.dailyDeals || [];
    },
    flash() {
      return store.getState().data.flashOffers || [];
    },
    recordOpen(kind, id) {
      eventLog('company_open', {
        actor_id: store.getState().auth.user?.id,
        actor_type: store.getState().auth.user?.user_type || store.getState().auth.role,
        session_id: store.getState().auth.session?.session_id,
        payload: { kind, id }
      });
    }
  };
}
