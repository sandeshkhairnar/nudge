// hooks/use-realtime-chat.ts
// ─── Realtime chat hook (Client Component) ────────────────────
//
// Uses Supabase Realtime (postgres_changes) to stream new messages
// into local state without page refresh.
// Also uses Broadcast for typing indicators.
//
// Usage:
//   const { messages, sendMessage, typingUsers, setTyping } =
//     useRealtimeChat({ channelId, currentUserId, initialMessages });

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface ChatMessage {
  id: string;
  content: string;
  is_ai: boolean;
  created_at: string;
  edited_at: string | null;
  user_id: string;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface UseRealtimeChatOptions {
  channelId: string;
  currentUserId: string;
  initialMessages?: ChatMessage[];
}

export function useRealtimeChat({
  channelId,
  currentUserId,
  initialMessages = [],
}: UseRealtimeChatOptions) {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Subscribe to new messages + typing broadcasts ──────────
  useEffect(() => {
    if (!channelId) return;

    const realtimeChannel = supabase
      .channel(`chat:${channelId}`, {
        config: { broadcast: { self: false } },
      })
      // 1. Postgres changes — new messages persisted to DB
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          // Fetch the full message with profile join
          const { data } = await supabase
            .from("messages")
            .select(`
              id, content, is_ai, created_at, edited_at, user_id,
              profiles!messages_user_id_fkey(id, full_name, avatar_url)
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => {
              // Deduplicate — optimistic insert may already exist
              const exists = prev.some((m) => m.id === data.id);
              return exists ? prev : [...prev, data as ChatMessage];
            });
          }
        }
      )
      // 2. Postgres changes — message edits
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.new.id
                ? { ...m, content: payload.new.content, edited_at: payload.new.edited_at }
                : m
            )
          );
        }
      )
      // 3. Postgres changes — deletes
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      // 4. Broadcast — typing indicators
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.userId === currentUserId) return;
        setTypingUsers((prev) =>
          prev.includes(payload.userName) ? prev : [...prev, payload.userName]
        );
        // Remove typing indicator after 3 s of silence
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== payload.userName));
        }, 3000);
      })
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    channelRef.current = realtimeChannel;

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [channelId, currentUserId]);

  // ── Optimistic send (instant UI + DB write) ─────────────────
  const sendMessage = useCallback(
    async (content: string, profile: { full_name: string | null; avatar_url: string | null }) => {
      if (!content.trim()) return;

      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMsg: ChatMessage = {
        id: optimisticId,
        content,
        is_ai: false,
        created_at: new Date().toISOString(),
        edited_at: null,
        user_id: currentUserId,
        profiles: { id: currentUserId, ...profile },
      };

      // Optimistically append
      setMessages((prev) => [...prev, optimisticMsg]);

      const { data, error } = await supabase
        .from("messages")
        .insert({ channel_id: channelId, user_id: currentUserId, content })
        .select(`
          id, content, is_ai, created_at, edited_at, user_id,
          profiles!messages_user_id_fkey(id, full_name, avatar_url)
        `)
        .single();

      if (error) {
        // Roll back optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        console.error("sendMessage error:", error.message);
        return;
      }

      // Replace optimistic with real DB row
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? (data as ChatMessage) : m))
      );
    },
    [channelId, currentUserId, supabase]
  );

  // ── Typing broadcast ────────────────────────────────────────
  const setTyping = useCallback(
    (userName: string) => {
      if (!channelRef.current) return;
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUserId, userName },
      });

      // Auto-stop typing after 2 s
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        typingTimerRef.current = null;
      }, 2000);
    },
    [currentUserId]
  );

  return { messages, sendMessage, typingUsers, setTyping, isConnected };
}