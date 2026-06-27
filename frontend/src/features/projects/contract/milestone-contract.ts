import * as StellarSdk from "@stellar/stellar-sdk";
import { simulateReadOnlyCall, invokeContract, toScVal, parseScVal } from "@/shared/lib/stellar";
import { MILESTONE_CONTRACT_ID } from "@/shared/lib/constants";
import { Milestone, MilestoneStatus } from "@/shared/types/milestone";

export function mapMilestoneStatus(statusVal: number): MilestoneStatus {
  switch (statusVal) {
    case 0:
      return MilestoneStatus.Pending;
    case 1:
      return MilestoneStatus.Submitted;
    case 2:
      return MilestoneStatus.Approved;
    case 3:
      return MilestoneStatus.Rejected;
    default:
      return MilestoneStatus.Pending;
  }
}

export class MilestoneContract {
  static contractId = MILESTONE_CONTRACT_ID;

  // Retrieve total count of milestones for a project
  static async getMilestoneCount(projectId: number): Promise<number> {
    if (!this.contractId) return 0;

    try {
      const resultScVal = await simulateReadOnlyCall(
        this.contractId,
        "get_milestone_count",
        [toScVal(projectId, "u64")]
      );
      return Number(parseScVal(resultScVal));
    } catch {
      return 0;
    }
  }

  // Retrieve a single milestone's details
  static async getMilestone(projectId: number, index: number): Promise<Milestone> {
    if (!this.contractId) throw new Error("MILESTONE_CONTRACT_ID is not configured");

    const resultScVal = await simulateReadOnlyCall(
      this.contractId,
      "get_milestone",
      [toScVal(projectId, "u64"), toScVal(index, "u32")]
    );

    const native = parseScVal(resultScVal) as any;

    return {
      id: index,
      projectId,
      description: native.description,
      status: mapMilestoneStatus(native.status),
      proofUrl: native.proof_url || undefined,
      fundsReleased: native.amount,
      approvedAt: native.approved_at ? Number(native.approved_at) : undefined,
    };
  }

  // Retrieve all milestones for a project
  static async getProjectMilestones(projectId: number): Promise<Milestone[]> {
    const count = await this.getMilestoneCount(projectId);
    const milestones: Milestone[] = [];
    for (let i = 0; i < count; i++) {
      try {
        const ms = await this.getMilestone(projectId, i);
        milestones.push(ms);
      } catch (err) {
        console.error(`Error loading milestone ${i} for project ${projectId}:`, err);
      }
    }
    return milestones;
  }

  // Build transaction to add a milestone
  static async addMilestoneTx(
    studentAddress: string,
    projectId: number,
    title: string,
    description: string,
    amount: bigint,
    reviewerAddress: string
  ): Promise<StellarSdk.Transaction> {
    if (!this.contractId) throw new Error("MILESTONE_CONTRACT_ID is not configured");

    return invokeContract(studentAddress, this.contractId, "add_milestone", [
      toScVal(studentAddress, "address"),
      toScVal(projectId, "u64"),
      toScVal(title, "string"),
      toScVal(description, "string"),
      toScVal(amount, "i128"),
      toScVal(reviewerAddress, "address"),
    ]);
  }

  // Build transaction to submit milestone proof
  static async submitMilestoneTx(
    studentAddress: string,
    projectId: number,
    index: number,
    proofUrl: string
  ): Promise<StellarSdk.Transaction> {
    if (!this.contractId) throw new Error("MILESTONE_CONTRACT_ID is not configured");

    return invokeContract(studentAddress, this.contractId, "submit_milestone", [
      toScVal(studentAddress, "address"),
      toScVal(projectId, "u64"),
      toScVal(index, "u32"),
      toScVal(proofUrl, "string"),
    ]);
  }

  // Build transaction to review (approve/reject) a milestone
  static async reviewMilestoneTx(
    reviewerAddress: string,
    projectId: number,
    index: number,
    approved: boolean
  ): Promise<StellarSdk.Transaction> {
    if (!this.contractId) throw new Error("MILESTONE_CONTRACT_ID is not configured");

    return invokeContract(reviewerAddress, this.contractId, "review_milestone", [
      toScVal(reviewerAddress, "address"),
      toScVal(projectId, "u64"),
      toScVal(index, "u32"),
      toScVal(approved, "bool"),
    ]);
  }
}
