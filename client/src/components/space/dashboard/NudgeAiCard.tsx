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
    <Card className="flex flex-col relative overflow-hidden group/chat h-full w-full">
      {/* Dynamic background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#4F46E5] opacity-[0.03] rounded-full blur-[60px] pointer-events-none group-hover/chat:opacity-[0.05] transition-all duration-700" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#0EA5E9] opacity-[0.03] rounded-full blur-[60px] pointer-events-none group-hover/chat:opacity-[0.05] transition-all duration-700" />

      <div className="relative flex flex-col p-5 flex-1 min-h-0 overflow-hidden z-10">
        {/* Header with clear chat */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#E5E7EB] flex-shrink-0">
          <div className="relative">
            <div className="relative w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-200 shadow-sm">
              <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="8" width="14" height="14" rx="6" fill="#4F46E5" />
                <rect x="8" y="26" width="14" height="14" rx="4" fill="#4F46E5" opacity="0.4" />
                <rect x="26" y="8" width="14" height="14" rx="4" fill="#0EA5E9" opacity="0.4" />
                <rect x="26" y="26" width="14" height="14" rx="6" fill="#0EA5E9" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-semibold text-gray-900 tracking-tight leading-none mb-1.5">Nudge Assistance</h3>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider leading-none">Online</p>
            </div>
          </div>
          {messages.length > 1 && (
            <button
              onClick={onClear}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 transition-all group border border-gray-200 bg-white cursor-pointer flex items-center justify-center shadow-sm"
              title="Clear session"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 group-hover:text-gray-900 transition-colors">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
              </svg>
            </button>
          )}
        </div>

        {/* Messages area */}
        <div ref={chatContainerRef} style={{ flex: 1, minHeight: 0, overflowY: "auto" }} className="py-4 space-y-4 pr-2 custom-scrollbar">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={i > 0 ? { opacity: 0, y: 10 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`flex items-start gap-3 ${m.role === "user" ? "justify-end" : ""}`}
            >
              {m.role === "ai" && (
                <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <svg width="14" height="14" viewBox="0 0 48 48" fill="none">
                    <rect x="8" y="8" width="14" height="14" rx="6" fill="#4F46E5" />
                    <rect x="26" y="26" width="14" height="14" rx="6" fill="#0EA5E9" />
                  </svg>
                </div>
              )}
              <div className={`${m.role === "user"
                ? "bg-gray-50 text-gray-900 border border-gray-200 shadow-sm"
                : "bg-transparent text-gray-900 border-transparent"
                } rounded-xl ${m.role === "user" ? "px-3.5 py-2.5" : "py-1"} max-w-[85%] relative overflow-hidden group transition-all duration-300`}>

                <div className="text-[13px] leading-relaxed font-medium relative z-10">
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
                    fallbackColor={me?.id ? strColor(me.id) : "#4F46E5"}
                    className="relative border border-gray-200"
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
              className="flex flex-col gap-2 pt-2"
            >
              {[
                { label: "📊 Project status", prompt: "Give me an overview of all projects and their current status" },
                { label: "⚠️ Stalled tasks", prompt: "Show me all stalled tasks that need attention" },
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => onSuggestionClick(chip.prompt)}
                  className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-[12px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer shadow-sm text-left focus:outline-none w-max"
                >
                  {chip.label}
                </button>
              ))}
            </motion.div>
          )}

          {/* Typing indicator */}
          {loading && messages[messages.length - 1].content === "" && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                <motion.div animate={{ scale: [0.8, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 2 }} className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]/40 shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
              </div>
              <div className="bg-transparent py-2">
                <div className="flex gap-2 items-center">
                  {[0, 0.2, 0.4].map((d) => (
                    <motion.div key={d} animate={{ y: [0, -3, 0], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: d }} className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  ))}
                  <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider ml-1">Analyzing...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="flex gap-3 pt-4 border-t border-[#E5E7EB] flex-shrink-0">
          <div className="flex-1 relative group/input">
            <input
              type="text"
              value={input}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask anything..."
              disabled={loading}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-600 focus:bg-white transition-all disabled:opacity-40 shadow-sm"
            />
          </div>
          <button
            onClick={onSend}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-lg border border-transparent bg-indigo-600 flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm text-white hover:bg-indigo-700 active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="relative transition-transform">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

      </div>
    </Card>
  );
}
