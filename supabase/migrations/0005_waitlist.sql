-- Waitlist. New people join the waitlist instead of creating an account;
-- an admin hand-picks who gets in. Only invited emails can create an account.
--
--  waiting  -> joined the list
--  invited  -> an admin let them in; they can now create an account
--  joined   -> they created their account
--
-- Anyone (signed out) may ADD themselves. Nobody but admins may read the list,
-- so the form cannot be used to see who else is on it.

create table public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254 and email = lower(email)),
  name        text not null default '' check (char_length(name) <= 120),
  company     text not null default '' check (char_length(company) <= 120),
  role        text not null default '' check (char_length(role) <= 120),
  use_case    text not null default '' check (char_length(use_case) <= 1000),
  source      text not null default '' check (char_length(source) <= 60),
  status      text not null default 'waiting' check (status in ('waiting', 'invited', 'joined')),
  created_at  timestamptz not null default now(),
  invited_at  timestamptz,
  joined_at   timestamptz
);

alter table public.waitlist enable row level security;
grant insert (email, name, company, role, use_case, source) on public.waitlist to anon, authenticated;
grant select, update on public.waitlist to authenticated;
grant all on public.waitlist to service_role;

create policy waitlist_join on public.waitlist for insert to anon, authenticated
  with check (status = 'waiting');
create policy waitlist_admin_read on public.waitlist for select to authenticated
  using (public.is_admin());
create policy waitlist_admin_update on public.waitlist for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Joining twice with the same email is not an error the visitor should see,
-- and must not reveal that the email is already listed. join_waitlist()
-- inserts, or silently does nothing.
create function public.join_waitlist(p_email text, p_name text default '', p_company text default '',
                                     p_role text default '', p_use_case text default '', p_source text default '')
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_email is null or p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'waitlist: enter a valid email';
  end if;
  -- At most 200 joins an hour overall: stops a script filling the table.
  if (select count(*) from public.waitlist where created_at > now() - interval '1 hour') >= 200 then
    raise exception 'waitlist: too many sign-ups right now, try again later';
  end if;
  insert into public.waitlist (email, name, company, role, use_case, source)
  values (lower(btrim(p_email)), left(btrim(coalesce(p_name, '')), 120), left(btrim(coalesce(p_company, '')), 120),
          left(btrim(coalesce(p_role, '')), 120), left(btrim(coalesce(p_use_case, '')), 1000), left(btrim(coalesce(p_source, '')), 60))
  on conflict (email) do nothing;
end $$;
revoke all on function public.join_waitlist(text, text, text, text, text, text) from public;
grant execute on function public.join_waitlist(text, text, text, text, text, text) to anon, authenticated;

-- Admins only: let someone in.
create function public.invite_from_waitlist(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'only an admin can invite'; end if;
  update public.waitlist set status = 'invited', invited_at = now()
   where id = p_id and status = 'waiting';
end $$;
revoke all on function public.invite_from_waitlist(uuid) from public;
grant execute on function public.invite_from_waitlist(uuid) to authenticated;

-- The gate. Every new auth user must be on the waitlist as invited (or already
-- joined). Accounts the team creates with the service key go through the same
-- check, so add them to the list as invited first (worker/create_account.py).
-- Turn the gate off by setting app.waitlist_gate = 'off' on the database.
create function public.require_invite() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('app.waitlist_gate', true), 'on') = 'off' then
    return new;
  end if;
  if not exists (select 1 from public.waitlist w
                  where w.email = lower(new.email) and w.status in ('invited', 'joined')) then
    raise exception 'waitlist_only: this email has not been invited yet';
  end if;
  update public.waitlist set status = 'joined', joined_at = coalesce(joined_at, now())
   where email = lower(new.email);
  return new;
end $$;

create trigger require_invite
  before insert on auth.users
  for each row execute function public.require_invite();

-- Everyone who already has an account counts as joined, so nobody is locked out.
insert into public.waitlist (email, status, source, invited_at, joined_at)
select lower(u.email), 'joined', 'existing account', now(), now() from auth.users u
 where u.email is not null
on conflict (email) do nothing;
