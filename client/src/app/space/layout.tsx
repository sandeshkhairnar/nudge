"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/global/Sidebar";
import CreateProjectModal from "@/components/space/CreateProjectModal";
import { createProject } from "@/lib/projects";
import { useWorkspaceStore } from "@/store/workspace-store";
import { useNotificationStore } from "@/store/notification-store";
import { useNotificationActions } from "@/components/global/notification-provider";
import { useProjectsStore } from "@/store/projects-store";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

function Topbar({
  title,
  onOpenCreate,
}: {
  title?: string;
  onOpenCreate: () => void;
}) {
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { markAsRead, markAllAsRead } = useNotificationActions();

  const displayNotifs = notifications.slice(0, 5);

  const accentByType: Record<string, string> = {
    mention: "#36C5F0",
    message: "#36C5F0",
    task: "#ECB22E",
    system: "#2EB67D",
  };

  return (
    <header
      className="h-[60px] border-b border-[#EBEBEB] flex items-center px-4 md:px-7 gap-2 md:gap-3 bg-white shrink-0 sticky top-0 z-40"
      style={{ boxShadow: "0 1px 0 #F5F5F2" }}
    >
      <div className="flex-1 min-w-0 pl-10 md:pl-0">
        <h1 className="text-[15px] font-black text-[#0D0D0D] tracking-[-0.02em] truncate">
          {title ?? "Dashboard"}
        </h1>
      </div>

      <motion.div
        animate={{
          width: focused ? 220 : 160,
          boxShadow: focused ? "0 0 0 2px rgba(54,197,240,0.2)" : "0 0 0 1px #EBEBEB",
        }}
        transition={{ duration: 0.2 }}
        className="hidden sm:flex rounded-[10px] bg-[#F9F9F7] items-center gap-2 px-3 h-9 overflow-hidden flex-shrink-0"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
          <circle cx="11" cy="11" r="7" stroke="#9CA3AF" strokeWidth="1.8" />
          <path d="M20 20l-3-3" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search tasks…"
          className="bg-transparent border-none outline-none text-[13px] font-medium text-[#0D0D0D] w-full placeholder-[#C4C4BC]"
        />
        <AnimatePresence>
          {search && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setSearch("")}
              className="text-[#9CA3AF] hover:text-[#6B7280] text-[16px] leading-none flex-shrink-0 border-0 bg-transparent cursor-pointer"
            >
              ×
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="relative flex-shrink-0">
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => setNotifOpen((o) => !o)}
          className="w-9 h-9 rounded-[10px] bg-[#F9F9F7] border border-[#EBEBEB] flex items-center justify-center relative cursor-pointer"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
              stroke="#374151"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {unreadCount > 0 && (
            <motion.span
              animate={{ scale: [1, 1.35, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-[7px] right-[7px] w-[7px] h-[7px] rounded-full bg-[#E01E5A] border-[1.5px] border-white"
            />
          )}
        </motion.button>

        <AnimatePresence>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-[98]" onClick={() => setNotifOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-11 right-0 w-[min(320px,calc(100vw-32px))] bg-white rounded-2xl border border-[#EBEBEB] z-[99] overflow-hidden"
                style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.10)" }}
              >
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F5F5F2]">
                  <span className="text-[13px] font-black text-[#0D0D0D]">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-full bg-[#E01E5A] text-white text-[10px] font-black">
                        {unreadCount}
                      </span>
                    )}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-[11px] font-bold text-[#36C5F0] cursor-pointer border-0 bg-transparent"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {displayNotifs.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <p className="text-[13px] text-[#9CA3AF] font-medium">No notifications yet</p>
                  </div>
                ) : (
                  displayNotifs.map((n, i) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ background: "#F9F9F7" }}
                      onClick={() => {
                        if (!n.read) markAsRead(n.id);
                        setNotifOpen(false);
                        window.location.href = "/space/inbox";
                      }}
                      className="flex items-start gap-3 px-5 py-3.5 border-b border-[#F5F5F2] last:border-0 cursor-pointer"
                      style={{ background: n.read ? "transparent" : "rgba(54,197,240,0.03)" }}
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-[5px] flex-shrink-0"
                        style={{ background: accentByType[n.type] ?? "#9CA3AF", opacity: n.read ? 0.3 : 1 }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[12.5px] leading-snug"
                          style={{ fontWeight: n.read ? 500 : 700, color: n.read ? "#6B7280" : "#374151" }}
                        >
                          {n.preview}
                        </p>
                        {n.sender?.full_name && (
                          <p className="text-[11px] text-[#36C5F0] font-semibold mt-0.5">
                            {n.sender.full_name}
                            {n.project_name && (
                              <span className="text-[#9CA3AF] font-normal"> · {n.project_name}</span>
                            )}
                          </p>
                        )}
                        <p className="text-[11px] text-[#9CA3AF] mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}

                <div className="px-5 py-3 border-t border-[#F5F5F2]">
                  <Link href="/space/inbox" className="text-[12px] font-semibold text-[#9CA3AF] hover:text-[#6B7280] border-0 bg-transparent">
                    View all notifications →
                  </Link>
                  {/* <button
                    onClick={() => {
                      setNotifOpen(false);
                      window.location.href = "/space/inbox";
                    }}
                    className="text-[12px] font-semibold text-[#9CA3AF] hover:text-[#6B7280] border-0 bg-transparent cursor-pointer"
                  >
                    View all notifications →
                  </button> */}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        whileHover={{ y: -1, boxShadow: "0 6px 20px rgba(0,0,0,0.2)" }}
        whileTap={{ scale: 0.96 }}
        onClick={onOpenCreate}
        className="h-9 px-3 md:px-4 bg-[#0D0D0D] text-white rounded-[10px] text-[13px] font-black flex items-center gap-1.5 border-0 cursor-pointer flex-shrink-0"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">New project</span>
      </motion.button>
    </header>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const workspace = useWorkspaceStore((s) => s.workspace);
  const addProject = useProjectsStore((s) => s.addProject);

  const handleCreate = async (name: string, description: string) => {
    if (!workspace) return;
    const res = await createProject({ workspaceId: workspace.id, name, description });
    if (res?.error) return;
    if (res.project) {
      addProject({
        id: res.project.id,
        name: res.project.name,
        color: res.project.color ?? "#36C5F0",
        progress: res.project.progress ?? 0,
      });
    }
    setOpen(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { font-family: 'Sora', sans-serif; box-sizing: border-box; }
        ::selection { background: #36C5F0; color: #fff; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E0E0D8; border-radius: 4px; }
        input::placeholder { color: #C4C4BC; }
      `}</style>

      <div className="flex h-screen overflow-hidden bg-[#F9F9F7]">
        <div className="hidden md:flex flex-shrink-0">
          <Sidebar />
        </div>

        <div className="flex md:hidden">
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar onOpenCreate={() => setOpen(true)} />
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-7 bg-[#F9F9F7]">
            {children}
          </div>
        </div>
      </div>

      <CreateProjectModal open={open} onClose={() => setOpen(false)} onCreate={handleCreate} />
    </>
  );
}