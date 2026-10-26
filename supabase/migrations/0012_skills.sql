-- Skill library (v0.15.0). A skill is a named set of instructions, with optional
-- inputs the user fills in, that the agent follows when asked for it. Prebuilt
-- skills ship in the app code (src/skills.js, worker PREBUILT_SKILLS); this table
-- holds (a) which skills are switched on per project, with their settings, and
-- (b) custom skills users write themselves.
--
--   skills   one row per custom skill, OR per prebuilt skill a user configured.
--            prebuilt_key set = a prebuilt skill's on/off + settings for a project.
--            prebuilt_key null = a custom skill (name + instructions).
--
-- Using a skill: in the chat ("/" menu or "Use skill"), or as a scheduled task.
-- The job payload carries skill_id (custom) or skill_key (prebuilt); the worker
-- loads the instructions itself, so the user's text never becomes the system
-- instructions of another account.

create table public.skills (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users (id) on delete cascade,
  deal_id       text not null references public.deals (id) on delete cascade,
  prebuilt_key  text check (prebuilt_key is null or prebuilt_key ~ '^[a-z][a-z0-9_]{1,40}$'),
  name          text not null check (char_length(name) between 1 and 80),
  description   text not null default '' check (char_length(description) <= 300),
  instructions  text not null default '' check (char_length(instructions) <= 8000),
  settings      jsonb not null default '{}'::jsonb check (pg_column_size(settings) <= 8000),
  enabled       boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (deal_id, prebuilt_key)
);
create index skills_deal_idx on public.skills (deal_id);

alter table public.skills enable row level security;
grant select, insert, update, delete on public.skills to authenticated;
grant all on public.skills to service_role;

create policy skills_owner on public.skills for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid()
    and exists (select 1 from public.deals d where d.id = deal_id and d.owner_id = auth.uid()));

-- Cap custom skills so nobody fills the table by accident.
create function public.limit_skills() returns trigger
language plpgsql as $$
begin
  if new.prebuilt_key is null and
     (select count(*) from public.skills where owner_id = new.owner_id and prebuilt_key is null) >= 50 then
    raise exception 'skill_limit: at most 50 custom skills per account';
  end if;
  return new;
end $$;
create trigger skills_limit before insert on public.skills
  for each row execute function public.limit_skills();

create function public.touch_skill() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then new.owner_id := old.owner_id; new.deal_id := old.deal_id; new.prebuilt_key := old.prebuilt_key; end if;
  return new;
end $$;
create trigger skills_touch before update on public.skills
  for each row execute function public.touch_skill();
