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
      className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-30"
    >
      <div className="px-3 py-2 border-b border-gray-50 flex items-center gap-1.5">
        <AtSign size={11} className="text-blue-400" />
        <span className="text-[10.5px] font-black uppercase tracking-wider text-gray-400">
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
          className="w-full flex items-center gap-2.5 px-3 py-2.5 cursor-pointer border-0 bg-transparent text-left transition-colors"
          style={{ background: idx === activeIndex ? "#EFF6FF" : "transparent" }}
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
              className="text-[13px] font-bold text-gray-800 truncate"
              style={{ fontFamily: "'Sora',sans-serif" }}
            >
              {member.full_name ?? member.email}
            </p>
            <p className="text-[10.5px] text-gray-400 truncate">{member.email}</p>
          </div>
          {idx === activeIndex && (
            <span className="text-[9px] text-blue-400 font-bold border border-blue-200 bg-blue-50 px-1.5 py-0.5 rounded-md flex-shrink-0">
              Enter
            </span>
          )}
        </button>
      ))}
    </motion.div>
  );
}
