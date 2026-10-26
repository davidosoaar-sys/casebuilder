#!/bin/bash
# On the VPS: one-shot Hermes with Gemini, the worker's toolsets, a realistic prompt; full error tail.
set -u
P=/home/casebuilder/.hermes/profiles/gemini-probe
mkdir -p $P/work
install -m 600 /dev/null $P/.env
printf 'GEMINI_API_KEY=%s\n' "$(cat /tmp/gk)" > $P/.env
[ -n "${TAVILY:-}" ] && printf 'TAVILY_API_KEY=%s\n' "$TAVILY" >> $P/.env
for m in ${MODELS:-gemini-3.8-flash gemini-3.5-flash-lite}; do
  t0=$(date +%s)
  out=$(cd $P/work && HERMES_HOME=$P timeout 300 /home/casebuilder/.local/bin/hermes -z "You help a seller build a business case for Spotify. In one sentence: which company is this project about? Do not change anything." --provider gemini -m $m -t ${TOOLS:-web,memory,todo} 2>&1)
  rc=$?
  echo "== $m rc=$rc $(( $(date +%s) - t0 ))s"
  echo "$out" | tail -c 1500 | sed -E 's/AQ\.[A-Za-z0-9_.-]{10,}/[key]/g'
done
shred -u $P/.env /tmp/gk 2>/dev/null; rm -f $P/.env /tmp/gk; rm -rf $P
