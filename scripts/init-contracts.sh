#!/usr/bin/env bash
# =============================================================================
# EduFundX — Initialize Contracts Post-Deployment
# =============================================================================
# Use this script when contracts are already deployed but need initialization
# or re-initialization (e.g., after upgrading to a new version that adds init).
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment
if [ -f "$PROJECT_ROOT/.env" ]; then
  source "$PROJECT_ROOT/.env"
fi

NETWORK="${STELLAR_NETWORK:-testnet}"

if [ "$NETWORK" == "testnet" ]; then
  RPC_URL="https://soroban-testnet.stellar.org"
  NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
else
  RPC_URL="http://localhost:8000/soroban/rpc"
  NETWORK_PASSPHRASE="Standalone Network ; February 2017"
fi

# Validate required vars
for var in STELLAR_DEPLOYER_SECRET NEXT_PUBLIC_CORE_CONTRACT_ID NEXT_PUBLIC_REPUTATION_CONTRACT_ID NEXT_PUBLIC_ESCROW_CONTRACT_ID NEXT_PUBLIC_MILESTONE_CONTRACT_ID NEXT_PUBLIC_NATIVE_TOKEN_CONTRACT_ID; do
  if [ -z "${!var:-}" ]; then
    echo "❌ $var is not set. Please configure your .env file."
    exit 1
  fi
done

DEPLOYER_PUBLIC="${STELLAR_DEPLOYER_PUBLIC:-$(stellar keys address deployer 2>/dev/null || echo '')}"
ADMIN_ADDRESS="${STELLAR_ADMIN_PUBLIC:-$DEPLOYER_PUBLIC}"

echo "=== EduFundX Contract Initialization ==="
echo "Network:    $NETWORK"
echo "Admin:      $ADMIN_ADDRESS"
echo "Core:       $NEXT_PUBLIC_CORE_CONTRACT_ID"
echo "Reputation: $NEXT_PUBLIC_REPUTATION_CONTRACT_ID"
echo "Escrow:     $NEXT_PUBLIC_ESCROW_CONTRACT_ID"
echo "Milestone:  $NEXT_PUBLIC_MILESTONE_CONTRACT_ID"
echo "Token:      $NEXT_PUBLIC_NATIVE_TOKEN_CONTRACT_ID"
echo ""

# Initialize Reputation Contract
echo "--- Initializing Reputation Contract ---"
stellar contract invoke \
  --id "$NEXT_PUBLIC_REPUTATION_CONTRACT_ID" \
  --source "$STELLAR_DEPLOYER_SECRET" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- initialize \
  --admin "$ADMIN_ADDRESS" \
  --core_contract_id "$NEXT_PUBLIC_CORE_CONTRACT_ID" \
  && echo "✅ Reputation contract initialized" \
  || echo "⚠️  Reputation contract may already be initialized"

# Initialize Core Contract
echo ""
echo "--- Initializing Core Contract ---"
stellar contract invoke \
  --id "$NEXT_PUBLIC_CORE_CONTRACT_ID" \
  --source "$STELLAR_DEPLOYER_SECRET" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- initialize \
  --admin "$ADMIN_ADDRESS" \
  --reputation_contract_id "$NEXT_PUBLIC_REPUTATION_CONTRACT_ID" \
  --token_id "$NEXT_PUBLIC_NATIVE_TOKEN_CONTRACT_ID" \
  --platform_fee_bps "${NEXT_PUBLIC_PLATFORM_FEE_BPS:-250}" \
  && echo "✅ Core contract initialized" \
  || echo "⚠️  Core contract may already be initialized"

# Initialize Escrow Contract
echo ""
echo "--- Initializing Escrow Contract ---"
stellar contract invoke \
  --id "$NEXT_PUBLIC_ESCROW_CONTRACT_ID" \
  --source "$STELLAR_DEPLOYER_SECRET" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- initialize \
  --admin "$ADMIN_ADDRESS" \
  --registry_contract_id "$NEXT_PUBLIC_CORE_CONTRACT_ID" \
  --token_contract_id "$NEXT_PUBLIC_NATIVE_TOKEN_CONTRACT_ID" \
  --reputation_contract_id "$NEXT_PUBLIC_REPUTATION_CONTRACT_ID" \
  --milestone_contract_id "$NEXT_PUBLIC_MILESTONE_CONTRACT_ID" \
  && echo "✅ Escrow contract initialized" \
  || echo "⚠️  Escrow contract may already be initialized"

# Initialize Milestone Contract
echo ""
echo "--- Initializing Milestone Contract ---"
stellar contract invoke \
  --id "$NEXT_PUBLIC_MILESTONE_CONTRACT_ID" \
  --source "$STELLAR_DEPLOYER_SECRET" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- initialize \
  --admin "$ADMIN_ADDRESS" \
  --registry_contract_id "$NEXT_PUBLIC_CORE_CONTRACT_ID" \
  --escrow_contract_id "$NEXT_PUBLIC_ESCROW_CONTRACT_ID" \
  --reputation_contract_id "$NEXT_PUBLIC_REPUTATION_CONTRACT_ID" \
  && echo "✅ Milestone contract initialized" \
  || echo "⚠️  Milestone contract may already be initialized"

# Configure Core references
echo ""
echo "--- Setting Core Registry References ---"
stellar contract invoke \
  --id "$NEXT_PUBLIC_CORE_CONTRACT_ID" \
  --source "$STELLAR_DEPLOYER_SECRET" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- set_escrow_contract \
  --admin "$ADMIN_ADDRESS" \
  --escrow "$NEXT_PUBLIC_ESCROW_CONTRACT_ID" \
  && echo "✅ Escrow reference updated"

stellar contract invoke \
  --id "$NEXT_PUBLIC_CORE_CONTRACT_ID" \
  --source "$STELLAR_DEPLOYER_SECRET" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- set_milestone_contract \
  --admin "$ADMIN_ADDRESS" \
  --milestone "$NEXT_PUBLIC_MILESTONE_CONTRACT_ID" \
  && echo "✅ Milestone reference updated"

echo ""
echo "✅ Initialization complete!"
