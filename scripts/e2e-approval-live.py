# Live check: approve a +alias through the real RPC as an admin, then wait for the
# DEPLOYED worker (not this machine) to send the email. Prints the row outcome and
# deletes the test row afterwards.
# Usage: python3 scripts/e2e-approval-live.py <alias-email> <admin-access-token>
import os, sys, json, time, urllib.parse, urllib.request
def envfile(p):
    out = {}
    for l in open(os.path.expanduser(p)):
        if "=" in l and l[0].isupper():
            k, v = l.split("=", 1); out[k] = v.strip()
    return out
W = envfile("~/.config/casebuilder/worker.env")
pub = envfile(os.path.join(os.path.dirname(__file__), "..", ".env.local"))["VITE_SUPABASE_PUBLISHABLE_KEY"]
alias, token = sys.argv[1], sys.argv[2]
def call(method, path, body=None, key=None, bearer=None, prefer=None):
    h = {"apikey": key or W["SUPABASE_SECRET_KEY"], "Authorization": "Bearer " + (bearer or W["SUPABASE_SECRET_KEY"]), "Content-Type": "application/json"}
    if prefer: h["Prefer"] = prefer
    req = urllib.request.Request(W["SUPABASE_URL"] + path, method=method, data=None if body is None else json.dumps(body).encode(), headers=h)
    raw = urllib.request.urlopen(req, timeout=30).read()
    return json.loads(raw) if raw else None
q = urllib.parse.quote(alias)
call("POST", "/rest/v1/rpc/approve_email", {"p_email": alias}, key=pub, bearer=token)
row = None
for _ in range(30):
    row = call("GET", f"/rest/v1/waitlist?email=eq.{q}&select=status,approval_email,approval_email_error")[0]
    if row["approval_email"] in ("sent", "failed"): break
    time.sleep(2)
print("row:", row)
call("DELETE", f"/rest/v1/waitlist?email=eq.{q}", prefer="return=minimal")
print("test row deleted")
