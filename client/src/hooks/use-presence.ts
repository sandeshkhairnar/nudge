// hooks/use-presence.ts
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function usePresence(channelName: string, userId: string, metadata: any = {}, shouldTrack: boolean = true) {
  const [presenceState, setPresenceState] = useState<Record<string, any>>({});
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        setPresenceState(channel.presenceState());
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && shouldTrack) {
          await channel.track({ userId, ...metadata, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, userId, JSON.stringify(metadata), shouldTrack]);

  return presenceState;
}