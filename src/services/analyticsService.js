export function createAnalyticsService(store) {
  return {
    summary() {
      const state = store.getState();
      const orders = state.data.orders || [];
      const customers = state.data.customers || [];
      const products = state.data.products || [];
      const revenue = orders.reduce((sum, order) => sum + Number(order.grand_total || 0), 0);
      const submitted = orders.filter((order) => order.status === 'submitted').length;
      const shipped = orders.filter((order) => order.status === 'shipped' || order.status === 'delivered').length;
      return {
        revenue,
        orders: orders.length,
        customers: customers.length,
        products: products.length,
        submitted,
        shipped
      };
    },
    repPerformance() {
      const state = store.getState();
      const reps = state.data.authUsers.filter((user) => user.user_type === 'sales_rep');
      return reps.map((rep) => ({
        id: rep.id,
        name: rep.name,
        orders: state.data.orders.filter((order) => order.sales_rep_id === rep.id).length,
        customers: state.data.customers.filter((customer) => customer.sales_rep_id === rep.id || customer.created_by_rep_id === rep.id).length
      }));
    }
  };
}
