#!/usr/bin/env bash
# =============================================================================
# EduFundX — Deploy Contracts to Stellar Testnet
# =============================================================================
# Prerequisites:
#   - Stellar CLI installed: cargo install --locked stellar-cli
#   - Deployer account funded: ./scripts/fund-testnet.sh --generate
#   - .env file configured with STELLAR_DEPLOYER_SECRET
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONTRACTS_DIR="$PROJECT_ROOT/contracts"
WASM_DIR="$CONTRACTS_DIR/target/wasm32-unknown-unknown/release"

RPC_URL="https://soroban-testnet.stellar.org"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Load environment
if [ -f "$PROJECT_ROOT/.env" ]; then
  source "$PROJECT_ROOT/.env"
fi

if [ -z "${STELLAR_DEPLOYER_SECRET:-}" ]; then
  echo "❌ STELLAR_DEPLOYER_SECRET not set. Run ./scripts/fund-testnet.sh --generate first."
  exit 1
fi

DEPLOYER_PUBLIC="${STELLAR_DEPLOYER_PUBLIC:-$(stellar keys address deployer 2>/dev/null || echo '')}"
if [ -z "$DEPLOYER_PUBLIC" ]; then
  echo "❌ Cannot determine deployer public key. Set STELLAR_DEPLOYER_PUBLIC in .env"
  exit 1
fi

echo "=== EduFundX Testnet Deployment ==="
echo "Deployer: $DEPLOYER_PUBLIC"
echo "RPC: $RPC_URL"
echo ""

# Step 1: Build contracts
echo "--- Step 1: Building contracts ---"
cd "$CONTRACTS_DIR"
cargo build --release --target wasm32-unknown-unknown -p edufundx_reputation
cargo build --release --target wasm32-unknown-unknown -p edufundx_core
cargo build --release --target wasm32-unknown-unknown -p edufundx_escrow
cargo build --release --target wasm32-unknown-unknown -p edufundx_milestone

# Verify sizes
for wasm in "$WASM_DIR"/edufundx_*.wasm; do
  size=$(stat --printf="%s" "$wasm" 2>/dev/null || stat -f%z "$wasm")
  name=$(basename "$wasm")
  kb=$((size / 1024))
  echo "  $name: ${kb}KB"
  if [ "$size" -gt 65536 ]; then
    echo "  ❌ $name exceeds 64KB! Optimize your contract."
    exit 1
  fi
done
echo "✅ Contracts built and size-checked"

# Step 2: Deploy Contracts
echo ""
echo "--- Step 2: Deploying edufundx_reputation ---"
REPUTATION_ID=$(stellar contract deploy \
  --wasm "$WASM_DIR/edufundx_reputation.wasm" \
  --source "$STELLAR_DEPLOYER_SECRET" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE")
echo "✅ Reputation Contract: $REPUTATION_ID"

echo ""
echo "--- Step 3: Deploying edufundx_core registry ---"
CORE_ID=$(stellar contract deploy \
  --wasm "$WASM_DIR/edufundx_core.wasm" \
  --source "$STELLAR_DEPLOYER_SECRET" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE")
echo "✅ Core Contract: $CORE_ID"

echo ""
echo "--- Step 4: Deploying edufundx_escrow ---"
ESCROW_ID=$(stellar contract deploy \
  --wasm "$WASM_DIR/edufundx_escrow.wasm" \
  --source "$STELLAR_DEPLOYER_SECRET" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE")
echo "✅ Escrow Contract: $ESCROW_ID"

echo ""
echo "--- Step 5: Deploying edufundx_milestone ---"
MILESTONE_ID=$(stellar contract deploy \
  --wasm "$WASM_DIR/edufundx_milestone.wasm" \
  --source "$STELLAR_DEPLOYER_SECRET" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE")
echo "✅ Milestone Contract: $MILESTONE_ID"

# Step 6: Get native token SAC address
echo ""
echo "--- Step 6: Getting native XLM SAC address ---"
NATIVE_TOKEN_ID=$(stellar contract id asset \
  --asset native \
  --source "$STELLAR_DEPLOYER_SECRET" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" 2>/dev/null || echo "")

if [ -z "$NATIVE_TOKEN_ID" ]; then
  echo "  ⚠️  Could not auto-detect native token. Using known testnet SAC."
  NATIVE_TOKEN_ID="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
fi
echo "Native Token: $NATIVE_TOKEN_ID"

# Step 7: Initialize Contracts
echo ""
echo "--- Step 7: Initializing reputation contract ---"
ADMIN_ADDRESS="${STELLAR_ADMIN_PUBLIC:-$DEPLOYER_PUBLIC}"

stellar contract invoke \
  --id "$REPUTATION_ID" \
  --source "$STELLAR_DEPLOYER_SECRET" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- initialize \
  --admin "$ADMIN_ADDRESS" \
  --core_contract_id "$CORE_ID"
echo "✅ Reputation contract initialized"

echo ""
echo "--- Step 8: Initializing core contract ---"
stellar contract invoke \
  --id "$CORE_ID" \
  --source "$STELLAR_DEPLOYER_SECRET" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- initialize \
  --admin "$ADMIN_ADDRESS" \
  --reputation_contract_id "$REPUTATION_ID" \
  --token_id "$NATIVE_TOKEN_ID" \
  --platform_fee_bps 250
echo "✅ Core contract initialized"

echo ""
echo "--- Step 9: Initializing escrow contract ---"
stellar contract invoke \
  --id "$ESCROW_ID" \
  --source "$STELLAR_DEPLOYER_SECRET" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- initialize \
  --admin "$ADMIN_ADDRESS" \
  --registry_contract_id "$CORE_ID" \
  --token_contract_id "$NATIVE_TOKEN_ID" \
  --reputation_contract_id "$REPUTATION_ID" \
  --milestone_contract_id "$MILESTONE_ID"
echo "✅ Escrow contract initialized"

echo ""
echo "--- Step 10: Initializing milestone contract ---"
stellar contract invoke \
  --id "$MILESTONE_ID" \
  --source "$STELLAR_DEPLOYER_SECRET" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- initialize \
  --admin "$ADMIN_ADDRESS" \
  --registry_contract_id "$CORE_ID" \
  --escrow_contract_id "$ESCROW_ID" \
  --reputation_contract_id "$REPUTATION_ID"
echo "✅ Milestone contract initialized"

echo ""
echo "--- Step 11: Configuring core registry references ---"
stellar contract invoke \
  --id "$CORE_ID" \
  --source "$STELLAR_DEPLOYER_SECRET" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- set_escrow_contract \
  --admin "$ADMIN_ADDRESS" \
  --escrow "$ESCROW_ID"

stellar contract invoke \
  --id "$CORE_ID" \
  --source "$STELLAR_DEPLOYER_SECRET" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- set_milestone_contract \
  --admin "$ADMIN_ADDRESS" \
  --milestone "$MILESTONE_ID"
echo "✅ Core registry references set"

# Step 12: Save deployment info
echo ""
DEPLOY_FILE="$PROJECT_ROOT/.deployment-testnet.json"
cat > "$DEPLOY_FILE" << EOF
{
  "network": "testnet",
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployer": "$DEPLOYER_PUBLIC",
  "admin": "$ADMIN_ADDRESS",
  "contracts": {
    "core": "$CORE_ID",
    "reputation": "$REPUTATION_ID",
    "escrow": "$ESCROW_ID",
    "milestone": "$MILESTONE_ID",
    "native_token": "$NATIVE_TOKEN_ID"
  },
  "rpc_url": "$RPC_URL",
  "explorer": "https://stellar.expert/explorer/testnet"
}
EOF

echo "=========================================="
echo "  TESTNET DEPLOYMENT COMPLETE"
echo "=========================================="
echo ""
echo "Contract IDs:"
echo "  Core/Registry:  $CORE_ID"
echo "  Reputation:     $REPUTATION_ID"
echo "  Escrow:         $ESCROW_ID"
echo "  Milestone:      $MILESTONE_ID"
echo "  Token:          $NATIVE_TOKEN_ID"
echo ""
echo "Explorer Links:"
echo "  Core:           https://stellar.expert/explorer/testnet/contract/$CORE_ID"
echo "  Reputation:     https://stellar.expert/explorer/testnet/contract/$REPUTATION_ID"
echo "  Escrow:         https://stellar.expert/explorer/testnet/contract/$ESCROW_ID"
echo "  Milestone:      https://stellar.expert/explorer/testnet/contract/$MILESTONE_ID"
echo ""
echo "Update your .env / frontend/.env.local:"
echo "  NEXT_PUBLIC_CORE_CONTRACT_ID=$CORE_ID"
echo "  NEXT_PUBLIC_REPUTATION_CONTRACT_ID=$REPUTATION_ID"
echo "  NEXT_PUBLIC_ESCROW_CONTRACT_ID=$ESCROW_ID"
echo "  NEXT_PUBLIC_MILESTONE_CONTRACT_ID=$MILESTONE_ID"
echo "  NEXT_PUBLIC_NATIVE_TOKEN_CONTRACT_ID=$NATIVE_TOKEN_ID"
echo ""
echo "Deployment info saved to: $DEPLOY_FILE"
