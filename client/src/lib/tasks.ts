// lib/tasks.ts
// ─── Task CRUD (Server Actions) ───────────────────────────────

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

type TaskStatus = "todo" | "in_progress" | "review" | "done";

import { CreateTaskSchema, type CreateTaskInput } from "@/lib/validations/task.schema";

// ─── Create Task ─────────────────────────────────────────────
export async function createTask(rawData: unknown) {
  const parsed = CreateTaskSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: "Validation Error", details: parsed.error.flatten() };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      project_id: data.projectId,
      title: data.title,
      description: data.description ?? null,
      status: data.status,
      type: data.type,
      assignee_id: data.assigneeId ?? null,
      due_date: data.dueDate ?? null,
      priority: data.priority,
      created_by: user.id,
    })
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url)
    `)
    .single();

  if (error) return { error: error.message };

  const { data: allTasks } = await supabase.from("tasks").select("status").eq("project_id", data.projectId);
  if (allTasks) {
    const total = allTasks.length;
    const done = allTasks.filter(t => t.status === "done").length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    await supabase.from("projects").update({ progress }).eq("id", data.projectId);
  }

  revalidatePath(`/space/${data.projectId}`);
  return { task };
}

// ─── Create Subtask ──────────────────────────────────────────
export async function createSubtask(data: {
  projectId: string; // for revalidation
  parentTaskId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  type?: string;
  assigneeId?: string;
  dueDate?: string;
  priority?: string;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const { data: task, error } = await supabase
    .from("subtasks")
    .insert({
      parent_task_id: data.parentTaskId,
      title: data.title,
      description: data.description ?? null,
      status: data.status ?? "todo",
      type: data.type ?? "task",
      assignee_id: data.assigneeId ?? null,
      due_date: data.dueDate ?? null,
      priority: data.priority ?? "medium",
    })
    .select(`
      *,
      assignee:profiles!subtasks_assignee_id_fkey(id, full_name, avatar_url)
    `)
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/space/${data.projectId}`);
  return { task };
}

// ─── Bulk Create Magic Tasks ───────────────────────────────
export async function createMagicTasksBulk(projectId: string, extractedTasks: any[]) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const parentTasksToInsert = [];
  const subtasksToInsert = [];
  
  const firstTaskId = crypto.randomUUID();
  let isFirst = true;
  let firstIdToReturn = null;

  for (const task of extractedTasks) {
    if (!task.title?.trim()) continue;
    
    const taskId = isFirst ? firstTaskId : crypto.randomUUID();
    if (isFirst) {
      firstIdToReturn = taskId;
      isFirst = false;
    }

    parentTasksToInsert.push({
      id: taskId,
      project_id: projectId,
      title: task.title.trim(),
      description: task.description ?? null,
      status: "todo",
      type: task.type ?? "task",
      assignee_id: task.assigneeId ?? null,
      due_date: task.due_date ?? task.dueDate ?? null,
      priority: task.priority ?? "medium",
      created_by: user.id,
    });

    if (task.subtasks && Array.isArray(task.subtasks)) {
      for (const st of task.subtasks) {
        if (!st.title?.trim()) continue;
        subtasksToInsert.push({
          id: crypto.randomUUID(),
          parent_task_id: taskId,
          title: st.title.trim(),
          description: st.description ?? null,
          status: "todo",
          type: "task",
          assignee_id: st.assigneeId ?? null,
          due_date: st.due_date ?? st.dueDate ?? null,
          priority: st.priority ?? "medium",
        });
      }
    }
  }

  if (parentTasksToInsert.length > 0) {
    const { error: pError } = await supabase.from("tasks").insert(parentTasksToInsert);
    if (pError) return { error: pError.message };
  }

  if (subtasksToInsert.length > 0) {
    const { error: sError } = await supabase.from("subtasks").insert(subtasksToInsert);
    if (sError) return { error: sError.message };
  }

  revalidatePath(`/space/${projectId}`);
  return { success: true, firstTaskId: firstIdToReturn };
}

// ─── Get Tasks for Project ────────────────────────────────────
export async function getProjectTasks(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url),
      created_by_profile:profiles!tasks_created_by_fkey(id, full_name),
      subtasks(*, assignee:profiles!subtasks_assignee_id_fkey(id, full_name, avatar_url), attachments:task_attachments(*), task_resources(resources(*))),
      attachments:task_attachments(*),
      task_resources(resources(*))
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
    type?: string;
    assignee_id?: string | null;
    due_date?: string | null;
    priority?: string;
  },
  projectId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId);

  if (error) return { error: error.message };

  if (updates.status) {
    const { data: allTasks } = await supabase.from("tasks").select("status").eq("project_id", projectId);
    if (allTasks) {
      const total = allTasks.length;
      const done = allTasks.filter(t => t.status === "done").length;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      await supabase.from("projects").update({ progress }).eq("id", projectId);
    }
  }

  revalidatePath(`/space/${projectId}`);
  return { success: true };
}

// ─── Update Subtask ───────────────────────────────────────────
export async function updateSubtask(
  subtaskId: string,
  updates: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    type?: string;
    assignee_id?: string | null;
    due_date?: string | null;
    priority?: string;
  },
  projectId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("subtasks")
    .update(updates)
    .eq("id", subtaskId);

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

  const { data: allTasks } = await supabase.from("tasks").select("status").eq("project_id", projectId);
  if (allTasks) {
    const total = allTasks.length;
    const done = allTasks.filter(t => t.status === "done").length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    await supabase.from("projects").update({ progress }).eq("id", projectId);
  }

  revalidatePath(`/space/${projectId}`);
  return { success: true };
}

// ─── Delete Subtask ───────────────────────────────────────────
export async function deleteSubtask(subtaskId: string, projectId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("subtasks")
    .delete()
    .eq("id", subtaskId);

  if (error) return { error: error.message };

  revalidatePath(`/space/${projectId}`);
  return { success: true };
}

// ─── Attachments ──────────────────────────────────────────────

export async function uploadTaskAttachment(formData: FormData) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file") as File;
  const targetId = formData.get("id") as string;
  const targetType = formData.get("type") as "task" | "subtask";
  const projectId = formData.get("projectId") as string;

  if (!file || !targetId || !targetType) return { error: "Missing file or target fields" };

  const ext = file.name.split(".").pop();
  const path = `${targetId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from("task-attachments")
    .upload(path, file, { contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage
    .from("task-attachments")
    .getPublicUrl(path);

  // Insert DB record
  const { data: attachment, error: dbError } = await supabase
    .from("task_attachments")
    .insert({
      task_id: targetType === "task" ? targetId : null,
      subtask_id: targetType === "subtask" ? targetId : null,
      uploaded_by: user.id,
      file_name: file.name,
      file_url: publicUrl,
      file_type: file.type,
      file_size: file.size
    })
    .select()
    .single();

  if (dbError) return { error: dbError.message };

  if (projectId) revalidatePath(`/space/${projectId}`);
  return { attachment };
}

export async function deleteTaskAttachment(attachmentId: string, projectId: string) {
  const supabase = await createClient();

  const { data: attachment } = await supabase
    .from("task_attachments")
    .select("file_url")
    .eq("id", attachmentId)
    .single();
    
  if (attachment) {
    const urlParts = attachment.file_url.split("/task-attachments/");
    if (urlParts.length > 1) {
      const path = urlParts[1];
      await supabase.storage.from("task-attachments").remove([path]);
    }
  }

  const { error } = await supabase
    .from("task_attachments")
    .delete()
    .eq("id", attachmentId);

  if (error) return { error: error.message };

  revalidatePath(`/space/${projectId}`);
  return { success: true };
}

// ─── Task Resources (Linking) ─────────────────────────────────

export async function linkTaskResource(targetType: "task" | "subtask", targetId: string, resourceId: string, projectId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("task_resources")
    .insert({ 
      task_id: targetType === "task" ? targetId : null,
      subtask_id: targetType === "subtask" ? targetId : null,
      resource_id: resourceId 
    });

  if (error) return { error: error.message };

  revalidatePath(`/space/${projectId}`);
  return { success: true };
}

export async function unlinkTaskResource(targetType: "task" | "subtask", targetId: string, resourceId: string, projectId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("task_resources")
    .delete()
    .eq(targetType === "task" ? "task_id" : "subtask_id", targetId)
    .eq("resource_id", resourceId);

  if (error) return { error: error.message };

  revalidatePath(`/space/${projectId}`);
  return { success: true };
}