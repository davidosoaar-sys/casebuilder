#!/bin/bash
# The 5 agent-dependent old reviews, on the VPS harness (new worker.py, live worker paused and always
# restarted), one after another. Then report leftovers on the TEST account.
cd ~/Projects/casebuilder
OUT=/tmp/cb-old-reviews; : > $OUT/agent-summary.txt
for s in ${ONLY:-review-agent-chat review-chat-sees-research review-v0150-research review-v0150-skills review-v0150-scheduled}; do
  bash scripts/run-harness-review.sh scripts/$s.mjs > $OUT/h-$s.log 2>&1
  echo "$s $(grep -cE '^PASS' $OUT/h-$s.log)p $(grep -cE '^FAIL' $OUT/h-$s.log)f $(grep -E 'review exit' $OUT/h-$s.log) worker:$(tail -1 $OUT/h-$s.log)" >> $OUT/agent-summary.txt
done
node scripts/check-test-chats.mjs | tail -4 >> $OUT/agent-summary.txt
node scripts/check-test-files.mjs | tail -1 >> $OUT/agent-summary.txt
echo DONE >> $OUT/agent-summary.txt
