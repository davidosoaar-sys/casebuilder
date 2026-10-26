#!/bin/bash
# Append a CSS snippet file to src/styles.css once (idempotent by its first comment line).
cd ~/Projects/casebuilder
SNIP="$1"
MARK=$(grep -m1 -o 'Clean-up: [a-z ]*' "$SNIP")
if grep -q "$MARK" src/styles.css; then echo "already present: $MARK"; else cat "$SNIP" >> src/styles.css; echo "appended: $MARK"; fi
