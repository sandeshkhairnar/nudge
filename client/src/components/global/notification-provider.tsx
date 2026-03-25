"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { ToastContainer, ToastProps } from "@/components/global/toast";
import { IncomingCallModal, IncomingCall } from "@/components/global/IncomingCallModal";
import { usePathname, useRouter } from "next/navigation";
import { useNotificationStore, type Notification } from "@/store/notification-store";

interface NotificationContextType {
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotificationActions() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationActions must be used within a NotificationProvider");
  }
  return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const { playSound } = useNotificationSound();

  const { setNotifications, prependNotification, markRead, markAllRead, updateNotification, removeNotification } =
    useNotificationStore();

  const isInboxPage = pathname === "/space/inbox";

  useEffect(() => {
    const fetchUserAndNotifications = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

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
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        const shaped: Notification[] = data.map((n: any) => ({
          ...n,
          sender: n.sender ?? null,
          project_name: n.project?.name ?? null,
          channel_name: n.channel?.name ?? null,
        }));
        setNotifications(shaped);
      }
    };

    fetchUserAndNotifications();
  }, []);

  const handleDeclineCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  const handleAcceptCall = useCallback((room: string) => {
    setIncomingCall(null);
    router.push(`/space/video-call?room=${encodeURIComponent(room)}`);
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
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
            const shaped: Notification = {
              ...data,
              sender: (data as any).sender ?? null,
              project_name: (data as any).project?.name ?? null,
              channel_name: (data as any).channel?.name ?? null,
            };

            prependNotification(shaped);

            // Incoming call — show the dedicated modal instead of a toast
            if (shaped.type === "call") {
              playSound("call");
              setIncomingCall({
                id: shaped.id,
                room: shaped.content,          // content holds the room name
                callerName: shaped.sender?.full_name ?? "Someone",
                callerAvatarUrl: shaped.sender?.avatar_url ?? null,
                callerEmail: null,
              });
              return; // don't show a regular toast for calls
            }

            playSound(shaped.type);

            if (!isInboxPage) {
              const toast: ToastProps = {
                id: shaped.id,
                type: shaped.type,
                title: shaped.sender?.full_name ?? "Nudge",
                message: shaped.preview,
                projectName: shaped.project_name ?? undefined,
                channelName: shaped.channel_name ?? undefined,
                onClose: (id) => setToasts((prev) => prev.filter((t) => t.id !== id)),
                onClick: () => {
                  window.location.href = "/space/inbox";
                },
              };
              setToasts((prev) => [toast, ...prev].slice(0, 5));
            }

            if (
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted" &&
              document.visibilityState !== "visible"
            ) {
              new Notification(shaped.sender?.full_name ?? "Nudge", {
                body: shaped.preview,
                icon: "/favicon.ico",
              });
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          updateNotification(payload.new.id, payload.new as Partial<Notification>);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  const markAsRead = async (id: string) => {
    markRead(id);
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    markAllRead();
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("recipient_id", userId)
      .eq("read", false);
  };

  const archiveNotification = async (id: string) => {
    removeNotification(id);
    await supabase.from("notifications").delete().eq("id", id);
  };

  return (
    <NotificationContext.Provider value={{ markAsRead, markAllAsRead, archiveNotification }}>
      {children}

      {/* Incoming call modal — shown above everything */}
      <IncomingCallModal
        call={incomingCall}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
      />

      <ToastContainer
        toasts={toasts}
        onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </NotificationContext.Provider>
  );
}