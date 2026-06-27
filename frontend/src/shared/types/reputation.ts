export interface StudentReputation {
  address: string;
  score: number;
  projectsCompleted: number;
  milestonesDelivered: number;
  onTimeDelivery: number;
  totalFundsReceived: bigint;
  lastUpdated: number;
}

export interface SponsorReputation {
  address: string;
  score: number;
  projectsFunded: number;
  totalContributed: bigint;
  milestonesReviewed: number;
  avgResponseTime: number;
  lastUpdated: number;
}

export type ReputationTier = "Bronze" | "Silver" | "Gold" | "Platinum";

export interface ReputationTierInfo {
  label: ReputationTier;
  min: number;
  max: number;
  color: string;
  gradient: string;
}

export const REPUTATION_TIER_CONFIG: Record<ReputationTier, ReputationTierInfo> = {
  Bronze: {
    label: "Bronze",
    min: 0,
    max: 249,
    color: "#CD7F32",
    gradient: "from-amber-700 to-amber-900",
  },
  Silver: {
    label: "Silver",
    min: 250,
    max: 499,
    color: "#C0C0C0",
    gradient: "from-gray-300 to-gray-500",
  },
  Gold: {
    label: "Gold",
    min: 500,
    max: 749,
    color: "#FFD700",
    gradient: "from-yellow-400 to-amber-500",
  },
  Platinum: {
    label: "Platinum",
    min: 750,
    max: Infinity,
    color: "#E5E4E2",
    gradient: "from-slate-200 to-slate-400",
  },
};

export function getTierForScore(score: number): ReputationTierInfo {
  if (score >= 750) return REPUTATION_TIER_CONFIG.Platinum;
  if (score >= 500) return REPUTATION_TIER_CONFIG.Gold;
  if (score >= 250) return REPUTATION_TIER_CONFIG.Silver;
  return REPUTATION_TIER_CONFIG.Bronze;
}
