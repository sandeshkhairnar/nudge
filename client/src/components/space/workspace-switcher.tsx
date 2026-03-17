"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/store/workspace-store";

interface WorkspaceSwitcherProps {
  collapsed: boolean;
}

export function WorkspaceSwitcher({ collapsed }: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { workspace, workspaces, setWorkspace } = useWorkspaceStore();

  const switchWorkspace = async (newWorkspace: typeof workspace) => {
    if (!newWorkspace) return;
    
    setWorkspace(newWorkspace);
    localStorage.setItem('lastWorkspaceId', newWorkspace.id);
    setIsOpen(false);
    router.refresh();
  };

  if (!workspace) return null;

  if (collapsed) {
    return (
      <div className="relative">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-center p-2.5 rounded-[10px] cursor-pointer"
          style={{ background: "rgba(255,255,255,0.05)" }}
          whileHover={{ background: "rgba(255,255,255,0.08)" }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black text-white"
            style={{ background: "linear-gradient(135deg,#36C5F0,#2EB67D)" }}>
            {workspace.name[0]}
          </div>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 bottom-full mb-2 w-48 rounded-xl overflow-hidden z-50"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {workspaces.map((ws) => (
                <motion.button
                  key={ws.id}
                  onClick={() => switchWorkspace(ws)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                  style={{ background: ws.id === workspace.id ? "rgba(54,197,240,0.1)" : "transparent" }}
                >
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black text-white"
                    style={{ background: "linear-gradient(135deg,#36C5F0,#2EB67D)" }}>
                    {ws.name[0]}
                  </div>
                  <span className="text-[13px] font-medium text-white/80 flex-1 text-left">{ws.name}</span>
                  {ws.id === workspace.id && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17L4 12" stroke="#36C5F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative" style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <motion.div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-2.5 rounded-[10px] cursor-pointer"
        style={{ background: "rgba(255,255,255,0.05)" }}
        whileHover={{ background: "rgba(255,255,255,0.08)" }}
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#36C5F0,#2EB67D)" }}>
          {workspace.name[0]}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-[13px] font-bold text-white truncate">{workspace.name}</p>
          <p className="text-[11px] capitalize" style={{ color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{workspace.plan} plan</p>
        </div>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          width="14" height="14" viewBox="0 0 24 24" fill="none"
        >
          <path d="M6 9l6 6 6-6" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8" strokeLinecap="round" />
        </motion.svg>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-5 right-5 top-[70px] rounded-xl overflow-hidden z-50"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {workspaces.map((ws) => (
              <motion.button
                key={ws.id}
                onClick={() => switchWorkspace(ws)}
                className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                style={{ background: ws.id === workspace.id ? "rgba(54,197,240,0.1)" : "transparent" }}
              >
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black text-white"
                  style={{ background: "linear-gradient(135deg,#36C5F0,#2EB67D)" }}>
                  {ws.name[0]}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[13px] font-medium text-white/80">{ws.name}</p>
                  <p className="text-[10px] capitalize text-white/30">{ws.plan}</p>
                </div>
                {ws.id === workspace.id && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="#36C5F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </motion.button>
            ))}
            {/* <div className="border-t border-white/10">
              <Link href="/workspaces/new" className="no-underline">
                <motion.div
                  className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                  whileHover={{ x: 2 }}
                >
                  <div className="w-6 h-6 rounded-md flex items-center justify-center bg-white/10">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-[13px] text-white/60">Create Workspace</span>
                </motion.div>
              </Link>
            </div> */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}