begin;

-- Backfill canonical ownership where legacy rows still rely on older fields.
update public.customers
set sales_rep_id = coalesce(sales_rep_id, created_by_rep_id)
where customer_type = 'rep'
  and sales_rep_id is null
  and created_by_rep_id is not null;

update public.orders
set sales_rep_id = coalesce(sales_rep_id, rep_id)
where sales_rep_id is null
  and rep_id is not null;

-- Keep the public compatibility view aligned with the canonical field while
-- exposing legacy aliases so older consumers do not 400.
create or replace view public.v_rep_customers as
select
  id,
  name,
  phone,
  address,
  location,
  username,
  password,
  created_at,
  sales_rep_id,
  sales_rep_id as rep_id,
  created_by,
  created_by_rep_id,
  customer_type
from public.customers
where customer_type = 'rep';

commit;
