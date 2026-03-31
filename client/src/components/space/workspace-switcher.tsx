"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspaceStore } from "@/store/workspace-store";
import { Check, ChevronDown, Building } from "lucide-react";

interface Props {
  collapsed: boolean;
}

export function WorkspaceSwitcher({ collapsed }: Props) {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const [open, setOpen] = useState(false);

  if (!workspace) return null;

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
        className="w-full flex items-center gap-2.5 cursor-pointer border-0 bg-transparent transition-all rounded-none"
        style={{
          padding: collapsed ? "10px 0" : "10px 14px",
          justifyContent: collapsed ? "center" : "flex-start",
        }}
        onMouseEnter={(e) => {
          if (workspaces.length > 1)
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        {/* Logo / Avatar */}
        <div
          className="flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            background: workspace.logo_url
              ? "transparent"
              : "linear-gradient(135deg, #36C5F0 0%, #2EB67D 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          {workspace.logo_url ? (
            <img
              src={workspace.logo_url}
              alt={workspace.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              className="text-white font-black leading-none"
              style={{ fontSize: 11 }}
            >
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
              <p
                className="text-[12.5px] font-bold truncate leading-tight"
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {workspace.name}
              </p>
              {workspace.plan && (
                <p
                  className="text-[10px] capitalize truncate"
                  style={{
                    color: "rgba(255,255,255,0.28)",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
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
              style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }}
            >
              <motion.div
                animate={{ rotate: open ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={13} />
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
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-2 right-2 z-50 rounded-xl overflow-hidden"
              style={{
                top: "calc(100% + 4px)",
                background: "#141414",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
              }}
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
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border-0 cursor-pointer transition-all text-left"
                      style={{
                        background: isActive
                          ? "rgba(54,197,240,0.08)"
                          : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive)
                          (e.currentTarget as HTMLElement).style.background =
                            "rgba(255,255,255,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive)
                          (e.currentTarget as HTMLElement).style.background =
                            "transparent";
                      }}
                    >
                      {/* Logo */}
                      <div
                        className="flex-shrink-0 rounded-md overflow-hidden flex items-center justify-center"
                        style={{
                          width: 24,
                          height: 24,
                          background: ws.logo_url
                            ? "transparent"
                            : "linear-gradient(135deg, #36C5F0, #2EB67D)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {ws.logo_url ? (
                          <img
                            src={ws.logo_url}
                            alt={ws.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span
                            className="text-white font-black"
                            style={{ fontSize: 9 }}
                          >
                            {wsInitials}
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[12px] font-bold truncate"
                          style={{
                            color: isActive
                              ? "#36C5F0"
                              : "rgba(255,255,255,0.7)",
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {ws.name}
                        </p>
                        {ws.plan && (
                          <p
                            className="text-[10px] capitalize"
                            style={{ color: "rgba(255,255,255,0.25)" }}
                          >
                            {ws.plan}
                          </p>
                        )}
                      </div>

                      {/* Active check */}
                      {isActive && (
                        <Check size={12} style={{ color: "#36C5F0", flexShrink: 0 }} />
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