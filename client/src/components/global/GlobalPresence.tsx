"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePresenceStore } from "@/store/presence-store";

export function GlobalPresence() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const setOnlineUsers = usePresenceStore((s) => s.setOnlineUsers);

  useEffect(() => {
    let userId: string | null = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      const channel = supabase.channel("nudge-global-presence", {
        config: { presence: { key: userId } },
      });

      const syncStore = () => {
        const state = channel.presenceState();
        const flattened: Record<string, { id: string; online_at: string }> = {};
        Object.entries(state).forEach(([key, metadatas]) => {
          const meta = (metadatas as any[])[0];
          if (meta) {
            flattened[key] = {
              id: key,
              online_at: meta.online_at ?? new Date().toISOString(),
            };
          }
        });
        setOnlineUsers(flattened);
      };

      channel
        .on("presence", { event: "sync" }, syncStore)
        .on("presence", { event: "join" }, syncStore)
        .on("presence", { event: "leave" }, syncStore)
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({ userId, online_at: new Date().toISOString() });
          }
        });
    };

    init();

    return () => {
      supabase.removeAllChannels();
    };
  }, []);

  return null;
}
