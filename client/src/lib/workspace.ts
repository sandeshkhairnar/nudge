import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  owner_id: string;
  plan?: string;
  created_at: string;
  updated_at: string;
  nudge_engine_active?: boolean;
  nudge_check_time?: string;
  nudge_check_times?: string[];
}

export async function getUserWorkspace(userId: string) {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces(*)")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (error) {
    console.error("Workspace fetch error:", error);
    return null;
  }

  if (!data?.workspaces) return null;

  // workspaces(*) via a FK join returns a single object (not an array)
  // when coming from workspace_members -> workspaces (many-to-one)
  const ws = Array.isArray(data.workspaces)
    ? data.workspaces[0]
    : data.workspaces;

  return ws as Workspace;
}

export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces(*)")
    .eq("user_id", userId);

  if (error) {
    console.error("Workspaces fetch error:", error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Each row: { workspace_id, workspaces: Workspace | Workspace[] | null }
  // The FK join (many-to-one) returns a single object, not an array.
  // We normalise both cases defensively.
  const workspaces: Workspace[] = data
    .flatMap((item) => {
      if (!item.workspaces) return [];
      return Array.isArray(item.workspaces)
        ? item.workspaces
        : [item.workspaces];
    })
    .filter((ws): ws is Workspace => !!ws && typeof ws === "object");

  return workspaces;
}

export async function createWorkspace(
  userId: string,
  name: string,
  slug: string
) {
  // Step 1 – create the workspace row
  const { data: ws, error: wsError } = await supabase
    .from("workspaces")
    .insert({ name, slug, owner_id: userId })
    .select()
    .single();

  if (wsError) {
    console.error("Workspace creation error:", wsError);
    return { error: wsError };
  }

  // Step 2 – add the creator as owner in workspace_members.
  // The RLS policy "Users can insert themselves as member" (WITH CHECK auth.uid() = user_id)
  // allows this as long as the calling client is authenticated as userId.
  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({ workspace_id: ws.id, user_id: userId, role: "owner" });

  if (memberError) {
    console.error("Workspace member error:", memberError);
    // Roll back the workspace we just created so we don't leave orphans
    await supabase.from("workspaces").delete().eq("id", ws.id);
    return { error: memberError };
  }

  return { workspace: ws as Workspace };
}