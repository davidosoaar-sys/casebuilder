#!/usr/bin/env python3
"""Show which web tools the account's agent called in its latest session and,
where recorded, which search backend served them. Run on the VM as casebuilder:
  python3 which-search.py <profile-name>
"""
import json, re, sqlite3, sys
db = sqlite3.connect(f"/home/casebuilder/.hermes/profiles/{sys.argv[1]}/state.db")
sid = db.execute("select session_id from messages order by rowid desc limit 1").fetchone()[0]
for name, content in db.execute(
        "select tool_name, content from messages where session_id=? and tool_name like 'web_%' order by rowid", (sid,)):
    served = re.findall(r'"(?:served_by|provider|backend)"\s*:\s*"([^"]+)"', content or "")
    print(name, "served_by:", served[:1] or "(not recorded)")
