function normalizeIdentity(value) {
  return String(value ?? '').trim();
}

export function resolveCanonicalRepId(session, fallback = null) {
  if (!session || typeof session !== 'object') return normalizeIdentity(fallback) || null;
  const userType = normalizeIdentity(session.userType || session.user_type || session.role).toLowerCase();
  const candidate = session.sales_rep_id
    ?? session.rep_id
    ?? session.created_by_rep_id
    ?? (userType === 'rep' ? session.id : null)
    ?? fallback;
  const normalized = normalizeIdentity(candidate);
  return normalized || null;
}

export function buildOwnershipScope(session, fallback = null) {
  const canonicalRepId = resolveCanonicalRepId(session, fallback);
  const userType = normalizeIdentity(session?.userType || session?.user_type || session?.role).toLowerCase() || null;
  return {
    canonicalRepId,
    sales_rep_id: canonicalRepId,
    rep_id: canonicalRepId,
    userType,
    hasScope: Boolean(canonicalRepId),
  };
}

export function hasOwnershipScope(session) {
  return Boolean(resolveCanonicalRepId(session));
}

export function normalizeOwnershipRow(row) {
  if (!row || typeof row !== 'object') return row;
  const sales_rep_id = row.sales_rep_id ?? row.rep_id ?? null;
  const rep_id = row.rep_id ?? row.sales_rep_id ?? null;
  const created_by_rep_id = row.created_by_rep_id ?? null;
  return {
    ...row,
    sales_rep_id,
    rep_id,
    created_by_rep_id,
  };
}

export function resolveScopedCustomerQuery(session, { includeLegacy = false } = {}) {
  const canonicalRepId = resolveCanonicalRepId(session);
  if (!canonicalRepId) return null;
  const query = {
    select: 'id,name,phone,address,location,username,created_at,sales_rep_id,rep_id:sales_rep_id,created_by,created_by_rep_id,customer_type',
    sales_rep_id: `eq.${canonicalRepId}`,
    customer_type: 'eq.rep',
    order: 'created_at.desc',
  };
  if (includeLegacy) {
    query.or = `(sales_rep_id.eq.${canonicalRepId},created_by_rep_id.eq.${canonicalRepId})`;
  }
  return query;
}

export function resolveScopedOrderQuery(session, { includeLegacy = false } = {}) {
  const canonicalRepId = resolveCanonicalRepId(session);
  if (!canonicalRepId) return null;
  const query = {
    select: 'id,order_number,invoice_number,created_at,total_amount,status,user_type,customer_id,user_id,sales_rep_id,rep_id,updated_at',
    sales_rep_id: `eq.${canonicalRepId}`,
    order: 'created_at.desc',
  };
  if (includeLegacy) {
    query.or = `(sales_rep_id.eq.${canonicalRepId},rep_id.eq.${canonicalRepId})`;
  }
  return query;
}
