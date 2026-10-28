-- save_deal raised its version conflict with SQLSTATE 40001 (serialization_failure).
-- PostgREST treats 40001 as transient and retries the call itself, so a stale
-- save never returned: it looped inside the server (~500 retries a second),
-- held every pooled connection, and every other request (deals list, model keys,
-- sign-in reads, the worker's claim_job) timed out with PGRST003 / 504.
-- Same message, so the app's /deal_conflict/ check is unchanged; a plain
-- raise_exception code (40001) is returned to the client once.
create or replace function public.save_deal(p_id text, p_name text, p_data jsonb, p_expected_version integer)
returns integer
language plpgsql
set search_path to 'public'
as $function$
declare
  v integer;
begin
  update public.deals
     set name = p_name, data = p_data
   where id = p_id and version = p_expected_version
  returning version into v;
  if v is null then
    if exists (select 1 from public.deals where id = p_id) then
      raise exception 'deal_conflict: a newer copy of this deal is already saved' using errcode = 'P0001';
    end if;
    raise exception 'deal_not_found' using errcode = 'P0002';
  end if;
  return v;
end $function$;
