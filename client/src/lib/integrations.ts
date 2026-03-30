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

/* ── Read ────────────────────────────────────────────────── */

export async function getProjectIntegrations(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("project_id", projectId);

  if (error) return { integrations: [] as Integration[], error: error.message };
  return { integrations: data as Integration[], error: null };
}

/* ── GitHub Account OAuth save ──────────────────────────── */

/**
 * Called from the OAuth callback to upsert the github_account row with
 * the access_token and GitHub user metadata.
 */
export async function saveGithubAccount(data: {
  workspaceId: string;
  projectId: string;
  accessToken: string;
  githubLogin: string;
  githubId: number;
  githubAvatarUrl: string;
  githubName: string | null;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  // Check for existing github_account row for this project
  const { data: existing } = await supabase
    .from("integrations")
    .select("id")
    .eq("project_id", data.projectId)
    .eq("provider", "github_account")
    .maybeSingle();

  const payload = {
    access_token: data.accessToken,
    metadata: {
      github_login:      data.githubLogin,
      github_id:         data.githubId,
      github_avatar_url: data.githubAvatarUrl,
      github_name:       data.githubName,
    },
  };

  if (existing) {
    const { error } = await supabase
      .from("integrations")
      .update(payload)
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("integrations").insert({
      workspace_id:   data.workspaceId,
      project_id:     data.projectId,
      provider:       "github_account",
      repo_full_name: null,
      ...payload,
    });
    if (error) return { error: error.message };
  }

  revalidatePath(`/space/${data.projectId}`);
  return { success: true };
}

/* ── Connect a specific repo (uses account token) ────────── */

export async function connectRepoToProject(data: {
  workspaceId: string;
  projectId: string;
  repoFullName: string;
  repoId?: number;
  accessToken: string;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  // Enforce single repo per project — remove any existing github integration
  await supabase
    .from("integrations")
    .delete()
    .eq("project_id", data.projectId)
    .eq("provider", "github");

  const { error } = await supabase.from("integrations").insert({
    workspace_id:   data.workspaceId,
    project_id:     data.projectId,
    provider:       "github",
    repo_full_name: data.repoFullName,
    repo_id:        data.repoId ?? null,
    access_token:   data.accessToken || null,
    metadata:       {},
  });

  if (error) return { error: error.message };
  revalidatePath(`/space/${data.projectId}`);
  return { success: true };
}

/* ── Legacy: manual repo connect (still supported) ──────── */

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
    .eq("repo_full_name", data.repoFullName)
    .maybeSingle();

  if (existing) return { error: "Repository already connected" };

  const { error } = await supabase.from("integrations").insert({
    workspace_id:   data.workspaceId,
    project_id:     data.projectId,
    provider:       "github",
    repo_full_name: data.repoFullName,
  });

  if (error) return { error: error.message };
  revalidatePath(`/space/${data.projectId}`);
  return { success: true };
}

/* ── Delete ─────────────────────────────────────────────── */

export async function deleteIntegration(id: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("integrations").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/space/${projectId}`);
  return { success: true };
}
