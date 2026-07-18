import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TaskService } from "@/services/task.service";

export function useUpdateTaskStatus(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) => 
      TaskService.updateTaskStatus(taskId, status),
    onMutate: async ({ taskId, status }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(["tasks", projectId]);

      // Optimistically update to the new value
      queryClient.setQueryData(["tasks", projectId], (old: any[]) => {
        if (!old) return old;
        return old.map((t) => 
          t.id === taskId ? { ...t, status } : t
        );
      });

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(["tasks", projectId], context?.previousTasks);
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
