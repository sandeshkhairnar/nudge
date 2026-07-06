"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Hash, Plus } from "lucide-react";
import GlobalAvatar from "@/components/global/Avatar";
import { strColor } from "@/lib/utils/color";
import { Channel, Tab, OnlineUser, Project } from "@/types";

interface ProjectSidebarProps {
  project: Project | null;
  tab: Tab;
  sidebarOpen: boolean;
  channels: Channel[];
  activeChannel: Channel | null;
  onlineUsers: OnlineUser[];
  onTabChange: (tab: Tab) => void;
  onChannelSelect: (ch: Channel) => void;
  onAddChannel: () => void;
  onClose: () => void;
  onAvatarClick?: () => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "tasks", label: "Tasks" },
  { id: "team", label: "Team" },
  { id: "resources", label: "Resources" },
  { id: "integrations", label: "Integrations" },
  { id: "settings", label: "Settings" },
];

export default function ProjectSidebar({
  project,
  tab,
  sidebarOpen,
  channels,
  activeChannel,
  onlineUsers,
  onTabChange,
  onChannelSelect,
  onAddChannel,
  onClose,
  onAvatarClick,
}: ProjectSidebarProps) {
  return (
    <div
      className={`flex-shrink-0 flex flex-col bg-gray-50 border-r border-gray-200 overflow-hidden transition-all duration-300
        fixed inset-y-0 left-0 z-40 lg:static lg:z-auto lg:translate-x-0
        ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}`}
      style={{ width: 220 }}
    >
      <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0 bg-white">
        <div className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAvatarClick}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer overflow-hidden relative group shadow-sm"
            style={{
              background: project?.avatar_url 
                ? "transparent" 
                : (project?.color ? `linear-gradient(135deg,#4F46E5)` : "linear-gradient(135deg,#4F46E5,#6366F1)"),
              border: project?.avatar_url ? "1px solid #E5E7EB" : "none",
            }}
          >
            {project?.avatar_url ? (
              <img src={project.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-extrabold text-sm relative z-10">
                {project?.name?.[0] ?? "P"}
              </span>
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Plus size={12} className="text-white" />
            </div>
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-gray-900 truncate leading-tight">
              {project?.name ?? "Project"}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${project?.progress ?? 0}%`,
                    background: project?.color ?? "#4F46E5",
                  }}
                />
              </div>
              <span className="text-[9px] text-gray-400 font-bold flex-shrink-0">
                {project?.progress ?? 0}%
              </span>
            </div>
          </div>
          <button
            className="lg:hidden border-0 bg-transparent cursor-pointer p-1 text-gray-400"
            onClick={onClose}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <nav className="px-2 pt-3 pb-1 flex-shrink-0 space-y-0.5">
        {TABS.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => { onTabChange(item.id); onClose(); }}
            whileHover={{ x: 1.5 }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border-0 cursor-pointer transition-all text-left"
            style={{
              background: tab === item.id ? "#fff" : "transparent",
              color: tab === item.id ? "#111827" : "#6B7280",
              boxShadow: tab === item.id ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
            }}
          >
            <span className="text-[13px] font-semibold">{item.label}</span>
          </motion.button>
        ))}
      </nav>

      <AnimatePresence>
        {tab === "chat" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-2 mt-2 overflow-hidden flex-shrink-0"
          >
            <div className="flex items-center justify-between px-3 mb-1.5 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Channels
              </span>
              <button
                onClick={onAddChannel}
                className="cursor-pointer text-gray-400 hover:text-gray-700 border-0 bg-transparent p-0.5 transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>
            <div className="space-y-0.5">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => { onChannelSelect(ch); onClose(); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border-0 cursor-pointer transition-all text-left"
                  style={{
                    background: activeChannel?.id === ch.id ? "#fff" : "transparent",
                    color: activeChannel?.id === ch.id ? "#111827" : "#6B7280",
                    boxShadow: activeChannel?.id === ch.id ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                  }}
                >
                  <Hash size={13} className={`${activeChannel?.id === ch.id ? "text-indigo-500" : "text-gray-400"} flex-shrink-0`} />
                  <span className="text-[13px] font-medium flex-1 text-left truncate">
                    {ch.name}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-auto px-4 py-3 border-t border-gray-200 flex-shrink-0 bg-white">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
          Online · {onlineUsers.length}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {onlineUsers.length === 0 ? (
            <p className="text-[11px] font-medium text-gray-400">No one online</p>
          ) : (
            onlineUsers.slice(0, 8).map((u) => (
              <div key={u.id} title={u.full_name ?? "User"} className="relative">
                <GlobalAvatar
                  url={u.avatar_url}
                  name={u.full_name}
                  email={u.email}
                  userId={u.id}
                  showStatus={true}
                  size={22}
                  fallbackColor={strColor(u.id)}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
