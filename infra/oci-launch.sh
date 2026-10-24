#!/bin/sh
# Launch the CaseBuilder worker VM on OCI (Always Free shapes only).
# Usage: oci-launch.sh a1     -> VM.Standard.A1.Flex 1 OCPU / 6 GB (aarch64)
#        oci-launch.sh micro  -> VM.Standard.E2.1.Micro (x86, 1 GB)
# Prints the instance OCID, or the API error (e.g. out of host capacity).
set -e
D="$(dirname "$0")"; OCI="$D/ocir.sh"
T=$(awk -F= '/^tenancy/{print $2}' ~/.oci/config)
AD="ogfc:CA-TORONTO-1-AD-1"
SUBNET="ocid1.subnet.oc1.ca-toronto-1.aaaaaaaa7oi27ml2t74dl2n4povx2ivnqzqopkmdxnci3z7zoa6cwqi6mxka"   # public subnet-casebuilder-vnc
case "$1" in
  a1)    SHAPE=VM.Standard.A1.Flex; CFG='--shape-config {"ocpus":1,"memoryInGBs":6}'
         IMG=ocid1.image.oc1.ca-toronto-1.aaaaaaaar7ibkdwphllntivzy2s44jmtzhb43cildmxm4vrw3v6sfyhn7iba ;;
  micro) SHAPE=VM.Standard.E2.1.Micro; CFG=''
         IMG=ocid1.image.oc1.ca-toronto-1.aaaaaaaa3lqjk2qhxwosiq6rdvb3xdwr7ryonf2ml4ur2tbevw6ynd2ovhxa ;;
  *) echo "usage: $0 a1|micro"; exit 2 ;;
esac
# Refuse to create a duplicate.
existing=$("$OCI" compute instance list -c "$T" --all --query "data[?\"lifecycle-state\"!='TERMINATED' && \"display-name\"=='casebuilder-worker-$1'].id | [0]" --raw-output 2>/dev/null || true)
if [ -n "$existing" ] && [ "$existing" != "null" ]; then echo "EXISTS $existing"; exit 0; fi
export SUPPRESS_LABEL_WARNING=True
~/.local/bin/oci compute instance launch -c "$T" --availability-domain "$AD" \
  --display-name "casebuilder-worker-$1" --shape "$SHAPE" $CFG \
  --image-id "$IMG" --subnet-id "$SUBNET" --assign-public-ip true \
  --ssh-authorized-keys-file ~/.ssh/casebuilder_oci.pub \
  --boot-volume-size-in-gbs 50 \
  --query 'data.id' --raw-output
