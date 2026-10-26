#!/bin/bash
# Run the pre-v0.16.0 review scripts against the v0.16.0 branch on :5173 (TEST account).
# Skips the ones that create accounts, change the test password, or send email:
# review-password, review-password-email, review-signup-email, review-waitlist.
# Agent/worker-dependent scripts run against the LIVE worker's database queue only if
# it is up; they are listed separately so a worker failure is not read as a UI regression.
cd ~/Projects/casebuilder
OUT=/tmp/cb-old-reviews; mkdir -p $OUT; : > $OUT/summary.txt
UI="review-shell review-v0143-shell review-nav-instructions review-deals review-files review-connectors review-new-project-dialog review-new-project-brand review-brand-assets review-stakeholder-brief review-chat-attach review-v0150-chats review-v0150-keys review-auth"
AGENT="review-agent-chat review-agent-commands review-chat-sees-research review-research review-v0150-older-chats review-v0150-research review-v0150-skills review-v0150-scheduled"
run() { for s in $2; do node scripts/$s.mjs > $OUT/$s.log 2>&1; c=$?; p=$(grep -cE '^(PASS|ok|✓)' $OUT/$s.log); f=$(grep -cE '^(FAIL|not ok|✗)' $OUT/$s.log); echo "$1 $s exit=$c pass=$p fail=$f" >> $OUT/summary.txt; done; }
run UI "$UI"
run AGENT "$AGENT"
echo DONE >> $OUT/summary.txt
