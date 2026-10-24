#!/bin/sh
# oci with retries: a freshly added API key authenticates intermittently for a
# few minutes, and 401s/429s/5xx must not be read as "empty result".
export SUPPRESS_LABEL_WARNING=True
i=0
while :; do
  out=$(~/.local/bin/oci "$@" 2>/tmp/ocix.err); rc=$?
  if [ $rc = 0 ]; then printf '%s\n' "$out"; exit 0; fi
  if grep -qE '"status": (401|429|5[0-9][0-9])' /tmp/ocix.err && [ $i -lt 8 ]; then i=$((i+1)); sleep 8; continue; fi
  cat /tmp/ocix.err >&2; exit $rc
done
