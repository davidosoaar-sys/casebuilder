#!/bin/bash
# Run a harness review: new worker.py into worker-harness ONLY, pause the live worker
# for the run, always restart it. Usage: bash scripts/run-harness-review.sh scripts/<review>.mjs
# PUMP=1 also runs scripts/harness-pump.mjs, which hands every TEST job queued during the
# run to the new worker; for reviews that do not hand jobs over themselves.
set -u
cd ~/Projects/casebuilder
REVIEW="$1"
scp -q worker/worker.py casebuilder-vps:/tmp/worker-harness.py
ssh casebuilder-vps 'sudo install -o casebuilder -g root -m 600 /tmp/worker-harness.py /home/casebuilder/worker-harness/worker.py && rm /tmp/worker-harness.py && sudo -u casebuilder md5sum /home/casebuilder/worker-harness/worker.py /home/casebuilder/worker/worker.py'
echo "local: $(md5 -q worker/worker.py)"
PUMP_PID=
restart() {
  [ -n "$PUMP_PID" ] && kill "$PUMP_PID" 2>/dev/null
  ssh casebuilder-vps 'sudo systemctl start casebuilder-worker; systemctl is-active casebuilder-worker'
}
trap restart EXIT
ssh casebuilder-vps 'sudo systemctl stop casebuilder-worker; systemctl is-active casebuilder-worker; true'
if [ "${PUMP:-0}" = 1 ]; then node scripts/harness-pump.mjs & PUMP_PID=$!; sleep 3; fi
node "$REVIEW"
echo "review exit: $?"
