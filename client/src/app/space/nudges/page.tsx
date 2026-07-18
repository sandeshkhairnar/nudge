import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { NudgesClient } from "@/components/space/nudges/NudgesClient";

export default async function NudgesPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return <div>Unauthorized</div>;
  }

  // Get active workspace (Assuming user is in a workspace. In reality, it should be passed via URL or cookie. We fetch the first one as a fallback)
  // For SSR, since workspace selection is client-side store, we will pass empty array and let the client fetch,
  // OR we can rely on the client entirely if we don't know the workspace ID on the server.
  // Actually, wait, the user's current architecture uses `useWorkspaceStore` on the client.
  // We can't know the workspace ID on the server unless we fetch their default workspace.
  const { data: memberData } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  let initialNudges: any[] = [];

  if (memberData?.workspace_id) {
    const { data } = await supabase
      .from("nudges")
      .select("*, projects(name, color), tasks(title)")
      .eq("workspace_id", memberData.workspace_id)
      .eq("dismissed", false)
      .order("created_at", { ascending: false });
    
    if (data) {
      initialNudges = data;
    }
  }

  return <NudgesClient initialNudges={initialNudges} />;
}
