export async function loadRuntimeTiers(api) {
  const rows = await api.get('v_visible_tiers', { select: 'tier_name,display_name,min_order,is_default,id', order: 'min_order.asc' }).catch(() => []);
  return Array.isArray(rows) ? rows : [];
}
