-- Schedules runner. Needs the pg_cron extension (Supabase: Database ->
-- Extensions -> pg_cron). One system cron job, every minute; user schedules
-- are rows in public.schedules, not separate cron jobs.

create extension if not exists pg_cron;

select cron.schedule(
  'casebuilder-enqueue-due-schedules',
  '* * * * *',
  $$select public.enqueue_due_schedules()$$
);
