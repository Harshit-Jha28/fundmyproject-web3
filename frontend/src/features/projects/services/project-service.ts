import { CoreRegistryContract } from "../contract/core-contract";
import { MilestoneContract } from "../contract/milestone-contract";
import { EscrowContract } from "../contract/escrow-contract";
import { Project } from "@/shared/types/project";
import { Milestone } from "@/shared/types/milestone";

export class ProjectService {
  static async getAllProjects(): Promise<Project[]> {
    const count = Number(await CoreRegistryContract.getProjectCount());

    console.log("PROJECT COUNT:", count);

    const projects: Project[] = [];

    for (let i = 1; i <= count; i++) {
      try {
        console.log("Fetching project ID:", i);

        const project = await this.getProjectDetails(i);

        console.log("Fetched project:", project);

        projects.push(project);
      } catch (err) {
        console.error(`PROJECT FETCH FAILED (${i}):`, err);
      }
    }

    return projects.sort((a, b) => b.id - a.id);
  }

  // Fetch full details of a single project, joining core, escrow, and milestone info
  static async getProjectDetails(id: number): Promise<Project> {
    const baseProject = await CoreRegistryContract.getProject(id);

    const totalEscrow = await EscrowContract.getProjectTotalEscrow(id);
    const totalReleased = await EscrowContract.getProjectReleased(id);

    const milestoneCount = await MilestoneContract.getMilestoneCount(id);
    const milestones = await MilestoneContract.getProjectMilestones(id);
    const completedMilestones =
      milestones.filter((m) => m.status === "Approved").length;

    return {
      ...baseProject,
      currentFunding: totalEscrow + totalReleased,
      milestoneCount,
      completedMilestones,
      deadline: baseProject.createdAt + 60 * 60 * 24 * 30,
    };
  }

  static async getProjectMilestones(id: number): Promise<Milestone[]> {
    return MilestoneContract.getProjectMilestones(id);
  }
}