"use client";
import { useRef, useEffect, useLayoutEffect } from "react";
import { Loader2, Hash } from "lucide-react";
import { Message, Reaction } from "@/types";
import { formatDate } from "@/lib/utils/formatters";
import MessageRow from "./MessageRow";
import DateDivider from "./DateDivider";

interface ChatTabProps {
  messages: Message[];
  loading: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
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
  isLoadingMore,
  hasMore,
  onLoadMore,
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
  const scrollSentinelRef = useRef<HTMLDivElement>(null);

  // Infinite Scroll Observer
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (scrollSentinelRef.current) observer.observe(scrollSentinelRef.current);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isLoadingMore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={22} className="text-gray-300 animate-spin" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
          <Hash size={22} className="text-gray-400" />
        </div>
        <p className="text-[14px] font-bold text-gray-900 mb-1">
          Welcome to #{activeChannelName ?? "general"}
        </p>
        <p className="text-[13px] font-medium text-gray-500">
          This is the start of the channel. Say hello! 👋
        </p>
      </div>
    );
  }

  const rows: React.ReactNode[] = [];

  messages.forEach((m, i) => {
    const prev = messages[i + 1]; // In DESC, prev is an OLDER message
    const dateLabel = formatDate(m.created_at);
    
    // Message Row
    const sameSenderAsNext =
      prev?.user_id === m.user_id &&
      formatDate(prev.created_at) === dateLabel &&
      new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60 * 1000;

    rows.push(
      <MessageRow
        key={m.id}
        message={m}
        isSelf={m.user_id === currentUserId}
        sameSender={sameSenderAsNext}
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

    // If next message has different date or doesn't exist, this is the top of the date group
    if (!prev || formatDate(prev.created_at) !== dateLabel) {
      rows.push(<DateDivider key={`d-${m.id}`} label={dateLabel} />);
    }
  });

  return (
    <div className="flex-1 flex flex-col-reverse overflow-y-auto px-4 pb-2 scroll-smooth">
      <div ref={endRef} className="h-1" />
      {rows}
      {hasMore && (
        <div ref={scrollSentinelRef} className="h-8 flex items-center justify-center py-2">
          {isLoadingMore ? <Loader2 size={18} className="text-gray-400 animate-spin" /> : <div className="h-1" />}
        </div>
      )}
    </div>
  );
}
