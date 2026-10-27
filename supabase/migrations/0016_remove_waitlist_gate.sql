-- Remove the waitlist gate (Amr, 2026-10-27): anyone with the app link can
-- create an account, so Chris can never get stuck waiting for approval.
-- Only the sign-up trigger goes. The waitlist table, its rows and the admin
-- functions stay in place (no data deleted, nobody is emailed). Re-enable by
-- re-creating the trigger from 0005_waitlist.sql.
drop trigger if exists require_invite on auth.users;
