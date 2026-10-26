#!/bin/bash
# On the VPS: one-shot Hermes per provider with a deliberately FAKE key, in a throwaway profile.
# Proves the provider id and model id are accepted and the request reaches the provider
# (expected outcome: an auth error from the provider, not "unknown provider/model").
set -u
P=/home/casebuilder/.hermes/profiles/provider-probe
mkdir -p $P/work
run() { # provider env model fakekey
  install -m 600 /dev/null $P/.env; printf '%s=%s\n' "$2" "$4" > $P/.env
  out=$(cd $P/work && HERMES_HOME=$P timeout 120 /home/casebuilder/.local/bin/hermes -z "Reply OK" --provider $1 -m $3 -t memory 2>&1); rc=$?
  echo "$1 $3 rc=$rc :: $(echo "$out" | tr '\n' ' ' | grep -oiE '(401|403|invalid[^.]{0,80}|incorrect[^.]{0,80}|unauthori[^.]{0,60}|unknown provider[^.]{0,60}|not a valid[^.]{0,60}|No auth[^.]{0,60}|model[^.]{0,60}not[^.]{0,40})' | head -3 | tr '\n' '|')"
  echo "   tail: $(echo "$out" | tr '\n' ' ' | tail -c 220)"
}
run openai-api OPENAI_API_KEY gpt-5.6-terra sk-proj-FAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKE0000
run openrouter OPENROUTER_API_KEY anthropic/claude-sonnet-5.5 sk-or-v1-FAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKE0000
run anthropic ANTHROPIC_API_KEY claude-sonnet-5-5 sk-ant-api03-FAKEFAKEFAKEFAKEFAKEFAKEFAKE0000
run gemini GEMINI_API_KEY gemini-3.8-flash AIzaSyFAKEFAKEFAKEFAKEFAKEFAKEFAKE00000
shred -u $P/.env 2>/dev/null; rm -rf $P
