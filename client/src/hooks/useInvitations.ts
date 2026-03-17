"use client";

import { useState, useEffect, useCallback } from "react";
import { acceptInvitation, declineInvitation, getPendingInvitations } from "@/lib/project-members";
import { createClient } from "@/lib/supabase/client";

export type Invitation = {
  id: string;
  role: string;
  created_at: string;
  expires_at: string;
  invitee_email: string;
  workspaces: { id: string; name: string; slug: string } | null;
  projects: { id: string; name: string; color: string } | null;
  profiles: { id: string; full_name: string | null; email: string; avatar_url: string | null } | null;
};

export function useInvitations(userId: string) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = useCallback(async () => {
    const { invitations: data } = await getPendingInvitations(userId);
    setInvitations((data as unknown as Invitation[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchInvitations();

    const supabase = createClient();
    const channel = supabase
      .channel(`invitations:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invitations",
          filter: `invitee_id=eq.${userId}`,
        },
        () => fetchInvitations()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchInvitations]);

  const accept = async (id: string) => {
    const result = await acceptInvitation(id);
    if (!result.error) setInvitations((prev) => prev.filter((i) => i.id !== id));
    return result;
  };

  const decline = async (id: string) => {
    const result = await declineInvitation(id);
    if (!result.error) setInvitations((prev) => prev.filter((i) => i.id !== id));
    return result;
  };

  return { invitations, loading, accept, decline, refetch: fetchInvitations };
}