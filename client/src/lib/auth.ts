"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";

function getAdminClient() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function signUp(formData: {
  fullName: string;
  email: string;
  password: string;
  workspaceName: string;
  purpose?: string;
  teamSize?: string;
  invitationId?: string;
}) {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: { data: { full_name: formData.fullName } },
  });

  if (authError) return { error: authError.message };
  if (!authData.user) return { error: "User creation failed" };

  const userId = authData.user.id;

  if (formData.invitationId) {
    const admin = getAdminClient();

    const { data: invitation, error: invErr } = await admin
      .from("invitations")
      .select("*")
      .eq("id", formData.invitationId)
      .eq("status", "pending")
      .single();

    if (invErr || !invitation) {
      await supabase.auth.signOut();
      return { error: "Invitation not found or already used" };
    }

    const emailMatch =
      invitation.invitee_email?.toLowerCase().trim() ===
      formData.email.toLowerCase().trim();
    const idMatch = invitation.invitee_id === userId;

    if (!emailMatch && !idMatch) {
      await supabase.auth.signOut();
      return { error: "This invitation is not for you" };
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await admin.from("invitations").update({ status: "declined" }).eq("id", formData.invitationId);
      await supabase.auth.signOut();
      return { error: "Invitation has expired" };
    }

    const { error: wsError } = await admin
      .from("workspace_members")
      .upsert(
        { workspace_id: invitation.workspace_id, user_id: userId, role: invitation.role },
        { onConflict: "workspace_id,user_id", ignoreDuplicates: true }
      );

    if (wsError) {
      await supabase.auth.signOut();
      return { error: `Failed to join workspace: ${wsError.message}` };
    }

    if (invitation.project_id) {
      const { error: pmError } = await admin
        .from("project_members")
        .upsert(
          { project_id: invitation.project_id, user_id: userId, role: invitation.role },
          { onConflict: "project_id,user_id" }
        );
      if (pmError) {
        await supabase.auth.signOut();
        return { error: `Failed to join project: ${pmError.message}` };
      }
    }

    await admin
      .from("invitations")
      .update({ status: "accepted", invitee_id: userId })
      .eq("id", formData.invitationId);

    await supabase.auth.signOut();

    return {
      success: true,
      workspace: null,
      projectId: invitation.project_id ?? null,
      workspaceName: null,
    };
  }

  if (!formData.workspaceName.trim()) {
    await supabase.auth.signOut();
    return { success: true, workspace: null };
  }

  const base = formData.workspaceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "workspace";

  const suffix = Math.random().toString(36).slice(2, 10);
  const slug = `${base}-${suffix}`;

  const { data: workspace, error: wsError } = await supabase.rpc(
    "create_workspace_with_owner",
    {
      p_name: formData.workspaceName,
      p_slug: slug,
      p_owner_id: userId,
      p_purpose: formData.purpose ?? null,
      p_team_size: formData.teamSize ?? null,
    }
  );

  if (wsError) {
    const adminClient = await createClient();
    await adminClient.auth.admin?.deleteUser(userId).catch(() => { });
    return { error: `Workspace setup failed: ${wsError.message}. Please try again.` };
  }

  await supabase.auth.signOut();

  return { success: true, workspace };
}

export async function signIn(formData: {
  email: string;
  password: string;
  skipRedirect?: boolean;
}) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) return { error: error.message };

  if (!formData.skipRedirect) {
    redirect("/space");
  }

  return { success: true };
}


export async function signInWithGoogle(isDesktop?: boolean) {
  const supabase = await createClient();

  const redirectTo = isDesktop
    ? "nudge://auth/callback"
    : `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) return { error: error.message };
  if (data.url) redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

export async function updateProfile(updates: {
  full_name?: string;
  avatar_url?: string;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function resetPasswordForEmail(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function updatePassword(password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) return { error: error.message };
  return { success: true };
}