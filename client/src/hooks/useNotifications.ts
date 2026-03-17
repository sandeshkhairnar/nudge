import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface Notification {
  id: string;
  type: "mention" | "message" | "task" | "system";
  read: boolean;
  created_at: string;
  project_id: string | null;
  channel_id: string | null;
  message_id: string | null;
  content: string;
  preview: string;
  sender: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  project_name: string | null;
  channel_name: string | null;
}

interface UseNotificationsOptions {
  enableSound?: boolean;
  enableToast?: boolean;
  onNewNotification?: (notification: Notification) => void;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const onNewNotificationRef = useRef(options.onNewNotification);

  useEffect(() => {
    onNewNotificationRef.current = options.onNewNotification;
  }, [options.onNewNotification]);

  const fetchNotifications = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from("notifications")
      .select(`
        id, type, read, created_at,
        project_id, channel_id, message_id,
        content, preview,
        sender:profiles!notifications_sender_id_fkey (
          id, full_name, avatar_url
        ),
        project:projects ( name ),
        channel:channels ( name )
      `)
      .eq("recipient_id", uid)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      const shaped = data.map((n: any) => ({
        ...n,
        sender: n.sender ?? null,
        project_name: n.project?.name ?? null,
        channel_name: n.channel?.name ?? null,
      }));
      setNotifications(shaped);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let realtimeChannel: RealtimeChannel;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      fetchNotifications(user.id);

      realtimeChannel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${user.id}`,
          },
          async (payload) => {
            const { data } = await supabase
              .from("notifications")
              .select(`
                id, type, read, created_at,
                project_id, channel_id, message_id,
                content, preview,
                sender:profiles!notifications_sender_id_fkey (
                  id, full_name, avatar_url
                ),
                project:projects ( name ),
                channel:channels ( name )
              `)
              .eq("id", payload.new.id)
              .single();

            if (data) {
              const shaped = {
                ...data,
                sender: (data as any).sender ?? null,
                project_name: (data as any).project?.name ?? null,
                channel_name: (data as any).channel?.name ?? null,
              } as Notification;

              setNotifications((prev) => [shaped, ...prev]);
              showBrowserNotification(shaped);
              onNewNotificationRef.current?.(shaped);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === payload.new.id ? { ...n, ...payload.new } : n
              )
            );
          }
        )
        .subscribe();
    });

    return () => {
      realtimeChannel?.unsubscribe();
    };
  }, [fetchNotifications, supabase]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  }, [supabase]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("recipient_id", userId)
      .eq("read", false);
  }, [supabase, userId]);

  const archive = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  }, [supabase]);

  return {
    notifications,
    loading,
    unreadCount: notifications.filter((n) => !n.read).length,
    markRead,
    markAllRead,
    archive,
  };
}

function showBrowserNotification(n: Notification) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const title =
    n.type === "mention"
      ? `🔔 ${n.sender?.full_name} mentioned you`
      : n.sender?.full_name ?? "Nudge";

  new Notification(title, {
    body: n.preview,
    icon: "/favicon.ico",
    silent: true,
  });
}