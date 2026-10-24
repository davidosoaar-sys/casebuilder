#!/bin/sh
# Wait for the worker VM to be RUNNING and print its public IP.
D="$(dirname "$0")"; OCI="$D/ocir.sh"
ID="$1"; T=$(awk -F= '/^tenancy/{print $2}' ~/.oci/config)
for i in $(seq 1 30); do
  st=$("$OCI" compute instance get --instance-id "$ID" --query 'data."lifecycle-state"' --raw-output 2>/dev/null)
  echo "state: $st"; [ "$st" = RUNNING ] && break; sleep 15
done
"$OCI" compute instance list-vnics --instance-id "$ID" --query 'data[0]."public-ip"' --raw-output
