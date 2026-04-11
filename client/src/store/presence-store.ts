import { create } from "zustand";

interface OnlineUser {
  id: string;
  online_at: string;
}

interface PresenceState {
  onlineUsers: Record<string, OnlineUser>;
  setOnlineUsers: (users: Record<string, OnlineUser>) => void;
  isUserOnline: (userId: string) => boolean;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUsers: {},
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  isUserOnline: (userId) => {
    // Check if user is in the presence map
    return !!get().onlineUsers[userId];
  },
}));
