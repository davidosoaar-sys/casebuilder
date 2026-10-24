#!/usr/bin/env python3
"""CaseBuilder worker: Supabase job queue -> per-account Hermes -> Supabase.

Loop: claim one job (exactly-once, SKIP LOCKED in Postgres), fetch that
account's own model key from Vault, run the job in that account's own Hermes
profile, write the result back, post the reply to the deal's chat.

Stdlib only. Config from env (see worker.env.example):
  SUPABASE_URL, SUPABASE_SECRET_KEY   required
  CB_MODEL      default claude-sonnet-5-5
  CB_TOOLSETS   default web,memory,todo   (never terminal/file/code: all
                profiles share one Unix user, so those would cross accounts)
  CB_TIMEOUT    seconds per job, default 480 (< 10 min stale-claim window)
  CB_POLL       idle poll interval seconds, default 3
  CB_ONCE=1     process at most one job then exit (tests)
"""
import json, os, re, socket, subprocess, sys, tempfile, time, urllib.error, urllib.request

URL = os.environ["SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_SECRET_KEY"]
MODEL = os.environ.get("CB_MODEL", "claude-sonnet-5-5")
TOOLSETS = os.environ.get("CB_TOOLSETS", "web,memory,todo")
TIMEOUT = int(os.environ.get("CB_TIMEOUT", "480"))
POLL = float(os.environ.get("CB_POLL", "3"))
ONCE = os.environ.get("CB_ONCE") == "1"
WORKER_ID = f"{socket.gethostname()}:{os.getpid()}"
HERMES = os.path.expanduser(os.environ.get("CB_HERMES", "~/.local/bin/hermes"))
HOME = os.path.expanduser("~/.hermes")

FORBIDDEN = {"terminal", "file", "code_execution", "browser", "computer_use", "delegation", "cronjob"}
assert not FORBIDDEN & set(TOOLSETS.split(",")), f"unsafe toolsets for shared host: {TOOLSETS}"


def log(*a):
    print(time.strftime("%H:%M:%S"), *a, flush=True)


def api(method, path, body=None, prefer=None):
    req = urllib.request.Request(URL + path, method=method,
                                 data=None if body is None else json.dumps(body).encode())
    req.add_header("apikey", KEY)
    req.add_header("Authorization", "Bearer " + KEY)
    req.add_header("Content-Type", "application/json")
    if prefer:
        req.add_header("Prefer", prefer)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{method} {path} -> {e.code} {e.read()[:300]!r}") from None


def rpc(fn, **args):
    return api("POST", f"/rest/v1/rpc/{fn}", args)


def profile_for(owner_id):
    # One Hermes profile per account: own memory, sessions and learned skills.
    name = "acct-" + re.sub(r"[^0-9a-f]", "", owner_id.lower())
    if not os.path.isdir(os.path.join(HOME, "profiles", name)):
        subprocess.run([HERMES, "profile", "create", name, "--no-alias"],
                       check=True, capture_output=True, text=True, timeout=120)
        log("created profile", name)
    return name


def build_prompt(job, deal):
    p = job.get("payload") or {}
    msg = (p.get("message") or p.get("prompt") or "").strip()
    parts = ["You are the CaseBuilder assistant for a B2B salesperson. "
             "Be concise and concrete. Never invent numbers: if you do not "
             "know a figure, say so and say how to find it."]
    if deal:
        d = deal.get("data") or {}
        brief = {k: d.get(k) for k in ("name", "company", "industry", "fields", "stakeholders") if d.get(k)}
        parts.append("Deal context (JSON, may be partial):\n" + json.dumps(brief, default=str)[:6000])
    parts.append(f"Task type: {job['kind']}.")
    parts.append("Request:\n" + (msg or "(no message given)"))
    return "\n\n".join(parts)


def run_hermes(profile, prompt, api_key):
    """Run one job in the account's own Hermes home.

    The key is handed over through the profile's .env (0600) for the length of
    the job and shredded afterwards. Verified on the box: one-shot Hermes
    (v0.22.5) does NOT pick up ANTHROPIC_API_KEY from the process env, but does
    read the profile .env. Jobs run one at a time, so the file never outlives
    its own job, and it only ever holds that account's key.
    """
    home = os.path.join(HOME, "profiles", profile)
    env = {k: v for k, v in os.environ.items()
           if not k.startswith("SUPABASE_") and k not in ("ANTHROPIC_API_KEY", "TAVILY_API_KEY")}  # agent never sees DB creds
    env["HERMES_HOME"] = home
    workdir = os.path.join(home, "work")
    os.makedirs(workdir, exist_ok=True)
    envfile = os.path.join(home, ".env")
    fd = os.open(envfile, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f:
        f.write(f"ANTHROPIC_API_KEY={api_key}\n")
        # Shared search key (team's, not the account's): Hermes reads it from the
        # same profile .env, and shreds with it after the job.
        if os.environ.get("TAVILY_API_KEY"):
            f.write(f"TAVILY_API_KEY={os.environ['TAVILY_API_KEY']}\n")
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as u:
        usage_path = u.name
    try:
        r = subprocess.run([HERMES, "-z", prompt, "--provider", "anthropic",
                            "-m", MODEL, "-t", TOOLSETS, "--usage-file", usage_path],
                           cwd=workdir, env=env, capture_output=True, text=True, timeout=TIMEOUT)
        try:
            usage = json.load(open(usage_path))
        except Exception:
            usage = None
        out = r.stdout.strip()
        if r.returncode != 0 or not out:
            raise RuntimeError(f"hermes exit {r.returncode}: {(r.stderr or r.stdout)[-400:]}")
        return out, usage
    finally:
        subprocess.run(["shred", "-u", envfile], capture_output=True)
        if os.path.exists(envfile):
            os.unlink(envfile)
        try:
            os.unlink(usage_path)
        except OSError:
            pass


def handle(job):
    jid, owner = job["id"], job["owner_id"]
    log("claimed", jid, job["kind"], "attempt", job["attempts"])
    key = rpc("get_model_key", p_owner=owner, p_provider="anthropic")
    if not key:
        raise RuntimeError("No Anthropic API key saved for this account. Add one in Settings.")
    deal = None
    if job.get("deal_id"):
        rows = api("GET", f"/rest/v1/deals?id=eq.{job['deal_id']}&owner_id=eq.{owner}&select=id,name,data")
        deal = rows[0] if rows else None
    profile = profile_for(owner)
    t0 = time.time()
    text, usage = run_hermes(profile, build_prompt(job, deal), key)
    secs = round(time.time() - t0, 1)
    result = {"text": text, "model": MODEL, "seconds": secs, "usage": usage}
    if job.get("deal_id") and deal:
        api("POST", "/rest/v1/chat_messages", {"deal_id": job["deal_id"], "owner_id": owner,
            "role": "assistant", "content": text, "job_id": jid,
            "meta": {"model": MODEL, "seconds": secs}}, prefer="return=minimal")
    rpc("complete_job", p_id=jid, p_worker=WORKER_ID, p_result=result)
    u = usage or {}
    log("done", jid, f"{secs}s", f"tokens in={u.get('input_tokens')} out={u.get('output_tokens')} calls={u.get('api_calls')}")


def main():
    log("worker", WORKER_ID, "model", MODEL, "tools", TOOLSETS)
    while True:
        try:
            jobs = rpc("claim_job", p_worker=WORKER_ID) or []
        except Exception as e:
            log("claim error:", e); time.sleep(10); continue
        if not jobs:
            if ONCE:
                log("no job"); return
            time.sleep(POLL); continue
        job = jobs[0]
        try:
            handle(job)
        except Exception as e:
            msg = str(e)[:500]
            try:
                status = rpc("fail_job", p_id=job["id"], p_worker=WORKER_ID, p_error=msg)
            except Exception as e2:
                status = f"(fail_job error: {e2})"
            log("failed", job["id"], status, msg)
        if ONCE:
            return


if __name__ == "__main__":
    main()
