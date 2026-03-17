"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
import { getCurrentUser } from "@/lib/auth";
import { sendInviteEmail } from "@/lib/mailer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function inviteProjectMember(
  projectId: string,
  email: string,
  role: "admin" | "member" | "viewer" = "member"
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const { data: project } = await supabase
    .from("projects")
    .select("id, workspace_id, name")
    .eq("id", projectId)
    .single();

  if (!project) return { error: "Project not found" };

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("owner_id, name")
    .eq("id", project.workspace_id)
    .single();

  const isOwner = workspace?.owner_id === user.id;

  const { data: callerMembership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  const isAdmin = callerMembership?.role === "admin";

  if (!isOwner && !isAdmin) return { error: "Only owners and admins can invite members" };

  const normalizedEmail = email.toLowerCase().trim();

  const { data: existing } = await supabase
    .from("invitations")
    .select("id")
    .eq("project_id", projectId)
    .eq("invitee_email", normalizedEmail)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) return { error: "An invitation is already pending for this email" };

  // Look up the invitee by email — must NOT be the current user
  const { data: invitee } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .neq("id", user.id)   // ← prevent inviting yourself
    .maybeSingle();

  const { data: inviterProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: invitation, error: invErr } = await supabase
    .from("invitations")
    .insert({
      workspace_id: project.workspace_id,
      project_id: projectId,
      inviter_id: user.id,
      invitee_email: normalizedEmail,
      invitee_id: invitee?.id ?? null,   // null if they don't have an account yet
      role,
    })
    .select("id")
    .single();

  if (invErr) return { error: invErr.message };

  const hasAccount = !!invitee?.id;

  const inviteUrl = hasAccount
    ? `${APP_URL}/space/inbox?invite=${invitation.id}`
    : `${APP_URL}/get-started?invite=${invitation.id}&email=${encodeURIComponent(normalizedEmail)}`;

  try {
    await sendInviteEmail({
      to: normalizedEmail,
      inviterName: inviterProfile?.full_name ?? "A teammate",
      workspaceName: workspace?.name ?? "your workspace",
      projectName: project.name,
      role,
      inviteUrl,
      hasAccount,
    });
  } catch (emailErr) {
    console.error("Failed to send invite email:", emailErr);
  }

  return { invitationId: invitation.id, sent: true, hasAccount };
}

export async function acceptInvitation(invitationId: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const { data: userProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  const { data: invitation, error: fetchErr } = await supabase
    .from("invitations")
    .select("*")
    .eq("id", invitationId)
    .eq("status", "pending")
    .single();

  if (fetchErr || !invitation) return { error: "Invitation not found or already used" };

  const emailMatch =
    invitation.invitee_email === userProfile?.email?.toLowerCase().trim();
  const idMatch = invitation.invitee_id === user.id;

  if (!emailMatch && !idMatch) return { error: "This invitation is not for you" };

  if (new Date(invitation.expires_at) < new Date()) {
    await supabase.from("invitations").update({ status: "declined" }).eq("id", invitationId);
    return { error: "Invitation has expired" };
  }

  // Use service role to bypass RLS — the invitation itself is the auth proof
  const admin = getAdminClient();

  const { error: wsError } = await admin
    .from("workspace_members")
    .upsert(
      { workspace_id: invitation.workspace_id, user_id: user.id, role: invitation.role },
      { onConflict: "workspace_id,user_id", ignoreDuplicates: true }
    );

  if (wsError) return { error: wsError.message };

  if (invitation.project_id) {
    const { error: pmError } = await admin
      .from("project_members")
      .upsert(
        { project_id: invitation.project_id, user_id: user.id, role: invitation.role },
        { onConflict: "project_id,user_id" }
      );
    if (pmError) return { error: pmError.message };
  }

  await admin
    .from("invitations")
    .update({ status: "accepted", invitee_id: user.id })
    .eq("id", invitationId);

  if (invitation.project_id) revalidatePath(`/space/${invitation.project_id}`);
  revalidatePath("/space/inbox");

  return { success: true, projectId: invitation.project_id };
}

export async function declineInvitation(invitationId: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const { data: userProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  const { data: invitation } = await supabase
    .from("invitations")
    .select("invitee_email, invitee_id, status")
    .eq("id", invitationId)
    .single();

  if (!invitation) return { error: "Invitation not found" };

  const emailMatch =
    invitation.invitee_email === userProfile?.email?.toLowerCase().trim();
  const idMatch = invitation.invitee_id === user.id;

  if (!emailMatch && !idMatch) return { error: "This invitation is not for you" };

  await supabase.from("invitations").update({ status: "declined" }).eq("id", invitationId);

  revalidatePath("/space/inbox");
  return { success: true };
}

export async function getInvitationByToken(invitationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invitations")
    .select(`
      id, role, status, invitee_email, expires_at, created_at,
      workspaces:workspace_id(id, name, slug),
      projects:project_id(id, name, color),
      profiles!invitations_inviter_id_fkey(id, full_name, email, avatar_url)
    `)
    .eq("id", invitationId)
    .single();

  if (error || !data) return { error: "Invitation not found" };
  if (data.status !== "pending") return { error: `Invitation already ${data.status}` };
  if (new Date(data.expires_at) < new Date()) return { error: "Invitation has expired" };

  const invitation = {
    ...data,
    workspaces: Array.isArray(data.workspaces) ? data.workspaces[0] ?? null : data.workspaces,
    projects: Array.isArray(data.projects) ? data.projects[0] ?? null : data.projects,
    profiles: Array.isArray(data.profiles) ? data.profiles[0] ?? null : data.profiles,
  };

  return { invitation };
}

export async function getPendingInvitations(userId: string) {
  const supabase = await createClient();
  // Use admin client so RLS on workspaces/projects never silently returns null
  const admin = getAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  if (!profile) return { invitations: [] };

  const normalizedEmail = profile.email.toLowerCase().trim();

  // Step 1: fetch the raw invitations (no joins — avoid ambiguous FK resolution)
  const { data: rows, error } = await supabase
    .from("invitations")
    .select("id, role, created_at, expires_at, invitee_email, workspace_id, project_id, inviter_id")
    .eq("status", "pending")
    .or(`invitee_email.eq.${normalizedEmail},invitee_id.eq.${userId}`)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getPendingInvitations error:", error);
    return { error: error.message };
  }

  if (!rows || rows.length === 0) return { invitations: [] };

  // Step 2: collect unique IDs for batch lookups
  const workspaceIds = [...new Set(rows.map((r: any) => r.workspace_id).filter(Boolean))];
  const projectIds   = [...new Set(rows.map((r: any) => r.project_id).filter(Boolean))];
  const inviterIds   = [...new Set(rows.map((r: any) => r.inviter_id).filter(Boolean))];

  // Step 3: batch fetch related records using admin client (bypasses RLS)
  const [{ data: workspaces }, { data: projects }, { data: profiles }] = await Promise.all([
    admin.from("workspaces").select("id, name, slug").in("id", workspaceIds),
    admin.from("projects").select("id, name, color").in("id", projectIds),
    admin.from("profiles").select("id, full_name, email, avatar_url").in("id", inviterIds),
  ]);

  // Step 4: build lookup maps
  const wsMap  = Object.fromEntries((workspaces ?? []).map((w: any) => [w.id, w]));
  const prMap  = Object.fromEntries((projects   ?? []).map((p: any) => [p.id, p]));
  const prfMap = Object.fromEntries((profiles   ?? []).map((p: any) => [p.id, p]));

  // Step 5: hydrate
  const invitations = rows.map((r: any) => ({
    id:            r.id,
    role:          r.role,
    created_at:    r.created_at,
    expires_at:    r.expires_at,
    invitee_email: r.invitee_email,
    workspaces:    wsMap[r.workspace_id]  ?? null,
    projects:      prMap[r.project_id]    ?? null,
    profiles:      prfMap[r.inviter_id]   ?? null,
  }));

  console.log("Fetched invitations:", invitations);
  return { invitations };
}

export async function getProjectMembers(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_members")
    .select(`
      id, role, joined_at,
      profiles!project_members_user_id_fkey(id, full_name, email, avatar_url)
    `)
    .eq("project_id", projectId)
    .order("joined_at");

  if (error) return { error: error.message };

  const members = (data ?? []).map((item: any) => ({
    ...item,
    profiles: Array.isArray(item.profiles) ? item.profiles[0] ?? null : item.profiles,
  }));

  return { members };
}

export async function removeProjectMember(projectId: string, userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath(`/space/${projectId}`);
  return { success: true };
}

export async function getVisibleProjects(workspaceId: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated", projects: [] };

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("owner_id")
    .eq("id", workspaceId)
    .single();

  const isOwner = workspace?.owner_id === user.id;

  const { data: wsMembership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  const isAdmin = wsMembership?.role === "admin";

  if (isOwner || isAdmin) {
    const { data, error } = await supabase
      .from("projects")
      .select(`
        id, name, description, color, progress, created_at, updated_at,
        profiles!projects_created_by_fkey(id, full_name, avatar_url)
      `)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) return { error: error.message, projects: [] };
    return { projects: data ?? [], role: isOwner ? "owner" : "admin" };
  }

  const { data, error } = await supabase
    .from("project_members")
    .select(`
      role,
      projects!project_members_project_id_fkey(
        id, name, description, color, progress, created_at, updated_at,
        profiles!projects_created_by_fkey(id, full_name, avatar_url)
      )
    `)
    .eq("user_id", user.id)
    .not("projects", "is", null);

  if (error) return { error: error.message, projects: [] };

  const projects = (data ?? [])
    .map((pm: any) => ({ ...pm.projects, memberRole: pm.role }))
    .filter(Boolean);

  return { projects, role: wsMembership?.role ?? "member" };
}