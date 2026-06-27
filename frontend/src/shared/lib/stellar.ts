import * as StellarSdk from "@stellar/stellar-sdk";
import { SOROBAN_RPC_URL, NETWORK_PASSPHRASE, HORIZON_URL } from "./constants";

// Soroban RPC Server instance (v16 uses rpc namespace)
let sorobanServer: StellarSdk.rpc.Server | null = null;

export function getSorobanServer(): StellarSdk.rpc.Server {
  if (!sorobanServer) {
    sorobanServer = new StellarSdk.rpc.Server(SOROBAN_RPC_URL, {
      allowHttp: SOROBAN_RPC_URL.startsWith("http://"),
    });
  }
  return sorobanServer;
}

// Horizon Server instance for account queries
let horizonServer: StellarSdk.Horizon.Server | null = null;

export function getHorizonServer(): StellarSdk.Horizon.Server {
  if (!horizonServer) {
    horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL, {
      allowHttp: HORIZON_URL.startsWith("http://"),
    });
  }
  return horizonServer;
}

export function getNetworkPassphrase(): string {
  return NETWORK_PASSPHRASE;
}

// Build a base transaction for contract calls
export async function buildTransaction(
  sourceAddress: string,
  operations: StellarSdk.xdr.Operation[],
  fee = "100"
): Promise<StellarSdk.Transaction> {
  const server = getSorobanServer();
  const account = await server.getAccount(sourceAddress);

  const txBuilder = new StellarSdk.TransactionBuilder(account, {
    fee,
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  operations.forEach((op) => txBuilder.addOperation(op));
  txBuilder.setTimeout(30);

  return txBuilder.build();
}

// Simulate and assemble transaction resource fees
export async function prepareTransaction(
  tx: StellarSdk.Transaction
): Promise<StellarSdk.Transaction> {
  const server = getSorobanServer();
  const simulation = await server.simulateTransaction(tx);
  
  if (StellarSdk.rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Simulation failed: ${JSON.stringify(simulation)}`);
  }
  
  return StellarSdk.rpc.assembleTransaction(tx, simulation).build();
}

// Build, simulate and prepare a contract invocation transaction
export async function invokeContract(
  sourceAddress: string,
  contractId: string,
  functionName: string,
  args: StellarSdk.xdr.ScVal[]
): Promise<StellarSdk.Transaction> {
  const contract = new StellarSdk.Contract(contractId);
  const op = contract.call(functionName, ...args);
  
  const baseTx = await buildTransaction(sourceAddress, [op]);
  return prepareTransaction(baseTx);
}

// Submit a signed transaction to the network
export async function submitTransaction(
  signedTx: StellarSdk.Transaction
): Promise<StellarSdk.rpc.Api.SendTransactionResponse> {
  const server = getSorobanServer();
  return server.sendTransaction(signedTx);
}

// Poll for transaction completion
export async function waitForTransaction(
  hash: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<StellarSdk.rpc.Api.GetTransactionResponse> {
  const server = getSorobanServer();

  for (let i = 0; i < maxAttempts; i++) {
    const response = await server.getTransaction(hash);

    if (response.status !== "NOT_FOUND") {
      return response;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Transaction ${hash} not found after ${maxAttempts} attempts`);
}

// Get XLM balance for an address
export async function getXlmBalance(address: string): Promise<string> {
  try {
    const server = getHorizonServer();
    const account = await server.loadAccount(address);
    const nativeBalance = account.balances.find(
      (b) => b.asset_type === "native"
    );
    return nativeBalance?.balance ?? "0";
  } catch {
    return "0";
  }
}

// Parse Soroban contract values
export function parseScVal(val: StellarSdk.xdr.ScVal): unknown {
  return StellarSdk.scValToNative(val);
}

export function toScVal(
  val: string | number | bigint | boolean,
  type: "address" | "i128" | "u64" | "u32" | "string" | "bool" | "symbol"
): StellarSdk.xdr.ScVal {
  switch (type) {
    case "address":
      return new StellarSdk.Address(val as string).toScVal();
    case "i128":
      return StellarSdk.nativeToScVal(BigInt(val), { type: "i128" });
    case "u64":
      return StellarSdk.nativeToScVal(BigInt(val), { type: "u64" });
    case "u32":
      return StellarSdk.nativeToScVal(Number(val), { type: "u32" });
    case "string":
      return StellarSdk.nativeToScVal(String(val));
    case "bool":
      return StellarSdk.nativeToScVal(Boolean(val));
    case "symbol":
      return StellarSdk.nativeToScVal(String(val), { type: "symbol" });
    default:
      throw new Error(`Unsupported ScVal type: ${type}`);
  }
}

// Simulate a read-only contract function call
export async function simulateReadOnlyCall(
  contractId: string,
  functionName: string,
  args: StellarSdk.xdr.ScVal[]
): Promise<StellarSdk.xdr.ScVal> {
  const server = getSorobanServer();
  const dummyAddress = "GD7VZJCNHRNXQNEALGZBHQVMJOM7G5S3ZOUQBI3LNBKS2G4G64EXZWNZ";

  if (!StellarSdk.StrKey.isValidEd25519PublicKey(dummyAddress)) {
    throw new Error(`Invalid Stellar address: ${dummyAddress}`);
  }

  const contract = new StellarSdk.Contract(contractId);
  const op = contract.call(functionName, ...args);

  const source = new StellarSdk.Account(dummyAddress, "0");
  const tx = new StellarSdk.TransactionBuilder(source, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const simulation = await server.simulateTransaction(tx);

if (StellarSdk.rpc.Api.isSimulationError(simulation)) {
  throw new Error(
    `Simulation error for ${functionName}: ${JSON.stringify(simulation)}`
  );
}

const sim = simulation as any;

// New SDK format
if (sim.result?.retval) {
  return sim.result.retval;
}

// Old SDK format
if (sim.results?.length > 0 && sim.results[0].xdr) {
  return StellarSdk.xdr.ScVal.fromXDR(sim.results[0].xdr, "base64");
}

throw new Error(
  `No return value from ${functionName} on contract ${contractId}. Response: ${JSON.stringify(simulation)}`
);
}