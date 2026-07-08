"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, FileText, CornerDownRight, Trash2, MessageCircle,
  Smile, CheckCircle2, Video, Calendar, ClipboardList, Zap,
  AlignLeft, PenTool, CheckSquare
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
        className="group relative flex items-center justify-center py-2 px-4 hover:bg-gray-50/50 rounded-lg transition-colors border-0"
        onMouseEnter={() => onHover(m.id)}
        onMouseLeave={() => onHover(null)}
      >
        <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
          <span className={`flex items-center justify-center w-5 h-5 rounded-full ${isEnded ? 'bg-emerald-100 text-emerald-600' : isNudge ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-100 text-indigo-600'}`}>
            {isEnded ? <CheckCircle2 size={12} /> : isNudge ? <Zap size={11} strokeWidth={3} className="fill-emerald-500" /> : isOngoing ? <Video size={12} /> : <Calendar size={12} />}
          </span>
          <div className="flex items-center gap-2 text-[12.5px] font-medium text-gray-600">
            <span
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(parsed.text.replace(/\[Join now\].*$/, "").trim()).replace(/<br\/>/g, " ")
              }}
              className="inline-block [&>p]:inline-block [&>p]:m-0"
            />
            <span className="text-gray-300 ml-0.5">•</span>
            <span className="text-[10.5px] text-gray-400 font-semibold uppercase tracking-tight">{formatTime(m.created_at)}</span>
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
    const sections: { heading: string; icon: React.ReactNode; items: string[] }[] = [];
    const lines = rawMarkdown.split("\n");
    let currentSection: { heading: string; icon: React.ReactNode; items: string[] } | null = null;

    const sectionIcons: Record<string, React.ReactNode> = {
      summary: <AlignLeft size={14} className="text-indigo-500" />,
      "key decisions": <PenTool size={14} className="text-indigo-500" />,
      "action items": <CheckSquare size={14} className="text-indigo-500" />,
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
          icon: sectionIcons[key] ?? <AlignLeft size={14} className="text-indigo-500" />,
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
          <div className="flex-1 h-px bg-gray-200" />
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full">
            <ClipboardList size={11} className="text-gray-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Meeting Minutes · {formatTime(m.created_at)}
            </span>
          </div>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Card */}
        <div className="w-full max-w-[560px] bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

          {/* Card header */}
          <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-50 border-b border-gray-200">
            <div className="w-8 h-8 rounded-[9px] bg-indigo-50 flex items-center justify-center text-[15px]">
              <Zap size={14} className={'fill-indigo-500 text-indigo-500'} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-gray-900 leading-tight">AI Meeting Minutes</p>
              <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                Generated by Nudge Engine
              </p>
            </div>
            {/* Pulse indicator — same visual pattern as call pills */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-full shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Auto</span>
            </div>
          </div>

          {/* Sections */}
          <div className="px-5 py-4 flex flex-col gap-4">
            {sections.map((section, si) => (
              <div key={si}>
                {/* Section heading */}
                <div className="flex items-center gap-2 mb-3 mt-1">
                  {section.icon}
                  <span className="text-[11.5px] font-black text-gray-800 uppercase tracking-wide">
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
                  <div className="mt-4 h-px bg-gray-100" />
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
      className="group relative flex gap-0 px-3 sm:px-4 hover:bg-gray-50/50 rounded-lg transition-colors"
      style={{ paddingTop: sameSender ? 4 : 14, paddingBottom: 4 }}
      onMouseEnter={() => onHover(m.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div style={{ width: 40, flexShrink: 0, paddingTop: 2, position: "relative" }}>
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
            className="text-[10px] text-gray-300 block text-right pr-1.5 select-none absolute right-0 top-1.5 leading-none"
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
          <div className="flex items-baseline gap-2 mb-1">
            <span className={`text-[13px] font-bold ${m.is_ai ? "text-indigo-600" : "text-gray-900"}`}>
              {isSelf ? "You" : name}
            </span>
            <span className="text-[11px] font-medium text-gray-400">{formatTime(m.created_at)}</span>
            {m.is_ai && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full">
                ✦ AI
              </span>
            )}
          </div>
        )}

        {parsed.text && (
          <p
            className={`text-[13.5px] leading-[1.6] break-words ${m.is_ai ? "text-indigo-900" : "text-gray-800"}`}
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
          <div className="flex flex-wrap gap-1.5 mt-2">
            {reactions.map((r, ri) => (
              <button
                key={ri}
                onClick={() => onToggleReaction(m.id, r.emoji)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] border cursor-pointer transition-all shadow-sm ${r.mine
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
              >
                {r.emoji}
                <span className="text-[11px] font-bold">{r.count}</span>
              </button>
            ))}
          </div>
        )}

        {!isThread && replyCount > 0 && (
          <button
            onClick={() => onOpenThread?.(m.id)}
            className="flex items-center gap-1.5 mt-2 text-[12px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer border-0 bg-transparent p-0 transition-colors"
          >
            <CornerDownRight size={12} />
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
            initial={{ opacity: 0, scale: 0.96, y: 2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute right-4 -top-3.5 flex items-center gap-0.5 bg-white/90 backdrop-blur-md border border-gray-100 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-1 z-10"
          >
            {QUICK_EMOJIS.slice(0, 5).map((emoji) => (
              <button
                key={emoji}
                onClick={() => onToggleReaction(m.id, emoji)}
                className="text-base w-7 h-7 flex items-center justify-center hover:bg-gray-100/80 rounded-lg cursor-pointer border-0 bg-transparent transition-colors duration-150"
              >
                {emoji}
              </button>
            ))}
            <div className="w-px h-4 bg-gray-200 mx-1" />
            {!isThread && (
              <button
                onClick={() => onOpenThread?.(m.id)}
                title="Reply in thread"
                className="w-7 h-7 flex items-center justify-center hover:bg-gray-100/80 rounded-lg cursor-pointer border-0 bg-transparent text-gray-500 hover:text-gray-900 transition-colors duration-150"
              >
                <MessageCircle size={13.5} />
              </button>
            )}
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100/80 rounded-lg cursor-pointer border-0 bg-transparent text-gray-500 hover:text-gray-900 transition-colors duration-150">
              <Smile size={13.5} />
            </button>
            {isSelf && (
              <>
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <button
                  onClick={() => onDeleteRequest(m.id)}
                  title="Delete message"
                  className="w-7 h-7 flex items-center justify-center hover:bg-red-50 rounded-lg cursor-pointer border-0 bg-transparent text-gray-400 hover:text-red-500 transition-colors duration-150"
                >
                  <Trash2 size={13.5} />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}