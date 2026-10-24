#!/bin/bash
# Baseline hardening for the CaseBuilder worker VM (Ubuntu 24.04, Oracle).
# Idempotent: safe to re-run. Run on the server as the ubuntu user via sudo.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

# 1. Swap: Micro has ~1 GB RAM. 4 GB swapfile so Node/Python never get OOM-killed.
if ! swapon --show | grep -q /swapfile; then
  sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null && sudo swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-casebuilder.conf >/dev/null
sudo sysctl -q -p /etc/sysctl.d/99-casebuilder.conf

# 2. Updates + automatic security patches + fail2ban.
sudo apt-get update -qq
sudo apt-get -y -qq -o Dpkg::Options::=--force-confold upgrade
sudo apt-get -y -qq install unattended-upgrades fail2ban git curl ca-certificates jq
sudo dpkg-reconfigure -f noninteractive unattended-upgrades
sudo systemctl enable --now fail2ban >/dev/null 2>&1

# 3. SSH: keys only, no root login.
sudo tee /etc/ssh/sshd_config.d/99-casebuilder.conf >/dev/null <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
EOF
sudo sshd -t && sudo systemctl reload ssh

# 4. Firewall: Oracle's Ubuntu image ships iptables rules that already allow
# only SSH (22) inbound. The worker makes OUTBOUND calls only (Supabase,
# model API), so no inbound port is opened. Verify rather than change.
echo "== inbound rules (iptables INPUT):"
sudo iptables -S INPUT | grep -E 'dport|REJECT|ACCEPT' | head -8

echo "== summary"
free -m | awk 'NR<=3'
swapon --show
sshd_conf=$(sudo sshd -T | grep -E '^(passwordauthentication|permitrootlogin|kbdinteractiveauthentication) ')
echo "$sshd_conf"
systemctl is-active fail2ban unattended-upgrades
