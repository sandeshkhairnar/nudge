import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface Workspace {
  id: string;
  name: string;
  plan: string;
}

export async function getUserWorkspace(userId: string) {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces(id, name, plan)")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (error) {
    console.error("Workspace fetch error:", error);
    return null;
  }

  if (!data?.workspaces) return null;

  const ws = data.workspaces as any;

  return {
    id: ws.id,
    name: ws.name,
    plan: ws.plan,
  };
}

// New function to get all workspaces for a user
export async function getUserWorkspaces(userId: string) {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces(id, name, plan)")
    .eq("user_id", userId);

  if (error) {
    console.error("Workspaces fetch error:", error);
    return [];
  }

  if (!data) return [];

  return data.map(item => {
    const ws = item.workspaces as any;
    return {
      id: ws.id,
      name: ws.name,
      plan: ws.plan,
    };
  });
}