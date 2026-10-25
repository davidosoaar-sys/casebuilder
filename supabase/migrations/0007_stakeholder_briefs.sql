-- Stakeholder briefs: a job kind that reads a project's files and connector
-- material and writes a synthesis for ONE stakeholder (where they stand, what
-- they said, decisions, open asks), not a copy of the transcripts.
alter table public.jobs drop constraint jobs_kind_check;
alter table public.jobs add constraint jobs_kind_check
  check (kind in ('chat', 'research', 'find_leads', 'recheck_assumptions', 'build_deck', 'stakeholder_brief'));
