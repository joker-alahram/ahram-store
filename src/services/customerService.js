export async function loadRepCustomers(api, repId) {
  if (!repId) return [];
  const rows = await api.get('v_rep_customers', {
    select: 'id,name,phone,address,location,username,created_at,sales_rep_id,created_by,customer_type',
    sales_rep_id: `eq.${repId}`,
    order: 'created_at.desc',
  }).catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

export async function createCustomer(api, payload) {
  const rows = await api.post('customers', payload).catch((error) => { throw error; });
  return Array.isArray(rows) ? rows[0] : rows;
}

export function persistSelectedCustomer(customer) {
  void customer;
}
