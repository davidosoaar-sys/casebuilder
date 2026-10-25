-- Waitlist: an approved email passes straight through.
-- join_waitlist now returns what should happen next:
--   'waiting' -> on the list, wait for an invite
--   'invited' -> already approved: go straight to creating the account
--   'joined'  -> already has an account: sign in
-- The visitor only learns the status of the email they typed themselves.
-- approve_email lets an admin pre-approve someone by email before they join.

drop function public.join_waitlist(text, text, text, text, text, text);

create function public.join_waitlist(p_email text, p_name text default '', p_role text default '', p_source text default '')
returns text
language plpgsql security definer set search_path = public as $$
declare
  e text := lower(btrim(coalesce(p_email, '')));
  s text;
begin
  if e !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'waitlist: enter a valid email';
  end if;
  select status into s from public.waitlist where email = e;
  if s is not null then
    -- Fill in a name/role the admin did not have when pre-approving.
    update public.waitlist
       set name = case when name = '' then left(btrim(coalesce(p_name, '')), 120) else name end,
           role = case when role = '' then left(btrim(coalesce(p_role, '')), 120) else role end
     where email = e;
    return s;
  end if;
  if (select count(*) from public.waitlist where created_at > now() - interval '1 hour') >= 200 then
    raise exception 'waitlist: too many sign-ups right now, try again later';
  end if;
  insert into public.waitlist (email, name, role, source)
  values (e, left(btrim(coalesce(p_name, '')), 120), left(btrim(coalesce(p_role, '')), 120), left(btrim(coalesce(p_source, '')), 60));
  return 'waiting';
end $$;
revoke all on function public.join_waitlist(text, text, text, text) from public;
grant execute on function public.join_waitlist(text, text, text, text) to anon, authenticated;

create function public.approve_email(p_email text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  e text := lower(btrim(coalesce(p_email, '')));
begin
  if not public.is_admin() then raise exception 'only an admin can approve'; end if;
  if e !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'waitlist: enter a valid email'; end if;
  insert into public.waitlist (email, status, source, invited_at) values (e, 'invited', 'approved by admin', now())
  on conflict (email) do update set status = 'invited', invited_at = coalesce(public.waitlist.invited_at, now())
   where public.waitlist.status = 'waiting';
end $$;
revoke all on function public.approve_email(text) from public;
grant execute on function public.approve_email(text) to authenticated;
