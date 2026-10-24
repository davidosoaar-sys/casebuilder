#!/bin/sh
# Survey the OCI tenancy for the CaseBuilder worker: AD, free shapes, subnet, images.
export SUPPRESS_LABEL_WARNING=True
OCI="$(dirname "$0")/ocir.sh"
T=$(awk -F= '/^tenancy/{print $2}' ~/.oci/config)
echo "== ADs"; $OCI iam availability-domain list -c "$T" --query 'data[].name' --output table
AD=$($OCI iam availability-domain list -c "$T" --query 'data[0].name' --raw-output)
echo "== shapes offered (free-tier relevant)"
$OCI compute shape list -c "$T" --availability-domain "$AD" --all --query 'data[?contains(shape,`A1`)||contains(shape,`Micro`)].shape' --output table
echo "== subnets"
$OCI network subnet list -c "$T" --all --query 'data[].{name:"display-name",id:id,public:"prohibit-public-ip-on-vnic"}' --output table
echo "== instances"
$OCI compute instance list -c "$T" --all --query 'data[].{name:"display-name",state:"lifecycle-state",shape:shape}' --output table
for S in VM.Standard.A1.Flex VM.Standard.E2.1.Micro; do
  echo "== latest Ubuntu 24.04 image for $S"
  $OCI compute image list -c "$T" --operating-system "Canonical Ubuntu" --operating-system-version "24.04" --shape "$S" --sort-by TIMECREATED --all --query 'data[?!contains("display-name",`Minimal`)] | [0].{name:"display-name",id:id}' --output table 2>&1 | tail -4
done
echo "== free-tier limits"
$OCI limits value list -c "$T" --service-name compute --all --query 'data[?contains(name,`a1`)||contains(name,`micro`)].{name:name,ad:"availability-domain",value:value}' --output table 2>&1 | head -20
