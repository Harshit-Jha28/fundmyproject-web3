export const CORE_CONTRACT_ID =
  process.env.NEXT_PUBLIC_CORE_CONTRACT_ID || "";

export const REPUTATION_CONTRACT_ID =
  process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_ID || "";

export const ESCROW_CONTRACT_ID =
  process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID || "";

export const MILESTONE_CONTRACT_ID =
  process.env.NEXT_PUBLIC_MILESTONE_CONTRACT_ID || "";

// Soroban RPC Configuration
export const SOROBAN_RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";

export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";

export const STELLAR_NETWORK =
  (process.env.NEXT_PUBLIC_STELLAR_NETWORK as "testnet" | "mainnet") || "testnet";

// Horizon
export const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org";

// Explorer
export const EXPLORER_URL =
  process.env.NEXT_PUBLIC_EXPLORER_URL || "https://stellar.expert/explorer/testnet";

// App
export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME || "EduFundX";

export const APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";

// Transaction defaults
export const DEFAULT_TX_TIMEOUT = 30; // seconds
export const DEFAULT_FEE = "100"; // stroops

// Pagination
export const DEFAULT_PAGE_SIZE = 12;

// Polling intervals
export const ACTIVITY_POLL_INTERVAL = 5000; // 5 seconds
export const BALANCE_POLL_INTERVAL = 15000; // 15 seconds

// Reputation tiers
export const REPUTATION_TIERS = {
  BRONZE: { min: 0, max: 249, label: "Bronze", color: "#CD7F32" },
  SILVER: { min: 250, max: 499, label: "Silver", color: "#C0C0C0" },
  GOLD: { min: 500, max: 749, label: "Gold", color: "#FFD700" },
  PLATINUM: { min: 750, max: Infinity, label: "Platinum", color: "#E5E4E2" },
} as const;

export function getReputationTier(score: number) {
  if (score >= REPUTATION_TIERS.PLATINUM.min) return REPUTATION_TIERS.PLATINUM;
  if (score >= REPUTATION_TIERS.GOLD.min) return REPUTATION_TIERS.GOLD;
  if (score >= REPUTATION_TIERS.SILVER.min) return REPUTATION_TIERS.SILVER;
  return REPUTATION_TIERS.BRONZE;
}
