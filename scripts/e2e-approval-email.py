# End-to-end approval email: approve a fresh +alias as an admin (through the real
# RPC, signed in as the TEST account promoted for the run), run the worker's
# sender once with the real Gmail credentials, print the row's outcome.
# Usage: python3 scripts/e2e-approval-email.py <alias-email> <admin-access-token>
import os, sys, json, urllib.parse, urllib.request
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "worker"))
def envfile(p):
    out = {}
    for l in open(os.path.expanduser(p)):
        if "=" in l and l[0].isupper():
            k, v = l.split("=", 1); out[k] = v.strip()
    return out
W = envfile("~/.config/casebuilder/worker.env")
G = envfile("~/.config/casebuilder/gmail-smtp.env")
os.environ.update(SUPABASE_URL=W["SUPABASE_URL"], SUPABASE_SECRET_KEY=W["SUPABASE_SECRET_KEY"],
                  GMAIL_USER="casebuilder.app@gmail.com", GMAIL_APP_PASSWORD=G["GMAIL_APP_PASSWORD"])
import worker  # noqa: E402

alias, token = sys.argv[1], sys.argv[2]
pub = envfile(os.path.join(os.path.dirname(__file__), "..", ".env.local"))["VITE_SUPABASE_PUBLISHABLE_KEY"]
req = urllib.request.Request(W["SUPABASE_URL"] + "/rest/v1/rpc/approve_email", method="POST",
                             data=json.dumps({"p_email": alias}).encode(),
                             headers={"apikey": pub, "Authorization": "Bearer " + token, "Content-Type": "application/json"})
urllib.request.urlopen(req, timeout=30).read()
row = worker.api("GET", f"/rest/v1/waitlist?email=eq.{urllib.parse.quote(alias)}&select=status,approval_email")
print("after approve:", row)
pending = worker.api("GET", "/rest/v1/waitlist?approval_email=eq.pending&select=email")
print("pending rows:", [r["email"] for r in pending])
if [r["email"] for r in pending] != [alias]:
    sys.exit("refusing to send: other rows are pending")
print("sent:", worker.send_approval_emails())
print("final:", worker.api("GET", f"/rest/v1/waitlist?email=eq.{urllib.parse.quote(alias)}&select=status,approval_email,approval_email_error"))
