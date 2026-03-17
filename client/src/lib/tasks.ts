// lib/tasks.ts
// ─── Task CRUD (Server Actions) ───────────────────────────────

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

type TaskStatus = "todo" | "in_progress" | "review" | "done";

// ─── Create Task ─────────────────────────────────────────────
export async function createTask(data: {
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  assigneeId?: string;
  dueDate?: string;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      project_id: data.projectId,
      title: data.title,
      description: data.description ?? null,
      status: data.status ?? "todo",
      assignee_id: data.assigneeId ?? null,
      due_date: data.dueDate ?? null,
      created_by: user.id,
    })
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url)
    `)
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/space/${data.projectId}`);
  return { task };
}

// ─── Get Tasks for Project ────────────────────────────────────
export async function getProjectTasks(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url),
      created_by_profile:profiles!tasks_created_by_fkey(id, full_name)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  return { tasks: data ?? [] };
}

// ─── Update Task ──────────────────────────────────────────────
export async function updateTask(
  taskId: string,
  updates: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    assignee_id?: string | null;
    due_date?: string | null;
  },
  projectId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId);

  if (error) return { error: error.message };

  revalidatePath(`/space/${projectId}`);
  return { success: true };
}

// ─── Delete Task ──────────────────────────────────────────────
export async function deleteTask(taskId: string, projectId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId);

  if (error) return { error: error.message };

  revalidatePath(`/space/${projectId}`);
  return { success: true };
}