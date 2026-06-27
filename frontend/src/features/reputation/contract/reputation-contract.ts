import { simulateReadOnlyCall, toScVal, parseScVal } from "@/shared/lib/stellar";
import { REPUTATION_CONTRACT_ID } from "@/shared/lib/constants";
import { StudentReputation, SponsorReputation } from "@/shared/types/reputation";

export class ReputationContract {
  static contractId = REPUTATION_CONTRACT_ID;

  // Retrieve student reputation from contract
  static async getStudentReputation(studentAddress: string): Promise<StudentReputation> {
    try {
      if (!this.contractId) throw new Error("REPUTATION_CONTRACT_ID is not configured");

      const resultScVal = await simulateReadOnlyCall(
        this.contractId,
        "get_student_reputation",
        [toScVal(studentAddress, "address")]
      );

      const native = parseScVal(resultScVal) as any;

      return {
        address: studentAddress,
        score: Number(native.score),
        projectsCompleted: Number(native.projects_completed),
        milestonesDelivered: Number(native.milestones_completed),
        onTimeDelivery: 100, // Placeholder/Calculated field
        totalFundsReceived: BigInt(native.total_funded_received),
        lastUpdated: Date.now(),
      };
    } catch (err) {
      console.warn("Reputation query unavailable. Falling back to 0. Error details:", err);
      return {
        address: studentAddress,
        score: 0,
        projectsCompleted: 0,
        milestonesDelivered: 0,
        onTimeDelivery: 100,
        totalFundsReceived: 0n,
        lastUpdated: Date.now(),
      };
    }
  }

  // Retrieve sponsor reputation from contract
  static async getSponsorReputation(sponsorAddress: string): Promise<SponsorReputation> {
    try {
      if (!this.contractId) throw new Error("REPUTATION_CONTRACT_ID is not configured");

      const resultScVal = await simulateReadOnlyCall(
        this.contractId,
        "get_sponsor_reputation",
        [toScVal(sponsorAddress, "address")]
      );

      const native = parseScVal(resultScVal) as any;

      return {
        address: sponsorAddress,
        score: Number(native.score),
        projectsFunded: Number(native.projects_sponsored),
        totalContributed: BigInt(native.total_contributed),
        milestonesReviewed: Number(native.contributions_count),
        avgResponseTime: 0, // Placeholder/Calculated field
        lastUpdated: Date.now(),
      };
    } catch (err) {
      console.warn("Reputation query unavailable. Falling back to 0. Error details:", err);
      return {
        address: sponsorAddress,
        score: 0,
        projectsFunded: 0,
        totalContributed: 0n,
        milestonesReviewed: 0,
        avgResponseTime: 0,
        lastUpdated: Date.now(),
      };
    }
  }
}
