-- Skills move to the account (v0.15.1). Amr: Skills and Scheduled belong in the
-- main menu, not inside a project. A skill library is the user's, so skills are
-- account-wide: deal_id is null for every skill written from now on. (0 skill
-- rows existed when this shipped, so nothing to migrate.)
--
-- Scheduled tasks keep deal_id: a run still belongs to one project and lands in
-- that project's chat. Only the screen moves to the main menu.

alter table public.skills alter column deal_id drop not null;
alter table public.skills drop constraint if exists skills_deal_id_prebuilt_key_key;
-- One settings row per prebuilt skill per account.
create unique index skills_owner_prebuilt_uniq on public.skills (owner_id, prebuilt_key)
  where deal_id is null and prebuilt_key is not null;
create index skills_owner_idx on public.skills (owner_id);

drop policy skills_owner on public.skills;
create policy skills_owner on public.skills for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid()
    and (deal_id is null or exists (select 1 from public.deals d where d.id = deal_id and d.owner_id = auth.uid())));
