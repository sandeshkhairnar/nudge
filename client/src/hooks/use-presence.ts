"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function usePresence(
  channelName: string,
  userId: string,
  metadata: Record<string, any> = {},
  shouldTrack: boolean = true
) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const metadataRef = useRef(metadata);
  const [presenceState, setPresenceState] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!userId || !channelName) return;

    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    });

    const sync = () => setPresenceState({ ...channel.presenceState() });

    channel
      .on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, sync)
      .on("presence", { event: "leave" }, sync)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && shouldTrack) {
          await channel.track({
            userId,
            ...metadataRef.current,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, userId, shouldTrack]);

  return presenceState;
}