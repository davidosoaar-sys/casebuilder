#!/bin/bash
# Deploy the worker to the VM and (re)start it as a systemd service.
# Secrets go file-to-file over SSH; never through argv, logs, or chat.
set -euo pipefail
cd "$(dirname "$0")/.."
scp -q worker/worker.py casebuilder-vps:/tmp/cb-worker.py
scp -q src/prebuiltSkills.json casebuilder-vps:/tmp/cb-prebuiltSkills.json
# worker.env -> server, stripped to the two needed vars, owner-only.
{ grep -E '^(SUPABASE_URL|SUPABASE_SECRET_KEY)=' ~/.config/casebuilder/worker.env
  grep -E '^TAVILY_API_KEY=tvly-' ~/.config/casebuilder/search.env 2>/dev/null || true
  # Waitlist approval emails go out from this Gmail (app password, same as sign-up codes).
  grep -E '^GMAIL_APP_PASSWORD=.{16}$' ~/.config/casebuilder/gmail-smtp.env 2>/dev/null && echo 'GMAIL_USER=casebuilder.app@gmail.com' || true; } | ssh casebuilder-vps 'cat > /tmp/cb-worker.env'
ssh casebuilder-vps 'bash -s' <<'EOF'
set -e
sudo install -d -o casebuilder -g casebuilder -m 700 /home/casebuilder/worker
sudo install -o casebuilder -g casebuilder -m 644 /tmp/cb-worker.py /home/casebuilder/worker/worker.py
sudo install -o casebuilder -g casebuilder -m 644 /tmp/cb-prebuiltSkills.json /home/casebuilder/worker/prebuiltSkills.json
sudo install -o casebuilder -g casebuilder -m 600 /tmp/cb-worker.env /home/casebuilder/worker/worker.env
shred -u /tmp/cb-worker.env; rm -f /tmp/cb-worker.py /tmp/cb-prebuiltSkills.json
sudo tee /etc/systemd/system/casebuilder-worker.service >/dev/null <<'UNIT'
[Unit]
Description=CaseBuilder Hermes worker (Supabase job queue)
After=network-online.target
Wants=network-online.target

[Service]
User=casebuilder
WorkingDirectory=/home/casebuilder/worker
EnvironmentFile=/home/casebuilder/worker/worker.env
Environment=PATH=/home/casebuilder/.local/bin:/usr/bin:/bin
ExecStart=/usr/bin/python3 -u /home/casebuilder/worker/worker.py
Restart=always
RestartSec=5
MemoryMax=800M
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full

[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
sudo systemctl try-restart casebuilder-worker
echo "deployed; worker restarted if it was running"
EOF
