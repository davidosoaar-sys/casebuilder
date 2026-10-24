-- Bring-your-own model API key, per account.
-- The key itself lives encrypted in Supabase Vault. public.model_keys only
-- holds metadata (provider, last 4, when) so the app can show "key saved,
-- ends in ...abcd". Users can set, replace and remove their own key but can
-- never read any key back, including their own. Only the worker
-- (service_role) can decrypt, through get_model_key().

create table public.model_keys (
  owner_id    uuid not null references auth.users (id) on delete cascade,
  provider    text not null check (provider in ('anthropic', 'openai', 'google')),
  secret_id   uuid not null,
  last4       text not null,
  updated_at  timestamptz not null default now(),
  primary key (owner_id, provider)
);

alter table public.model_keys enable row level security;
-- Metadata is readable by its owner. No direct writes: only the functions.
-- Column-level grant on purpose: secret_id is an internal pointer and must not
-- reach the app. (Revoking one column does NOT override a table-wide grant in
-- Postgres; the test suite caught exactly that.)
grant select (owner_id, provider, last4, updated_at) on public.model_keys to authenticated;
grant all on public.model_keys to service_role;
create policy model_keys_read_own on public.model_keys for select
  using (owner_id = auth.uid());

-- Set or replace the caller's key for one provider. Returns the last 4.
create function public.set_model_key(p_provider text, p_key text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  k text := btrim(coalesce(p_key, ''));
  sid uuid;
  nm text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_provider not in ('anthropic', 'openai', 'google') then
    raise exception 'unsupported provider %', p_provider;
  end if;
  if length(k) < 20 or length(k) > 400 or k ~ '\s' then
    raise exception 'that does not look like an API key';
  end if;
  if p_provider = 'anthropic' and k !~ '^sk-ant-' then
    raise exception 'Anthropic keys start with sk-ant-';
  end if;
  nm := 'model_key:' || uid || ':' || p_provider;
  select secret_id into sid from public.model_keys where owner_id = uid and provider = p_provider;
  if sid is null then
    sid := vault.create_secret(k, nm, 'CaseBuilder model API key');
    insert into public.model_keys (owner_id, provider, secret_id, last4)
    values (uid, p_provider, sid, right(k, 4));
  else
    perform vault.update_secret(sid, k);
    update public.model_keys set last4 = right(k, 4), updated_at = now()
     where owner_id = uid and provider = p_provider;
  end if;
  return right(k, 4);
end $$;

-- Remove the caller's key for one provider.
create function public.delete_model_key(p_provider text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  sid uuid;
begin
  delete from public.model_keys where owner_id = auth.uid() and provider = p_provider
  returning secret_id into sid;
  if sid is not null then delete from vault.secrets where id = sid; end if;
end $$;

-- Worker only: the decrypted key for one account, or null if none saved.
create function public.get_model_key(p_owner uuid, p_provider text)
returns text
language sql security definer set search_path = public as $$
  select d.decrypted_secret
    from public.model_keys m
    join vault.decrypted_secrets d on d.id = m.secret_id
   where m.owner_id = p_owner and m.provider = p_provider
$$;

revoke execute on function public.set_model_key(text, text) from public, anon;
revoke execute on function public.delete_model_key(text) from public, anon;
revoke execute on function public.get_model_key(uuid, text) from public, anon, authenticated;
grant execute on function public.set_model_key(text, text) to authenticated;
grant execute on function public.delete_model_key(text) to authenticated;
grant execute on function public.get_model_key(uuid, text) to service_role;
