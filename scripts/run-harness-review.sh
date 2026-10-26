#!/bin/bash
# Run a harness review: new worker.py into worker-harness ONLY, pause the live worker
# for the run, always restart it. Usage: bash scripts/run-harness-review.sh scripts/<review>.mjs
set -u
cd ~/Projects/casebuilder
REVIEW="$1"
scp -q worker/worker.py casebuilder-vps:/tmp/worker-harness.py
ssh casebuilder-vps 'sudo install -o casebuilder -g root -m 600 /tmp/worker-harness.py /home/casebuilder/worker-harness/worker.py && rm /tmp/worker-harness.py && sudo -u casebuilder md5sum /home/casebuilder/worker-harness/worker.py /home/casebuilder/worker/worker.py'
echo "local: $(md5 -q worker/worker.py)"
restart() { ssh casebuilder-vps 'sudo systemctl start casebuilder-worker; systemctl is-active casebuilder-worker'; }
trap restart EXIT
ssh casebuilder-vps 'sudo systemctl stop casebuilder-worker; systemctl is-active casebuilder-worker; true'
node "$REVIEW"
echo "review exit: $?"
