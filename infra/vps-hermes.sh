#!/bin/bash
# Install a FRESH Hermes Agent for CaseBuilder on the worker VM.
# Separate system user "casebuilder"; nothing copied from Amr's personal Hermes.
# Idempotent. Run on the server: ssh casebuilder-vps 'bash -s' < infra/vps-hermes.sh
set -euo pipefail
# Node (bundled by Hermes) needs libatomic1; the casebuilder user has no sudo,
# so install it here as admin first or "pm install" fails on node.
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq libatomic1 >/dev/null
id casebuilder >/dev/null 2>&1 || sudo useradd --create-home --shell /bin/bash casebuilder
sudo -iu casebuilder bash <<'EOF'
set -e
if ! command -v hermes >/dev/null 2>&1 && [ ! -x ~/.local/bin/hermes ]; then
  # Headless worker: no browser, no computer-use driver.
  curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash -s -- --non-interactive --skip-browser --skip-computer-use 2>&1 | tail -15
fi
export PATH="$HOME/.local/bin:$PATH"
echo "== installed:"; hermes --version 2>&1 | head -1
EOF
echo "== memory after install"; free -m | sed -n 2,3p
