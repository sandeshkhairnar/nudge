// hooks/use-presence.ts
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function usePresence(channelName: string, userId: string) {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ userId: string }>();
        const ids = new Set(Object.keys(state));
        setOnlineIds(ids);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ userId, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, userId]);

  return onlineIds;
}