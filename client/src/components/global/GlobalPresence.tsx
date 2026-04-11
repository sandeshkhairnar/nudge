"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePresence } from "@/hooks/use-presence";
import { usePresenceStore } from "@/store/presence-store";

export function GlobalPresence() {
  const supabase = createClient();
  const setOnlineUsers = usePresenceStore((s) => s.setOnlineUsers);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function getSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    }
    getSession();
  }, [supabase]);

  // Use the existing presence hook on a global channel
  const presenceState = usePresence("nudge-global-presence", userId || "", {
    online_at: new Date().toISOString(),
  }, !!userId);

  useEffect(() => {
    // presenceState is Record<string, any[]> from Supabase
    // We flatten it for the store
    const flattened: Record<string, { id: string; online_at: string }> = {};
    Object.entries(presenceState).forEach(([id, metadatas]) => {
      if (metadatas && metadatas[0]) {
        flattened[id] = {
          id,
          online_at: (metadatas[0] as any).online_at || new Date().toISOString()
        };
      }
    });
    setOnlineUsers(flattened);
  }, [presenceState, setOnlineUsers]);

  return null; // This component is just a logic provider
}
