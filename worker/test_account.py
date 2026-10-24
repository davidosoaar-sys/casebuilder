#!/usr/bin/env python3
"""Create (or reuse) the CaseBuilder TEST account and drive it like the app would.

  setup   create auth user test@casebuilder.dev (random password kept in
          ~/.config/casebuilder/test-account.env), sign in, save the Anthropic
          key via set_model_key AS THAT USER, create a test deal.
  enqueue post a chat message + enqueue a chat job as the user. Prints job id.
  status  show the job and the deal's chat (as the user, through RLS).
Never prints a key or password.
"""
import json, os, secrets, sys, time, urllib.error, urllib.request

ENV = os.path.expanduser("~/.config/casebuilder/test-account.env")
WENV = os.path.expanduser("~/.config/casebuilder/worker.env")
APPENV = os.path.expanduser("~/Projects/casebuilder/.env.local")
EMAIL = "test@casebuilder.dev"
DEAL = "test-northwind"


def load(path):
    out = {}
    for line in open(path):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            out[k.strip()] = v.strip().strip('"').strip("'")
    return out


w, t, a = load(WENV), load(ENV), load(APPENV)
URL, SECRET, PUB = w["SUPABASE_URL"].rstrip("/"), w["SUPABASE_SECRET_KEY"], a["VITE_SUPABASE_PUBLISHABLE_KEY"]


def call(method, path, body=None, key=PUB, bearer=None, prefer=None):
    req = urllib.request.Request(URL + path, method=method, data=None if body is None else json.dumps(body).encode())
    req.add_header("apikey", key)
    req.add_header("Authorization", "Bearer " + (bearer or key))
    req.add_header("Content-Type", "application/json")
    if prefer:
        req.add_header("Prefer", prefer)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{method} {path} -> {e.code} {e.read()[:300]!r}")


def signin():
    r = call("POST", "/auth/v1/token?grant_type=password", {"email": EMAIL, "password": t["TEST_PASSWORD"]})
    return r["access_token"], r["user"]["id"]


def setup():
    if "TEST_PASSWORD" not in t:
        pw = secrets.token_urlsafe(24)
        call("POST", "/auth/v1/admin/users", {"email": EMAIL, "password": pw, "email_confirm": True}, key=SECRET)
        with open(ENV, "a") as f:
            f.write(f"TEST_PASSWORD={pw}\n")
        t["TEST_PASSWORD"] = pw
        print("created auth user", EMAIL)
    jwt, uid = signin()
    print("signed in as", EMAIL, "uid", uid)
    last4 = call("POST", "/rest/v1/rpc/set_model_key", {"p_provider": "anthropic", "p_key": t["ANTHROPIC_API_KEY"]}, bearer=jwt)
    print("key saved via app path, ends in", "..." + str(last4)[-2:] if last4 else None)
    meta = call("GET", "/rest/v1/model_keys?select=provider,last4", bearer=jwt)
    print("what the app can see:", [{"provider": m["provider"], "last4": "**" + m["last4"][-2:]} for m in meta])
    if not call("GET", f"/rest/v1/deals?id=eq.{DEAL}&select=id", bearer=jwt):
        data = {"id": DEAL, "name": "Northwind Retail", "company": "Northwind Retail", "industry": "Retail",
                "fields": [], "stakeholders": [], "deck": [], "connectors": {}}
        call("POST", "/rest/v1/deals", {"id": DEAL, "owner_id": uid, "name": "Northwind Retail", "data": data},
             bearer=jwt, prefer="return=minimal")
        print("created deal", DEAL)


def enqueue(msg):
    jwt, uid = signin()
    call("POST", "/rest/v1/chat_messages", {"deal_id": DEAL, "owner_id": uid, "role": "user", "content": msg},
         bearer=jwt, prefer="return=minimal")
    job = call("POST", "/rest/v1/jobs", {"owner_id": uid, "deal_id": DEAL, "kind": "chat", "payload": {"message": msg}},
               bearer=jwt, prefer="return=representation")[0]
    print(job["id"])


def status(jid):
    jwt, _ = signin()
    j = call("GET", f"/rest/v1/jobs?id=eq.{jid}&select=status,attempts,error,result", bearer=jwt)[0]
    r = j.get("result") or {}
    print("job:", j["status"], "attempts", j["attempts"], "error", j["error"])
    if r:
        u = r.get("usage") or {}
        print("model", r.get("model"), "seconds", r.get("seconds"), "cost", u.get("estimated_cost"))
    for m in call("GET", f"/rest/v1/chat_messages?deal_id=eq.{DEAL}&select=role,content&order=id", bearer=jwt):
        print(f"[{m['role']}] {m['content'][:700]}")


if __name__ == "__main__":
    cmd = sys.argv[1]
    {"setup": setup, "enqueue": lambda: enqueue(sys.argv[2]), "status": lambda: status(sys.argv[2])}[cmd]()
