"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, FileText, CornerDownRight, Trash2, MessageCircle,
  Smile, CheckCircle2, Video, Calendar, ClipboardList, Zap,
} from "lucide-react";
import GlobalAvatar from "@/components/global/Avatar";
import { strColor } from "@/lib/utils/color";
import { formatTime, formatBytes, renderMarkdown } from "@/lib/utils/formatters";
import { Message, Reaction, QUICK_EMOJIS } from "@/types";

interface MessageRowProps {
  message: Message;
  isSelf: boolean;
  sameSender: boolean;
  isThread?: boolean;
  reactions: Reaction[];
  replyCount?: number;
  hoveredMsgId: string | null;
  deleteConfirmId: string | null;
  deletingId: string | null;
  activeThreadId: string | null;
  currentUserId: string;
  onHover: (id: string | null) => void;
  onToggleReaction: (msgId: string, emoji: string) => void;
  onOpenThread?: (msgId: string) => void;
  onDeleteRequest: (msgId: string) => void;
  onDeleteConfirm: (msgId: string, isThread: boolean) => void;
  onDeleteCancel: () => void;
}

export default function MessageRow({
  message: m,
  isSelf,
  sameSender,
  isThread = false,
  reactions,
  replyCount = 0,
  hoveredMsgId,
  deleteConfirmId,
  deletingId,
  activeThreadId,
  currentUserId,
  onHover,
  onToggleReaction,
  onOpenThread,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: MessageRowProps) {
  const name = m.profiles?.full_name ?? "Unknown";
  const isHovered = hoveredMsgId === m.id;
  const showDeleteConfirm = deleteConfirmId === m.id;
  const isDeleting = deletingId === m.id;

  const parsed = (() => {
    let data: any = m.content;

    for (let i = 0; i < 2; i++) {
      if (typeof data === "string" && (data.trim().startsWith("{") || data.trim().startsWith("["))) {
        try {
          const next = JSON.parse(data);
          if (next && (typeof next === "object" || typeof next === "string")) {
            data = next;
          }
        } catch (e) {
          break;
        }
      } else {
        break;
      }
    }

    let finalType = data && typeof data === "object" ? data.type : undefined;
    let finalText = data && typeof data === "object" ? (data.text ?? "") : String(m.content);
    let attachments = data && typeof data === "object" ? data.attachments : undefined;

    if (!finalType && typeof finalText === "string") {
      const lowerText = finalText.toLowerCase();
      if (lowerText.includes("started a meeting")) finalType = "system_call";
      else if (lowerText.includes("ended the meeting")) finalType = "system_call_ended";
      else if (lowerText.includes("is calling you")) finalType = "system_call_ringing";
    }

    if (!finalType && finalText.trim().startsWith("{") && finalText.includes('"text"')) {
      const match = finalText.match(/"text"\s*:\s*"([^"]*)"?/);
      if (match) {
        finalText = match[1];
        const lowerText = finalText.toLowerCase();
        if (lowerText.includes("started a meeting")) finalType = "system_call";
        else if (lowerText.includes("ended the meeting")) finalType = "system_call_ended";
        else if (lowerText.includes("is calling you")) finalType = "system_call_ringing";
      }
    }

    return {
      text: finalText,
      type: finalType,
      attachments: attachments,
      room: data?.room
    };
  })();

  // ── System call / meeting pills ──────────────────────────────────────────
  if (
    parsed.type?.startsWith("system_") ||
    parsed.type === "call" ||
    parsed.type === "call_ended" ||
    parsed.type === "nudge"
  ) {
    const isOngoing = parsed.type === "system_call" || parsed.type === "call";
    const isEnded = parsed.type === "system_call_ended" || parsed.type === "call_ended";
    const isNudge = parsed.type === "nudge" || parsed.type === "system_nudge";

    return (
      <div
        key={m.id}
        className="group relative flex items-center justify-center py-2 px-4 hover:bg-[#F9F9F7]/30 rounded-lg transition-colors border-0"
        onMouseEnter={() => onHover(m.id)}
        onMouseLeave={() => onHover(null)}
      >
        <div className="flex items-center gap-2.5 bg-[#F9F9F7] border border-[#F0F0EB] px-3 py-1 rounded-full">
          <span className={`flex items-center justify-center w-4.5 h-4.5 rounded-full ${isEnded ? 'bg-emerald-100 text-emerald-600' : isNudge ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-100 text-indigo-600'}`}>
            {isEnded ? <CheckCircle2 size={11} /> : isNudge ? <Zap size={10} strokeWidth={3} className="fill-emerald-500" /> : isOngoing ? <Video size={11} /> : <Calendar size={11} />}
          </span>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-500">
            <span
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(parsed.text.replace(/\[Join now\].*$/, "").trim()).replace(/<br\/>/g, " ")
              }}
              className="inline-block [&>p]:inline-block [&>p]:m-0"
            />
            <span className="text-gray-300 ml-0.5">•</span>
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{formatTime(m.created_at)}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── MOM Card (system-generated, centered in chat) ────────────────────────
  if (parsed.type === "mom_card" || (parsed.text && parsed.text.startsWith("[MOM_CARD]\n"))) {
    const rawMarkdown =
      parsed.type === "mom_card"
        ? parsed.text
        : parsed.text.replace("[MOM_CARD]\n", "");

    // Parse markdown sections into structured data
    const sections: { heading: string; icon: string; items: string[] }[] = [];
    const lines = rawMarkdown.split("\n");
    let currentSection: { heading: string; icon: string; items: string[] } | null = null;

    const sectionIcons: Record<string, string> = {
      summary: "🤔",
      "key decisions": "📝",
      "action items": "📋",
    };

    for (const line of lines) {
      const h2 = line.match(/^#{2,3}\s+(.+)/);
      const bullet = line.match(/^[*-]\s+(.+)/);
      const isBlank = line.trim() === "" || line.trim().startsWith("---");

      if (h2) {
        if (currentSection) sections.push(currentSection);
        const headingText = h2[1].replace(/[\p{Emoji}\uFE0F]/gu, "").trim();
        const key = headingText.toLowerCase();
        // Skip date/metadata sections
        if (key.startsWith("date")) {
          currentSection = null;
          continue;
        }
        currentSection = {
          heading: headingText,
          icon: sectionIcons[key] ?? "•",
          items: [],
        };
      } else if (bullet && currentSection) {
        // Strip bold markdown from bullet items
        currentSection.items.push(bullet[1].replace(/\*\*(.*?)\*\*/g, "$1").trim());
      } else if (!isBlank && currentSection && line.trim().length > 0 && !line.startsWith("#")) {
        // Treat plain paragraph lines as items (fixes Summary not showing)
        currentSection.items.push(line.trim());
      }
    }
    if (currentSection) sections.push(currentSection);

    return (
      <div
        key={m.id}
        className="flex flex-col items-center w-full px-4 py-3 my-2"
        onMouseEnter={() => onHover(m.id)}
        onMouseLeave={() => onHover(null)}
      >
        {/* Divider line with label — matches system message visual language */}
        <div className="flex items-center gap-3 w-full max-w-[560px] mb-3">
          <div className="flex-1 h-px bg-[#EBEBEB]" />
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F4F4F1] border border-[#E8E8E4] rounded-full">
            <ClipboardList size={10} className="text-gray-400" />
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Meeting Minutes · {formatTime(m.created_at)}
            </span>
          </div>
          <div className="flex-1 h-px bg-[#EBEBEB]" />
        </div>

        {/* Card */}
        <div className="w-full max-w-[560px] bg-white border border-[#E8E8E4] rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]">

          {/* Card header */}
          <div className="flex items-center gap-3 px-5 py-3.5 bg-[#FAFAF8] border-b border-[#F0F0EB]">
            <div className="w-7 h-7 rounded-[9px] bg-emerald-50 flex items-center justify-center text-[15px]">
              <Zap size={12} className={'fill-emerald-500 border-none'} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-[#0D0D0D] leading-tight">AI Meeting Minutes</p>
              <p className="text-[10px] font-semibold text-[#B0B0A8] uppercase tracking-wider mt-0.5">
                Generated by Nudge Engine
              </p>
            </div>
            {/* Pulse indicator — same visual pattern as call pills */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#EBEBEB] rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-[#36C5F0] animate-pulse" />
              <span className="text-[9px] font-black text-[#B0B0A8] uppercase tracking-wider">Auto</span>
            </div>
          </div>

          {/* Sections */}
          <div className="px-5 py-4 flex flex-col gap-4">
            {sections.map((section, si) => (
              <div key={si}>
                {/* Section heading */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[13px]">{section.icon}</span>
                  <span className="text-[11.5px] font-black text-[#0D0D0D] uppercase tracking-wide">
                    {section.heading}
                  </span>
                </div>

                {/* Items */}
                <ul className="flex flex-col gap-1.5 pl-1">
                  {section.items.map((item, ii) => (
                    <li key={ii} className="flex items-start gap-2.5">
                      {section.heading.toLowerCase().includes("action") ? (
                        // Action items get a checkbox-style dot
                        <span className="mt-[5px] w-3.5 h-3.5 rounded-[4px] border border-[#C8C8C0] flex-shrink-0" />
                      ) : (
                        // Other items get a subtle bullet
                        <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#C8C8C0] flex-shrink-0" />
                      )}
                      <span className="text-[13px] text-[#4A4A45] leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Divider between sections (not after last) */}
                {si < sections.length - 1 && (
                  <div className="mt-4 h-px bg-[#F0F0EB]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Regular message ──────────────────────────────────────────────────────
  return (
    <div
      key={m.id}
      className="group relative flex gap-0 px-3 sm:px-4 hover:bg-[#F9F9F7] rounded-lg transition-colors"
      style={{ paddingTop: sameSender ? 2 : 12, paddingBottom: 2 }}
      onMouseEnter={() => onHover(m.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div style={{ width: 40, flexShrink: 0, paddingTop: 2 }}>
        {!sameSender ? (
          <GlobalAvatar
            url={m.profiles?.avatar_url}
            name={name}
            email={(m.profiles as { email?: string })?.email}
            size={32}
            fallbackColor={strColor(m.user_id)}
          />
        ) : isHovered ? (
          <span
            className="text-[10px] text-gray-300 block text-right pr-1 leading-loose select-none"
            style={{ paddingTop: 5 }}
          >
            {new Date(m.created_at).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </span>
        ) : null}
      </div>

      <div className="flex-1 min-w-0 pl-2.5">
        {!sameSender && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className={`text-[13.5px] font-black ${m.is_ai ? "text-violet-600" : "text-gray-900"}`}>
              {isSelf ? "You" : name}
            </span>
            <span className="text-[11px] text-gray-400">{formatTime(m.created_at)}</span>
            {m.is_ai && (
              <span className="flex items-center gap-0.5 text-[9px] font-black tracking-wider text-violet-500 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded-full">
                ✦ AI
              </span>
            )}
          </div>
        )}

        {parsed.text && (
          <p
            className={`text-[14px] leading-[1.6] break-words ${m.is_ai ? "text-violet-700" : "text-gray-800"}`}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(parsed.text) }}
          />
        )}

        {parsed.attachments && (parsed.attachments as unknown[]).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {(parsed.attachments as { type: string; url: string; name: string; size?: number }[]).map((a, ai) =>
              a.type === "image" ? (
                <a key={ai} href={a.url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={a.url}
                    alt={a.name}
                    className="rounded-xl border border-gray-100 object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                    style={{ maxWidth: "min(280px, 90vw)", maxHeight: 200 }}
                  />
                </a>
              ) : (
                <a
                  key={ai}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl no-underline hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[12.5px] font-semibold text-gray-800">{a.name}</p>
                    {a.size && <p className="text-[10px] text-gray-400">{formatBytes(a.size)}</p>}
                  </div>
                </a>
              )
            )}
          </div>
        )}

        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {reactions.map((r, ri) => (
              <button
                key={ri}
                onClick={() => onToggleReaction(m.id, r.emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] border cursor-pointer transition-all ${r.mine
                  ? "bg-blue-50 border-blue-200 text-blue-800"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
              >
                {r.emoji}
                <span className="text-[11px] font-semibold">{r.count}</span>
              </button>
            ))}
          </div>
        )}

        {!isThread && replyCount > 0 && (
          <button
            onClick={() => onOpenThread?.(m.id)}
            className="flex items-center gap-1.5 mt-1.5 text-[11.5px] font-semibold text-blue-500 hover:text-blue-700 hover:underline cursor-pointer border-0 bg-transparent p-0 transition-colors"
          >
            <CornerDownRight size={11} />
            {replyCount} {replyCount === 1 ? "reply" : "replies"}
          </button>
        )}

        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mt-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl"
          >
            <span className="text-[11.5px] text-red-600 font-semibold flex-1">
              Delete this message?
            </span>
            <button
              onClick={() => onDeleteConfirm(m.id, isThread)}
              disabled={isDeleting}
              className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-[11px] font-bold cursor-pointer border-0 flex items-center gap-1 disabled:opacity-60"
            >
              {isDeleting ? <Loader2 size={10} className="animate-spin" /> : null}
              Delete
            </button>
            <button
              onClick={onDeleteCancel}
              className="px-2.5 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg text-[11px] font-bold cursor-pointer"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isHovered && !showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.1 }}
            className="absolute right-3 -top-4 flex items-center gap-0.5 bg-white border border-gray-200 rounded-xl shadow-lg px-1.5 py-1 z-10"
          >
            {QUICK_EMOJIS.slice(0, 5).map((emoji) => (
              <button
                key={emoji}
                onClick={() => onToggleReaction(m.id, emoji)}
                className="text-base w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg cursor-pointer border-0 bg-transparent hover:scale-110 transition-all"
              >
                {emoji}
              </button>
            ))}
            <div className="w-px h-4 bg-gray-200 mx-0.5" />
            {!isThread && (
              <button
                onClick={() => onOpenThread?.(m.id)}
                title="Reply in thread"
                className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg cursor-pointer border-0 bg-transparent text-gray-400 hover:text-gray-700 transition-colors"
              >
                <MessageCircle size={13} />
              </button>
            )}
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg cursor-pointer border-0 bg-transparent text-gray-400">
              <Smile size={13} />
            </button>
            {isSelf && (
              <>
                <div className="w-px h-4 bg-gray-200 mx-0.5" />
                <button
                  onClick={() => onDeleteRequest(m.id)}
                  title="Delete message"
                  className="w-7 h-7 flex items-center justify-center hover:bg-red-50 rounded-lg cursor-pointer border-0 bg-transparent text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}