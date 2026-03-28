"use client";

import { motion } from "framer-motion";
import { AtSign } from "lucide-react";
import { useRef } from "react";
import GlobalAvatar from "@/components/global/Avatar";
import { strColor } from "@/lib/utils/color";
import { MentionSuggestion } from "@/types";

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
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.97 }}
      transition={{ duration: 0.12 }}
      className="absolute bottom-full left-0 right-0 mb-2 z-40 overflow-hidden"
      style={{
        background: "#fff",
        border: "1px solid #E8E8E4",
        borderRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
        maxHeight: 220,
        overflowY: "auto",
      }}
    >
      <div
        className="px-3 py-2 flex items-center gap-1.5"
        style={{ borderBottom: "1px solid #F0F0EB" }}
      >
        <AtSign size={11} className="text-blue-400" />
        <span
          className="text-[10px] font-black uppercase tracking-wider"
          style={{ color: "#C4C4BC", letterSpacing: "0.08em" }}
        >
          Mention someone
        </span>
      </div>

      {suggestions.map((member, idx) => (
        <button
          key={member.id}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(member);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 cursor-pointer border-0 text-left transition-colors"
          style={{ background: idx === activeIndex ? "#F4F4F1" : "transparent" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#F7F7F4";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              idx === activeIndex ? "#F4F4F1" : "transparent";
          }}
        >
          <GlobalAvatar
            url={member.avatar_url}
            name={member.full_name}
            email={member.email}
            size={26}
            fallbackColor={strColor(member.id)}
          />
          <div className="min-w-0 flex-1">
            <p
              className="text-[12.5px] font-semibold truncate leading-tight"
              style={{ color: "#0D0D0D", fontFamily: "'Sora', sans-serif" }}
            >
              {member.full_name ?? member.email}
            </p>
            <p
              className="text-[10.5px] truncate leading-tight"
              style={{ color: "#B0B0A8" }}
            >
              {member.email}
            </p>
          </div>
          {idx === activeIndex && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
              style={{
                color: "#60A5FA",
                background: "#EFF6FF",
                border: "1px solid #BFDBFE",
              }}
            >
              Enter
            </span>
          )}
        </button>
      ))}
    </motion.div>
  );
}