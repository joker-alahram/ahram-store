-- Safe additive SQL extensions for frontend analytics and feature control
-- No existing table is modified. No data is deleted, renamed, or altered.

CREATE TABLE IF NOT EXISTS public.ui_sessions (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT,
  session_id TEXT UNIQUE,
  user_id TEXT,
  customer_id TEXT,
  rep_id TEXT,
  current_section TEXT,
  user_agent TEXT,
  referrer TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ui_sessions_user_id ON public.ui_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_ui_sessions_customer_id ON public.ui_sessions (customer_id);
CREATE INDEX IF NOT EXISTS idx_ui_sessions_rep_id ON public.ui_sessions (rep_id);
CREATE INDEX IF NOT EXISTS idx_ui_sessions_last_seen_at ON public.ui_sessions (last_seen_at DESC);

CREATE TABLE IF NOT EXISTS public.ui_events (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT,
  session_id TEXT,
  user_id TEXT,
  customer_id TEXT,
  rep_id TEXT,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  page_key TEXT,
  action TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ui_events_created_at ON public.ui_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ui_events_event_type ON public.ui_events (event_type);
CREATE INDEX IF NOT EXISTS idx_ui_events_entity_type ON public.ui_events (entity_type);
CREATE INDEX IF NOT EXISTS idx_ui_events_session_id ON public.ui_events (session_id);

CREATE TABLE IF NOT EXISTS public.ui_feature_flags (
  flag_key TEXT PRIMARY KEY,
  flag_value BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.ui_feature_flags (flag_key, flag_value, description)
VALUES
  ('enable_new_layout', TRUE, 'Activate the modular frontend layout'),
  ('enable_recommendation_rail', TRUE, 'Show recommendation sections powered by views'),
  ('enable_minimal_toasts', TRUE, 'Use the single toast instance only'),
  ('enable_customer_context', TRUE, 'Keep rep/customer context visible in the UI')
ON CONFLICT (flag_key) DO UPDATE
SET flag_value = EXCLUDED.flag_value,
    description = EXCLUDED.description,
    updated_at = NOW();

CREATE OR REPLACE VIEW public.v_ui_event_daily AS
SELECT
  DATE(created_at) AS event_date,
  event_type,
  entity_type,
  COUNT(*) AS event_count
FROM public.ui_events
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 4 DESC;
