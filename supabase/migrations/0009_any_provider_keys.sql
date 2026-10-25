-- Bring your own key, any provider (v0.15.0).
-- Adds OpenRouter next to Anthropic, OpenAI and Google, checks each key's
-- prefix, and records which provider the account's agent should use when
-- more than one key is saved ("preferred"). The newest saved key becomes
-- preferred automatically; the user can switch in Settings.

alter table public.model_keys drop constraint model_keys_provider_check;
alter table public.model_keys add constraint model_keys_provider_check
  check (provider in ('anthropic', 'openai', 'google', 'openrouter'));
alter table public.model_keys add column preferred boolean not null default false;
grant select (preferred) on public.model_keys to authenticated;
-- At most one preferred key per account.
create unique index model_keys_one_preferred on public.model_keys (owner_id) where preferred;
-- Existing accounts: their only key so far (Anthropic) is the preferred one.
update public.model_keys set preferred = true where provider = 'anthropic';

create or replace function public.set_model_key(p_provider text, p_key text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  k text := btrim(coalesce(p_key, ''));
  sid uuid;
  nm text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_provider not in ('anthropic', 'openai', 'google', 'openrouter') then
    raise exception 'unsupported provider %', p_provider;
  end if;
  if length(k) < 20 or length(k) > 400 or k ~ '\s' then
    raise exception 'that does not look like an API key';
  end if;
  if p_provider = 'anthropic' and k !~ '^sk-ant-' then
    raise exception 'Anthropic keys start with sk-ant-';
  elsif p_provider = 'openrouter' and k !~ '^sk-or-' then
    raise exception 'OpenRouter keys start with sk-or-';
  elsif p_provider = 'openai' and (k !~ '^sk-' or k ~ '^sk-(ant|or)-') then
    raise exception 'OpenAI keys start with sk- (not sk-ant- or sk-or-)';
  elsif p_provider = 'google' and k !~ '^AIza' then
    raise exception 'Google AI Studio keys start with AIza';
  end if;
  nm := 'model_key:' || uid || ':' || p_provider;
  select secret_id into sid from public.model_keys where owner_id = uid and provider = p_provider;
  -- The key just saved becomes the one the agent uses.
  update public.model_keys set preferred = false where owner_id = uid and provider <> p_provider;
  if sid is null then
    sid := vault.create_secret(k, nm, 'CaseBuilder model API key');
    insert into public.model_keys (owner_id, provider, secret_id, last4, preferred)
    values (uid, p_provider, sid, right(k, 4), true);
  else
    perform vault.update_secret(sid, k);
    update public.model_keys set last4 = right(k, 4), updated_at = now(), preferred = true
     where owner_id = uid and provider = p_provider;
  end if;
  return right(k, 4);
end $$;

-- Removing the preferred key hands "preferred" to the most recently updated remaining one.
create or replace function public.delete_model_key(p_provider text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  sid uuid;
  was boolean;
begin
  delete from public.model_keys where owner_id = auth.uid() and provider = p_provider
  returning secret_id, preferred into sid, was;
  if sid is not null then delete from vault.secrets where id = sid; end if;
  if was then
    update public.model_keys set preferred = true
     where owner_id = auth.uid() and provider = (
       select provider from public.model_keys where owner_id = auth.uid() order by updated_at desc limit 1);
  end if;
end $$;

-- Choose which saved key the agent uses.
create function public.set_preferred_model_key(p_provider text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from public.model_keys where owner_id = auth.uid() and provider = p_provider) then
    raise exception 'no saved key for %', p_provider;
  end if;
  update public.model_keys set preferred = false where owner_id = auth.uid() and provider <> p_provider;
  update public.model_keys set preferred = true where owner_id = auth.uid() and provider = p_provider;
end $$;

-- Worker / server only: the provider and decrypted key the account's agent should use.
create function public.get_active_model_key(p_owner uuid)
returns table (provider text, key text)
language sql security definer set search_path = public as $$
  select m.provider, d.decrypted_secret
    from public.model_keys m
    join vault.decrypted_secrets d on d.id = m.secret_id
   where m.owner_id = p_owner
   order by m.preferred desc, m.updated_at desc
   limit 1
$$;

revoke execute on function public.set_preferred_model_key(text) from public, anon;
grant execute on function public.set_preferred_model_key(text) to authenticated;
revoke execute on function public.get_active_model_key(uuid) from public, anon, authenticated;
grant execute on function public.get_active_model_key(uuid) to service_role;
