-- CaseBuilder backend schema, v1.
--
-- Supabase is the system of record: accounts, deals (with their deck),
-- per-deal chat, jobs and schedules all live here. The Hermes worker is a
-- consumer: it claims jobs, does the work, writes results back.
--
-- Isolation: every user-facing table carries owner_id and row-level security
-- restricts it to auth.uid(). Worker functions are granted to service_role
-- only, which never leaves the server.

-- ---------------------------------------------------------------------------
-- Profiles and roles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now()
);

-- Security definer so policies can ask "is this caller an admin?" without
-- recursing through the profiles policy itself.
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- Every new auth user gets a profile. Role is always 'user'; admins are
-- promoted by hand with the service role.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- A user may not change their own role. Only app callers are restricted;
-- the database owner (Supabase SQL editor) and service_role can promote.
create function public.protect_role() returns trigger
language plpgsql as $$
begin
  if new.role is distinct from old.role
     and current_user in ('authenticated', 'anon')
     and not public.is_admin() then
    raise exception 'role can only be changed by an admin';
  end if;
  return new;
end $$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_role();

-- ---------------------------------------------------------------------------
-- Deals
-- ---------------------------------------------------------------------------
-- One row per deal. `data` is the complete deal record the app already uses
-- (fields, stakeholders, deck, connectors), so src/dealStorage.js can swap
-- localStorage for this table without reshaping the app.
-- `version` gives optimistic concurrency: a save must name the version it
-- read, so Chris and the agent can never silently overwrite each other.

create table public.deals (
  id          text primary key,
  owner_id    uuid not null references auth.users (id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  data        jsonb not null,
  version     integer not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index deals_owner_idx on public.deals (owner_id, updated_at desc);

-- Bump version and updated_at on every write; reject stale writes.
create function public.deals_versioning() returns trigger
language plpgsql as $$
begin
  if new.version <> old.version then
    raise exception 'version is managed by the database' using errcode = '22023';
  end if;
  new.version := old.version + 1;
  new.updated_at := now();
  new.owner_id := old.owner_id;  -- ownership never moves
  new.created_at := old.created_at;
  return new;
end $$;

create trigger deals_versioning
  before update on public.deals
  for each row execute function public.deals_versioning();

-- Save with a version check. Returns the new version, or raises
-- 'deal_conflict' if someone else saved first. Runs as the caller, so RLS
-- still applies.
create function public.save_deal(p_id text, p_name text, p_data jsonb, p_expected_version integer)
returns integer
language plpgsql security invoker set search_path = public as $$
declare
  v integer;
begin
  update public.deals
     set name = p_name, data = p_data
   where id = p_id and version = p_expected_version
  returning version into v;
  if v is null then
    if exists (select 1 from public.deals where id = p_id) then
      raise exception 'deal_conflict: a newer copy of this deal is already saved' using errcode = '40001';
    end if;
    raise exception 'deal_not_found' using errcode = 'P0002';
  end if;
  return v;
end $$;

-- ---------------------------------------------------------------------------
-- Chat (one thread per deal)
-- ---------------------------------------------------------------------------

create table public.chat_messages (
  id          bigint generated always as identity primary key,
  deal_id     text not null references public.deals (id) on delete cascade,
  owner_id    uuid not null references auth.users (id) on delete cascade,
  role        text not null check (role in ('user', 'assistant', 'status')),
  content     text not null,
  job_id      uuid,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index chat_deal_idx on public.chat_messages (deal_id, id);

-- ---------------------------------------------------------------------------
-- Schedules (per-user recurring tasks)
-- ---------------------------------------------------------------------------
-- pg_cron runs ONE system job every minute (enqueue_due_schedules). User
-- schedules are rows here, so users can see, pause and edit them in the app.

create table public.schedules (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users (id) on delete cascade,
  deal_id      text references public.deals (id) on delete cascade,
  title        text not null,
  kind         text not null check (kind in ('chat', 'recheck_assumptions', 'research')),
  payload      jsonb not null default '{}'::jsonb,
  every        interval not null check (every >= interval '1 hour' and every <= interval '31 days'),
  timezone     text not null default 'UTC',
  next_run_at  timestamptz not null,
  enabled      boolean not null default true,
  created_at   timestamptz not null default now()
);
create index schedules_due_idx on public.schedules (next_run_at) where enabled;

-- Month-based intervals drift; we only allow hours and days.
alter table public.schedules
  add constraint schedules_no_months check (extract(month from every) = 0 and extract(year from every) = 0);

-- Cap per account so nobody burns tokens by accident.
create function public.limit_schedules() returns trigger
language plpgsql as $$
begin
  if (select count(*) from public.schedules where owner_id = new.owner_id) >= 20 then
    raise exception 'schedule_limit: at most 20 schedules per account';
  end if;
  return new;
end $$;

create trigger schedules_limit
  before insert on public.schedules
  for each row execute function public.limit_schedules();

-- ---------------------------------------------------------------------------
-- Jobs (the queue between the web app and the Hermes worker)
-- ---------------------------------------------------------------------------

create table public.jobs (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users (id) on delete cascade,
  deal_id       text references public.deals (id) on delete cascade,
  kind          text not null check (kind in ('chat', 'research', 'find_leads', 'recheck_assumptions', 'build_deck')),
  payload       jsonb not null default '{}'::jsonb,
  status        text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed', 'cancelled')),
  attempts      integer not null default 0,
  max_attempts  integer not null default 3,
  run_after     timestamptz not null default now(),
  locked_by     text,
  locked_at     timestamptz,
  result        jsonb,
  error         text,
  schedule_id   uuid references public.schedules (id) on delete set null,
  dedupe_key    text unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index jobs_queue_idx on public.jobs (run_after, created_at) where status = 'queued';
create index jobs_owner_idx on public.jobs (owner_id, created_at desc);

-- Users may only enqueue a fresh job. Everything else is the worker's.
create function public.sanitize_user_job() returns trigger
language plpgsql as $$
begin
  if current_user = 'authenticated' then
    new.status := 'queued';
    new.attempts := 0;
    new.max_attempts := 3;
    new.run_after := now();
    new.locked_by := null;
    new.locked_at := null;
    new.result := null;
    new.error := null;
    new.schedule_id := null;
    new.dedupe_key := null;
  end if;
  return new;
end $$;

create trigger jobs_sanitize
  before insert on public.jobs
  for each row execute function public.sanitize_user_job();

-- Rate limit: at most 30 jobs per account per 10 minutes from the app.
create function public.limit_jobs() returns trigger
language plpgsql as $$
begin
  if current_user = 'authenticated' and (
    select count(*) from public.jobs
     where owner_id = new.owner_id and created_at > now() - interval '10 minutes'
  ) >= 30 then
    raise exception 'rate_limited: too many requests, try again in a few minutes';
  end if;
  return new;
end $$;

create trigger jobs_rate_limit
  before insert on public.jobs
  for each row execute function public.limit_jobs();

-- ---------------------------------------------------------------------------
-- Worker functions (service_role only)
-- ---------------------------------------------------------------------------

-- Claim the next job. SKIP LOCKED means several workers can run without
-- ever taking the same job. Jobs stuck in 'running' longer than p_stale
-- (worker crashed) are requeued first.
create function public.claim_job(p_worker text, p_stale interval default interval '10 minutes')
returns setof public.jobs
language plpgsql security definer set search_path = public as $$
begin
  update public.jobs
     set status = case when attempts >= max_attempts then 'failed' else 'queued' end,
         error = case when attempts >= max_attempts then 'worker stopped responding' else error end,
         locked_by = null, locked_at = null, updated_at = now()
   where status = 'running' and locked_at < now() - p_stale;

  return query
  update public.jobs j
     set status = 'running', attempts = j.attempts + 1,
         locked_by = p_worker, locked_at = now(), updated_at = now()
   where j.id = (
     select id from public.jobs
      where status = 'queued' and run_after <= now()
      order by run_after, created_at
      for update skip locked
      limit 1)
  returning j.*;
end $$;

create function public.complete_job(p_id uuid, p_worker text, p_result jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.jobs
     set status = 'done', result = p_result, error = null, updated_at = now()
   where id = p_id and status = 'running' and locked_by = p_worker;
  if not found then
    raise exception 'job % is not running under worker %', p_id, p_worker;
  end if;
end $$;

-- Retry with backoff (1, 4, 9 minutes...) until max_attempts, then fail.
create function public.fail_job(p_id uuid, p_worker text, p_error text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  s text;
begin
  update public.jobs
     set status = case when attempts >= max_attempts then 'failed' else 'queued' end,
         run_after = now() + make_interval(mins => attempts * attempts),
         error = p_error, locked_by = null, locked_at = null, updated_at = now()
   where id = p_id and status = 'running' and locked_by = p_worker
  returning status into s;
  if s is null then
    raise exception 'job % is not running under worker %', p_id, p_worker;
  end if;
  return s;
end $$;

-- Called by pg_cron every minute. Turns due schedules into jobs.
-- dedupe_key = schedule + slot, so the same slot can never be queued twice.
-- If the system was down for several slots, they collapse into ONE job and
-- next_run_at jumps past now().
create function public.enqueue_due_schedules()
returns integer
language plpgsql security definer set search_path = public as $$
declare
  s public.schedules%rowtype;
  n integer := 0;
  nxt timestamptz;
begin
  for s in
    select * from public.schedules
     where enabled and next_run_at <= now()
     order by next_run_at
     for update skip locked
  loop
    insert into public.jobs (owner_id, deal_id, kind, payload, schedule_id, dedupe_key)
    values (s.owner_id, s.deal_id, s.kind, s.payload, s.id, s.id::text || ':' || s.next_run_at::text)
    on conflict (dedupe_key) do nothing;
    if found then n := n + 1; end if;

    -- Step in the schedule's own timezone so "every day at 9 AM" stays at
    -- 9 AM across daylight-saving changes.
    nxt := s.next_run_at;
    while nxt <= now() loop
      nxt := ((nxt at time zone s.timezone) + s.every) at time zone s.timezone;
    end loop;
    update public.schedules set next_run_at = nxt where id = s.id;
  end loop;
  return n;
end $$;

revoke execute on function public.claim_job(text, interval) from public, anon, authenticated;
revoke execute on function public.complete_job(uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function public.fail_job(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.enqueue_due_schedules() from public, anon, authenticated;
grant execute on function public.claim_job(text, interval) to service_role;
grant execute on function public.complete_job(uuid, text, jsonb) to service_role;
grant execute on function public.fail_job(uuid, text, text) to service_role;
grant execute on function public.enqueue_due_schedules() to service_role;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.profiles      enable row level security;
alter table public.deals         enable row level security;
alter table public.chat_messages enable row level security;
alter table public.schedules     enable row level security;
alter table public.jobs          enable row level security;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.deals to authenticated;
grant select, insert on public.chat_messages to authenticated;
grant select, insert, update, delete on public.schedules to authenticated;
grant select, insert on public.jobs to authenticated;
grant all on all tables in schema public to service_role;

-- profiles
create policy profiles_read on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- deals: owner has full control; admins can read everything
create policy deals_owner on public.deals for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy deals_admin_read on public.deals for select
  using (public.is_admin());

-- chat: owner reads; owner may only post 'user' messages on their own deals.
-- Assistant and status messages come from the worker (service_role).
create policy chat_read on public.chat_messages for select
  using (owner_id = auth.uid() or public.is_admin());
create policy chat_post on public.chat_messages for insert
  with check (
    owner_id = auth.uid() and role = 'user'
    and exists (select 1 from public.deals d where d.id = deal_id and d.owner_id = auth.uid()));

-- schedules: owner-only, and only on their own deals
create policy schedules_owner on public.schedules for all
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and (deal_id is null or exists (select 1 from public.deals d where d.id = deal_id and d.owner_id = auth.uid())));

-- jobs: owner reads and enqueues on their own deals; no updates or deletes
create policy jobs_read on public.jobs for select
  using (owner_id = auth.uid() or public.is_admin());
create policy jobs_enqueue on public.jobs for insert
  with check (
    owner_id = auth.uid()
    and (deal_id is null or exists (select 1 from public.deals d where d.id = deal_id and d.owner_id = auth.uid())));

-- ---------------------------------------------------------------------------
-- Realtime: the app subscribes to chat and job status changes
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.chat_messages, public.jobs;
  end if;
end $$;
