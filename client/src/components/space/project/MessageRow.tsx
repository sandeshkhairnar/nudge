"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, FileText, CornerDownRight, Trash2, MessageCircle,
  Smile, CheckCircle2, Video, Calendar,
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
    
    // Multi-pass parsing for potentially double-encoded JSON
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

    // Final bulletproof detection pass on whatever text we have
    if (!finalType && typeof finalText === "string") {
      const lowerText = finalText.toLowerCase();
      if (lowerText.includes("started a meeting")) finalType = "system_call";
      else if (lowerText.includes("ended the meeting")) finalType = "system_call_ended";
      else if (lowerText.includes("is calling you")) finalType = "system_call_ringing";
    }

    // If it's still JSON-like and no type, it's a failed parse of a possible system msg
    if (!finalType && finalText.trim().startsWith("{") && finalText.includes('"text"')) {
       // Deep extraction fallback
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

  if (
    parsed.type?.startsWith("system_") ||
    parsed.type === "call" ||
    parsed.type === "call_ended"
  ) {
    const isOngoing = parsed.type === "system_call" || parsed.type === "call";
    const isEnded = parsed.type === "system_call_ended" || parsed.type === "call_ended";

    return (
      <div
        key={m.id}
        className="group relative flex items-center justify-center py-2 px-4 hover:bg-[#F9F9F7]/30 rounded-lg transition-colors border-0"
        onMouseEnter={() => onHover(m.id)}
        onMouseLeave={() => onHover(null)}
      >
        <div className="flex items-center gap-2.5 bg-[#F9F9F7] border border-[#F0F0EB] px-3 py-1 rounded-full">
          <span className={`flex items-center justify-center w-4.5 h-4.5 rounded-full ${isEnded ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
            {isEnded ? <CheckCircle2 size={11} /> : isOngoing ? <Video size={11} /> : <Calendar size={11} />}
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
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] border cursor-pointer transition-all ${
                  r.mine
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
