#!/usr/bin/env bash
# =============================================================================
# EduFundX — Deploy Contracts to Local Stellar Quickstart
# =============================================================================
# Prerequisites:
#   - Docker installed and running
#   - Stellar CLI installed: cargo install --locked stellar-cli
#   - Contracts built: cd contracts && cargo build --release --target wasm32-unknown-unknown
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONTRACTS_DIR="$PROJECT_ROOT/contracts"
WASM_DIR="$CONTRACTS_DIR/target/wasm32-unknown-unknown/release"

LOCAL_RPC="http://localhost:8000/soroban/rpc"
LOCAL_NETWORK_PASSPHRASE="Standalone Network ; February 2017"

echo "=== EduFundX Local Deployment ==="
echo ""

# Step 1: Start local Stellar network (if not running)
echo "--- Step 1: Checking local Stellar network ---"
if ! curl -s "$LOCAL_RPC" > /dev/null 2>&1; then
  echo "Starting Stellar Quickstart (Docker)..."
  docker run --rm -d \
    --name stellar-quickstart \
    -p 8000:8000 \
    stellar/quickstart:latest \
    --standalone \
    --enable-soroban-rpc
  echo "Waiting for network to start (30s)..."
  sleep 30
else
  echo "Local network already running."
fi

# Step 2: Build contracts
echo ""
echo "--- Step 2: Building contracts ---"
cd "$CONTRACTS_DIR"
cargo build --release --target wasm32-unknown-unknown -p edufundx_reputation
cargo build --release --target wasm32-unknown-unknown -p edufundx_core
cargo build --release --target wasm32-unknown-unknown -p edufundx_escrow
cargo build --release --target wasm32-unknown-unknown -p edufundx_milestone
echo "✅ Contracts built"

# Step 3: Generate local deployer key
echo ""
echo "--- Step 3: Setting up deployer account ---"
stellar keys generate local-deployer --network local 2>/dev/null || true
DEPLOYER_ADDRESS=$(stellar keys address local-deployer)
echo "Deployer: $DEPLOYER_ADDRESS"

# Fund via friendbot (local)
curl -s "http://localhost:8000/friendbot?addr=$DEPLOYER_ADDRESS" > /dev/null 2>&1 || true

# Step 4: Deploy Contracts
echo ""
echo "--- Step 4: Deploying reputation contract ---"
REPUTATION_ID=$(stellar contract deploy \
  --wasm "$WASM_DIR/edufundx_reputation.wasm" \
  --source local-deployer \
  --rpc-url "$LOCAL_RPC" \
  --network-passphrase "$LOCAL_NETWORK_PASSPHRASE")
echo "✅ Reputation Contract: $REPUTATION_ID"

echo ""
echo "--- Step 5: Deploying core registry contract ---"
CORE_ID=$(stellar contract deploy \
  --wasm "$WASM_DIR/edufundx_core.wasm" \
  --source local-deployer \
  --rpc-url "$LOCAL_RPC" \
  --network-passphrase "$LOCAL_NETWORK_PASSPHRASE")
echo "✅ Core Contract: $CORE_ID"

echo ""
echo "--- Step 6: Deploying escrow contract ---"
ESCROW_ID=$(stellar contract deploy \
  --wasm "$WASM_DIR/edufundx_escrow.wasm" \
  --source local-deployer \
  --rpc-url "$LOCAL_RPC" \
  --network-passphrase "$LOCAL_NETWORK_PASSPHRASE")
echo "✅ Escrow Contract: $ESCROW_ID"

echo ""
echo "--- Step 7: Deploying milestone contract ---"
MILESTONE_ID=$(stellar contract deploy \
  --wasm "$WASM_DIR/edufundx_milestone.wasm" \
  --source local-deployer \
  --rpc-url "$LOCAL_RPC" \
  --network-passphrase "$LOCAL_NETWORK_PASSPHRASE")
echo "✅ Milestone Contract: $MILESTONE_ID"

# Step 8: Get native token contract ID
echo ""
echo "--- Step 8: Getting native XLM token contract ---"
NATIVE_TOKEN_ID=$(stellar contract id asset \
  --asset native \
  --source local-deployer \
  --rpc-url "$LOCAL_RPC" \
  --network-passphrase "$LOCAL_NETWORK_PASSPHRASE" 2>/dev/null || echo "NATIVE_TOKEN_NOT_AVAILABLE")
echo "Native Token: $NATIVE_TOKEN_ID"

# Step 9: Initialize contracts
echo ""
echo "--- Step 9: Initializing contracts ---"

# Initialize Reputation Contract
echo "Initializing reputation contract..."
stellar contract invoke \
  --id "$REPUTATION_ID" \
  --source local-deployer \
  --rpc-url "$LOCAL_RPC" \
  --network-passphrase "$LOCAL_NETWORK_PASSPHRASE" \
  -- initialize \
  --admin "$DEPLOYER_ADDRESS" \
  --core_contract_id "$CORE_ID"
echo "✅ Reputation contract initialized"

# Initialize Core Contract
echo "Initializing core contract..."
stellar contract invoke \
  --id "$CORE_ID" \
  --source local-deployer \
  --rpc-url "$LOCAL_RPC" \
  --network-passphrase "$LOCAL_NETWORK_PASSPHRASE" \
  -- initialize \
  --admin "$DEPLOYER_ADDRESS" \
  --reputation_contract_id "$REPUTATION_ID" \
  --token_id "$NATIVE_TOKEN_ID" \
  --platform_fee_bps 250
echo "✅ Core contract initialized"

# Initialize Escrow Contract
echo "Initializing escrow contract..."
stellar contract invoke \
  --id "$ESCROW_ID" \
  --source local-deployer \
  --rpc-url "$LOCAL_RPC" \
  --network-passphrase "$LOCAL_NETWORK_PASSPHRASE" \
  -- initialize \
  --admin "$DEPLOYER_ADDRESS" \
  --registry_contract_id "$CORE_ID" \
  --token_contract_id "$NATIVE_TOKEN_ID" \
  --reputation_contract_id "$REPUTATION_ID" \
  --milestone_contract_id "$MILESTONE_ID"
echo "✅ Escrow contract initialized"

# Initialize Milestone Contract
echo "Initializing milestone contract..."
stellar contract invoke \
  --id "$MILESTONE_ID" \
  --source local-deployer \
  --rpc-url "$LOCAL_RPC" \
  --network-passphrase "$LOCAL_NETWORK_PASSPHRASE" \
  -- initialize \
  --admin "$DEPLOYER_ADDRESS" \
  --registry_contract_id "$CORE_ID" \
  --escrow_contract_id "$ESCROW_ID" \
  --reputation_contract_id "$REPUTATION_ID"
echo "✅ Milestone contract initialized"

# Configure escrow & milestone addresses inside core registry
echo "Configuring core registry references..."
stellar contract invoke \
  --id "$CORE_ID" \
  --source local-deployer \
  --rpc-url "$LOCAL_RPC" \
  --network-passphrase "$LOCAL_NETWORK_PASSPHRASE" \
  -- set_escrow_contract \
  --admin "$DEPLOYER_ADDRESS" \
  --escrow "$ESCROW_ID"

stellar contract invoke \
  --id "$CORE_ID" \
  --source local-deployer \
  --rpc-url "$LOCAL_RPC" \
  --network-passphrase "$LOCAL_NETWORK_PASSPHRASE" \
  -- set_milestone_contract \
  --admin "$DEPLOYER_ADDRESS" \
  --milestone "$MILESTONE_ID"
echo "✅ Core registry references set"

# Output
echo ""
echo "=========================================="
echo "  LOCAL DEPLOYMENT COMPLETE"
echo "=========================================="
echo ""
echo "Contract IDs:"
echo "  Core/Registry:  $CORE_ID"
echo "  Reputation:     $REPUTATION_ID"
echo "  Escrow:         $ESCROW_ID"
echo "  Milestone:      $MILESTONE_ID"
echo "  Token:          $NATIVE_TOKEN_ID"
echo ""
echo "Add to your .env:"
echo "  NEXT_PUBLIC_CORE_CONTRACT_ID=$CORE_ID"
echo "  NEXT_PUBLIC_REPUTATION_CONTRACT_ID=$REPUTATION_ID"
echo "  NEXT_PUBLIC_ESCROW_CONTRACT_ID=$ESCROW_ID"
echo "  NEXT_PUBLIC_MILESTONE_CONTRACT_ID=$MILESTONE_ID"
echo "  NEXT_PUBLIC_NATIVE_TOKEN_CONTRACT_ID=$NATIVE_TOKEN_ID"
echo "  NEXT_PUBLIC_SOROBAN_RPC_URL=$LOCAL_RPC"
echo ""
