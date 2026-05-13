ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS location_lat numeric,
  ADD COLUMN IF NOT EXISTS location_lng numeric;

COMMENT ON COLUMN public.customers.location_lat IS 'Latitude captured at customer creation';
COMMENT ON COLUMN public.customers.location_lng IS 'Longitude captured at customer creation';
