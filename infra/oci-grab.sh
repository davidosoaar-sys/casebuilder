#!/bin/sh
# Keep trying to get a free worker VM. Strategy:
#  - retry auth blips (401) and rate limits (429) quietly
#  - try A1 (6 GB); on "Out of host capacity" try Micro right away as well
#  - stop at the first success. Log: /tmp/oci-grab.log
D="$(dirname "$0")"
LOG=/tmp/oci-grab.log
: > "$LOG"
try() { # $1 = a1|micro ; echo ocid on success
  out=$(sh "$D/oci-launch.sh" "$1" 2>&1)
  case "$out" in
    ocid1.instance*) echo "$(date +%T) $1 LAUNCHED $out" >> "$LOG"; echo "$out"; return 0;;
    EXISTS*)         echo "$(date +%T) $1 $out" >> "$LOG"; echo "${out#EXISTS }"; return 0;;
  esac
  msg=$(echo "$out" | grep -oE '"message": "[^"]*"' | head -1)
  echo "$(date +%T) $1 failed: ${msg:-$out}" >> "$LOG"
  return 1
}
for round in $(seq 1 ${ROUNDS:-40}); do
  try a1 && exit 0
  # Fall back to Micro only when A1 genuinely has no capacity, not on an auth blip.
  if [ "${A1_ONLY:-0}" != 1 ] && tail -1 "$LOG" | grep -qi "capacity"; then try micro && exit 0; fi
  sleep ${PAUSE:-30}
done
echo "$(date +%T) gave up" >> "$LOG"; exit 1
