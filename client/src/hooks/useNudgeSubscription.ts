import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function useNudgeSubscription(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;
    const supabase = createClient();
    
    const channel = supabase
      .channel("realtime-nudges")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "nudges",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          // Instantly refresh nudges and show a toast
          queryClient.invalidateQueries({ queryKey: ["nudges", workspaceId] });
          toast.success("New AI Nudge received!");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);
}
