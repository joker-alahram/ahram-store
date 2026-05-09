import { ROLES, ORDER_STATES } from '../contracts/runtime.js';
import { formatMoney } from './pricingService.js';
import { createId } from '../utils/uuid.js';

const ALLOWED = {
  draft: ['submitted', 'cancelled'],
  submitted: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
};

export function createOrderService(store, cartService, eventLog) {
  function reserveInventory(cartItems) {
    const state = store.getState();
    const products = state.data.products.map((row) => {
      const match = cartItems.find((item) => item.kind === 'product' && item.product_id === row.product_id && item.unit_code_snapshot === row.unit_code && item.tier_snapshot === row.tier_name);
      if (!match) return row;
      const qty = Number(match.quantity || 0);
      return { ...row, reserved_qty: Number(row.reserved_qty || 0) + qty };
    });
    store.setState({ data: { products } }, { action: 'reserve_inventory' });
  }

  function releaseInventory(cartItems) {
    const state = store.getState();
    const products = state.data.products.map((row) => {
      const match = cartItems.find((item) => item.kind === 'product' && item.product_id === row.product_id && item.unit_code_snapshot === row.unit_code && item.tier_snapshot === row.tier_name);
      if (!match) return row;
      const qty = Number(match.quantity || 0);
      return { ...row, reserved_qty: Math.max(0, Number(row.reserved_qty || 0) - qty) };
    });
    store.setState({ data: { products } }, { action: 'release_inventory' });
  }

  function deductInventory(cartItems) {
    const state = store.getState();
    const products = state.data.products.map((row) => {
      const match = cartItems.find((item) => item.kind === 'product' && item.product_id === row.product_id && item.unit_code_snapshot === row.unit_code && item.tier_snapshot === row.tier_name);
      if (!match) return row;
      const qty = Number(match.quantity || 0);
      return {
        ...row,
        reserved_qty: Math.max(0, Number(row.reserved_qty || 0) - qty),
        available_qty: Math.max(0, Number(row.available_qty || 0) - qty)
      };
    });
    store.setState({ data: { products } }, { action: 'deduct_inventory' });
  }

  function resolveCustomer(state) {
    const selected = state.data.customers.find((customer) => customer.id === state.cart.customer_id);
    return selected || null;
  }

  return {
    createFromCart() {
      const state = store.getState();
      if (!state.cart.items.length) {
        const error = new Error('VALIDATION_FAILED');
        error.code = 'VALIDATION_FAILED';
        throw error;
      }

      const role = state.auth.role;
      if (role === ROLES.GUEST) {
        const error = new Error('AUTH_REQUIRED');
        error.code = 'AUTH_REQUIRED';
        throw error;
      }

      const customer = resolveCustomer(state);
      if (!customer || customer.is_blocked) {
        const error = new Error('VALIDATION_FAILED');
        error.code = 'VALIDATION_FAILED';
        throw error;
      }

      for (const item of state.cart.items) {
        if (item.kind !== 'product') continue;
        const product = state.data.products.find((row) => row.product_id === item.product_id && row.unit_code === item.unit_code_snapshot && row.tier_name === item.tier_snapshot);
        if (!product) {
          const error = new Error('PRODUCT_NOT_SELLABLE');
          error.code = 'PRODUCT_NOT_SELLABLE';
          throw error;
        }
        const sellable = Number(product.available_qty || 0) - Number(product.reserved_qty || 0);
        if (!product.allow_backorder && sellable < item.quantity) {
          const error = new Error('INVENTORY_INSUFFICIENT');
          error.code = 'INVENTORY_INSUFFICIENT';
          throw error;
        }
      }

      const subtotal = state.cart.items.reduce((sum, item) => sum + Number(item.line_total || 0), 0);
      const order = {
        id: createId(),
        order_number: `ORD-${new Date().getFullYear()}-${String((state.data.orders.length || 0) + 1).padStart(4, '0')}`,
        customer_id: customer.id,
        sales_rep_id: state.auth.role === ROLES.SALES_REP ? state.auth.user?.id || null : customer.sales_rep_id || null,
        status: 'submitted',
        payment_status: 'unpaid',
        currency: 'EGP',
        subtotal,
        discount_total: 0,
        grand_total: subtotal,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1,
        items: state.cart.items.map((item) => ({
          product_id: item.product_id,
          product_name_snapshot: item.product_name_snapshot,
          unit_code_snapshot: item.unit_code_snapshot,
          tier_snapshot: item.tier_snapshot,
          unit_price_snapshot: item.unit_price_snapshot,
          quantity: item.quantity,
          line_total: item.line_total,
          pricing_snapshot: item.pricing_snapshot
        })),
        audit: []
      };

      reserveInventory(state.cart.items);
      store.setState((current) => ({
        data: { orders: [order, ...current.data.orders] },
        cart: { ...current.cart, items: [] }
      }), { action: 'create_order' });

      eventLog('order_creation', {
        actor_id: state.auth.user?.id,
        actor_type: state.auth.user?.user_type || state.auth.role,
        session_id: state.auth.session?.session_id,
        payload: { order_id: order.id, total: order.grand_total }
      });

      return order;
    },

    list() {
      const state = store.getState();
      const role = state.auth.role;
      const user = state.auth.user;
      if (role === ROLES.ADMIN) return state.data.orders;
      if (role === ROLES.SALES_REP) return state.data.orders.filter((order) => order.sales_rep_id === user?.id || order.customer_id === state.cart.customer_id);
      if (role === ROLES.CUSTOMER) return state.data.orders.filter((order) => order.customer_id === user?.id);
      return [];
    },

    get(id) {
      return store.getState().data.orders.find((order) => order.id === id) || null;
    },

    updateStatus(id, nextStatus) {
      const state = store.getState();
      const order = state.data.orders.find((row) => row.id === id);
      if (!order) throw Object.assign(new Error('ORDER_NOT_FOUND'), { code: 'ORDER_NOT_FOUND' });
      const allowed = ALLOWED[order.status] || [];
      if (!allowed.includes(nextStatus)) throw Object.assign(new Error('ORDER_ALREADY_FINALIZED'), { code: 'ORDER_ALREADY_FINALIZED' });

      if (nextStatus === 'cancelled') {
        releaseInventory(order.items);
      }
      if (nextStatus === 'shipped') {
        deductInventory(order.items);
      }

      const next = state.data.orders.map((row) => row.id === id ? { ...row, status: nextStatus, updated_at: new Date().toISOString(), version: (row.version || 1) + 1 } : row);
      store.setState({ data: { orders: next } }, { action: 'update_order_status' });
      eventLog('representative_action', {
        actor_id: state.auth.user?.id,
        actor_type: state.auth.user?.user_type || state.auth.role,
        session_id: state.auth.session?.session_id,
        payload: { action: 'update_order_status', order_id: id, nextStatus }
      });
    },

    editItems(id, items) {
      const state = store.getState();
      const order = state.data.orders.find((row) => row.id === id);
      if (!order) throw Object.assign(new Error('ORDER_NOT_FOUND'), { code: 'ORDER_NOT_FOUND' });
      if (!['draft', 'submitted'].includes(order.status)) {
        throw Object.assign(new Error('ORDER_ALREADY_FINALIZED'), { code: 'ORDER_ALREADY_FINALIZED' });
      }
      const next = state.data.orders.map((row) => row.id === id ? { ...row, items, updated_at: new Date().toISOString(), version: (row.version || 1) + 1 } : row);
      store.setState({ data: { orders: next } }, { action: 'edit_order_items' });
    },

    whatsappMessage(order) {
      const customer = store.getState().data.customers.find((c) => c.id === order.customer_id);
      const lines = [
        `فاتورة/طلب رقم: ${order.order_number}`,
        `العميل: ${customer?.name || order.customer_id}`,
        `الحالة: ${order.status}`,
        '---'
      ];
      for (const item of order.items || []) {
        lines.push(`${item.product_name_snapshot} × ${item.quantity} = ${formatMoney(item.line_total)} ج.م`);
      }
      lines.push('---');
      lines.push(`الإجمالي: ${formatMoney(order.grand_total)} ج.م`);
      return lines.join('\n');
    }
  };
}
