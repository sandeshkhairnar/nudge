"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bold, Italic, Code, AtSign, Smile, Paperclip, ImageIcon, Send, Loader2, X, FileText,
} from "lucide-react";
import { formatBytes } from "@/lib/utils/formatters";
import { MentionSuggestion, QUICK_EMOJIS } from "@/types";
import MentionDropdown from "./MentionDropdown";

interface ChatInputBarProps {
  input: string;
  pendingFiles: { file: File; preview: string }[];
  uploading: boolean;
  emojiPickerOpen: boolean;
  mentionSuggestions: MentionSuggestion[];
  mentionQuery: string | null;
  mentionIndex: number;
  isThreadMention: boolean;
  activeChannelName?: string;
  onInputChange: (value: string, cursorPos: number) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onSend: () => void;
  onInsertFormat: (wrap: string) => void;
  onInsertAt: () => void;
  onToggleEmoji: () => void;
  onSelectEmoji: (e: string) => void;
  onRemoveFile: (index: number) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileClick: () => void;
  onImageClick: () => void;
  onMentionSelect: (member: MentionSuggestion) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function ChatInputBar({
  input,
  pendingFiles,
  uploading,
  emojiPickerOpen,
  mentionSuggestions,
  mentionQuery,
  mentionIndex,
  isThreadMention,
  activeChannelName,
  onInputChange,
  onKeyDown,
  onPaste,
  onSend,
  onInsertFormat,
  onInsertAt,
  onToggleEmoji,
  onSelectEmoji,
  onRemoveFile,
  onFileSelect,
  onFileClick,
  onImageClick,
  onMentionSelect,
  textareaRef,
  fileInputRef,
}: ChatInputBarProps) {
  const hasContent = input.trim() || pendingFiles.length > 0;
  const formatButtons = [
    { wrap: "**", label: "bold", icon: <Bold size={11} /> },
    { wrap: "_", label: "italic", icon: <Italic size={11} /> },
    { wrap: "`", label: "code", icon: <Code size={11} /> },
  ];

  return (
    <div className="flex-shrink-0 px-3 sm:px-4 pb-4 pt-2">
      <div
        className="relative border border-gray-200 rounded-2xl overflow-visible focus-within:border-gray-300 focus-within:shadow-md transition-all bg-white"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
      >
        <AnimatePresence>
          <MentionDropdown
            suggestions={mentionSuggestions}
            query={mentionQuery}
            activeIndex={mentionIndex}
            isThread={false}
            currentIsThread={isThreadMention}
            onSelect={onMentionSelect}
          />
        </AnimatePresence>

        <AnimatePresence>
          {pendingFiles.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex gap-2 flex-wrap px-3 pt-3 overflow-hidden"
            >
              {pendingFiles.map((f, i) => {
                const isImg = f.file.type.startsWith("image/");
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative flex-shrink-0 rounded-xl overflow-hidden border border-gray-200"
                    style={{ width: isImg ? 76 : 140, height: isImg ? 76 : 64 }}
                  >
                    {isImg ? (
                      <img src={f.preview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-1 p-2">
                        <FileText size={18} className="text-gray-400" />
                        <span className="text-[9px] text-gray-500 font-semibold text-center truncate w-full">
                          {f.file.name}
                        </span>
                        <span className="text-[9px] text-gray-400">{formatBytes(f.file.size)}</span>
                      </div>
                    )}
                    <button
                      onClick={() => onRemoveFile(i)}
                      className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center cursor-pointer border-0"
                    >
                      <X size={8} color="white" />
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-0.5 px-3 pt-2.5 pb-1">
          {formatButtons.map(({ wrap, label, icon }) => (
            <button
              key={label}
              onClick={() => onInsertFormat(wrap)}
              title={label}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer border-0 bg-transparent transition-colors"
            >
              {icon}
            </button>
          ))}
          <div className="w-px h-3.5 bg-gray-200 mx-1" />
          <button
            onClick={onInsertAt}
            title="Mention someone"
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer border-0 bg-transparent transition-colors"
          >
            <AtSign size={11} />
          </button>
          <div className="w-px h-3.5 bg-gray-200 mx-1" />
          <div className="relative">
            <button
              onClick={onToggleEmoji}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer border-0 bg-transparent transition-colors"
            >
              <Smile size={11} />
            </button>
            <AnimatePresence>
              {emojiPickerOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.12 }}
                  className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-2xl shadow-xl p-2.5 z-20"
                >
                  <div className="grid grid-cols-6 gap-0.5">
                    {QUICK_EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => onSelectEmoji(e)}
                        className="text-lg w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg cursor-pointer border-0 bg-transparent hover:scale-110 transition-all"
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
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value, e.target.selectionEnd)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          placeholder={`Message #${activeChannelName ?? "general"} — type @ to mention`}
          rows={1}
          className="w-full px-3 py-2 bg-transparent border-none outline-none text-[13.5px] font-medium text-gray-800 placeholder-gray-300 resize-none"
          style={{ fontFamily: "'Sora',sans-serif", minHeight: 40, maxHeight: 160 }}
        />

        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          <div className="flex items-center gap-0.5">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={onFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.zip,.pptx"
            />
            <button
              onClick={onFileClick}
              title="Attach file"
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer border-0 bg-transparent transition-colors"
            >
              <Paperclip size={14} />
            </button>
            <button
              onClick={onImageClick}
              title="Upload image"
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer border-0 bg-transparent transition-colors"
            >
              <ImageIcon size={14} />
            </button>
            <span className="text-[10px] text-gray-300 ml-1.5 hidden sm:block select-none">
              @ to mention · Ctrl+V to paste
            </span>
          </div>

          <motion.button
            onClick={onSend}
            whileTap={{ scale: 0.94 }}
            disabled={uploading || !hasContent}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-black cursor-pointer border-0 transition-all disabled:cursor-not-allowed"
            style={{
              background: hasContent && !uploading ? "#0D0D0D" : "#F3F4F6",
              color: hasContent && !uploading ? "#fff" : "#9CA3AF",
              fontFamily: "'Sora',sans-serif",
            }}
          >
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            <span className="hidden sm:inline">{uploading ? "Uploading…" : "Send"}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
