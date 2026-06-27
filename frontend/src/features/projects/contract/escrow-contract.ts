import * as StellarSdk from "@stellar/stellar-sdk";
import { simulateReadOnlyCall, invokeContract, toScVal, parseScVal } from "@/shared/lib/stellar";
import { ESCROW_CONTRACT_ID } from "@/shared/lib/constants";

export class EscrowContract {
  static contractId = ESCROW_CONTRACT_ID;

  // Retrieve current locked funds in escrow for a project
  static async getProjectTotalEscrow(projectId: number): Promise<bigint> {
    if (!this.contractId) return 0n;

    try {
      const resultScVal = await simulateReadOnlyCall(
        this.contractId,
        "get_project_total_escrow",
        [toScVal(projectId, "u64")]
      );
      return BigInt(parseScVal(resultScVal) as any);
    } catch {
      return 0n;
    }
  }

  // Retrieve amount already released to the student
  static async getProjectReleased(projectId: number): Promise<bigint> {
    if (!this.contractId) return 0n;

    try {
      const resultScVal = await simulateReadOnlyCall(
        this.contractId,
        "get_project_released",
        [toScVal(projectId, "u64")]
      );
      return BigInt(parseScVal(resultScVal) as any);
    } catch {
      return 0n;
    }
  }

  // Retrieve how much a specific sponsor has contributed to a project
  static async getSponsorship(projectId: number, sponsor: string): Promise<bigint> {
    if (!this.contractId) return 0n;

    try {
      const resultScVal = await simulateReadOnlyCall(
        this.contractId,
        "get_sponsorship",
        [toScVal(projectId, "u64"), toScVal(sponsor, "address")]
      );
      return BigInt(parseScVal(resultScVal) as any);
    } catch {
      return 0n;
    }
  }

  // Build transaction to sponsor a project
  static async sponsorProjectTx(
    sponsorAddress: string,
    projectId: number,
    amount: bigint
  ): Promise<StellarSdk.Transaction> {
    if (!this.contractId) throw new Error("ESCROW_CONTRACT_ID is not configured");

    return invokeContract(sponsorAddress, this.contractId, "sponsor_project", [
      toScVal(sponsorAddress, "address"),
      toScVal(projectId, "u64"),
      toScVal(amount, "i128"),
    ]);
  }

  // Build transaction to claim a refund
  static async refundSponsorTx(
    sponsorAddress: string,
    projectId: number
  ): Promise<StellarSdk.Transaction> {
    if (!this.contractId) throw new Error("ESCROW_CONTRACT_ID is not configured");

    return invokeContract(sponsorAddress, this.contractId, "refund_sponsor", [
      toScVal(sponsorAddress, "address"),
      toScVal(projectId, "u64"),
    ]);
  }
}
