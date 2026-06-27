import { useQuery } from "@tanstack/react-query";
import { ProjectService } from "../services/project-service";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => ProjectService.getAllProjects(),
    refetchInterval: 15000, // Poll every 15s
  });
}

export function useProjectDetails(id: number) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => ProjectService.getProjectDetails(id),
    enabled: !isNaN(id) && id > 0,
    refetchInterval: 10000, // Poll details every 10s
  });
}

export function useProjectMilestones(id: number) {
  return useQuery({
    queryKey: ["project-milestones", id],
    queryFn: () => ProjectService.getProjectMilestones(id),
    enabled: !isNaN(id) && id > 0,
    refetchInterval: 10000,
  });
}
