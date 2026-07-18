import { useQuery } from "@tanstack/react-query";
import { TaskService } from "@/services/task.service";

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => TaskService.getTasks(projectId),
    enabled: !!projectId,
  });
}
