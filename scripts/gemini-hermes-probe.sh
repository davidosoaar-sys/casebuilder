#!/bin/bash
# On the VPS: run one-shot Hermes with the Gemini provider at each tier, the way worker.py does,
# in a throwaway profile. The key arrives in /tmp/gk (0600) and is shredded at the end.
# Usage (from the Mac): see scripts/gemini-hermes-probe-run.sh
set -u
P=/home/casebuilder/.hermes/profiles/gemini-probe
mkdir -p $P/work
install -m 600 /dev/null $P/.env
printf 'GEMINI_API_KEY=%s\n' "$(cat /tmp/gk)" > $P/.env
for m in ${MODELS:-gemini-3.5-flash-lite gemini-3.8-flash gemini-3.1-pro-preview}; do
  t0=$(date +%s)
  out=$(cd $P/work && HERMES_HOME=$P timeout 240 /home/casebuilder/.local/bin/hermes -z "Reply with exactly: GEMINI-OK" --provider gemini -m $m -t memory 2>&1)
  rc=$?
  echo "$m rc=$rc $(( $(date +%s) - t0 ))s :: $(echo "$out" | tr '\n' ' ' | tail -c 300)"
done
shred -u $P/.env /tmp/gk 2>/dev/null; rm -f $P/.env /tmp/gk
