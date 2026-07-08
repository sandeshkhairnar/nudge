"use client";

import { motion, AnimatePresence } from "framer-motion";
import { User } from "lucide-react";
import { useRef } from "react";
import GlobalAvatar from "@/components/global/Avatar";
import { strColor } from "@/lib/utils/color";
import { MentionSuggestion } from "@/types";

const NUDGE_BOT_ID = "6e6cb238-3601-4873-8e92-9a0c54614991";

interface MentionDropdownProps {
  suggestions: MentionSuggestion[];
  query: string | null;
  activeIndex: number;
  isThread: boolean;
  currentIsThread: boolean;
  onSelect: (member: MentionSuggestion) => void;
}

export default function MentionDropdown({
  suggestions,
  query,
  activeIndex,
  isThread,
  currentIsThread,
  onSelect,
}: MentionDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  if (query === null || suggestions.length === 0 || currentIsThread !== isThread) {
    return null;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="absolute bottom-full left-0 right-0 mb-2 z-40 overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(79,70,229,0.12)",
        borderRadius: 16,
        boxShadow:
          "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(79,70,229,0.08), 0 1px 3px rgba(0,0,0,0.04)",
        maxHeight: 260,
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        className="px-3.5 py-2.5 flex items-center gap-2"
        style={{
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          background: "linear-gradient(to right, rgba(79,70,229,0.03), transparent)",
        }}
      >
        <div className="w-4 h-4 rounded-md bg-indigo-100 flex items-center justify-center">
          <span className="text-[9px] font-black text-indigo-600">@</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Mention
        </span>
        {query && (
          <span className="ml-auto text-[10px] font-semibold text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded-md">
            {query}
          </span>
        )}
      </div>

      {/* Suggestions */}
      <div className="py-1">
        {suggestions.map((member, idx) => {
          const isBot = member.id === NUDGE_BOT_ID;
          const isActive = idx === activeIndex;

          return (
            <button
              key={member.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(member);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 cursor-pointer border-0 text-left transition-all duration-100 relative group"
              style={{
                background: isActive
                  ? isBot
                    ? "linear-gradient(to right, rgba(79,70,229,0.08), rgba(79,70,229,0.03))"
                    : "rgba(0,0,0,0.04)"
                  : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.025)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <motion.div
                  layoutId="mention-active"
                  className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full"
                  style={{ background: isBot ? "#4F46E5" : "#6B7280" }}
                  transition={{ duration: 0.15 }}
                />
              )}

              {/* Avatar — use GlobalAvatar for both bot and humans */}
              <div className="relative flex-shrink-0">
                <GlobalAvatar
                  url={member.avatar_url}
                  name={member.full_name}
                  email={member.email}
                  size={30}
                  fallbackColor={isBot ? "#4F46E5" : strColor(member.id)}
                />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p
                    className="text-[13px] font-semibold truncate leading-tight"
                    style={{ color: isBot ? "#4F46E5" : "#0D0D0D" }}
                  >
                    {member.full_name ?? member.email}
                  </p>
                  {isBot && (
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: "rgba(79,70,229,0.1)",
                        color: "#4F46E5",
                        border: "1px solid rgba(79,70,229,0.2)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      AI
                    </span>
                  )}
                </div>
                <p
                  className="text-[10.5px] truncate leading-tight mt-0.5"
                  style={{ color: isBot ? "#818CF8" : "#B0B0A8" }}
                >
                  {isBot ? "Ask Nudge AI anything" : member.email}
                </p>
              </div>

              {/* Enter hint */}
              {isActive && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
                  style={{
                    color: isBot ? "#4F46E5" : "#6B7280",
                    background: isBot ? "rgba(79,70,229,0.08)" : "rgba(0,0,0,0.05)",
                    border: `1px solid ${isBot ? "rgba(79,70,229,0.2)" : "rgba(0,0,0,0.08)"}`,
                  }}
                >
                  ↵
                </motion.span>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}