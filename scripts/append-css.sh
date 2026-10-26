#!/bin/bash
# Append a CSS snippet file to src/styles.css once (idempotent by its first line, which must be a
# unique /* comment */). Refuses a snippet with no first-line comment rather than guessing.
cd ~/Projects/casebuilder
SNIP="$1"
MARK=$(head -1 "$SNIP")
case "$MARK" in "/*"*"*/") ;; *) echo "REFUSED: first line of $SNIP must be a /* comment */ marker"; exit 1;; esac
if grep -qF -- "$MARK" src/styles.css; then echo "already present: $MARK"; else cat "$SNIP" >> src/styles.css; echo "appended: $MARK"; fi
