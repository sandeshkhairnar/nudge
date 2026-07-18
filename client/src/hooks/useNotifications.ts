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
    email: string | null;
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const onNewNotificationRef = useRef(options.onNewNotification);

  useEffect(() => {
    onNewNotificationRef.current = options.onNewNotification;
  }, [options.onNewNotification]);

  const fetchUnreadCount = useCallback(async (uid: string) => {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", uid)
      .eq("read", false);
    if (!error && count !== null) setUnreadCount(count);
  }, [supabase]);

  const fetchNotifications = useCallback(async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select(`
        id, type, read, created_at,
        project_id, channel_id, message_id,
        content, preview,
        sender:profiles!notifications_sender_id_fkey (
          id, full_name, avatar_url, email
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
      })) as Notification[];
      setNotifications(shaped);
      setHasMore(data.length === 50);
    }
    setLoading(false);
    fetchUnreadCount(uid);
  }, [supabase, fetchUnreadCount]);

  const fetchMore = useCallback(async () => {
    if (!userId || !hasMore || isLoadingMore || loading || notifications.length === 0) return;
    setIsLoadingMore(true);
    const oldest = notifications[notifications.length - 1];
    const { data, error } = await supabase
      .from("notifications")
      .select(`
        id, type, read, created_at,
        project_id, channel_id, message_id,
        content, preview,
        sender:profiles!notifications_sender_id_fkey (
          id, full_name, avatar_url, email
        ),
        project:projects ( name ),
        channel:channels ( name )
      `)
      .eq("recipient_id", userId)
      .lt("created_at", oldest.created_at)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      const shaped = data.map((n: any) => ({
        ...n,
        sender: n.sender ?? null,
        project_name: n.project?.name ?? null,
        channel_name: n.channel?.name ?? null,
      })) as Notification[];
      setNotifications((prev) => [...prev, ...shaped]);
      setHasMore(data.length === 50);
    }
    setIsLoadingMore(false);
  }, [supabase, userId, hasMore, isLoadingMore, loading, notifications]);

  useEffect(() => {
    let realtimeChannel: RealtimeChannel;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      fetchNotifications(user.id);

      const channelName = `notifications:${user.id}:${Math.random().toString(36).substring(7)}`;
      realtimeChannel = supabase
        .channel(channelName)
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
                  id, full_name, avatar_url, email
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
              setUnreadCount((prev) => prev + 1);
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
            if (payload.old?.read === false && payload.new.read === true) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            } else if (payload.old?.read === true && payload.new.read === false) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        )
        .subscribe();
    });

    return () => {
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
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
    isLoadingMore,
    hasMore,
    unreadCount,
    fetchMore,
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
      ? `${n.sender?.full_name} mentioned you`
      : n.sender?.full_name ?? "Nudge";

  new Notification(title, {
    body: n.preview,
    icon: "/favicon.ico",
    silent: true,
  });
}