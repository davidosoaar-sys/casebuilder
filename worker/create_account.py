#!/usr/bin/env python3
"""Create a real CaseBuilder login (Supabase auth user), optionally as admin.

  python3 worker/create_account.py <email> [--admin]

Random password, saved to ~/.config/casebuilder/accounts/<email>.env (0600) on
this Mac. Never printed. Idempotent: an existing user keeps their password and
only has their role set.
"""
import json, os, secrets, sys, urllib.error, urllib.parse, urllib.request

CFG = os.path.expanduser("~/.config/casebuilder")


def load(path):
    out = {}
    for line in open(path):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            out[k.strip()] = v.strip().strip('"').strip("'")
    return out


w = load(os.path.join(CFG, "worker.env"))
URL, SECRET = w["SUPABASE_URL"], w["SUPABASE_SECRET_KEY"]


def call(method, path, body=None, prefer=None):
    req = urllib.request.Request(URL + path, method=method,
                                 data=json.dumps(body).encode() if body is not None else None)
    req.add_header("apikey", SECRET)
    req.add_header("Authorization", f"Bearer {SECRET}")
    req.add_header("Content-Type", "application/json")
    if prefer:
        req.add_header("Prefer", prefer)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]


def find_user(email):
    page = 1
    while True:
        s, d = call("GET", f"/auth/v1/admin/users?page={page}&per_page=200")
        if s != 200:
            sys.exit(f"list users failed: {s} {d}")
        for u in d.get("users", []):
            if (u.get("email") or "").lower() == email.lower():
                return u
        if len(d.get("users", [])) < 200:
            return None
        page += 1


def main():
    if len(sys.argv) < 2 or "@" not in sys.argv[1]:
        sys.exit(__doc__)
    email, admin = sys.argv[1].strip().lower(), "--admin" in sys.argv
    u = find_user(email)
    if u:
        print("account already exists; password unchanged")
    else:
        pw = secrets.token_urlsafe(18)
        s, d = call("POST", "/auth/v1/admin/users", {"email": email, "password": pw, "email_confirm": True})
        if s not in (200, 201):
            sys.exit(f"create failed: {s} {d}")
        u = d
        os.makedirs(os.path.join(CFG, "accounts"), exist_ok=True)
        path = os.path.join(CFG, "accounts", f"{email}.env")
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w") as f:
            f.write(f"# CaseBuilder login. Change it after first sign-in.\nEMAIL={email}\nPASSWORD={pw}\n")
        print(f"created; password saved to {path}")
    role = "admin" if admin else "user"
    s, d = call("PATCH", f"/rest/v1/profiles?id=eq.{u['id']}", {"role": role}, prefer="return=representation")
    if s != 200 or not d:
        sys.exit(f"set role failed: {s} {d}")
    print(f"user id {u['id']}  role {d[0]['role']}")


main()
