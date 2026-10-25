# Run the NEW worker code against one pre-locked job, without the claim loop, so
# the live worker (old code) never touches it. Used to test unreleased worker
# changes on the VPS against real Supabase + the account's own key.
#   python3 handle_one.py <job_id>
# The job must already be status=running, locked_by=<this harness id>.
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import worker

jid = sys.argv[1]
rows = worker.api("GET", f"/rest/v1/jobs?id=eq.{jid}&select=*")
assert rows, "no such job"
job = rows[0]
assert job["status"] == "running" and job["locked_by"] == "harness", f"job not pre-locked: {job['status']} {job['locked_by']}"
worker.WORKER_ID = "harness"
worker.handle(job)
after = worker.api("GET", f"/rest/v1/jobs?id=eq.{jid}&select=status,error")[0]
print(json.dumps(after))
