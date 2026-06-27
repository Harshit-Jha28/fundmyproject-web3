export enum ProjectStatus {
  Active = "Active",
  FullyFunded = "FullyFunded",
  MilestonesInProgress = "MilestonesInProgress",
  Completed = "Completed",
  Cancelled = "Cancelled",
  Disputed = "Disputed",
}

export interface Project {
  id: number;
  student: string;
  title: string;
  description: string;
  fundingGoal: bigint;
  currentFunding: bigint;
  deadline: number; // unix timestamp
  status: ProjectStatus;
  milestoneCount: number;
  completedMilestones: number;
  sponsorCount: number;
  createdAt: number;
  category?: string;
}

export interface ProjectFormData {
  title: string;
  description: string;
  fundingGoal: string; // XLM amount as string
  milestoneDescriptions: string[];
  deadline: string; // ISO date string
  category?: string;
}

export interface ProjectSponsor {
  address: string;
  amount: bigint;
  timestamp: number;
}

export function getStatusColor(status: ProjectStatus): string {
  switch (status) {
    case ProjectStatus.Active:
      return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    case ProjectStatus.FullyFunded:
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case ProjectStatus.MilestonesInProgress:
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    case ProjectStatus.Completed:
      return "text-green-400 bg-green-500/10 border-green-500/20";
    case ProjectStatus.Cancelled:
      return "text-red-400 bg-red-500/10 border-red-500/20";
    case ProjectStatus.Disputed:
      return "text-orange-400 bg-orange-500/10 border-orange-500/20";
    default:
      return "text-gray-400 bg-gray-500/10 border-gray-500/20";
  }
}

export function getStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case ProjectStatus.Active:
      return "Active";
    case ProjectStatus.FullyFunded:
      return "Fully Funded";
    case ProjectStatus.MilestonesInProgress:
      return "In Progress";
    case ProjectStatus.Completed:
      return "Completed";
    case ProjectStatus.Cancelled:
      return "Cancelled";
    case ProjectStatus.Disputed:
      return "Disputed";
    default:
      return "Unknown";
  }
}
