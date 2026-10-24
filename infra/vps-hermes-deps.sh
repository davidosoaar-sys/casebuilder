#!/bin/bash
# Re-run Hermes's dependency step (pm install) by hand with full logging, for a
# headless worker: no browser, no computer-use driver. Run as user casebuilder.
set -u
cd ~/.hermes/hermes-agent
PY=$(ls ~/.local/share/uv/python/cpython-3.14*/bin/python3 2>/dev/null | head -1)
UVDIR=$(ls -d ~/.hermes/tools/uv-*/ 2>/dev/null | head -1)
export PATH="$UVDIR:$HOME/.local/bin:$PATH" HERMES_HOME="$HOME/.hermes"
echo "python: $PY ($($PY --version 2>&1))"; echo "uv: $(command -v uv)"
timeout 1200 "$PY" -m pm.cli install --without agent-browser --without cua-driver > /tmp/pm.log 2>&1
echo "rc=$?"
grep -n -iE "error|fail|killed|memory|no space|Traceback" /tmp/pm.log | tail -15
echo "--- tail"; tail -20 /tmp/pm.log
