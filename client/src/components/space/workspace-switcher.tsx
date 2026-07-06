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
            (e.currentTarget as HTMLElement).style.background = "#F9FAFB";
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
              : "linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)",
            border: "1px solid #E5E7EB",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
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
                className="text-[12.5px] font-[700] truncate leading-tight"
                style={{
                  color: "#111827",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {workspace.name}
              </p>
              {workspace.plan && (
                <p
                  className="text-[10px] capitalize truncate font-[600]"
                  style={{
                    color: "#6B7280",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
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
                style={{ color: "#9CA3AF" }}
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
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-2 right-2 z-50 rounded-xl overflow-hidden"
              style={{
                top: "calc(100% + 4px)",
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                boxShadow: "0 12px 32px rgba(0,0,0,0.06)",
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
                          ? "#F3F4F6"
                          : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive)
                          (e.currentTarget as HTMLElement).style.background =
                            "#F9FAFB";
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
                            : "linear-gradient(135deg, #4F46E5, #2563EB)",
                          border: "1px solid #E5E7EB",
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
                              ? "#4F46E5"
                              : "#111827",
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}
                        >
                          {ws.name}
                        </p>
                        {ws.plan && (
                          <p
                            className="text-[10px] capitalize font-medium"
                            style={{ color: "#6B7280" }}
                          >
                            {ws.plan}
                          </p>
                        )}
                      </div>

                      {/* Active check */}
                      {isActive && (
                        <Check size={12} style={{ color: "#4F46E5", flexShrink: 0 }} strokeWidth={3} />
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
