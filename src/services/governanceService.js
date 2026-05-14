function normalizeIdentity(value) {
  return String(value ?? '').trim();
}

function toUniqueList(rows, keySelector) {
  const seen = new Set();
  const result = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    const key = keySelector(row);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(row);
  }
  return result;
}

function mapByKey(rows, keySelector) {
  const map = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const key = keySelector(row);
    if (!key) continue;
    map.set(key, row);
  }
  return map;
}

export async function loadGovernanceProjection(api, session) {
  const identity = normalizeIdentity(session?.phone || session?.username || session?.id || session?.name);
  if (!identity) {
    return {
      systemUser: null,
      capabilities: [],
      workflowTransitions: [],
      loaded: true,
      loading: false,
      failed: false,
    };
  }

  const select = 'id,full_name,phone,username,user_type,manager_user_id,is_active,is_blocked,blocked_reason,created_at,updated_at';
  const byPhone = await api.get('system_users', {
    select,
    phone: `eq.${identity}`,
    limit: '1',
  }).catch(() => []);
  const userRows = Array.isArray(byPhone) && byPhone.length
    ? byPhone
    : await api.get('system_users', {
        select,
        username: `eq.${identity}`,
        limit: '1',
      }).catch(() => []);

  const systemUser = Array.isArray(userRows) ? userRows[0] || null : null;
  if (!systemUser?.id) {
    const workflowStates = await api.get('workflow_states', {
      select: 'id,state_key,display_name,description,is_initial,is_terminal,is_active,sort_order',
      is_active: 'eq.true',
      order: 'sort_order.asc',
    }).catch(() => []);
    const workflowTransitions = await api.get('workflow_transitions', {
      select: 'id,from_state_id,to_state_id,is_active,created_at',
      is_active: 'eq.true',
    }).catch(() => []);
    return {
      systemUser: null,
      capabilities: [],
      workflowTransitions: Array.isArray(workflowTransitions) ? workflowTransitions : [],
      workflowStates: Array.isArray(workflowStates) ? workflowStates : [],
      loaded: true,
      loading: false,
      failed: false,
    };
  }

  const userCapabilityRows = await api.get('user_capabilities', {
    select: 'capability_id,is_active,granted_at,expires_at',
    system_user_id: `eq.${systemUser.id}`,
    is_active: 'eq.true',
  }).catch(() => []);

  const capabilityIds = toUniqueList(userCapabilityRows, (row) => normalizeIdentity(row?.capability_id))
    .map((row) => normalizeIdentity(row?.capability_id))
    .filter(Boolean);

  const capabilities = capabilityIds.length
    ? await api.get('capabilities', {
        select: 'id,capability_key,display_name,domain_key,description,is_active,is_system,created_at,updated_at',
        id: `in.(${capabilityIds.join(',')})`,
        is_active: 'eq.true',
      }).catch(() => [])
    : [];

  const workflowStates = await api.get('workflow_states', {
    select: 'id,state_key,display_name,description,is_initial,is_terminal,is_active,sort_order',
    is_active: 'eq.true',
    order: 'sort_order.asc',
  }).catch(() => []);

  const workflowTransitions = await api.get('workflow_transitions', {
    select: 'id,from_state_id,to_state_id,is_active,created_at',
    is_active: 'eq.true',
  }).catch(() => []);

  const transitionCapabilities = await api.get('workflow_transition_capabilities', {
    select: 'transition_id,capability_id',
  }).catch(() => []);

  const stateById = mapByKey(workflowStates, (row) => normalizeIdentity(row?.id));
  const capabilityById = mapByKey(capabilities, (row) => normalizeIdentity(row?.id));
  const capabilitiesByTransition = new Map();
  for (const row of Array.isArray(transitionCapabilities) ? transitionCapabilities : []) {
    const transitionId = normalizeIdentity(row?.transition_id);
    const capabilityId = normalizeIdentity(row?.capability_id);
    if (!transitionId || !capabilityId) continue;
    const capability = capabilityById.get(capabilityId) || null;
    if (!capabilitiesByTransition.has(transitionId)) capabilitiesByTransition.set(transitionId, []);
    capabilitiesByTransition.get(transitionId).push(capability ? {
      id: capability.id,
      capability_key: capability.capability_key,
      display_name: capability.display_name,
      domain_key: capability.domain_key,
      description: capability.description,
      is_active: capability.is_active,
      is_system: capability.is_system,
    } : { id: capabilityId, capability_key: null, display_name: null, domain_key: null, description: null, is_active: false, is_system: false });
  }

  const normalizedTransitions = [];
  for (const row of Array.isArray(workflowTransitions) ? workflowTransitions : []) {
    const fromState = stateById.get(normalizeIdentity(row?.from_state_id)) || null;
    const toState = stateById.get(normalizeIdentity(row?.to_state_id)) || null;
    normalizedTransitions.push({
      id: row.id,
      from_state_id: row.from_state_id,
      to_state_id: row.to_state_id,
      from_state_key: fromState?.state_key || null,
      to_state_key: toState?.state_key || null,
      from_state: fromState,
      to_state: toState,
      capabilities: capabilitiesByTransition.get(normalizeIdentity(row?.id)) || [],
      is_active: row.is_active !== false,
      created_at: row.created_at || null,
    });
  }

  return {
    systemUser,
    capabilities: Array.isArray(capabilities) ? capabilities : [],
    workflowTransitions: normalizedTransitions,
    workflowStates: Array.isArray(workflowStates) ? workflowStates : [],
    loaded: true,
    loading: false,
    failed: false,
  };
}
