"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { Bell, MessageSquare, AtSign, AlertCircle, X, Hash } from "lucide-react";

export type ToastType = "mention" | "message" | "task" | "system";

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  projectName?: string;
  channelName?: string;
  onClose: (id: string) => void;
  onClick?: () => void;
}

const toastConfig: Record<ToastType, { icon: React.ElementType; color: string; label: string; bg: string }> = {
  mention: { icon: AtSign, color: "#36C5F0", label: "Mention", bg: "rgba(54,197,240,0.08)" },
  message: { icon: MessageSquare, color: "#2EB67D", label: "Message", bg: "rgba(46,182,125,0.08)" },
  task: { icon: AlertCircle, color: "#ECB22E", label: "Task", bg: "rgba(236,178,46,0.08)" },
  system: { icon: Bell, color: "#A259FF", label: "System", bg: "rgba(162,89,255,0.08)" },
};

export function Toast({ id, type, title, message, projectName, channelName, onClose, onClick }: ToastProps) {
  const cfg = toastConfig[type];
  const Icon = cfg.icon;

  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.94, transition: { duration: 0.18 } }}
      onClick={onClick}
      className="relative flex gap-3 p-3.5 rounded-2xl cursor-pointer overflow-hidden"
      style={{
        width: 320,
        background: "rgba(13,13,13,0.95)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl"
        style={{ background: cfg.color }}
      />

      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: cfg.bg, border: `1px solid ${cfg.color}22` }}
      >
        <Icon size={15} style={{ color: cfg.color }} />
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[12px] font-black text-white truncate">{title}</span>
            <span
              className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              {cfg.label}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(id); }}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md text-white/30 hover:text-white/70 border-0 bg-transparent cursor-pointer transition-colors"
          >
            <X size={11} />
          </button>
        </div>

        {(projectName || channelName) && (
          <div className="flex items-center gap-1 mb-1">
            {projectName && (
              <span className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>
                {projectName}
              </span>
            )}
            {channelName && (
              <>
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>·</span>
                <Hash size={9} style={{ color: "rgba(255,255,255,0.3)" }} />
                <span className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {channelName}
                </span>
              </>
            )}
          </div>
        )}

        <p className="text-[12px] leading-relaxed line-clamp-2" style={{ color: "rgba(255,255,255,0.55)" }}>
          {message}
        </p>
      </div>
    </motion.div>
  );
}

export function ToastContainer({ toasts, onClose }: { toasts: ToastProps[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 items-end">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}