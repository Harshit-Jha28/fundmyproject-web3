#!/usr/bin/env bash
# =============================================================================
# EduFundX — Fund Testnet Accounts via Friendbot
# =============================================================================
# Usage: ./scripts/fund-testnet.sh [--generate]
#   --generate: Generate new keypairs and fund them
#   (no flag):  Fund the accounts from .env
# =============================================================================
set -euo pipefail

FRIENDBOT_URL="https://friendbot.stellar.org"

fund_account() {
  local public_key=$1
  local label=$2
  echo "Funding $label ($public_key)..."
  response=$(curl -s "$FRIENDBOT_URL?addr=$public_key")
  if echo "$response" | grep -q '"hash"'; then
    echo "  ✅ Funded successfully"
  else
    echo "  ⚠️  May already be funded or error occurred"
    echo "  Response: $(echo "$response" | head -c 200)"
  fi
}

if [[ "${1:-}" == "--generate" ]]; then
  echo "=== Generating New Keypairs ==="
  echo ""

  # Generate deployer keypair
  echo "--- Deployer Account ---"
  deployer_output=$(stellar keys generate deployer --network testnet 2>&1 || true)
  deployer_public=$(stellar keys address deployer 2>/dev/null || echo "GENERATION_FAILED")
  deployer_secret=$(stellar keys show deployer 2>/dev/null || echo "GENERATION_FAILED")
  echo "Public:  $deployer_public"
  echo "Secret:  $deployer_secret"
  echo ""

  # Generate admin keypair
  echo "--- Admin Account ---"
  admin_output=$(stellar keys generate admin --network testnet 2>&1 || true)
  admin_public=$(stellar keys address admin 2>/dev/null || echo "GENERATION_FAILED")
  admin_secret=$(stellar keys show admin 2>/dev/null || echo "GENERATION_FAILED")
  echo "Public:  $admin_public"
  echo "Secret:  $admin_secret"
  echo ""

  echo "=== Add these to your .env file ==="
  echo "STELLAR_DEPLOYER_SECRET=$deployer_secret"
  echo "STELLAR_DEPLOYER_PUBLIC=$deployer_public"
  echo "STELLAR_ADMIN_SECRET=$admin_secret"
  echo "STELLAR_ADMIN_PUBLIC=$admin_public"
  echo ""

  fund_account "$deployer_public" "Deployer"
  fund_account "$admin_public" "Admin"

else
  echo "=== Funding Accounts from .env ==="
  if [ -f .env ]; then
    source .env
  elif [ -f ../.env ]; then
    source ../.env
  else
    echo "❌ No .env file found. Run with --generate to create new accounts."
    exit 1
  fi

  if [ -n "${STELLAR_DEPLOYER_PUBLIC:-}" ]; then
    fund_account "$STELLAR_DEPLOYER_PUBLIC" "Deployer"
  fi
  if [ -n "${STELLAR_ADMIN_PUBLIC:-}" ]; then
    fund_account "$STELLAR_ADMIN_PUBLIC" "Admin"
  fi
fi

echo ""
echo "✅ Funding complete!"
