"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspaceStore } from "@/store/workspace-store";
import { Check, ChevronDown, Building } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  collapsed: boolean;
}

export function WorkspaceSwitcher({ collapsed }: Props) {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!workspace) {
    return (
      <div className="relative pointer-events-none">
        <div className={`w-full flex items-center gap-2.5 border-0 bg-transparent rounded-xl ${collapsed ? "py-2 justify-center" : "px-2.5 py-2 justify-start"}`}>
          <div className="flex-shrink-0 rounded-lg w-7 h-7 bg-white/5 animate-pulse border border-white/5" />
          {!collapsed && (
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="w-[65%] h-[13px] bg-white/5 rounded animate-pulse" />
              <div className="w-[40%] h-[10px] bg-white/5 rounded animate-pulse" />
            </div>
          )}
        </div>
      </div>
    );
  }

  const initials = workspace.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => workspaces.length > 1 && setOpen((o) => !o)}
        className={`w-full flex items-center gap-2.5 cursor-pointer border-0 bg-transparent transition-all rounded-xl hover:bg-white/5 active:bg-white/10 ${
          collapsed ? "py-2 justify-center" : "px-2.5 py-2 justify-start"
        }`}
      >
        {/* Logo / Avatar */}
        <div className="flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center w-7 h-7 bg-gradient-to-br from-indigo-500 to-blue-600 border border-white/10 shadow-sm relative">
          {workspace.logo_url ? (
            <img
              src={workspace.logo_url}
              alt={workspace.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white font-bold text-[11px] leading-none">
              {initials}
            </span>
          )}
        </div>

        {/* Name + plan — hidden when collapsed */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 min-w-0 overflow-hidden text-left"
            >
              <p className="text-[13px] font-bold text-white truncate leading-tight">
                {workspace.name}
              </p>
              {workspace.plan && (
                <p className="text-[11px] capitalize truncate font-medium text-gray-400 mt-0.5">
                  {workspace.plan} plan
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chevron — only when multiple workspaces */}
        <AnimatePresence>
          {!collapsed && workspaces.length > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-shrink-0 text-gray-500"
            >
              <motion.div
                animate={{ rotate: open ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={14} strokeWidth={2.5} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && !collapsed && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-1 right-1 z-50 rounded-xl overflow-hidden bg-white border border-gray-200 shadow-xl mt-1"
            >
              <div className="p-1.5 flex flex-col gap-0.5">
                {workspaces.map((ws) => {
                  const wsInitials = ws.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  const isActive = ws.id === workspace.id;

                  return (
                    <button
                      key={ws.id}
                      onClick={() => {
                        setWorkspace(ws);
                        localStorage.setItem("lastWorkspaceId", ws.id);
                        setOpen(false);
                        router.push("/space");
                      }}
                      className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg border-0 cursor-pointer transition-all text-left ${
                        isActive ? "bg-indigo-50" : "bg-transparent hover:bg-gray-50"
                      }`}
                    >
                      {/* Logo */}
                      <div className="flex-shrink-0 rounded-md overflow-hidden flex items-center justify-center w-6 h-6 bg-gradient-to-br from-indigo-500 to-blue-600 border border-gray-100 shadow-sm">
                        {ws.logo_url ? (
                          <img
                            src={ws.logo_url}
                            alt={ws.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-[9px]">
                            {wsInitials}
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-semibold truncate ${isActive ? "text-indigo-700" : "text-gray-900"}`}>
                          {ws.name}
                        </p>
                        {ws.plan && (
                          <p className={`text-[10px] capitalize font-medium ${isActive ? "text-indigo-500" : "text-gray-500"}`}>
                            {ws.plan} plan
                          </p>
                        )}
                      </div>

                      {/* Active check */}
                      {isActive && (
                        <Check size={14} className="text-indigo-600 flex-shrink-0" strokeWidth={3} />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
