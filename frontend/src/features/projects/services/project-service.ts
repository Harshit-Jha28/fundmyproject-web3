import { CoreRegistryContract } from "../contract/core-contract";
import { MilestoneContract } from "../contract/milestone-contract";
import { EscrowContract } from "../contract/escrow-contract";
import { Project } from "@/shared/types/project";
import { Milestone } from "@/shared/types/milestone";

export class ProjectService {
  // Fetch all projects sequentially/parallelly using get_project_count + get_project
  static async getAllProjects(): Promise<Project[]> {
    const count = await CoreRegistryContract.getProjectCount();
    const projects: Project[] = [];

    // Parallel fetch projects
    const promises = Array.from({ length: count }, (_, i) => this.getProjectDetails(i + 1));
    const results = await Promise.allSettled(promises);

    results.forEach((res) => {
      if (res.status === "fulfilled") {
        projects.push(res.value);
      }
    });

    // Sort newest first
    return projects.sort((a, b) => b.id - a.id);
  }

  // Fetch full details of a single project, joining core, escrow, and milestone info
  static async getProjectDetails(id: number): Promise<Project> {
    const baseProject = await CoreRegistryContract.getProject(id);
    
    // Resolve escrow details
    const totalEscrow = await EscrowContract.getProjectTotalEscrow(id);
    const totalReleased = await EscrowContract.getProjectReleased(id);
    
    // Resolve milestones
    const milestoneCount = await MilestoneContract.getMilestoneCount(id);
    const milestones = await MilestoneContract.getProjectMilestones(id);
    const completedMilestones = milestones.filter(m => m.status === "Approved").length;

    return {
      ...baseProject,
      currentFunding: totalEscrow + totalReleased, // Total XLM sponsored
      milestoneCount,
      completedMilestones,
      // Default placeholder deadline mapping
      deadline: baseProject.createdAt + (60 * 60 * 24 * 30), // 30 days deadline
    };
  }

  // Get milestones for a project
  static async getProjectMilestones(id: number): Promise<Milestone[]> {
    return MilestoneContract.getProjectMilestones(id);
  }
}
