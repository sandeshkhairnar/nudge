// lib/resources.ts
// ─── Resource CRUD (Server Actions) ───────────────────────────

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

// ─── Get Resources for Project (grouped by category) ─────────
export async function getProjectResources(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("project_id", projectId)
    .order("category", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };

  // Group by category
  const grouped = (data ?? []).reduce<Record<string, typeof data>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  return { resources: data ?? [], grouped };
}

// ─── Add Resource ─────────────────────────────────────────────
export async function addResource(data: {
  projectId: string;
  category: string;
  label: string;
  url?: string;
  emoji?: string;
  type?: "link" | "file" | "credential";
  file_name?: string;
  file_size?: number;
  metadata?: any;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const { data: resource, error } = await supabase
    .from("resources")
    .insert({
      project_id: data.projectId,
      category: data.category,
      label: data.label,
      url: data.url ?? null,
      emoji: data.emoji ?? (data.type === "file" ? "📁" : data.type === "credential" ? "🔑" : "📄"),
      type: data.type ?? "link",
      file_name: data.file_name ?? null,
      file_size: data.file_size ?? null,
      metadata: data.metadata ?? {},
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/space/${data.projectId}`);
  return { resource };
}

// ─── Delete Resource ──────────────────────────────────────────
export async function deleteResource(resourceId: string, projectId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", resourceId);

  if (error) return { error: error.message };

  revalidatePath(`/space/${projectId}`);
  return { success: true };
}

// ─── Update Resource ──────────────────────────────────────────
export async function updateResource(
  resourceId: string,
  updates: { label?: string; url?: string; category?: string; emoji?: string },
  projectId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("resources")
    .update(updates)
    .eq("id", resourceId);

  if (error) return { error: error.message };

  revalidatePath(`/space/${projectId}`);
  return { success: true };
}