// lib/projects.ts
// ─── Project CRUD (Server Actions) ────────────────────────────

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

// ─── Create Project ───────────────────────────────────────────
export async function createProject(data: {
  workspaceId: string;
  name: string;
  description?: string;
  color?: string;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      workspace_id: data.workspaceId,
      name: data.name,
      description: data.description ?? null,
      color: data.color ?? "#36C5F0",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/space");
  return { project };
}

// ─── Get Projects for Workspace ───────────────────────────────
export async function getWorkspaceProjects(workspaceId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      created_by_profile:profiles!projects_created_by_fkey(id, full_name, avatar_url),
      tasks(count)
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  return { projects: data };
}

// ─── Get Single Project ───────────────────────────────────────
export async function getProject(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) return { error: error.message };
  return { project: data };
}

// ─── Update Project ───────────────────────────────────────────
export async function updateProject(
  projectId: string,
  updates: { name?: string; description?: string; color?: string; progress?: number }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath(`/space/${projectId}`);
  return { success: true };
}

// ─── Delete Project ───────────────────────────────────────────
export async function deleteProject(projectId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath("/space");
  return { success: true };
}