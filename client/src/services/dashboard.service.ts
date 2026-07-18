import { createClient } from "@/lib/supabase/client";

export class DashboardService {
  /**
   * Fetches all dashboard stats in a single network request using the Supabase RPC.
   */
  static async getStats(workspaceId: string) {
    if (!workspaceId) return null;
    const supabase = createClient();
    
    const { data, error } = await supabase.rpc('get_dashboard_stats', { workspace_uuid: workspaceId });
    
    if (error) {
      console.error("Dashboard RPC Error:", error);
      return null;
    }

    console.log("Dashboard RPC Result:", data);
    return data;
  }
}
