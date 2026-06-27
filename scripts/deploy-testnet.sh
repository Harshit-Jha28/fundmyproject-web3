#!/usr/bin/env bash
# =============================================================================
# EduFundX — Deploy Contracts to Stellar Testnet
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONTRACTS_DIR="$PROJECT_ROOT/contracts"
WASM_DIR="$CONTRACTS_DIR/target/wasm32v1-none/release"

RPC_URL="https://soroban-testnet.stellar.org"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

echo "=== [INFO] Starting Stellar Testnet Deployment Pipeline ==="
echo ""

# 1. Validation: Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
  echo "❌ [ERROR] stellar-cli is not installed or not in PATH."
  echo "Install it via: cargo install --locked stellar-cli"
  exit 1
fi
echo "[OK] stellar-cli is installed."

# 2. Validation: Check if deployer and admin keys are registered in stellar identity store
if ! stellar keys ls | grep -q "deployer"; then
  echo "❌ [ERROR] 'deployer' key not found in stellar keystore."
  echo "Please generate and fund it first using:"
  echo "stellar keys generate deployer --network testnet"
  exit 1
fi

if ! stellar keys ls | grep -q "admin"; then
  echo "❌ [ERROR] 'admin' key not found in stellar keystore."
  echo "Please generate and fund it first using:"
  echo "stellar keys generate admin --network testnet"
  exit 1
fi
echo "[OK] 'deployer' and 'admin' keys found in local keystore."

DEPLOYER_PUBLIC=$(stellar keys address deployer)
ADMIN_PUBLIC=$(stellar keys address admin)
echo "[INFO] Deployer Address: $DEPLOYER_PUBLIC"
echo "[INFO] Admin Address:    $ADMIN_PUBLIC"

# 3. Validation: Verify that deployer is funded on Testnet
echo "[INFO] Checking deployer account funding status..."
# Try to query account details on Horizon to check if it exists on-chain
if ! curl -s "https://horizon-testnet.stellar.org/accounts/$DEPLOYER_PUBLIC" | grep -q '"id"'; then
  echo "❌ [ERROR] Deployer account is not funded on Testnet."
  echo "Funding now via friendbot..."
  curl -s "https://friendbot.stellar.org/?addr=$DEPLOYER_PUBLIC" > /dev/null
  sleep 5
  if ! curl -s "https://horizon-testnet.stellar.org/accounts/$DEPLOYER_PUBLIC" | grep -q '"id"'; then
    echo "❌ [ERROR] Friendbot funding failed. Please try again later."
    exit 1
  fi
fi
echo "[OK] Deployer account is funded."

# 4. Build contracts
echo ""
echo "--- Step 1: Building smart contracts (Release profile) ---"
cd "$CONTRACTS_DIR"
cargo build --target wasm32v1-none --release

# Verify WASM outputs exist and are within size bounds
echo "[INFO] Verifying contract sizes..."
for contract in edufundx_reputation edufundx_core edufundx_escrow edufundx_milestone; do
  wasm_file="$WASM_DIR/${contract}.wasm"
  if [ ! -f "$wasm_file" ]; then
    echo "❌ [ERROR] WASM file not found: $wasm_file"
    exit 1
  fi
  size=$(stat -c%s "$wasm_file" 2>/dev/null || stat -f%z "$wasm_file" 2>/dev/null || echo "0")
  size_kb=$((size / 1024))
  echo "  $contract: ${size_kb}KB"
  if [ "$size" -gt 65536 ]; then
    echo "  ❌ [ERROR] $contract exceeds the 64KB limit! Please optimize."
    exit 1
  fi
done
echo "[OK] All contracts compiled successfully."

# 5. Deploy WASM files to Testnet
echo ""
echo "--- Step 2: Deploying WASM files to Stellar Testnet ---"

echo "[INFO] Deploying edufundx_reputation..."
REPUTATION_ID=$(stellar contract deploy \
  --wasm "$WASM_DIR/edufundx_reputation.wasm" \
  --source deployer \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE")
echo "[OK] Reputation Contract ID: $REPUTATION_ID"

echo "[INFO] Deploying edufundx_core registry..."
CORE_ID=$(stellar contract deploy \
  --wasm "$WASM_DIR/edufundx_core.wasm" \
  --source deployer \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE")
echo "[OK] Core Registry Contract ID: $CORE_ID"

echo "[INFO] Deploying edufundx_escrow..."
ESCROW_ID=$(stellar contract deploy \
  --wasm "$WASM_DIR/edufundx_escrow.wasm" \
  --source deployer \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE")
echo "[OK] Escrow Contract ID: $ESCROW_ID"

echo "[INFO] Deploying edufundx_milestone..."
MILESTONE_ID=$(stellar contract deploy \
  --wasm "$WASM_DIR/edufundx_milestone.wasm" \
  --source deployer \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE")
echo "[OK] Milestone Contract ID: $MILESTONE_ID"

# 6. Retrieve native token contract address
echo ""
echo "--- Step 3: Resolving native XLM token contract address ---"
NATIVE_TOKEN_ID=$(stellar contract id asset \
  --asset native \
  --source deployer \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" 2>/dev/null || echo "")

if [ -z "$NATIVE_TOKEN_ID" ]; then
  echo "  [WARN] Could not auto-detect native token. Using default testnet SAC."
  NATIVE_TOKEN_ID="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
fi
echo "[OK] Native XLM Token Contract: $NATIVE_TOKEN_ID"

# 7. Initialize contracts in dependency order
echo ""
echo "--- Step 4: Initializing contracts on-chain ---"

echo "[INFO] Initializing Reputation Contract..."
stellar contract invoke \
  --id "$REPUTATION_ID" \
  --source deployer \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- initialize \
  --admin "$ADMIN_PUBLIC" \
  --core_contract_id "$CORE_ID"
echo "[OK] Reputation contract initialized."

echo "[INFO] Initializing Core Registry Contract..."
stellar contract invoke \
  --id "$CORE_ID" \
  --source deployer \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- initialize \
  --admin "$ADMIN_PUBLIC" \
  --reputation_contract_id "$REPUTATION_ID" \
  --token_id "$NATIVE_TOKEN_ID" \
  --platform_fee_bps 250
echo "[OK] Core contract initialized."

echo "[INFO] Initializing Escrow Contract..."
stellar contract invoke \
  --id "$ESCROW_ID" \
  --source deployer \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- initialize \
  --admin "$ADMIN_PUBLIC" \
  --registry_contract_id "$CORE_ID" \
  --token_contract_id "$NATIVE_TOKEN_ID" \
  --reputation_contract_id "$REPUTATION_ID" \
  --milestone_contract_id "$MILESTONE_ID"
echo "[OK] Escrow contract initialized."

echo "[INFO] Initializing Milestone Contract..."
stellar contract invoke \
  --id "$MILESTONE_ID" \
  --source deployer \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- initialize \
  --admin "$ADMIN_PUBLIC" \
  --registry_contract_id "$CORE_ID" \
  --escrow_contract_id "$ESCROW_ID" \
  --reputation_contract_id "$REPUTATION_ID"
echo "[OK] Milestone contract initialized."

# 8. Set cross-contract references in Core contract
echo ""
echo "--- Step 5: Configuring Core contract gateway references ---"
stellar contract invoke \
  --id "$CORE_ID" \
  --source deployer \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- set_escrow_contract \
  --admin "$ADMIN_PUBLIC" \
  --escrow "$ESCROW_ID"

stellar contract invoke \
  --id "$CORE_ID" \
  --source deployer \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- set_milestone_contract \
  --admin "$ADMIN_PUBLIC" \
  --milestone "$MILESTONE_ID"
echo "[OK] Core gateway references set."

# 9. Save deployment details
echo ""
echo "--- Step 6: Generating configuration files ---"
DEPLOY_JSON="$PROJECT_ROOT/.deployment-testnet.json"
cat > "$DEPLOY_JSON" << EOF
{
  "network": "testnet",
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployer": "$DEPLOYER_PUBLIC",
  "admin": "$ADMIN_PUBLIC",
  "contracts": {
    "core": "$CORE_ID",
    "reputation": "$REPUTATION_ID",
    "escrow": "$ESCROW_ID",
    "milestone": "$MILESTONE_ID",
    "native_token": "$NATIVE_TOKEN_ID"
  },
  "rpc_url": "$RPC_URL"
}
EOF
echo "[OK] Deployment info saved to: $DEPLOY_JSON"

# Generate env files for frontend
ENV_LOCAL="$PROJECT_ROOT/frontend/.env.local"
cat > "$ENV_LOCAL" << EOF
# Generated by deploy-testnet.sh
NEXT_PUBLIC_CORE_CONTRACT_ID=$CORE_ID
NEXT_PUBLIC_REPUTATION_CONTRACT_ID=$REPUTATION_ID
NEXT_PUBLIC_ESCROW_CONTRACT_ID=$ESCROW_ID
NEXT_PUBLIC_MILESTONE_CONTRACT_ID=$MILESTONE_ID
NEXT_PUBLIC_NATIVE_TOKEN_CONTRACT_ID=$NATIVE_TOKEN_ID
NEXT_PUBLIC_SOROBAN_RPC_URL=$RPC_URL
NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE=$NETWORK_PASSPHRASE
NEXT_PUBLIC_STELLAR_NETWORK=testnet
EOF
echo "[OK] Frontend configuration saved to: $ENV_LOCAL"

echo ""
echo "====================================================="
echo "  STELLAR TESTNET DEPLOYMENT PIPELINE SUCCESSFUL"
echo "====================================================="
echo "  Core Registry: $CORE_ID"
echo "  Reputation:    $REPUTATION_ID"
echo "  Escrow:        $ESCROW_ID"
echo "  Milestone:     $MILESTONE_ID"
echo "  Token:         $NATIVE_TOKEN_ID"
echo "====================================================="
