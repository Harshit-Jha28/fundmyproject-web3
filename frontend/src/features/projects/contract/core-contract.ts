import * as StellarSdk from "@stellar/stellar-sdk";
import { simulateReadOnlyCall, invokeContract, toScVal, parseScVal } from "@/shared/lib/stellar";
import { CORE_CONTRACT_ID } from "@/shared/lib/constants";
import { Project, ProjectStatus } from "@/shared/types/project";

// Maps u32 Rust enum values to frontend ProjectStatus
export function mapStatus(statusVal: number): ProjectStatus {
  switch (statusVal) {
    case 0:
      return ProjectStatus.Active; // Treat Draft/Active as active or map appropriately
    case 1:
      return ProjectStatus.Active;
    case 2:
      return ProjectStatus.FullyFunded;
    case 3:
      return ProjectStatus.Completed;
    case 4:
      return ProjectStatus.Cancelled;
    default:
      return ProjectStatus.Active;
  }
}

export interface CoreProjectResponse {
  id: bigint;
  student: string;
  title: string;
  description: string;
  category: string;
  funding_goal: bigint;
  total_sponsored: bigint;
  status: number;
  created_at: bigint;
}

export class CoreRegistryContract {
  static contractId = CORE_CONTRACT_ID;

  // Retrieve a project from the registry contract
  static async getProject(id: number): Promise<Project> {
    if (!this.contractId) throw new Error("CORE_CONTRACT_ID is not configured");

    const resultScVal = await simulateReadOnlyCall(
      this.contractId,
      "get_project",
      [toScVal(id, "u64")]
    );

    // Parse the parsed native object. In Soroban, struct parses to a Javascript object.
    const native = parseScVal(resultScVal) as any;
    
    // Map fields
    return {
      id: Number(native.id),
      student: native.student,
      title: native.title,
      description: native.description,
      category: native.category,
      fundingGoal: native.funding_goal,
      currentFunding: native.total_sponsored,
      deadline: 0, // Not explicitly tracked in contract yet, can default
      status: mapStatus(native.status),
      milestoneCount: 0, // Resolved at service level
      completedMilestones: 0, // Resolved at service level
      sponsorCount: 0,
      createdAt: Number(native.created_at),
    };
  }

  // Retrieve total count of projects from registry contract
  static async getProjectCount(): Promise<number> {
    if (!this.contractId) return 0;

    try {
      const resultScVal = await simulateReadOnlyCall(
        this.contractId,
        "get_project_count",
        []
      );
      return Number(parseScVal(resultScVal));
    } catch {
      return 0;
    }
  }

  // Build transaction to create a project
  static async createProjectTx(
    sourceAddress: string,
    title: string,
    description: string,
    category: string,
    fundingGoal: bigint
  ): Promise<StellarSdk.Transaction> {
    if (!this.contractId) throw new Error("CORE_CONTRACT_ID is not configured");

    return invokeContract(sourceAddress, this.contractId, "create_project", [
      toScVal(sourceAddress, "address"),
      toScVal(title, "string"),
      toScVal(description, "string"),
      toScVal(category, "string"),
      toScVal(fundingGoal, "i128"),
    ]);
  }

  // Build transaction to update a project (Draft only)
  static async updateProjectTx(
    sourceAddress: string,
    id: number,
    title: string,
    description: string,
    category: string,
    fundingGoal: bigint
  ): Promise<StellarSdk.Transaction> {
    if (!this.contractId) throw new Error("CORE_CONTRACT_ID is not configured");

    return invokeContract(sourceAddress, this.contractId, "update_project", [
      toScVal(sourceAddress, "address"),
      toScVal(id, "u64"),
      toScVal(title, "string"),
      toScVal(description, "string"),
      toScVal(category, "string"),
      toScVal(fundingGoal, "i128"),
    ]);
  }

  // Build transaction to update status
  static async updateProjectStatusTx(
    sourceAddress: string,
    id: number,
    statusVal: number
  ): Promise<StellarSdk.Transaction> {
    if (!this.contractId) throw new Error("CORE_CONTRACT_ID is not configured");

    return invokeContract(sourceAddress, this.contractId, "update_project_status", [
      toScVal(sourceAddress, "address"),
      toScVal(id, "u64"),
      toScVal(statusVal, "u32"),
    ]);
  }
}
