function normalizeText(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

export function normalizeUserType(value, fallback = null) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'rep' || raw === 'sales_rep' || raw === 'sales rep' || raw === 'sales-rep') return 'rep';
  if (raw === 'admin') return 'admin';
  if (raw === 'customer' || raw === 'direct') return 'customer';
  return fallback;
}

function coerceSource(source) {
  if (source && typeof source === 'object') return source;
  if (source === null || source === undefined || source === '') return null;
  return { id: source, userType: 'rep' };
}

export function buildOwnershipScope(source) {
  const session = coerceSource(source);
  if (!session) {
    return {
      userType: null,
      sessionId: null,
      sales_rep_id: null,
      rep_id: null,
      created_by_rep_id: null,
      legacyRepId: null,
      hasScope: false,
      isRep: false,
    };
  }

  const userType = normalizeUserType(session.userType || session.user_type || session.role || null, null);
  const sessionId = normalizeText(session.id ?? session.user_id ?? null);
  const explicitSalesRepId = normalizeText(session.sales_rep_id ?? null);
  const legacyRepId = normalizeText(session.rep_id ?? session.created_by_rep_id ?? null);
  const canonicalSalesRepId = explicitSalesRepId || (userType === 'rep' ? sessionId : null);

  return {
    userType,
    sessionId,
    sales_rep_id: canonicalSalesRepId,
    rep_id: normalizeText(session.rep_id ?? canonicalSalesRepId) || canonicalSalesRepId,
    created_by_rep_id: normalizeText(session.created_by_rep_id ?? null),
    legacyRepId,
    hasScope: Boolean(userType === 'rep' && canonicalSalesRepId),
    isRep: userType === 'rep',
  };
}

export function hasOwnershipScope(source) {
  return buildOwnershipScope(source).hasScope;
}

export function normalizeOwnershipRow(row) {
  if (!row || typeof row !== 'object') return row;
  const canonicalSalesRepId = normalizeText(row.sales_rep_id ?? row.rep_id ?? null);
  const legacyRepId = normalizeText(row.rep_id ?? canonicalSalesRepId ?? null);
  const createdByRepId = normalizeText(row.created_by_rep_id ?? null);
  return {
    ...row,
    sales_rep_id: canonicalSalesRepId,
    rep_id: legacyRepId,
    created_by_rep_id: createdByRepId,
  };
}

export function resolveScopedCustomerQuery(source, options = {}) {
  const scope = buildOwnershipScope(source);
  if (!scope.hasScope) {
    return { scope, primary: null, legacy: null, canonicalId: null };
  }

  const select = options.select || 'id,name,phone,address,location,username,created_at,sales_rep_id,rep_id,created_by,customer_type';
  const order = options.order || 'created_at.desc';
  const canonicalId = scope.sales_rep_id;

  return {
    scope,
    canonicalId,
    primary: {
      select,
      sales_rep_id: `eq.${canonicalId}`,
      order,
    },
    legacy: {
      select,
      rep_id: `eq.${canonicalId}`,
      order,
    },
  };
}

export function resolveScopedOrderQuery(source, options = {}) {
  const scope = buildOwnershipScope(source);
  const select = options.select || 'id,order_number,invoice_number,created_at,total_amount,status,user_type,customer_id,user_id,sales_rep_id,rep_id,updated_at';
  const order = options.order || 'created_at.desc';
  const customerIds = Array.isArray(options.customerIds)
    ? options.customerIds.map((value) => normalizeText(value)).filter(Boolean)
    : [];

  if (scope.hasScope) {
    const canonicalId = scope.sales_rep_id;
    const primaryFilters = [`sales_rep_id.eq.${canonicalId}`];
    const legacyFilters = [`rep_id.eq.${canonicalId}`];
    if (customerIds.length) {
      const customerFilter = `customer_id.in.(${customerIds.join(',')})`;
      primaryFilters.push(customerFilter);
      legacyFilters.push(customerFilter);
    }

    return {
      scope,
      canonicalId,
      mode: 'rep',
      primary: {
        select,
        or: `(${primaryFilters.join(',')})`,
        order,
      },
      legacy: {
        select,
        or: `(${legacyFilters.join(',')})`,
        order,
      },
    };
  }

  if (scope.sessionId) {
    return {
      scope,
      canonicalId: null,
      mode: 'direct',
      primary: {
        select,
        or: `(customer_id.eq.${scope.sessionId},user_id.eq.${scope.sessionId})`,
        order,
      },
      legacy: null,
    };
  }

  return {
    scope,
    canonicalId: null,
    mode: 'none',
    primary: null,
    legacy: null,
  };
}
