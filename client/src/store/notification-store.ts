import { create } from "zustand";

export interface Notification {
  id: string;
  type: "mention" | "message" | "task" | "system" | "call";

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

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  prependNotification: (notification: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  updateNotification: (id: string, partial: Partial<Notification>) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),

  prependNotification: (notification) =>
    set((state) => {
      const notifications = [notification, ...state.notifications];
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      };
    }),

  markRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return { notifications, unreadCount: notifications.filter((n) => !n.read).length };
    }),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  removeNotification: (id) =>
    set((state) => {
      const notifications = state.notifications.filter((n) => n.id !== id);
      return { notifications, unreadCount: notifications.filter((n) => !n.read).length };
    }),

  updateNotification: (id, partial) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, ...partial } : n
      );
      return { notifications, unreadCount: notifications.filter((n) => !n.read).length };
    }),
}));