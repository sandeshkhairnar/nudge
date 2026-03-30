"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bold, Italic, Code, AtSign, Smile, Paperclip,
  ImageIcon, Send, Loader2, X, FileText, Plus,
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

function IBtn({
  onClick, title, children, active,
}: {
  onClick?: () => void;
  title?: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      title={title}
      className="relative w-7 h-7 flex items-center justify-center rounded-lg border-0 bg-transparent cursor-pointer transition-colors flex-shrink-0"
      style={{ color: active ? "#0D0D0D" : "#B0B0A8" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "#F4F4F1";
        (e.currentTarget as HTMLElement).style.color = "#0D0D0D";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
        (e.currentTarget as HTMLElement).style.color = active ? "#0D0D0D" : "#B0B0A8";
      }}
    >
      {children}
    </motion.button>
  );
}

function FilePill({ f, onRemove }: { f: { file: File; preview: string }; onRemove: () => void }) {
  const isImg = f.file.type.startsWith("image/");
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: -6 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: -6 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex-shrink-0 rounded-xl overflow-hidden border border-[#EAEAE6] group"
      style={{ width: isImg ? 52 : 110, height: 52 }}
    >
      {isImg ? (
        <img src={f.preview} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-[#F7F7F4] flex flex-col items-center justify-center gap-0.5 px-2">
          <FileText size={14} className="text-[#9CA3AF]" />
          <span className="text-[9px] text-[#6B7280] font-semibold truncate w-full text-center leading-tight">
            {f.file.name}
          </span>
          <span className="text-[8px] text-[#C4C4BC]">{formatBytes(f.file.size)}</span>
        </div>
      )}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center cursor-pointer border-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "rgba(0,0,0,0.55)" }}
      >
        <X size={8} color="white" />
      </button>
    </motion.div>
  );
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
  const [toolsOpen, setToolsOpen] = useState(false);
  const hasContent = input.trim() || pendingFiles.length > 0;

  const formatButtons = [
    { wrap: "**", label: "Bold", icon: <Bold size={12} /> },
    { wrap: "_", label: "Italic", icon: <Italic size={12} /> },
    { wrap: "`", label: "Code", icon: <Code size={12} /> },
  ];

  return (
    <div className="flex-shrink-0 px-3 sm:px-4 pb-3 pt-1.5">
      <div className="relative">
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

        <motion.div
          layout
          className="relative rounded-2xl bg-white overflow-visible"
          style={{
            border: "1px solid #E8E8E4",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
            transition: "box-shadow 0.2s, border-color 0.2s",
          }}
          onFocusCapture={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#C8C8C0";
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 1px 3px rgba(0,0,0,0.08), 0 6px 24px rgba(0,0,0,0.07)";
          }}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              (e.currentTarget as HTMLElement).style.borderColor = "#E8E8E4";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)";
            }
          }}
        >
          <AnimatePresence>
            {pendingFiles.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex gap-2 px-3 pt-3 pb-1 overflow-x-auto"
                style={{ scrollbarWidth: "none" }}
              >
                {pendingFiles.map((f, i) => (
                  <FilePill key={i} f={f} onRemove={() => onRemoveFile(i)} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {toolsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 36, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-0.5 px-2.5 overflow-hidden border-b border-[#F0F0EB]"
              >
                {formatButtons.map(({ wrap, label, icon }) => (
                  <IBtn key={label} onClick={() => onInsertFormat(wrap)} title={label}>
                    {icon}
                  </IBtn>
                ))}
                <div className="w-px h-3.5 bg-[#EAEAE6] mx-0.5" />
                <IBtn onClick={onInsertAt} title="Mention">
                  <AtSign size={12} />
                </IBtn>
                <IBtn onClick={onFileClick} title="Attach file">
                  <Paperclip size={12} />
                </IBtn>
                <IBtn onClick={onImageClick} title="Image">
                  <ImageIcon size={12} />
                </IBtn>
                <span className="ml-auto text-[10px] text-[#C4C4BC] pr-1 hidden sm:block select-none whitespace-nowrap">
                  ↵ send · ⇧↵ newline
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-1.5 px-2 py-2">
            <div className="flex-shrink-0 mb-0.5">
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => setToolsOpen((o) => !o)}
                title="Formatting & attachments"
                className="w-7 h-7 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
                style={{
                  background: toolsOpen ? "#0D0D0D" : "#F4F4F1",
                  color: toolsOpen ? "#fff" : "#9CA3AF",
                }}
                animate={{ rotate: toolsOpen ? 45 : 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <Plus size={14} />
              </motion.button>
            </div>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => onInputChange(e.target.value, e.target.selectionEnd)}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              placeholder={`Message #${activeChannelName ?? "general"}`}
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-[13.5px] text-[#0D0D0D] placeholder-[#C4C4BC] font-medium leading-relaxed"
              style={{
                fontFamily: "'Sora', sans-serif",
                minHeight: 28,
                maxHeight: 140,
                paddingTop: 2,
                paddingBottom: 2,
              }}
            />

            <div className="flex items-center gap-1 flex-shrink-0 mb-0.5">
              <div className="relative">
                <IBtn onClick={onToggleEmoji} title="Emoji" active={emojiPickerOpen}>
                  <Smile size={14} />
                </IBtn>

                <AnimatePresence>
                  {emojiPickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 6 }}
                      transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute bottom-full right-0 mb-2 z-30"
                      style={{
                        background: "#fff",
                        border: "1px solid #E8E8E4",
                        borderRadius: 16,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                        padding: 10,
                      }}
                    >
                      <div className="grid grid-cols-6 gap-0.5">
                        {QUICK_EMOJIS.map((e) => (
                          <motion.button
                            key={e}
                            whileHover={{ scale: 1.18 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onSelectEmoji(e)}
                            className="text-[18px] w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F4F4F1] cursor-pointer border-0 bg-transparent transition-colors"
                          >
                            {e}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-px h-4 bg-[#EAEAE6]" />

              <motion.button
                onClick={onSend}
                whileTap={{ scale: 0.91 }}
                disabled={uploading || !hasContent}
                title="Send"
                className="flex items-center justify-center rounded-xl border-0 cursor-pointer transition-all disabled:cursor-not-allowed flex-shrink-0"
                style={{
                  width: hasContent && !uploading ? "auto" : 30,
                  height: 30,
                  paddingLeft: hasContent && !uploading ? 12 : 0,
                  paddingRight: hasContent && !uploading ? 12 : 0,
                  background: hasContent && !uploading ? "#0D0D0D" : "#F4F4F1",
                  color: hasContent && !uploading ? "#fff" : "#C4C4BC",
                  gap: 5,
                  fontFamily: "'Sora', sans-serif",
                  fontSize: 12,
                  fontWeight: 800,
                  boxShadow: hasContent && !uploading ? "0 2px 8px rgba(0,0,0,0.18)" : "none",
                }}
                animate={{ width: hasContent && !uploading ? "auto" : 30 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {uploading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <>
                    <Send size={12} />
                    <AnimatePresence>
                      {hasContent && (
                        <motion.span
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: "auto", opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden whitespace-nowrap hidden sm:block"
                        >
                          Send
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </motion.button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={onFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.zip,.pptx"
          />
        </motion.div>
      </div>
    </div>
  );
}