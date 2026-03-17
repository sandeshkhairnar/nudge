"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export interface Integration {
  id: string;
  workspace_id: string;
  project_id: string;
  provider: string;
  repo_full_name: string | null;
  repo_id: number | null;
  access_token: string | null;
  webhook_secret: string | null;
  metadata: any;
  created_at: string;
}

export async function getProjectIntegrations(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("project_id", projectId);

  if (error) return { error: error.message };
  return { integrations: data as Integration[] };
}

export async function upsertGitHubIntegration(data: {
  workspaceId: string;
  projectId: string;
  repoFullName: string;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("integrations")
    .select("id")
    .eq("project_id", data.projectId)
    .eq("provider", "github")
    .single();

  if (existing) {
    const { error } = await supabase
      .from("integrations")
      .update({
        repo_full_name: data.repoFullName,
        workspace_id: data.workspaceId,
      })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("integrations")
      .insert({
        workspace_id: data.workspaceId,
        project_id: data.projectId,
        provider: "github",
        repo_full_name: data.repoFullName,
      });
    if (error) return { error: error.message };
  }

  revalidatePath(`/space/${data.projectId}`);
  return { success: true };
}

export async function deleteIntegration(id: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("integrations")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/space/${projectId}`);
  return { success: true };
}
