#!/usr/bin/env bash
# Affiche les derniers logs PM2 (socialhub) sur le VPS pour diagnostiquer une 500.
# Usage: SSHPASS='...' SSH_HOST=africamediaconnect.fr ./scripts/pm2-logs-remote.sh
set -e
SSH_USER="${SSH_USER:-root}"
SSH_HOST="${SSH_HOST:-}"
if [ -z "$SSH_HOST" ]; then echo "Définissez SSH_HOST"; exit 1; fi
if [ -n "$SSHPASS" ]; then export SSHPASS; SSH_CMD="sshpass -e ssh -o StrictHostKeyChecking=accept-new"; else SSH_CMD="ssh -o StrictHostKeyChecking=accept-new"; fi
$SSH_CMD "$SSH_USER@$SSH_HOST" "pm2 logs socialhub --lines 80 --nostream 2>&1"
