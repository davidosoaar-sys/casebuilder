-- Project files: the project's own context, like files in a Claude Project.
-- Past decks Chris liked (deck inspiration), finance sheets, call notes, a
-- CLAUDE.md-style workflow file. The agent reads them on every chat and deck
-- run for that project.
--
-- We keep the extracted TEXT (that is what the agent reads), plus the file's
-- name, type and size. The browser extracts text from PDF, Word, PowerPoint,
-- Excel and plain text before upload, so the server never parses user files.

create table public.project_files (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  deal_id     text not null references public.deals (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 200),
  kind        text not null default 'context' check (kind in ('context', 'deck_inspiration', 'instructions')),
  mime        text not null default '',
  size_bytes  integer not null default 0 check (size_bytes >= 0),
  text        text not null default '' check (char_length(text) <= 300000),
  pages       integer,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now()
);
create index project_files_deal_idx on public.project_files (deal_id, created_at);

alter table public.project_files enable row level security;
grant select, insert, update, delete on public.project_files to authenticated;
grant all on public.project_files to service_role;

-- Owner only, and only on their own deals.
create policy project_files_owner on public.project_files for all
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.deals d where d.id = deal_id and d.owner_id = auth.uid()));

-- At most 50 files and 2,000,000 characters per project.
create function public.limit_project_files() returns trigger
language plpgsql as $$
begin
  if (select count(*) from public.project_files where deal_id = new.deal_id) >= 50 then
    raise exception 'file_limit: at most 50 files per project';
  end if;
  if (select coalesce(sum(char_length(text)), 0) from public.project_files where deal_id = new.deal_id)
     + char_length(new.text) > 2000000 then
    raise exception 'file_limit: this project has too much text in its files';
  end if;
  return new;
end $$;

create trigger project_files_limit
  before insert on public.project_files
  for each row execute function public.limit_project_files();
