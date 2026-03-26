"use client";

import { Loader2, Hash } from "lucide-react";
import { Message, Reaction } from "@/types";
import { formatDate } from "@/lib/utils/formatters";
import MessageRow from "./MessageRow";
import DateDivider from "./DateDivider";

interface ChatTabProps {
  messages: Message[];
  loading: boolean;
  reactions: Record<string, Reaction[]>;
  replyCounts: Record<string, number>;
  activeChannelName?: string;
  activeThreadId: string | null;
  hoveredMsgId: string | null;
  deleteConfirmId: string | null;
  deletingId: string | null;
  currentUserId: string;
  endRef: React.RefObject<HTMLDivElement | null>;
  onHover: (id: string | null) => void;
  onToggleReaction: (msgId: string, emoji: string) => void;
  onOpenThread: (msgId: string) => void;
  onDeleteRequest: (msgId: string) => void;
  onDeleteConfirm: (msgId: string, isThread: boolean) => void;
  onDeleteCancel: () => void;
}

export default function ChatTab({
  messages,
  loading,
  reactions,
  replyCounts,
  activeChannelName,
  activeThreadId,
  hoveredMsgId,
  deleteConfirmId,
  deletingId,
  currentUserId,
  endRef,
  onHover,
  onToggleReaction,
  onOpenThread,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: ChatTabProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 size={22} className="text-gray-300 animate-spin" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Hash size={24} className="text-gray-300" />
        </div>
        <p className="text-[15px] font-bold text-gray-700 mb-1">
          Welcome to #{activeChannelName ?? "general"}
        </p>
        <p className="text-[13px] text-gray-400">
          This is the start of the channel. Say hello! 👋
        </p>
      </div>
    );
  }

  const rows: React.ReactNode[] = [];
  let lastDate = "";

  messages.forEach((m, i) => {
    const dateLabel = formatDate(m.created_at);
    if (dateLabel !== lastDate) {
      rows.push(<DateDivider key={`d-${m.id}`} label={dateLabel} />);
      lastDate = dateLabel;
    }
    const prev = messages[i - 1];
    const sameSender =
      prev?.user_id === m.user_id &&
      formatDate(prev.created_at) === dateLabel &&
      new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60 * 1000;

    rows.push(
      <MessageRow
        key={m.id}
        message={m}
        isSelf={m.user_id === currentUserId}
        sameSender={sameSender}
        isThread={false}
        reactions={reactions[m.id] ?? []}
        replyCount={replyCounts[m.id] ?? 0}
        hoveredMsgId={hoveredMsgId}
        deleteConfirmId={deleteConfirmId}
        deletingId={deletingId}
        activeThreadId={activeThreadId}
        currentUserId={currentUserId}
        onHover={onHover}
        onToggleReaction={onToggleReaction}
        onOpenThread={onOpenThread}
        onDeleteRequest={onDeleteRequest}
        onDeleteConfirm={onDeleteConfirm}
        onDeleteCancel={onDeleteCancel}
      />
    );
  });

  return (
    <div className="pb-2">
      {rows}
      <div ref={endRef} className="h-3" />
    </div>
  );
}
