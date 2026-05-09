export async function loadRuntimeSettings(api) {
  const rows = await api.get('v_app_settings', { select: 'settings,updated_at', limit: '1' }).catch(() => []);
  const row = Array.isArray(rows) ? rows[0] : null;
  return {
    settings: row?.settings && typeof row.settings === 'object' ? row.settings : {},
    updated_at: row?.updated_at || null,
  };
}
