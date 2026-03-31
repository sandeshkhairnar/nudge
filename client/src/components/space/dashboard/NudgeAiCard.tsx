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
    <Card className="flex flex-col relative overflow-hidden group/chat" style={{ height: 500, maxHeight: 500 }}>
      {/* Dynamic background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#36C5F0] opacity-[0.04] rounded-full blur-[60px] pointer-events-none group-hover/chat:opacity-[0.06] transition-all duration-700" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#2EB67D] opacity-[0.04] rounded-full blur-[60px] pointer-events-none group-hover/chat:opacity-[0.06] transition-all duration-700" />

      <div className="relative flex flex-col p-5 h-full overflow-hidden z-10">
        {/* Header with clear chat */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#F4F4F0] flex-shrink-0">
          <div className="relative">
            <div className="relative w-10 h-10 rounded-2xl bg-[#F9F9F8] flex items-center justify-center border border-[#F4F4F0] shadow-sm">
              <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                <rect x="6" y="6" width="16" height="16" rx="8" fill="#36C5F0" />
                <rect x="6" y="26" width="16" height="16" rx="4" fill="#36C5F0" opacity="0.4" />
                <rect x="26" y="6" width="16" height="16" rx="4" fill="#2EB67D" opacity="0.4" />
                <rect x="26" y="26" width="16" height="16" rx="8" fill="#2EB67D" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-[800] text-[#111111] tracking-[-0.01em] leading-none mb-1.5">Nudge Assistance</h3>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <p className="text-[9px] font-[800] text-[#A0A09B] uppercase tracking-[0.15em] leading-none">Online</p>
            </div>
          </div>
          {messages.length > 1 && (
            <button
              onClick={onClear}
              className="w-8 h-8 rounded-xl hover:bg-[#F9F9F8] transition-all group border border-[#F4F4F0] bg-white cursor-pointer flex items-center justify-center shadow-sm"
              title="Clear session"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#A0A09B] group-hover:text-[#111111] transition-colors">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
              </svg>
            </button>
          )}
        </div>

        {/* Messages area */}
        <div ref={chatContainerRef} style={{ flex: 1, minHeight: 0, overflowY: "auto" }} className="py-4 space-y-4 scrollbar-hide pr-1">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={i > 0 ? { opacity: 0, y: 10 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`flex items-start gap-3 ${m.role === "user" ? "justify-end" : ""}`}
            >
              {m.role === "ai" && (
                <div className="w-7 h-7 rounded-lg bg-[#F9F9F8] border border-[#F4F4F0] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <svg width="14" height="14" viewBox="0 0 48 48" fill="none">
                    <rect x="6" y="6" width="16" height="16" rx="8" fill="#36C5F0" />
                    <rect x="26" y="26" width="16" height="16" rx="8" fill="#2EB67D" />
                  </svg>
                </div>
              )}
              <div className={`${m.role === "user"
                ? "bg-[#F9F9F8] text-[#111111] border border-[#F4F4F0] shadow-sm"
                : "bg-transparent text-[#111111] border-transparent"
                } rounded-[18px] ${m.role === "user" ? "px-4 py-3" : "py-1"} max-w-[85%] relative overflow-hidden group transition-all duration-300`}>

                <div className={`${m.role === "user" ? "text-[13px]" : "text-[13px]"} leading-relaxed tracking-wide font-medium relative z-10`}>
                  {m.role === "ai" ? <Streamdown>{m.content}</Streamdown> : m.content}
                </div>
              </div>
              {m.role === "user" && (
                <div className="flex-shrink-0 mt-0.5 relative">
                  <Avatar
                    url={me?.avatar_url || null}
                    name={me?.full_name || "You"}
                    email={me?.email || ""}
                    size={28}
                    fallbackColor={me?.id ? strColor(me.id) : "#A259FF"}
                    className="relative border border-[#F4F4F0]"
                  />
                </div>
              )}
            </motion.div>
          ))}

          {/* Suggestion chips */}
          {messages.length === 1 && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="flex flex-wrap gap-2 pt-2"
            >
              {[
                { label: "📊 Project status", prompt: "Give me an overview of all projects and their current status" },
                { label: "⚠️ Stalled tasks", prompt: "Show me all stalled tasks that need attention" },
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => onSuggestionClick(chip.prompt)}
                  className="px-3.5 py-2.5 rounded-xl bg-white border border-[#F4F4F0] text-[11px] font-[700] text-[#A0A09B] hover:text-[#111111] hover:bg-[#F9F9F8] hover:border-[#E0E0E0] transition-all duration-300 cursor-pointer shadow-sm text-left focus:outline-none w-max"
                >
                  {chip.label}
                </button>
              ))}
            </motion.div>
          )}

          {/* Typing indicator */}
          {loading && messages[messages.length - 1].content === "" && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#F9F9F8] border border-[#F4F4F0] flex items-center justify-center flex-shrink-0 shadow-sm">
                <motion.div animate={{ scale: [0.8, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 2 }} className="w-2.5 h-2.5 rounded-full bg-[#36C5F0]/40 shadow-[0_0_10px_rgba(54,197,240,0.5)]" />
              </div>
              <div className="bg-transparent py-2">
                <div className="flex gap-2 items-center">
                  {[0, 0.2, 0.4].map((d) => (
                    <motion.div key={d} animate={{ y: [0, -3, 0], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: d }} className="w-1.5 h-1.5 rounded-full bg-[#111111]/30" />
                  ))}
                  <span className="text-[9px] font-[800] text-[#A0A09B] uppercase tracking-[0.2em] ml-1">Analyzing...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="flex gap-3 pt-4 border-t border-[#F4F4F0] flex-shrink-0">
          <div className="flex-1 relative group/input">
            <input
              type="text"
              value={input}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask anything..."
              disabled={loading}
              className="w-full bg-[#F9F9F8] border border-[#F4F4F0] rounded-[14px] px-4 py-3.5 text-[12px] font-medium text-[#111111] placeholder:text-[#A0A09B] outline-none focus:border-[#E0E0E0] focus:bg-white transition-all disabled:opacity-40 tracking-wide shadow-sm"
            />
          </div>
          <button
            onClick={onSend}
            disabled={loading || !input.trim()}
            className="w-[46px] h-[46px] rounded-[14px] border border-transparent bg-gradient-to-br from-[#36C5F0] to-[#2EB67D] flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-md text-white hover:opacity-90 active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="relative transition-transform">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

      </div>
    </Card>
  );
}
