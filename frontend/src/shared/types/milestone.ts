export enum MilestoneStatus {
  Pending = "Pending",
  Submitted = "Submitted",
  Approved = "Approved",
  Rejected = "Rejected",
}

export interface Milestone {
  id: number;
  projectId: number;
  description: string;
  status: MilestoneStatus;
  submittedAt?: number;
  approvedAt?: number;
  proofUrl?: string;
  fundsReleased: bigint;
}

export function getMilestoneStatusColor(status: MilestoneStatus): string {
  switch (status) {
    case MilestoneStatus.Pending:
      return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    case MilestoneStatus.Submitted:
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    case MilestoneStatus.Approved:
      return "text-green-400 bg-green-500/10 border-green-500/20";
    case MilestoneStatus.Rejected:
      return "text-red-400 bg-red-500/10 border-red-500/20";
    default:
      return "text-gray-400 bg-gray-500/10 border-gray-500/20";
  }
}

export function getMilestoneStatusIcon(status: MilestoneStatus): string {
  switch (status) {
    case MilestoneStatus.Pending:
      return "circle";
    case MilestoneStatus.Submitted:
      return "clock";
    case MilestoneStatus.Approved:
      return "check-circle";
    case MilestoneStatus.Rejected:
      return "x-circle";
    default:
      return "circle";
  }
}
