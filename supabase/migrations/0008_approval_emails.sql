-- Approval emails. When an admin approves someone (invite_from_waitlist or
-- approve_email), their row is queued for a confirmation email. The worker
-- sends it over SMTP and records the outcome; the Waitlist page shows it.
--
--   approval_email = null      never queued (rows approved before this existed)
--                    'pending' queued, the worker has not sent it yet
--                    'sending' claimed by the worker (stops a double send)
--                    'sent'    delivered to the mail server
--                    'failed'  the mail server refused; approval_email_error says why
-- Only the worker (service key) writes 'sending' / 'sent' / 'failed'.

alter table public.waitlist
  add column approval_email text check (approval_email in ('pending', 'sending', 'sent', 'failed')),
  add column approval_email_at timestamptz,
  add column approval_email_error text check (char_length(approval_email_error) <= 300);

create or replace function public.invite_from_waitlist(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'only an admin can invite'; end if;
  update public.waitlist set status = 'invited', invited_at = now(), approval_email = 'pending'
   where id = p_id and status = 'waiting';
end $$;

create or replace function public.approve_email(p_email text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  e text := lower(btrim(coalesce(p_email, '')));
begin
  if not public.is_admin() then raise exception 'only an admin can approve'; end if;
  if e !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'waitlist: enter a valid email'; end if;
  insert into public.waitlist (email, status, source, invited_at, approval_email) values (e, 'invited', 'approved by admin', now(), 'pending')
  on conflict (email) do update set status = 'invited', invited_at = coalesce(public.waitlist.invited_at, now()), approval_email = 'pending'
   where public.waitlist.status = 'waiting';
end $$;
