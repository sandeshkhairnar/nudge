"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bold, Italic, Code, AtSign, Smile, X, Loader2, Send, CornerDownRight,
} from "lucide-react";
import GlobalAvatar from "@/components/global/Avatar";
import { strColor } from "@/lib/utils/color";
import { formatTime, renderMarkdown } from "@/lib/utils/formatters";
import { Message, Reaction, MentionSuggestion, QUICK_EMOJIS } from "@/types";
import MessageRow from "./MessageRow";
import MentionDropdown from "./MentionDropdown";

interface ThreadPanelProps {
  activeThreadId: string | null;
  activeThreadMsg: Message | null;
  threadMessages: Message[];
  threadLoading: boolean;
  threadInput: string;
  threadUploading: boolean;
  threadEmojiOpen: boolean;
  reactions: Record<string, Reaction[]>;
  replyCounts: Record<string, number>;
  hoveredThreadMsgId: string | null;
  deleteConfirmId: string | null;
  deletingId: string | null;
  currentUserId: string;
  mentionSuggestions: MentionSuggestion[];
  mentionQuery: string | null;
  mentionIndex: number;
  isThreadMention: boolean;
  threadEndRef: React.RefObject<HTMLDivElement | null>;
  threadTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onClose: () => void;
  onSend: () => void;
  onInputChange: (value: string, cursorPos: number) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onInsertFormat: (wrap: string) => void;
  onInsertAt: () => void;
  onToggleEmoji: () => void;
  onSelectEmoji: (e: string) => void;
  onToggleReaction: (msgId: string, emoji: string) => void;
  onHover: (id: string | null) => void;
  onDeleteRequest: (msgId: string) => void;
  onDeleteConfirm: (msgId: string, isThread: boolean) => void;
  onDeleteCancel: () => void;
  onMentionSelect: (member: MentionSuggestion) => void;
}

export default function ThreadPanel({
  activeThreadId,
  activeThreadMsg,
  threadMessages,
  threadLoading,
  threadInput,
  threadUploading,
  threadEmojiOpen,
  reactions,
  replyCounts,
  hoveredThreadMsgId,
  deleteConfirmId,
  deletingId,
  currentUserId,
  mentionSuggestions,
  mentionQuery,
  mentionIndex,
  isThreadMention,
  threadEndRef,
  threadTextareaRef,
  onClose,
  onSend,
  onInputChange,
  onKeyDown,
  onInsertFormat,
  onInsertAt,
  onToggleEmoji,
  onSelectEmoji,
  onToggleReaction,
  onHover,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onMentionSelect,
}: ThreadPanelProps) {
  const formatButtons = [
    { wrap: "**", label: "bold", icon: <Bold size={10} /> },
    { wrap: "_", label: "italic", icon: <Italic size={10} /> },
    { wrap: "`", label: "code", icon: <Code size={10} /> },
  ];

  return (
    <AnimatePresence>
      {activeThreadId && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 340, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="flex-shrink-0 flex flex-col border-l border-gray-100 bg-white overflow-hidden"
          style={{ minWidth: 0 }}
        >
          <div
            className="flex-shrink-0 flex items-center justify-between px-4 border-b border-gray-100"
            style={{ height: 52 }}
          >
            <div className="flex items-center gap-2">
              <CornerDownRight size={14} className="text-gray-400" />
              <span className="text-[13px] font-black text-gray-900">Thread</span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer border-0 bg-transparent transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {activeThreadMsg && (
              <div className="px-3 pt-4 pb-3 border-b border-gray-100">
                <div className="flex gap-3 items-start">
                  <GlobalAvatar
                    url={activeThreadMsg.profiles?.avatar_url}
                    name={activeThreadMsg.profiles?.full_name ?? "Unknown"}
                    size={32}
                    fallbackColor={strColor(activeThreadMsg.user_id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-[13px] font-black text-gray-900">
                        {activeThreadMsg.user_id === currentUserId
                          ? "You"
                          : (activeThreadMsg.profiles?.full_name ?? "Unknown")}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {formatTime(activeThreadMsg.created_at)}
                      </span>
                    </div>
                    {(() => {
                      let text = "";
                      const c = activeThreadMsg.content;
                      try {
                        const p = typeof c === "string" ? JSON.parse(c) : c;
                        text = p?.text ?? String(c);
                      } catch {
                        text = String(c);
                      }
                      return text ? (
                        <p
                          className="text-[13.5px] leading-[1.6] text-gray-800 break-words"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
                        />
                      ) : null;
                    })()}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[10.5px] font-semibold text-gray-400 flex-shrink-0">
                    {replyCounts[activeThreadId] ?? 0}{" "}
                    {(replyCounts[activeThreadId] ?? 0) === 1 ? "reply" : "replies"}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
              </div>
            )}

            <div className="pb-2">
              {threadLoading && (
                <div className="flex items-center justify-center h-20">
                  <Loader2 size={18} className="text-gray-300 animate-spin" />
                </div>
              )}
              {!threadLoading && threadMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <CornerDownRight size={20} className="text-gray-200 mb-2" />
                  <p className="text-[12px] text-gray-300 font-semibold">No replies yet.</p>
                  <p className="text-[11px] text-gray-200">Start the thread below.</p>
                </div>
              )}
              {threadMessages.map((m, i) => {
                const prev = threadMessages[i - 1];
                const sameSender =
                  prev?.user_id === m.user_id &&
                  new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() <
                    5 * 60 * 1000;
                return (
                  <MessageRow
                    key={m.id}
                    message={m}
                    isSelf={m.user_id === currentUserId}
                    sameSender={sameSender}
                    isThread={true}
                    reactions={reactions[m.id] ?? []}
                    hoveredMsgId={hoveredThreadMsgId}
                    deleteConfirmId={deleteConfirmId}
                    deletingId={deletingId}
                    activeThreadId={activeThreadId}
                    currentUserId={currentUserId}
                    onHover={onHover}
                    onToggleReaction={onToggleReaction}
                    onDeleteRequest={onDeleteRequest}
                    onDeleteConfirm={onDeleteConfirm}
                    onDeleteCancel={onDeleteCancel}
                  />
                );
              })}
              <div ref={threadEndRef} className="h-3" />
            </div>
          </div>

          <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-gray-100">
            <div className="relative border border-gray-200 rounded-xl overflow-visible focus-within:border-gray-300 focus-within:shadow-sm transition-all bg-white">
              <AnimatePresence>
                <MentionDropdown
                  suggestions={mentionSuggestions}
                  query={mentionQuery}
                  activeIndex={mentionIndex}
                  isThread={true}
                  currentIsThread={isThreadMention}
                  onSelect={onMentionSelect}
                />
              </AnimatePresence>

              <div className="flex items-center gap-0.5 px-2.5 pt-2 pb-0.5">
                {formatButtons.map(({ wrap, label, icon }) => (
                  <button
                    key={label}
                    onClick={() => onInsertFormat(wrap)}
                    title={label}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer border-0 bg-transparent transition-colors"
                  >
                    {icon}
                  </button>
                ))}
                <div className="w-px h-3 bg-gray-200 mx-1" />
                <button
                  onClick={onInsertAt}
                  title="Mention someone"
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 cursor-pointer border-0 bg-transparent transition-colors"
                >
                  <AtSign size={10} />
                </button>
                <div className="w-px h-3 bg-gray-200 mx-1" />
                <div className="relative">
                  <button
                    onClick={onToggleEmoji}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 cursor-pointer border-0 bg-transparent transition-colors"
                  >
                    <Smile size={10} />
                  </button>
                  <AnimatePresence>
                    {threadEmojiOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.1 }}
                        className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 z-20"
                      >
                        <div className="grid grid-cols-6 gap-0.5">
                          {QUICK_EMOJIS.map((e) => (
                            <button
                              key={e}
                              onClick={() => onSelectEmoji(e)}
                              className="text-base w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg cursor-pointer border-0 bg-transparent transition-all"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <textarea
                ref={threadTextareaRef}
                value={threadInput}
                onChange={(e) => onInputChange(e.target.value, e.target.selectionEnd)}
                onKeyDown={onKeyDown}
                placeholder="Reply in thread… (@ to mention)"
                rows={1}
                className="w-full px-3 py-2 bg-transparent border-none outline-none text-[13px] font-medium text-gray-800 placeholder-gray-300 resize-none"
                style={{ fontFamily: "'Sora',sans-serif", minHeight: 36, maxHeight: 120 }}
              />

              <div className="flex justify-end px-2.5 pb-2">
                <motion.button
                  onClick={onSend}
                  whileTap={{ scale: 0.94 }}
                  disabled={threadUploading || !threadInput.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-black cursor-pointer border-0 transition-all disabled:cursor-not-allowed"
                  style={{
                    background: threadInput.trim() && !threadUploading ? "#0D0D0D" : "#F3F4F6",
                    color: threadInput.trim() && !threadUploading ? "#fff" : "#9CA3AF",
                    fontFamily: "'Sora',sans-serif",
                  }}
                >
                  {threadUploading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Send size={12} />
                  )}
                  Reply
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
