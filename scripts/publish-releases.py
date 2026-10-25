# Create a GitHub Release for every v* tag that has none, using that version's
# CHANGELOG.md section as the notes. Safe to re-run: existing releases are skipped.
# Usage: python3 scripts/publish-releases.py [--dry-run] [--retitle]
#   --retitle  also rewrite title + notes of releases that already exist
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
def release_text(tag):
    """Title is just the version. The changelog subtitle becomes a heading at the
    top of the notes. Exception: a big release with a nickname (a subtitle like
    "The Dashboard Release") keeps it in the title."""
    head, body = sections[tag]
    sub = re.sub(r"^\(\d{4}-\d{2}-\d{2}\)\s*:?\s*", "", head).strip()
    date = (re.search(r"\d{4}-\d{2}-\d{2}", head) or [None])[0]
    nickname = re.fullmatch(r"The [\w' -]{2,40} Release", sub or "")
    title = f"{tag}: {sub}" if nickname else tag
    lines = []
    if sub and not nickname:
        lines.append(f"## {sub[0].upper() + sub[1:]}")
    if date:
        lines.append(f"_Released {date}_")
    notes = ("\n\n".join(lines) + "\n\n" if lines else "") + body + "\n"
    return title, notes, body


edit = "--retitle" in sys.argv
for tag in tags:
    if tag not in sections:
        print("MISSING changelog section", tag); continue
    title, notes_text, body = release_text(tag)
    if re.search(r"\.config/casebuilder|password\s*[:=]\s*\S|sk-ant-[A-Za-z0-9]|sb_secret_[A-Za-z0-9]|tvly-[A-Za-z0-9]", body, re.I):
        print("REFUSING (looks like it names a credential)", tag); continue
    if tag in existing and not edit:
        print("skip (exists)", tag); continue
    with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False) as f:
        f.write(notes_text); notes = f.name
    if tag in existing:
        cmd = ["gh", "release", "edit", tag, "-R", REPO, "--title", title, "--notes-file", notes]
    else:
        cmd = ["gh", "release", "create", tag, "-R", REPO, "--verify-tag", "--title", title, "--notes-file", notes,
               "--latest=" + ("true" if tag == latest else "false")]
    print(("DRY " if dry else "") + ("edit" if tag in existing else "create"), tag, "|", title)
    if not dry:
        subprocess.run(cmd, check=True, capture_output=True)
    os.unlink(notes)
