import { ROLES } from '../contracts/runtime.js';
import { createId } from '../utils/uuid.js';

export function createCustomerService(store, eventLog) {
  function assertCanManage() {
    const role = store.getState().auth.role;
    if (![ROLES.ADMIN, ROLES.SALES_REP].includes(role)) {
      const error = new Error('PERMISSION_DENIED');
      error.code = 'PERMISSION_DENIED';
      throw error;
    }
  }

  return {
    list() {
      const state = store.getState();
      const role = state.auth.role;
      const user = state.auth.user;
      if (role === ROLES.ADMIN) return state.data.customers;
      if (role === ROLES.SALES_REP) return state.data.customers.filter((customer) => customer.sales_rep_id === user?.id || customer.created_by_rep_id === user?.id);
      if (role === ROLES.CUSTOMER) return state.data.customers.filter((customer) => customer.id === user?.id);
      return [];
    },
    create(payload) {
      assertCanManage();
      const state = store.getState();
      const user = state.auth.user;
      const customer = {
        id: createId(),
        name: payload.name,
        phone: payload.phone || null,
        address: payload.address || '',
        location: payload.location || '',
        username: payload.username || payload.phone || payload.name,
        password: payload.password || '1234',
        created_at: new Date().toISOString(),
        sales_rep_id: payload.sales_rep_id || (state.auth.role === ROLES.SALES_REP ? user?.id : null),
        created_by: user?.id || null,
        customer_type: payload.customer_type || (payload.sales_rep_id ? 'rep_customer' : 'direct'),
        created_by_rep_id: state.auth.role === ROLES.SALES_REP ? user?.id : payload.created_by_rep_id || null,
        is_active: true,
        default_tier_name: payload.default_tier_name || 'base',
        is_blocked: false,
        blocked_reason: null
      };

      store.setState((current) => ({
        data: { customers: [customer, ...current.data.customers] }
      }), { action: 'create_customer' });

      eventLog('customer_creation', {
        actor_id: user?.id,
        actor_type: user?.user_type,
        session_id: state.auth.session?.session_id,
        payload: { customer_id: customer.id }
      });

      return customer;
    },
    update(id, patch) {
      assertCanManage();
      const current = store.getState();
      const customers = current.data.customers.map((customer) => customer.id === id ? { ...customer, ...patch } : customer);
      store.setState({ data: { customers } }, { action: 'update_customer' });
      return customers.find((customer) => customer.id === id) || null;
    },
    reassignCustomers(repId, customerIds = []) {
      assertCanManage();
      const customers = store.getState().data.customers.map((customer) => customerIds.includes(customer.id) ? { ...customer, sales_rep_id: repId, customer_type: 'rep_customer' } : customer);
      store.setState({ data: { customers } }, { action: 'reassign_customers' });
      return customers;
    }
  };
}
