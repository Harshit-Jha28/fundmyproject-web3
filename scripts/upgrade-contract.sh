#!/usr/bin/env bash
# =============================================================================
# EduFundX — Upgrade Contract WASM
# =============================================================================
# Usage: ./scripts/upgrade-contract.sh <core|reputation> [network]
#
# This script:
#   1. Builds the latest contract WASM
#   2. Installs the WASM to get the new hash
#   3. Calls the upgrade() function on the deployed contract
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONTRACTS_DIR="$PROJECT_ROOT/contracts"
WASM_DIR="$CONTRACTS_DIR/target/wasm32-unknown-unknown/release"

CONTRACT_NAME="${1:-}"
NETWORK="${2:-testnet}"

if [[ ! "$CONTRACT_NAME" =~ ^(core|reputation)$ ]]; then
  echo "Usage: $0 <core|reputation> [testnet|local]"
  echo ""
  echo "Examples:"
  echo "  $0 core testnet     # Upgrade core contract on testnet"
  echo "  $0 reputation local # Upgrade reputation contract locally"
  exit 1
fi

# Load environment
if [ -f "$PROJECT_ROOT/.env" ]; then
  source "$PROJECT_ROOT/.env"
fi

if [ "$NETWORK" == "testnet" ]; then
  RPC_URL="https://soroban-testnet.stellar.org"
  NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
else
  RPC_URL="http://localhost:8000/soroban/rpc"
  NETWORK_PASSPHRASE="Standalone Network ; February 2017"
fi

# Map contract name to package and contract ID
if [ "$CONTRACT_NAME" == "core" ]; then
  PACKAGE="edufundx_core"
  CONTRACT_ID="${NEXT_PUBLIC_CORE_CONTRACT_ID:-}"
elif [ "$CONTRACT_NAME" == "reputation" ]; then
  PACKAGE="edufundx_reputation"
  CONTRACT_ID="${NEXT_PUBLIC_REPUTATION_CONTRACT_ID:-}"
fi

if [ -z "$CONTRACT_ID" ]; then
  echo "❌ Contract ID not found. Set NEXT_PUBLIC_${CONTRACT_NAME^^}_CONTRACT_ID in .env"
  exit 1
fi

if [ -z "${STELLAR_DEPLOYER_SECRET:-}" ]; then
  echo "❌ STELLAR_DEPLOYER_SECRET not set."
  exit 1
fi

echo "=== EduFundX Contract Upgrade ==="
echo "Contract:  $CONTRACT_NAME ($PACKAGE)"
echo "ID:        $CONTRACT_ID"
echo "Network:   $NETWORK"
echo ""

# Step 1: Build latest WASM
echo "--- Step 1: Building latest WASM ---"
cd "$CONTRACTS_DIR"
cargo build --release --target wasm32-unknown-unknown -p "$PACKAGE"
echo "✅ Built"

WASM_FILE="$WASM_DIR/${PACKAGE}.wasm"

# Verify size
size=$(stat --printf="%s" "$WASM_FILE" 2>/dev/null || stat -f%z "$WASM_FILE")
kb=$((size / 1024))
echo "  Size: ${kb}KB"
if [ "$size" -gt 65536 ]; then
  echo "  ❌ Exceeds 64KB! Optimize before upgrading."
  exit 1
fi

# Step 2: Install WASM (upload to chain, get hash)
echo ""
echo "--- Step 2: Installing WASM (getting hash) ---"
WASM_HASH=$(stellar contract install \
  --wasm "$WASM_FILE" \
  --source "$STELLAR_DEPLOYER_SECRET" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE")
echo "✅ WASM Hash: $WASM_HASH"

# Step 3: Call upgrade on the contract
echo ""
echo "--- Step 3: Calling upgrade() ---"
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source "$STELLAR_DEPLOYER_SECRET" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- upgrade \
  --admin "$(stellar keys address deployer 2>/dev/null || echo "$STELLAR_DEPLOYER_PUBLIC")" \
  --new_wasm_hash "$WASM_HASH"
echo "✅ Upgrade complete!"

echo ""
echo "=========================================="
echo "  UPGRADE COMPLETE"
echo "=========================================="
echo "Contract: $CONTRACT_NAME"
echo "ID:       $CONTRACT_ID"
echo "New Hash: $WASM_HASH"
echo ""
echo "Verify at: https://stellar.expert/explorer/testnet/contract/$CONTRACT_ID"
