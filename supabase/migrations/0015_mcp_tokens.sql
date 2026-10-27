-- Connector secrets are generated in the browser; only SHA-256 hashes persist.
create table public.mcp_tokens (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
alter table public.mcp_tokens enable row level security;
grant select, insert on public.mcp_tokens to authenticated;
grant update (revoked_at) on public.mcp_tokens to authenticated;
grant all on public.mcp_tokens to service_role;
create policy mcp_tokens_owner on public.mcp_tokens for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
