"use client";

import { motion } from "framer-motion";
import { Streamdown } from "streamdown";
import Avatar from "@/components/global/Avatar";
import { Card } from "./DashboardBase";
import { strColor } from "@/lib/utils/color";

interface NudgeAiCardProps {
  messages: { role: string; content: string }[];
  input: string;
  loading: boolean;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSuggestionClick: (prompt: string) => void;
  me: { id: string; full_name: string | null; avatar_url: string | null; email: string | null } | null;
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  onClear: () => void;
}

export default function NudgeAiCard({
  messages,
  input,
  loading,
  onInputChange,
  onSend,
  onKeyDown,
  onSuggestionClick,
  me,
  chatContainerRef,
  onClear
}: NudgeAiCardProps) {
  return (
    <Card dark className="flex flex-col overflow-hidden" style={{ height: 500, maxHeight: 500 }}>
      <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "18px 18px" }} />

      <div className="relative flex flex-col p-4" style={{ height: "100%", maxHeight: 500, overflow: "hidden" }}>

        {/* Header with clear chat */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/10 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-[#0D0D0D] flex items-center justify-center flex-shrink-0 shadow-lg ring-1 ring-white/10">
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
              <rect x="6" y="6" width="16" height="16" rx="8" fill="#36C5F0" />
              <rect x="6" y="26" width="16" height="16" rx="4" fill="#36C5F0" opacity="0.4" />
              <rect x="26" y="6" width="16" height="16" rx="4" fill="#2EB67D" opacity="0.4" />
              <rect x="26" y="26" width="16" height="16" rx="8" fill="#2EB67D" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white leading-tight">Nudge AI</h3>
            <p className="text-[10px] text-green-400 leading-tight">● online</p>
          </div>
          {messages.length > 1 && (
            <button
              onClick={onClear}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors group border-0 bg-transparent cursor-pointer"
              title="Clear chat"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30 group-hover:text-white/60 transition-colors">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
              </svg>
            </button>
          )}
        </div>

        {/* Messages area */}
        <div ref={chatContainerRef} style={{ flex: 1, minHeight: 0, overflowY: "auto" }} className="py-3 space-y-3 scrollbar-hide">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={i > 0 ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex items-start gap-2 ${m.role === "user" ? "justify-end" : ""}`}
            >
              {m.role === "ai" && (
                <div className="w-6 h-6 rounded-lg bg-[#0D0D0D] ring-1 ring-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 48 48" fill="none">
                    <rect x="6" y="6" width="16" height="16" rx="8" fill="#36C5F0" />
                    <rect x="6" y="26" width="16" height="16" rx="4" fill="#36C5F0" opacity="0.4" />
                    <rect x="26" y="6" width="16" height="16" rx="4" fill="#2EB67D" opacity="0.4" />
                    <rect x="26" y="26" width="16" height="16" rx="8" fill="#2EB67D" />
                  </svg>
                </div>
              )}
              <div className={`${m.role === "user"
                ? "bg-gradient-to-br from-[#36C5F0]/25 to-[#2EB67D]/15 border border-[#36C5F0]/20 text-white"
                : "bg-white/[0.07] text-white/85 border border-white/[0.06]"
                } rounded-xl p-2.5 max-w-[85%] shadow-sm`}>
                <div className="text-xs leading-relaxed">
                  {m.role === "ai" ? <Streamdown>{m.content}</Streamdown> : m.content}
                </div>
              </div>
              {m.role === "user" && (
                <div className="flex-shrink-0 mt-0.5">
                  <Avatar
                    url={me?.avatar_url || null}
                    name={me?.full_name || "You"}
                    email={me?.email || ""}
                    size={24}
                    fallbackColor={me?.id ? strColor(me.id) : "#A259FF"}
                  />
                </div>
              )}
            </motion.div>
          ))}

          {/* Suggestion chips — show only on initial state */}
          {messages.length === 1 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-1.5 pt-1"
            >
              {[
                { label: "📊 Project status", prompt: "Give me an overview of all projects and their current status" },
                { label: "⚠️ Stalled tasks", prompt: "Show me all stalled tasks that need attention" },
                { label: "📋 My tasks", prompt: "What tasks are currently assigned to me?" },
                { label: "🏥 Health check", prompt: "Run a health check on all active projects" },
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => onSuggestionClick(chip.prompt)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-[10px] text-white/60 hover:text-white hover:bg-white/10 hover:border-white/15 transition-all duration-200 cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </motion.div>
          )}

          {/* Typing indicator */}
          {loading && messages[messages.length - 1].content === "" && (
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#0D0D0D] ring-1 ring-white/10 flex items-center justify-center flex-shrink-0">
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-2 h-2 rounded-full bg-[#36C5F0]" />
              </div>
              <div className="bg-white/[0.07] border border-white/[0.06] rounded-xl p-2.5">
                <div className="flex gap-1.5 items-center">
                  <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-[#36C5F0]/60" />
                  <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[#36C5F0]/60" />
                  <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-[#36C5F0]/60" />
                  <span className="text-[9px] text-white/25 ml-1">thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="flex gap-2 pt-3 border-t border-white/10 flex-shrink-0">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about tasks, projects, team..."
              disabled={loading}
              className="w-full bg-white/[0.07] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/25 outline-none focus:ring-1 focus:ring-[#36C5F0]/50 focus:border-[#36C5F0]/30 transition-all disabled:opacity-40"
            />
          </div>
          <button
            onClick={onSend}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-br from-[#36C5F0] to-[#2EB67D] hover:from-[#2ba9d4] hover:to-[#28a06e] w-9 h-9 rounded-xl border-0 flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#36C5F0]/20 cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

      </div>
    </Card>
  );
}
