"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Bell, ArrowRight, Check,
  Loader2, Search, X,
  AtSign, AlertCircle, Archive,
  Mic, ClipboardList, Zap, AlertTriangle, Info
} from "lucide-react";
import Link from "next/link";
import { isToday, isYesterday, isTomorrow, format } from "date-fns";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { useInvitations, type Invitation } from "@/hooks/useInvitations";
import { ToastContainer, ToastProps } from "@/components/global/toast";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import GlobalAvatar from "@/components/global/Avatar";
import { getCurrentUserId } from "@/lib/auth-client";

type NotifType = "mention" | "message" | "task" | "system";
type FilterTab = "all" | "mentions" | "messages" | "unread" | "invites";

function getGroupLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "d MMM yyyy");
}

function groupItemsByDate<T extends { created_at: string }>(items: T[]) {
  const groups: Record<string, T[]> = {};
  items.forEach((item) => {
    const label = getGroupLabel(new Date(item.created_at));
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  });
  return groups;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function colorFromString(s: string) {
  const palette = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#F43F5E"];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

type ParsedSystemMessage = {
  type: string;
  text: string;
  label: string;
  icon: React.ReactNode;
  textColor: string;
  bgColor: string;
  borderColor: string;
  preview: string;
};

function parseSystemContent(raw: string): ParsedSystemMessage | null {
  let data: any = null;

  if (typeof raw === "string" && (raw.trim().startsWith("{") || raw.trim().startsWith("["))) {
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (!data || typeof data !== "object") return null;

  const type: string = data.type ?? "";
  const text: string = data.text ?? "";

  const cleanText = text
    .replace(/\[MOM_CARD\]\s*/gi, "")
    .replace(/[📝📋🤔✍️🤝🤝🏃‍♂️🚨✨]/gu, "") 
    .replace(/#{1,4}\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\n+/g, " ")
    .trim();

  const previewText = cleanText.length > 120 ? cleanText.slice(0, 120) + "…" : cleanText;

  switch (type) {
    case "mom_card":
      return {
        type,
        text,
        label: "Meeting Minutes",
        icon: <ClipboardList size={12} />,
        textColor: "text-indigo-700",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-200",
        preview: previewText,
      };

    case "system_nudge":
    case "nudge":
      return {
        type,
        text,
        label: "Nudge",
        icon: <Zap size={12} strokeWidth={2.5} className="fill-emerald-500 text-emerald-500" />,
        textColor: "text-emerald-700",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        preview: previewText,
      };

    case "stall_alert":
    case "stall_warning":
    case "stalled_task_alert":
      return {
        type,
        text,
        label: "Stall Alert",
        icon: <AlertTriangle size={12} />,
        textColor: "text-amber-700",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        preview: previewText,
      };

    case "system_call":
    case "call":
      return {
        type,
        text,
        label: "Started Meeting",
        icon: <Bell size={12} />,
        textColor: "text-emerald-700",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        preview: previewText,
      };

    case "system_call_ended":
    case "call_ended":
      return {
        type,
        text,
        label: "Archived Meeting",
        icon: <Archive size={12} />,
        textColor: "text-gray-600",
        bgColor: "bg-gray-100",
        borderColor: "border-gray-200",
        preview: previewText,
      };

    case "system_call_ringing":
      return {
        type,
        text,
        label: "Incoming Call",
        icon: <Bell size={12} />,
        textColor: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        preview: previewText,
      };

    default:
      if (!type && !text) return null;
      return {
        type: type || "system",
        text,
        label: "System",
        icon: <Info size={12} />,
        textColor: "text-gray-600",
        bgColor: "bg-gray-100",
        borderColor: "border-gray-200",
        preview: previewText,
      };
  }
}

function parseMomCardPreview(content: string): string {
  const cleaned = content
    .replace(/\[MOM_CARD\]\s*/gi, "")
    .replace(/[📝📋🤔✍️🤝🤝🏃‍♂️🚨✨]/gu, "")
    .replace(/#{1,4}\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\n+/g, " ")
    .trim();
  return cleaned.length > 120 ? cleaned.slice(0, 120) + "…" : cleaned;
}

function getNotificationPreview(n: Notification): { preview: string; systemParsed: ParsedSystemMessage | null } {
  const raw = (n as any).content ?? n.preview ?? "";

  const momCardMatch = typeof raw === "string" && raw.includes("[MOM_CARD]");
  if (momCardMatch) {
    return {
      preview: parseMomCardPreview(raw),
      systemParsed: {
        type: "mom_card",
        text: raw,
        label: "Meeting Minutes",
        icon: <ClipboardList size={12} />,
        textColor: "text-indigo-700",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-200",
        preview: parseMomCardPreview(raw),
      },
    };
  }

  if (typeof raw === "string" && raw.trim().startsWith("{")) {
    const parsed = parseSystemContent(raw);
    if (parsed) {
      return { preview: parsed.preview, systemParsed: parsed };
    }
  }

  const preview = typeof raw === "string" ? raw : n.preview ?? "";
  return { preview, systemParsed: null };
}

function SystemBadge({ label, icon, textColor, bgColor, borderColor }: { label: string; icon: React.ReactNode; textColor: string; bgColor: string; borderColor: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold flex-shrink-0 border ${bgColor} ${textColor} ${borderColor}`}>
      {icon}
      {label}
    </span>
  );
}

function NotificationRow({
  item,
  type,
  onMarkRead,
  onArchive,
  onAccept,
  onDecline,
}: {
  item: any;
  type: "notification" | "invitation";
  onMarkRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  onAccept?: (id: string) => Promise<any>;
  onDecline?: (id: string) => Promise<any>;
  currentUserId?: string;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const isInvite = type === "invitation";

  const { preview, systemParsed } = useMemo(() => {
    if (isInvite) {
      const inv = item as Invitation;
      return {
        preview: `Invited you to join ${inv.projects?.name ?? inv.workspaces?.name ?? "a workspace"}`,
        systemParsed: null,
      };
    }
    return getNotificationPreview(item as Notification);
  }, [item, isInvite]);

  const isSystemType = !isInvite && (item.type === "system" || !!systemParsed);

  const title = isInvite
    ? (item as Invitation).projects?.name ?? (item as Invitation).workspaces?.name ?? "New Invitation"
    : systemParsed
      ? systemParsed.label
      : item.sender?.full_name ?? "Notification";

  const avatarUrl = isInvite ? item.profiles?.avatar_url : item.sender?.avatar_url;
  const avatarName = isInvite ? item.profiles?.full_name : item.sender?.full_name;
  const avatarEmail = isInvite ? item.profiles?.email : item.sender?.email;
  const avatarId = isInvite ? item.profiles?.id : item.sender?.id;

  return (
    <div
      className={`
        bg-white px-5 py-4 flex flex-col md:flex-row items-start md:items-center justify-between
        border border-gray-200 rounded-xl mb-3 transition-colors duration-200
        hover:border-gray-300 hover:shadow-sm
        ${!item.read && !isInvite ? "ring-1 ring-indigo-500/20 bg-indigo-50/10 shadow-sm" : "shadow-sm"}
      `}
    >
      <div className="flex items-start gap-3.5 flex-1 min-w-0 w-full mb-3 md:mb-0">
        <div className="relative flex-shrink-0 mt-0.5">
          {isSystemType && !avatarUrl ? (
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border shadow-sm ${systemParsed?.bgColor ?? "bg-gray-100"} ${systemParsed?.borderColor ?? "border-gray-200"}`}>
              <span className={systemParsed?.textColor ?? "text-gray-500"}>
                {systemParsed?.icon ?? <Bell size={16} />}
              </span>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 shadow-sm">
              <GlobalAvatar
                url={avatarUrl}
                name={avatarName}
                email={avatarEmail}
                size={36}
                fallbackColor={colorFromString(avatarId || "system")}
              />
            </div>
          )}
          {!item.read && !isInvite && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white shadow-sm" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[13.5px] font-bold text-gray-900 truncate">{title}</span>
            {systemParsed && (
              <SystemBadge
                label={systemParsed.label}
                icon={systemParsed.icon}
                textColor={systemParsed.textColor}
                bgColor={systemParsed.bgColor}
                borderColor={systemParsed.borderColor}
              />
            )}
            {isInvite && (
              <SystemBadge
                label="Invitation"
                icon={<Bell size={12} />}
                textColor="text-emerald-700"
                bgColor="bg-emerald-50"
                borderColor="border-emerald-200"
              />
            )}
            <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap ml-auto">{relativeTime(item.created_at)}</span>
          </div>
          <p className="text-[13px] font-medium text-gray-600 leading-relaxed line-clamp-2 md:pr-6">{preview}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2.5 w-full md:w-auto md:ml-4 flex-shrink-0">
        {isInvite ? (
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => onAccept?.(item.id)}
              className="flex-1 md:flex-none py-1.5 px-4 rounded-lg text-[12px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer border-0 shadow-sm"
            >
              Accept
            </button>
            <button
              onClick={() => onDecline?.(item.id)}
              className="flex-1 md:flex-none py-1.5 px-4 rounded-lg text-[12px] font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
            >
              Decline
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {!item.read && (
              <button
                onClick={() => onMarkRead?.(item.id)}
                className="text-emerald-600 bg-white border border-gray-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 cursor-pointer p-1.5 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                title="Mark as Read"
              >
                <Check size={14} strokeWidth={2.5} />
                <span className="text-[11px] font-bold hidden sm:block">Mark read</span>
              </button>
            )}
            <button
              onClick={() => onArchive?.(item.id)}
              className="text-gray-400 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-700 cursor-pointer p-1.5 rounded-lg transition-colors shadow-sm"
              title="Archive"
            >
              <Archive size={14} />
            </button>
            {item.project_id && (
              <Link
                href={`/space/${item.project_id}`}
                className="text-white text-[12px] font-semibold bg-gray-900 px-3.5 py-1.5 rounded-lg hover:bg-black transition-colors shadow-sm no-underline whitespace-nowrap flex items-center gap-1"
              >
                View <ArrowRight size={12} />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function InboxClient() {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    getCurrentUserId().then((id) => {
      if (id) setUserId(id);
    });
  }, []);

  const { playSound } = useNotificationSound();

  const handleNewNotification = useCallback(
    (notification: Notification) => {
      playSound(notification.type);
      const toast: ToastProps = {
        id: notification.id,
        type: notification.type,
        title: notification.sender?.full_name ?? "Nudge",
        message: notification.preview,
        projectName: notification.project_name ?? undefined,
        channelName: notification.channel_name ?? undefined,
        onClose: (id) => setToasts((prev) => prev.filter((t) => t.id !== id)),
        onClick: () => setToasts((prev) => prev.filter((t) => t.id !== notification.id)),
      };
      setToasts((prev) => [toast, ...prev].slice(0, 5));
    },
    [playSound]
  );

  const { invitations, accept: acceptInvite, decline: declineInvite } = useInvitations(userId);
  const {
    notifications,
    loading,
    isLoadingMore,
    hasMore,
    unreadCount,
    fetchMore,
    markRead: handleMarkRead,
    markAllRead: handleMarkAllRead,
    archive: handleArchive,
  } = useNotifications({
    enableSound: true,
    enableToast: true,
    onNewNotification: handleNewNotification,
  });

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fetchMore || !hasMore || isLoadingMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMore();
        }
      },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchMore, hasMore, isLoadingMore, loading]);

  const filteredItems = useMemo(() => {
    let includedInvites: any[] = [];
    if (filter === "all" || filter === "invites" || filter === "unread") {
      includedInvites = invitations.map((i) => ({ ...i, __type: "invitation" }));
    }

    const includedNotifications =
      filter === "invites"
        ? []
        : notifications
          .filter((n) => {
            const rawContent = (n as any).content ?? n.preview ?? "";
            if (n.type === "system" && /invited you to join/i.test(rawContent)) return false;
            if (filter === "unread" && n.read) return false;
            if (filter === "mentions" && n.type !== "mention") return false;
            if (filter === "messages" && n.type !== "message") return false;
            if (search) {
              const searchLower = search.toLowerCase();
              const contentStr = typeof rawContent === "string" ? rawContent.toLowerCase() : "";
              const previewStr = (n.preview ?? "").toLowerCase();
              if (!contentStr.includes(searchLower) && !previewStr.includes(searchLower)) return false;
            }
            return true;
          })
          .map((n) => ({ ...n, __type: "notification" }));

    const combined = [...includedInvites, ...includedNotifications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return groupItemsByDate(combined);
  }, [notifications, invitations, filter, search]);

  const totalUnreadCount = unreadCount + invitations.length;

  return (
    <div className="bg-transparent text-gray-900 h-full flex flex-col font-sans">
      <header className="pb-6 relative z-10 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">Inbox</h1>
            <p className="text-[13px] text-gray-500 font-medium mt-1">
              You have{" "}
              <span className="text-indigo-600 font-semibold">{totalUnreadCount}</span>{" "}
              unread notifications
            </p>
          </div>
          <button
            onClick={handleMarkAllRead}
            className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-[12px] font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer flex-shrink-0"
          >
            Mark All Read
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:items-center w-full">
          <div className="relative w-full lg:max-w-xs group flex-shrink-0 z-20">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search notifications..."
              className="w-full px-4 py-2 pl-9 pr-8 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1 border-0 cursor-pointer transition-colors"
                onClick={() => setSearch("")}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full hide-scrollbar sm:flex-wrap pb-1 lg:pb-0">
            {[
              { id: "all", label: "All" },
              { id: "unread", label: unreadCount ? `Unread (${unreadCount})` : "Unread" },
              { id: "mentions", label: "Mentions" },
              { id: "messages", label: "Messages" },
              { id: "invites", label: invitations.length ? `Invites (${invitations.length})` : "Invites" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id as FilterTab)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap cursor-pointer border ${
                  filter === t.id
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20 scroll-smooth relative z-0 w-full">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : Object.entries(filteredItems).length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 gap-3 text-gray-400">
            <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-200 shadow-sm flex items-center justify-center">
              <Check size={24} className="text-gray-400" />
            </div>
            <p className="text-[14px] font-semibold text-gray-500">All caught up</p>
          </div>
        ) : (
          Object.entries(filteredItems).map(([dateLabel, items]) => (
            <div key={dateLabel} className="mb-8">
              <h2 className="text-[12px] font-bold text-gray-400 mb-3 px-2 uppercase tracking-wide">{dateLabel}</h2>
              <div className="flex flex-col">
                {items.map((item: any, idx: number) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    type={item.__type}
                    onMarkRead={handleMarkRead}
                    onArchive={handleArchive}
                    onAccept={acceptInvite}
                    onDecline={async (id) => {
                      await declineInvite(id);
                    }}
                    currentUserId={userId}
                    isFirst={idx === 0}
                    isLast={idx === items.length - 1}
                  />
                ))}
              </div>
            </div>
          ))
        )}

        {hasMore && notifications.length > 0 && (
          <div ref={sentinelRef} className="py-8 flex justify-center">
            {isLoadingMore ? (
               <Loader2 className="animate-spin text-indigo-500" size={24} />
            ) : (
              <div className="h-1" />
            )}
          </div>
        )}
      </main>

      <ToastContainer
        toasts={toasts}
        onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}