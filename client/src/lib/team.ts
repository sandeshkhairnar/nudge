// lib/team.ts
// ─── Team / Workspace Member management (Server Actions) ──────

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

type MemberRole = "owner" | "admin" | "member" | "viewer";

// ─── Get Workspace Members ────────────────────────────────────
export async function getWorkspaceMembers(workspaceId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspace_members")
    .select(`
      id,
      role,
      joined_at,
      profiles!workspace_members_user_id_fkey(id, full_name, email, avatar_url)
    `)
    .eq("workspace_id", workspaceId)
    .order("joined_at", { ascending: true });

  if (error) return { error: error.message };
  return { members: data ?? [] };
}

// ─── Invite Member by Email ───────────────────────────────────
// NOTE: This sends a "magic link" invite via Supabase Auth.
// The invited user signs up via the link and is then added.
// For a full invite flow you'd want a pending_invites table.
export async function inviteMember(workspaceId: string, email: string, role: MemberRole = "member") {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  // Check caller is owner/admin
  const { data: callerMembership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .single();

  if (!callerMembership || !["owner", "admin"].includes(callerMembership.role)) {
    return { error: "Insufficient permissions" };
  }

  // Look up user by email in profiles
  const { data: invitee } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (!invitee) {
    return { error: "User not found. They must sign up first." };
  }

  const { error } = await supabase
    .from("workspace_members")
    .insert({ workspace_id: workspaceId, user_id: invitee.id, role });

  if (error) return { error: error.message };

  revalidatePath("/space/team");
  return { success: true };
}

// ─── Update Member Role ───────────────────────────────────────
export async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  newRole: MemberRole
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("workspace_members")
    .update({ role: newRole })
    .eq("workspace_id", workspaceId)
    .eq("user_id", memberId);

  if (error) return { error: error.message };

  revalidatePath("/space/team");
  return { success: true };
}

// ─── Remove Member ────────────────────────────────────────────
export async function removeMember(workspaceId: string, memberId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", memberId);

  if (error) return { error: error.message };

  revalidatePath("/space/team");
  return { success: true };
}