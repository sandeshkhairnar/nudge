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
}

const TABS: { id: Tab; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "tasks", label: "Tasks" },
  { id: "team", label: "Team" },
  { id: "resources", label: "Resources" },
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
}: ProjectSidebarProps) {
  return (
    <div
      className={`flex-shrink-0 flex flex-col bg-[#F9F9F7] border-r border-gray-100 overflow-hidden transition-all duration-300
        fixed inset-y-0 left-0 z-40 lg:static lg:z-auto lg:translate-x-0
        ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}`}
      style={{ width: 210 }}
    >
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: project?.color
                ? `linear-gradient(135deg,${project.color},#2EB67D)`
                : "linear-gradient(135deg,#36C5F0,#2EB67D)",
            }}
          >
            <span className="text-white font-extrabold text-sm">
              {project?.name?.[0] ?? "P"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-black text-gray-900 truncate leading-tight">
              {project?.name ?? "Project"}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${project?.progress ?? 0}%`,
                    background: project?.color ?? "#36C5F0",
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

      <nav className="px-2 pt-2.5 pb-1 flex-shrink-0 space-y-0.5">
        {TABS.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => { onTabChange(item.id); onClose(); }}
            whileHover={{ x: 1.5 }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border-0 cursor-pointer transition-all text-left"
            style={{
              background: tab === item.id ? "#fff" : "transparent",
              color: tab === item.id ? "#111827" : "#9CA3AF",
              boxShadow: tab === item.id ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              fontFamily: "'Sora',sans-serif",
            }}
          >
            <span className="text-[12.5px] font-semibold">{item.label}</span>
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
            <div className="flex items-center justify-between px-2.5 mb-1">
              <span className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-300">
                Channels
              </span>
              <button
                onClick={onAddChannel}
                className="cursor-pointer text-gray-300 hover:text-gray-600 border-0 bg-transparent p-0.5 transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>
            <div className="space-y-0.5">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => { onChannelSelect(ch); onClose(); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border-0 cursor-pointer transition-all text-left"
                  style={{
                    background: activeChannel?.id === ch.id ? "#fff" : "transparent",
                    color: activeChannel?.id === ch.id ? "#111827" : "#9CA3AF",
                    boxShadow: activeChannel?.id === ch.id ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
                    fontFamily: "'Sora',sans-serif",
                  }}
                >
                  <Hash size={11} className="text-gray-300 flex-shrink-0" />
                  <span className="text-[12px] font-semibold flex-1 text-left truncate">
                    {ch.name}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-auto px-4 py-3 border-t border-gray-100 flex-shrink-0">
        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-gray-300 mb-2">
          Online · {onlineUsers.length}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {onlineUsers.length === 0 ? (
            <p className="text-[10px] text-gray-300">No one online</p>
          ) : (
            onlineUsers.slice(0, 8).map((u) => (
              <div key={u.id} title={u.full_name ?? "User"} className="relative">
                <GlobalAvatar
                  url={u.avatar_url}
                  name={u.full_name}
                  email={u.email}
                  size={22}
                  fallbackColor={strColor(u.id)}
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white bg-emerald-400" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
