import { createClient } from "@/lib/supabase/client";

export class TaskService {
  static async getTasks(projectId: string) {
    if (!projectId) return [];
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("*,assignee:profiles!tasks_assignee_id_fkey(id,full_name,avatar_url,email),projects!tasks_project_id_fkey(id,name,color),attachments:task_attachments(*),task_resources(resources(*)),subtasks(*, assignee:profiles!subtasks_assignee_id_fkey(id, full_name, avatar_url, email), attachments:task_attachments(*), task_resources(resources(*)))")
      .eq("project_id", projectId)
      .order("created_at");

    if (error) throw new Error(error.message);
    return data || [];
  }

  static async updateTaskStatus(taskId: string, newStatus: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (data && data.project_id) {
      const { data: allTasks } = await supabase.from("tasks").select("status").eq("project_id", data.project_id);
      if (allTasks) {
        const total = allTasks.length;
        const done = allTasks.filter(t => t.status === "done").length;
        const progress = total > 0 ? Math.round((done / total) * 100) : 0;
        await supabase.from("projects").update({ progress }).eq("id", data.project_id);
      }
    }

    return data;
  }
}
