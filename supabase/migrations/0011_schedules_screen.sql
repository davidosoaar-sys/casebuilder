-- Scheduled tasks screen (v0.15.0). The schedules table and the pg_cron runner
-- exist since 0001/0002; this tightens what the app may write now that users
-- create schedules from a screen.
--
--   * kind: users may create 'chat' (an agent prompt) or 'research' (Deep
--     research) only. 'recheck_assumptions' was never built in the worker.
--   * a schedule from the app must belong to a project (deal_id), and its runs
--     post into that project's chat named in payload.chat_id (the worker only
--     trusts a chat the owner owns, see worker.chat_for).
--   * next_run_at from the app cannot be in the past: editing it to "now" over
--     and over would bypass the hourly minimum. "Run now" in the app inserts an
--     ordinary job instead, which the job rate limit covers.
--   * title and prompt sizes are capped.

alter table public.schedules
  add constraint schedules_title_len check (char_length(title) between 1 and 120),
  add constraint schedules_payload_size check (pg_column_size(payload) <= 20000);

create function public.sanitize_user_schedule() returns trigger
language plpgsql as $$
begin
  if current_user = 'authenticated' then
    if new.kind not in ('chat', 'research') then
      raise exception 'schedule_kind: a scheduled task is an agent prompt or Deep research';
    end if;
    if new.deal_id is null then
      raise exception 'schedule_project: a scheduled task belongs to a project';
    end if;
    if tg_op = 'INSERT' or new.next_run_at is distinct from old.next_run_at then
      if new.next_run_at < now() - interval '1 minute' then
        raise exception 'schedule_past: the next run cannot be in the past';
      end if;
    end if;
    if tg_op = 'UPDATE' then
      new.owner_id := old.owner_id;
      new.created_at := old.created_at;
    end if;
  end if;
  return new;
end $$;

create trigger schedules_sanitize
  before insert or update on public.schedules
  for each row execute function public.sanitize_user_schedule();
