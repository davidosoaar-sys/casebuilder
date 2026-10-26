#!/bin/bash
# v0.16.0 verification pass: unit tests, build, both UI review scripts, em-dash check.
cd ~/Projects/casebuilder
env -i PATH=$PATH HOME=$HOME npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npx vite build 2>&1 | grep -E "built in|rror"
for s in "$@"; do echo "== $s"; node "scripts/$s" 2>&1 | grep -E "FAIL|passed|ALL PASS"; done
echo "em dashes added: $(git diff HEAD | grep '^+' | grep -c '—')"
