"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────────
// SIGN UP
// When workspaceName is empty (invite flow), skip workspace creation.
// ─────────────────────────────────────────────────────────────────
export async function signUp(formData: {
  fullName: string;
  email: string;
  password: string;
  workspaceName: string;
  role?: string;
}) {
  const supabase = await createClient();

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: { data: { full_name: formData.fullName } },
  });

  if (authError) return { error: authError.message };
  if (!authData.user) return { error: "User creation failed" };

  // 2. Skip workspace creation for invite flow
  if (!formData.workspaceName.trim()) {
    return { success: true, workspace: null };
  }

  // 3. Build a collision-safe slug
  const base = formData.workspaceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "workspace";

  // Append a short random suffix to avoid duplicate slug collisions
  const suffix = Math.random().toString(36).slice(2, 6);
  const slug = `${base}-${suffix}`;

  const { data: workspace, error: wsError } = await supabase.rpc(
    "create_workspace_with_owner",
    {
      p_name: formData.workspaceName,
      p_slug: slug,
      p_owner_id: authData.user.id,
    }
  );

  if (wsError) return { error: wsError.message };

  return { success: true, workspace };
}

// ─────────────────────────────────────────────────────────────────
// SIGN IN
// ─────────────────────────────────────────────────────────────────
export async function signIn(formData: { email: string; password: string }) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) return { error: error.message };

  redirect("/space");
}

// ─────────────────────────────────────────────────────────────────
// SIGN IN WITH GOOGLE
// ─────────────────────────────────────────────────────────────────
export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) return { error: error.message };
  if (data.url) redirect(data.url);
}

// ─────────────────────────────────────────────────────────────────
// SIGN OUT
// ─────────────────────────────────────────────────────────────────
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

// ─────────────────────────────────────────────────────────────────
// GET CURRENT USER
// ─────────────────────────────────────────────────────────────────
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ─────────────────────────────────────────────────────────────────
// GET CURRENT PROFILE
// ─────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────
// RESET PASSWORD FOR EMAIL
// ─────────────────────────────────────────────────────────────────
export async function resetPasswordForEmail(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
  });

  if (error) return { error: error.message };
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────
// UPDATE PASSWORD
// ─────────────────────────────────────────────────────────────────
export async function updatePassword(password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) return { error: error.message };
  return { success: true };
}