# Create a GitHub Release for every v* tag that has none, using that version's
# CHANGELOG.md section as the notes. Safe to re-run: existing releases are skipped.
# Usage: python3 scripts/publish-releases.py [--dry-run]
import re, subprocess, sys, tempfile, os

REPO = "davidosoaar-sys/casebuilder"
dry = "--dry-run" in sys.argv
text = open(os.path.join(os.path.dirname(__file__), "..", "CHANGELOG.md")).read()
sections = {}
for m in re.finditer(r"^## (v\d+\.\d+\.\d+)([^\n]*)\n(.*?)(?=^## |\Z)", text, re.S | re.M):
    sections[m.group(1)] = (m.group(2).strip(" :"), m.group(3).strip())
tags = subprocess.run(["git", "tag", "-l", "v*", "--sort=v:refname"], capture_output=True, text=True, check=True).stdout.split()
existing = set(subprocess.run(["gh", "release", "list", "-R", REPO, "--limit", "200", "--json", "tagName", "-q", ".[].tagName"],
                              capture_output=True, text=True, check=True).stdout.split())
latest = tags[-1]
for tag in tags:
    if tag in existing:
        print("skip (exists)", tag); continue
    if tag not in sections:
        print("MISSING changelog section", tag); continue
    head, body = sections[tag]
    title = tag + (": " + re.sub(r"^\(\d{4}-\d{2}-\d{2}\)\s*:?\s*", "", head) if re.sub(r"^\(\d{4}-\d{2}-\d{2}\)\s*:?\s*", "", head) else "")
    if re.search(r"\.config/casebuilder|password\s*[:=]\s*\S|sk-ant-[A-Za-z0-9]|sb_secret_[A-Za-z0-9]|tvly-[A-Za-z0-9]", body, re.I):
        print("REFUSING (looks like it names a credential)", tag); continue
    with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False) as f:
        f.write(body + "\n"); notes = f.name
    cmd = ["gh", "release", "create", tag, "-R", REPO, "--verify-tag", "--title", title[:120], "--notes-file", notes,
           "--latest=" + ("true" if tag == latest else "false")]
    print(("DRY " if dry else "") + "create", tag, "|", title[:80], "|", len(body), "chars")
    if not dry:
        subprocess.run(cmd, check=True, capture_output=True)
    os.unlink(notes)
