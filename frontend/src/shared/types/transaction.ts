export enum TransactionState {
  BUILDING = "BUILDING",
  SIGNING = "SIGNING",
  SUBMITTING = "SUBMITTING",
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  FAILED = "FAILED",
}

export type TransactionType =
  | "create_project"
  | "contribute"
  | "submit_milestone"
  | "approve_milestone"
  | "reject_milestone"
  | "withdraw"
  | "refund"
  | "unknown";

export interface TransactionRecord {
  id: string;
  hash?: string;
  type: TransactionType;
  state: TransactionState;
  description: string;
  amount?: string;
  projectId?: number;
  createdAt: number;
  updatedAt: number;
  error?: string;
  retryCount: number;
}

export function getTransactionStateColor(state: TransactionState): string {
  switch (state) {
    case TransactionState.BUILDING:
    case TransactionState.SIGNING:
      return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    case TransactionState.SUBMITTING:
    case TransactionState.PENDING:
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    case TransactionState.CONFIRMED:
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case TransactionState.FAILED:
      return "text-red-400 bg-red-500/10 border-red-500/20";
    default:
      return "text-gray-400 bg-gray-500/10 border-gray-500/20";
  }
}

export function getTransactionStateLabel(state: TransactionState): string {
  switch (state) {
    case TransactionState.BUILDING:
      return "Building";
    case TransactionState.SIGNING:
      return "Awaiting Signature";
    case TransactionState.SUBMITTING:
      return "Submitting";
    case TransactionState.PENDING:
      return "Pending";
    case TransactionState.CONFIRMED:
      return "Confirmed";
    case TransactionState.FAILED:
      return "Failed";
    default:
      return "Unknown";
  }
}

export function getTransactionTypeLabel(type: TransactionType): string {
  switch (type) {
    case "create_project":
      return "Create Project";
    case "contribute":
      return "Contribution";
    case "submit_milestone":
      return "Submit Milestone";
    case "approve_milestone":
      return "Approve Milestone";
    case "reject_milestone":
      return "Reject Milestone";
    case "withdraw":
      return "Withdrawal";
    case "refund":
      return "Refund";
    default:
      return "Transaction";
  }
}
