-- Chat history (v0.15.0). A project can now have many chats, like Claude.
-- Before this, each deal had exactly one thread (chat_messages.deal_id).
--
--   chats           one row per conversation: title, which deal, kind
--                   ('chat' or 'research', the Deep research mode)
--   chat_messages   gains chat_id; every message belongs to one chat
--   jobs            gain chat_id in the payload only (no schema change)
--
-- Existing messages are moved into one chat per deal called "Earlier chat",
-- so nothing anyone already wrote disappears.

create table public.chats (
  id          uuid primary key default gen_random_uuid(),
  deal_id     text not null references public.deals (id) on delete cascade,
  owner_id    uuid not null references auth.users (id) on delete cascade,
  title       text not null default 'New chat' check (char_length(title) between 1 and 120),
  kind        text not null default 'chat' check (kind in ('chat', 'research')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index chats_deal_idx on public.chats (deal_id, updated_at desc);

alter table public.chats enable row level security;
grant select, insert, delete on public.chats to authenticated;
grant update (title) on public.chats to authenticated;
grant all on public.chats to service_role;

create policy chats_read on public.chats for select
  using (owner_id = auth.uid() or public.is_admin());
create policy chats_create on public.chats for insert
  with check (owner_id = auth.uid()
    and exists (select 1 from public.deals d where d.id = deal_id and d.owner_id = auth.uid()));
create policy chats_rename on public.chats for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy chats_delete on public.chats for delete
  using (owner_id = auth.uid());

-- Messages belong to a chat.
alter table public.chat_messages add column chat_id uuid references public.chats (id) on delete cascade;
insert into public.chats (deal_id, owner_id, title, created_at, updated_at)
select deal_id, owner_id, 'Earlier chat', min(created_at), max(created_at)
  from public.chat_messages group by deal_id, owner_id;
update public.chat_messages m set chat_id = c.id
  from public.chats c where c.deal_id = m.deal_id and c.owner_id = m.owner_id and m.chat_id is null;
alter table public.chat_messages alter column chat_id set not null;
create index chat_messages_chat_idx on public.chat_messages (chat_id, id);

-- A user message must go into one of the user's own chats on that same deal.
-- VOLATILE on purpose: it must see a chat the assign_chat trigger created a moment
-- earlier in the same insert (a plain subquery uses the statement's start snapshot).
create function public.owns_chat(p_chat uuid, p_deal text) returns boolean
language sql volatile security definer set search_path = public as $$
  select exists (select 1 from public.chats c where c.id = p_chat and c.owner_id = auth.uid() and c.deal_id = p_deal)
$$;
revoke all on function public.owns_chat(uuid, text) from public;
grant execute on function public.owns_chat(uuid, text) to authenticated;
drop policy chat_post on public.chat_messages;
create policy chat_post on public.chat_messages for insert
  with check (owner_id = auth.uid() and role = 'user' and public.owns_chat(chat_id, deal_id));

-- Backward compatible: a message sent without a chat (the app and worker before
-- v0.15.0) goes into that project's most recent chat, or a new "Earlier chat".
-- Runs before the row-level check, so the policy above still applies to the result.
create function public.assign_chat() returns trigger
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if new.chat_id is null then
    -- Only into a deal this message's owner actually owns; otherwise leave it
    -- null so the insert fails (NOT NULL), never creating a chat in someone's deal.
    if not exists (select 1 from public.deals d where d.id = new.deal_id and d.owner_id = new.owner_id) then
      return new;
    end if;
    select id into cid from public.chats where deal_id = new.deal_id and owner_id = new.owner_id
     order by updated_at desc limit 1;
    if cid is null then
      insert into public.chats (deal_id, owner_id, title) values (new.deal_id, new.owner_id, 'Earlier chat') returning id into cid;
    end if;
    new.chat_id := cid;
  end if;
  return new;
end $$;
create trigger chat_messages_assign before insert on public.chat_messages
  for each row execute function public.assign_chat();

-- Any new message bumps its chat to the top of the list.
create function public.touch_chat() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.chats set updated_at = now() where id = new.chat_id;
  return new;
end $$;
create trigger chat_messages_touch after insert on public.chat_messages
  for each row execute function public.touch_chat();

-- The app lists chats live.
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.chats;
  end if;
end $$;
