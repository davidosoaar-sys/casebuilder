-- 0014: accept Google's new Gemini key format.
-- Google AI Studio now issues "Auth" keys that start with AQ. (since mid-2026); the old
-- "Standard" AIza keys are being retired. set_model_key only accepted AIza, so a new
-- Gemini key could not be saved. Same function as 0009 otherwise.
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
  elsif p_provider = 'google' and k !~ '^(AIza|AQ\.)' then
    raise exception 'Google AI Studio keys start with AQ. (or AIza for older keys)';
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
