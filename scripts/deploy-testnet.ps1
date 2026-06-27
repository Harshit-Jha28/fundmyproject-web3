# =============================================================================
# EduFundX — Deploy Contracts to Stellar Testnet (PowerShell version)
# =============================================================================
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$ContractsDir = Join-Path $ProjectRoot "contracts"
$WasmDir = Join-Path $ContractsDir "target\wasm32v1-none\release"

$RpcUrl = "https://soroban-testnet.stellar.org"
$NetworkPassphrase = "Test SDF Network ; September 2015"

Write-Host "=== [INFO] Starting Stellar Testnet Deployment Pipeline (PowerShell) ===" -ForegroundColor Cyan
Write-Host ""

# 1. Validation: Check if stellar CLI is installed
if (!(Get-Command "stellar" -ErrorAction SilentlyContinue)) {
    Write-Error "[ERROR] stellar-cli is not installed or not in PATH. Install it via: cargo install --locked stellar-cli"
}
Write-Host "[OK] stellar-cli is installed." -ForegroundColor Green

# 2. Validation: Check if deployer and admin keys are registered
$keys = stellar keys ls
if ($keys -notcontains "deployer") {
    Write-Error "[ERROR] 'deployer' key not found in stellar keystore. Please generate and fund it first using: stellar keys generate deployer --network testnet"
}
if ($keys -notcontains "admin") {
    Write-Error "[ERROR] 'admin' key not found in stellar keystore. Please generate and fund it first using: stellar keys generate admin --network testnet"
}
Write-Host "[OK] 'deployer' and 'admin' keys found in local keystore." -ForegroundColor Green

$DeployerPublic = (stellar keys address deployer).Trim()
$AdminPublic = (stellar keys address admin).Trim()
Write-Host "[INFO] Deployer Address: $DeployerPublic"
Write-Host "[INFO] Admin Address:    $AdminPublic"

# 3. Validation: Verify that deployer is funded on Testnet
Write-Host "[INFO] Checking deployer account funding status..."
try {
    $response = Invoke-RestMethod -Uri "https://horizon-testnet.stellar.org/accounts/$DeployerPublic" -Method Get -ErrorAction Stop
    Write-Host "[OK] Deployer account is funded." -ForegroundColor Green
} catch {
    Write-Host "[WARN] Deployer account is not funded on Testnet. Funding now via friendbot..." -ForegroundColor Yellow
    try {
        $friendbot = Invoke-RestMethod -Uri "https://friendbot.stellar.org/?addr=$DeployerPublic" -Method Get
        Start-Sleep -Seconds 5
        $response = Invoke-RestMethod -Uri "https://horizon-testnet.stellar.org/accounts/$DeployerPublic" -Method Get -ErrorAction Stop
        Write-Host "[OK] Deployer account successfully funded." -ForegroundColor Green
    } catch {
        Write-Error "[ERROR] Friendbot funding failed. Please check your network and try again."
    }
}

# 4. Build contracts
Write-Host ""
Write-Host "--- Step 1: Building smart contracts (Release profile) ---" -ForegroundColor Cyan
Push-Location $ContractsDir
try {
    cargo build --target wasm32v1-none --release
} finally {
    Pop-Location
}

# Verify WASM outputs exist and are within size bounds
Write-Host "[INFO] Verifying contract sizes..."
$contracts = @("edufundx_reputation", "edufundx_core", "edufundx_escrow", "edufundx_milestone")
foreach ($contract in $contracts) {
    $wasmFile = Join-Path $WasmDir "${contract}.wasm"
    if (!(Test-Path $wasmFile)) {
        Write-Error "[ERROR] WASM file not found: $wasmFile"
    }
    $size = (Get-Item $wasmFile).Length
    $sizeKb = [Math]::Round($size / 1024, 2)
    Write-Host "  $($contract): $($sizeKb)KB"
    if ($size -gt 65536) {
        Write-Error "[ERROR] $contract exceeds the 64KB limit! Please optimize."
    }
}
Write-Host "[OK] All contracts compiled successfully." -ForegroundColor Green

# 5. Deploy WASM files to Testnet
Write-Host ""
Write-Host "--- Step 2: Deploying WASM files to Stellar Testnet ---" -ForegroundColor Cyan

function Deploy-Contract($wasmPath) {
    $maxAttempts = 3
    $wasmHash = ""
    
    # 5.1 Upload WASM step with retry
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        try {
            Write-Host "[INFO] Uploading WASM: $(Split-Path $wasmPath -Leaf) (Attempt $attempt)..."
            $uploadOutput = @(stellar contract upload --wasm $wasmPath --source deployer --rpc-url $RpcUrl --network-passphrase $NetworkPassphrase)
            $wasmHash = ($uploadOutput[-1]).ToString().Trim()
            if ($wasmHash -match "^[0-9a-fA-F]{64}$") {
                Write-Host "[INFO] WASM Hash resolved: $wasmHash"
                break
            }
        } catch {
            Write-Host "  [WARN] Upload attempt $attempt failed: $_. Retrying in 5 seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        }
    }
    
    if (!$wasmHash) {
        Write-Error "[ERROR] Failed to upload WASM after $maxAttempts attempts."
    }
    
    # Sleep to ensure ledger indexing sync and avoid TxBadSeq
    Start-Sleep -Seconds 8
    
    # 5.2 Instantiate contract step with retry
    $contractId = ""
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        try {
            Write-Host "[INFO] Instantiating contract using hash $wasmHash (Attempt $attempt)..."
            $deployOutput = @(stellar contract deploy --wasm-hash $wasmHash --source deployer --rpc-url $RpcUrl --network-passphrase $NetworkPassphrase)
            $contractId = ($deployOutput[-1]).ToString().Trim()
            if ($contractId -match "^C[A-Z0-9]{55}$") {
                break
            }
        } catch {
            Write-Host "  [WARN] Deploy attempt $attempt failed: $_. Retrying in 8 seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds 8
        }
    }
    
    if (!$contractId) {
        Write-Error "[ERROR] Failed to deploy contract after $maxAttempts attempts."
    }
    
    # Sleep to ensure deploy ledger close before next action
    Start-Sleep -Seconds 8
    return $contractId
}

$ReputationId = Deploy-Contract (Join-Path $WasmDir "edufundx_reputation.wasm")
Write-Host "[OK] Reputation Contract ID: $ReputationId" -ForegroundColor Green

$CoreId = Deploy-Contract (Join-Path $WasmDir "edufundx_core.wasm")
Write-Host "[OK] Core Registry Contract ID: $CoreId" -ForegroundColor Green

$EscrowId = Deploy-Contract (Join-Path $WasmDir "edufundx_escrow.wasm")
Write-Host "[OK] Escrow Contract ID: $EscrowId" -ForegroundColor Green

$MilestoneId = Deploy-Contract (Join-Path $WasmDir "edufundx_milestone.wasm")
Write-Host "[OK] Milestone Contract ID: $MilestoneId" -ForegroundColor Green

# 6. Retrieve native token contract address
Write-Host ""
Write-Host "--- Step 3: Resolving native XLM token contract address ---" -ForegroundColor Cyan
$NativeTokenId = ""
for ($attempt = 1; $attempt -le 3; $attempt++) {
    try {
        $NativeTokenId = (stellar contract id asset --asset native --network testnet).Trim()
        break
    } catch {
        Write-Host "  [WARN] Native token resolution attempt $attempt failed. Retrying..." -ForegroundColor Yellow
        Start-Sleep -Seconds 8
    }
}
if (!$NativeTokenId) {
    Write-Host "  [WARN] Using default testnet SAC." -ForegroundColor Yellow
    $NativeTokenId = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
}
Write-Host "[OK] Native XLM Token Contract: $NativeTokenId" -ForegroundColor Green
Start-Sleep -Seconds 8

# 7. Initialize contracts in dependency order (requires Admin authentication)
Write-Host ""
Write-Host "--- Step 4: Initializing contracts on-chain (using Admin account) ---" -ForegroundColor Cyan

Write-Host "[INFO] Initializing Reputation Contract..."
for ($attempt = 1; $attempt -le 3; $attempt++) {
    try {
        stellar contract invoke --id $ReputationId --source admin --rpc-url $RpcUrl --network-passphrase $NetworkPassphrase -- initialize --admin $AdminPublic --core_contract_id $CoreId
        Write-Host "[OK] Reputation contract initialized." -ForegroundColor Green
        break
    } catch {
        Write-Host "  [WARN] Reputation init attempt $attempt failed: $_. Retrying..." -ForegroundColor Yellow
        Start-Sleep -Seconds 8
    }
}
Start-Sleep -Seconds 8

Write-Host "[INFO] Initializing Core Registry Contract..."
for ($attempt = 1; $attempt -le 3; $attempt++) {
    try {
        stellar contract invoke --id $CoreId --source admin --rpc-url $RpcUrl --network-passphrase $NetworkPassphrase -- initialize --admin $AdminPublic --reputation_contract_id $ReputationId --token_id $NativeTokenId --platform_fee_bps 250
        Write-Host "[OK] Core contract initialized." -ForegroundColor Green
        break
    } catch {
        Write-Host "  [WARN] Core init attempt $attempt failed: $_. Retrying..." -ForegroundColor Yellow
        Start-Sleep -Seconds 8
    }
}
Start-Sleep -Seconds 8

Write-Host "[INFO] Initializing Escrow Contract..."
for ($attempt = 1; $attempt -le 3; $attempt++) {
    try {
        stellar contract invoke --id $EscrowId --source admin --rpc-url $RpcUrl --network-passphrase $NetworkPassphrase -- initialize --admin $AdminPublic --registry_contract_id $CoreId --token_contract_id $NativeTokenId --reputation_contract_id $ReputationId --milestone_contract_id $MilestoneId
        Write-Host "[OK] Escrow contract initialized." -ForegroundColor Green
        break
    } catch {
        Write-Host "  [WARN] Escrow init attempt $attempt failed: $_. Retrying..." -ForegroundColor Yellow
        Start-Sleep -Seconds 8
    }
}
Start-Sleep -Seconds 8

Write-Host "[INFO] Initializing Milestone Contract..."
for ($attempt = 1; $attempt -le 3; $attempt++) {
    try {
        stellar contract invoke --id $MilestoneId --source admin --rpc-url $RpcUrl --network-passphrase $NetworkPassphrase -- initialize --admin $AdminPublic --registry_contract_id $CoreId --escrow_contract_id $EscrowId --reputation_contract_id $ReputationId
        Write-Host "[OK] Milestone contract initialized." -ForegroundColor Green
        break
    } catch {
        Write-Host "  [WARN] Milestone init attempt $attempt failed: $_. Retrying..." -ForegroundColor Yellow
        Start-Sleep -Seconds 8
    }
}
Start-Sleep -Seconds 8

# 8. Set cross-contract references in Core contract (requires Admin authentication)
Write-Host ""
Write-Host "--- Step 5: Configuring Core contract gateway references ---" -ForegroundColor Cyan
for ($attempt = 1; $attempt -le 3; $attempt++) {
    try {
        stellar contract invoke --id $CoreId --source admin --rpc-url $RpcUrl --network-passphrase $NetworkPassphrase -- set_escrow_contract --admin $AdminPublic --escrow $EscrowId
        Write-Host "[OK] Escrow gateway reference set." -ForegroundColor Green
        break
    } catch {
        Write-Host "  [WARN] Core escrow ref set attempt $attempt failed: $_. Retrying..." -ForegroundColor Yellow
        Start-Sleep -Seconds 8
    }
}
Start-Sleep -Seconds 8

for ($attempt = 1; $attempt -le 3; $attempt++) {
    try {
        stellar contract invoke --id $CoreId --source admin --rpc-url $RpcUrl --network-passphrase $NetworkPassphrase -- set_milestone_contract --admin $AdminPublic --milestone $MilestoneId
        Write-Host "[OK] Milestone gateway reference set." -ForegroundColor Green
        break
    } catch {
        Write-Host "  [WARN] Core milestone ref set attempt $attempt failed: $_. Retrying..." -ForegroundColor Yellow
        Start-Sleep -Seconds 8
    }
}
Start-Sleep -Seconds 8

# 9. Save deployment details
Write-Host ""
Write-Host "--- Step 6: Generating configuration files ---" -ForegroundColor Cyan
$DeployJson = Join-Path $ProjectRoot ".deployment-testnet.json"
$jsonContent = @{
    network = "testnet"
    deployed_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    deployer = $DeployerPublic
    admin = $AdminPublic
    contracts = @{
        core = $CoreId
        reputation = $ReputationId
        escrow = $EscrowId
        milestone = $MilestoneId
        native_token = $NativeTokenId
    }
    rpc_url = $RpcUrl
} | ConvertTo-Json
Set-Content -Path $DeployJson -Value $jsonContent
Write-Host "[OK] Deployment info saved to: $DeployJson" -ForegroundColor Green

# Generate env files for frontend
$EnvLocal = Join-Path $ProjectRoot "frontend\.env.local"
$envContent = @"
# Generated by deploy-testnet.ps1
NEXT_PUBLIC_CORE_CONTRACT_ID=$CoreId
NEXT_PUBLIC_REPUTATION_CONTRACT_ID=$ReputationId
NEXT_PUBLIC_ESCROW_CONTRACT_ID=$EscrowId
NEXT_PUBLIC_MILESTONE_CONTRACT_ID=$MilestoneId
NEXT_PUBLIC_NATIVE_TOKEN_CONTRACT_ID=$NativeTokenId
NEXT_PUBLIC_SOROBAN_RPC_URL=$RpcUrl
NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE=$NetworkPassphrase
NEXT_PUBLIC_STELLAR_NETWORK=testnet
"@
Set-Content -Path $EnvLocal -Value $envContent
Write-Host "[OK] Frontend configuration saved to: $EnvLocal" -ForegroundColor Green

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  STELLAR TESTNET DEPLOYMENT PIPELINE SUCCESSFUL" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  Core Registry: $CoreId"
Write-Host "  Reputation:    $ReputationId"
Write-Host "  Escrow:        $EscrowId"
Write-Host "  Milestone:     $MilestoneId"
Write-Host "  Token:         $NativeTokenId"
Write-Host "=====================================================" -ForegroundColor Green
