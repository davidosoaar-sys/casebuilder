#!/bin/bash
# v0.16.0 verification pass: unit tests, build, UI review scripts, em-dash check.
# Every step prints a result; a script that crashes (dev server down, bad
# selector) prints CRASHED with its last error line, so silence never passes.
cd ~/Projects/casebuilder
env -i PATH=$PATH HOME=$HOME npm test > /tmp/cb-npmtest.log 2>&1
if grep -qE "^(ℹ|#) tests" /tmp/cb-npmtest.log; then grep -E "^(ℹ|#) (tests|pass|fail)" /tmp/cb-npmtest.log; grep -E "^not ok" /tmp/cb-npmtest.log | head -5
else echo "UNIT TESTS DID NOT RUN:"; tail -3 /tmp/cb-npmtest.log; fi
npx vite build 2>&1 | grep -E "built in|rror"
if [ $# -gt 0 ] && ! curl -s -o /dev/null http://localhost:5173/; then echo "DEV SERVER DOWN on :5173, UI reviews not run"; exit 1; fi
for s in "$@"; do
  echo "== $s"
  node "scripts/$s" > "/tmp/cb-review-$s.log" 2>&1; code=$?
  grep -E "FAIL|passed|ALL PASS" "/tmp/cb-review-$s.log"
  [ $code -ne 0 ] && echo "CRASHED (exit $code): $(grep -m1 -E 'Error' "/tmp/cb-review-$s.log")"
done
echo "em dashes added: $(git diff HEAD | grep '^+' | grep -c '—')"
