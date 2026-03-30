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

type NotifType = "mention" | "message" | "task" | "system";
type FilterTab = "all" | "mentions" | "messages" | "unread" | "invites";

function getGroupLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "d MMM");
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
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function colorFromString(s: string) {
  const palette = ["#36C5F0", "#2EB67D", "#ECB22E", "#E01E5A", "#A259FF", "#FF6B6B"];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

type ParsedSystemMessage = {
  type: string;
  text: string;
  label: string;
  icon: React.ReactNode;
  accent: string;
  bg: string;
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
    .replace(/[📝📋🤔✍️🤝🤝🏃‍♂️🚨✨]/gu, "") // Strip common AI emojis
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
        accent: "#36C5F0",
        bg: "#E8F5FD",
        preview: previewText,
      };

    case "system_nudge":
    case "nudge":
      return {
        type,
        text,
        label: "Nudge",
        icon: <Zap size={10} strokeWidth={3} className="fill-emerald-500" />,
        accent: "#10B981",
        bg: "#ECFDF5",
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
        accent: "#ECB22E",
        bg: "#FFFBEB",
        preview: previewText,
      };

    case "system_call":
    case "call":
      return {
        type,
        text,
        label: "Started Meeting",
        icon: <Bell size={12} />,
        accent: "#2EB67D",
        bg: "#F0FFF4",
        preview: previewText,
      };

    case "system_call_ended":
    case "call_ended":
      return {
        type,
        text,
        label: "Archive Meeting",
        icon: <Archive size={12} />,
        accent: "#718096",
        bg: "#F7FAFC",
        preview: previewText,
      };

    case "system_call_ringing":
      return {
        type,
        text,
        label: "Incoming Call",
        icon: <Bell size={12} />,
        accent: "#E01E5A",
        bg: "#FFF5F7",
        preview: previewText,
      };

    default:
      if (!type && !text) return null;
      return {
        type: type || "system",
        text,
        label: "System",
        icon: <Info size={12} />,
        accent: "#A0AEC0",
        bg: "#F7FAFC",
        preview: previewText,
      };
  }
}

function parseMomCardPreview(content: string): string {
  const cleaned = content
    .replace(/\[MOM_CARD\]\s*/gi, "")
    .replace(/[📝📋🤔✍️🤝🤝🏃‍♂️🚨✨]/gu, "") // Strip common AI emojis
    .replace(/#{1,4}\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\n+/g, " ")
    .trim();
  return cleaned.length > 120 ? cleaned.slice(0, 120) + "…" : cleaned;
}

function getNotificationPreview(n: Notification): { preview: string; systemParsed: ParsedSystemMessage | null } {
  const raw = (n as any).content ?? n.preview ?? "";

  const momCardMatch =
    typeof raw === "string" && raw.includes("[MOM_CARD]");
  if (momCardMatch) {
    return {
      preview: parseMomCardPreview(raw),
      systemParsed: {
        type: "mom_card",
        text: raw,
        label: "Meeting Minutes",
        icon: <ClipboardList size={12} />,
        accent: "#36C5F0",
        bg: "#EBF8FF",
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

const TYPE_CONFIG: Record<NotifType, { icon: React.ReactNode; accent: string; label: string }> = {
  mention: { icon: <AtSign size={10} strokeWidth={2.5} />, accent: "#36C5F0", label: "Mention" },
  message: { icon: <MessageSquare size={10} strokeWidth={2.5} />, accent: "#2EB67D", label: "Message" },
  task: { icon: <AlertCircle size={10} strokeWidth={2.5} />, accent: "#ECB22E", label: "Task" },
  system: { icon: <Bell size={10} strokeWidth={2.5} />, accent: "#A259FF", label: "System" },
} as const;

function SystemBadge({ label, icon, accent, bg }: { label: string; icon: React.ReactNode; accent: string; bg: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap flex-shrink-0"
      style={{ color: accent, background: bg, border: `1px solid ${accent}22` }}
    >
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
  isFirst,
  isLast,
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

  const cfg = !isInvite ? TYPE_CONFIG[(item as Notification).type || "system"] : null;

  const avatarUrl = isInvite ? item.profiles?.avatar_url : item.sender?.avatar_url;
  const avatarName = isInvite ? item.profiles?.full_name : item.sender?.full_name;
  const avatarEmail = isInvite ? item.profiles?.email : item.sender?.email;
  const avatarId = isInvite ? item.profiles?.id : item.sender?.id;

  return (
    <div
      className={`
        bg-white mx-2 md:mx-10 px-4 md:px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between
        border-b border-[#F0F4F8] transition-colors hover:bg-[#F9FAFB]
        ${isFirst ? "rounded-t-lg" : ""}
        ${isLast ? "rounded-b-lg border-none" : ""}
        ${!item.read && !isInvite ? "border-l-2 border-l-[#36C5F0]" : ""}
      `}
    >
      <div className="flex items-start gap-4 flex-1 min-w-0 w-full mb-3 md:mb-0">
        <div className="relative flex-shrink-0">
          {isSystemType && !avatarUrl ? (
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: systemParsed?.bg ?? "#F7FAFC", border: `1.5px solid ${systemParsed?.accent ?? "#A0AEC0"}33` }}
            >
              <span style={{ color: systemParsed?.accent ?? "#A0AEC0" }}>
                {systemParsed?.icon ?? <Bell size={18} />}
              </span>
            </div>
          ) : (
            <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-[#EDF2F7]">
              <GlobalAvatar
                url={avatarUrl}
                name={avatarName}
                email={avatarEmail}
                size={44}
                fallbackColor={colorFromString(avatarId || "system")}
              />
            </div>
          )}
          {!item.read && !isInvite && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#36C5F0] border-2 border-white" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-sm font-bold text-[#2D3748] truncate">{title}</span>
            {systemParsed && (
              <SystemBadge
                label={systemParsed.label}
                icon={systemParsed.icon}
                accent={systemParsed.accent}
                bg={systemParsed.bg}
              />
            )}
            {isInvite && (
              <SystemBadge
                label="Invite"
                icon={<Bell size={10} />}
                accent="#2EB67D"
                bg="#F0FFF4"
              />
            )}
            <span className="text-xs text-[#A0AEC0] whitespace-nowrap ml-auto">{relativeTime(item.created_at)}</span>
          </div>
          <p className="text-[13px] text-[#718096] line-clamp-2">{preview}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 w-full md:w-auto md:ml-4 flex-shrink-0">
        {isInvite ? (
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => onAccept?.(item.id)}
              className="flex-1 md:flex-none py-1.5 px-3 rounded text-[13px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer border-none font-sans"
            >
              Accept
            </button>
            <button
              onClick={() => onDecline?.(item.id)}
              className="flex-1 md:flex-none py-1.5 px-3 rounded text-[13px] font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer border-none font-sans"
            >
              Decline
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {!item.read && (
              <button
                onClick={() => onMarkRead?.(item.id)}
                className="text-emerald-500 bg-transparent border-0 cursor-pointer p-1.5 rounded-full hover:bg-emerald-50 transition-colors"
                title="Mark Read"
              >
                <Check size={15} />
              </button>
            )}
            <button
              onClick={() => onArchive?.(item.id)}
              className="text-gray-300 bg-transparent border-0 cursor-pointer p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              title="Archive"
            >
              <Archive size={15} />
            </button>
            {item.project_id && (
              <Link
                href={`/space/${item.project_id}`}
                className="text-[#319795] text-[13px] font-bold px-2.5 py-1 rounded hover:bg-[#E6FFFA] transition-colors no-underline whitespace-nowrap"
              >
                View
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InboxPage() {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      createClient()
        .auth.getUser()
        .then(({ data }) => {
          if (data.user?.id) setUserId(data.user.id);
        });
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
    <div className="bg-[#F9F9F7] text-[#2D3748] min-h-screen flex flex-col font-sans">
      <header className="p-6 md:p-10 pb-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A202C] mb-1">Notifications</h1>
            <p className="text-sm text-[#4A5568]">
              You have{" "}
              <span className="text-[#38A169] font-bold">{totalUnreadCount}</span>{" "}
              notifications to go through
            </p>
          </div>
          <button
            onClick={handleMarkAllRead}
            className="bg-white border border-[#E2E8F0] px-4 py-2 rounded-md text-[13px] font-semibold text-[#4A5568] hover:bg-[#F7FAFC] hover:border-[#CBD5E0] transition-colors w-full md:w-auto"
          >
            Mark all as Read
          </button>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 xl:items-center mb-8">
          <div className="relative w-full max-w-[400px] group flex-shrink-0">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-500" />
            <input
              type="text"
              placeholder="Search notifications…"
              className="w-full px-4 py-2.5 pl-11 pr-20 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#CBD5E0] shadow-sm transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-0"
                onClick={() => setSearch("")}
              >
                <X size={14} />
              </button>
            )}
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-[#2D3748] flex items-center justify-center pointer-events-none">
              <Search size={12} className="text-white" />
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 w-full hide-scrollbar">
            {[
              { id: "all", label: "All" },
              { id: "unread", label: unreadCount ? `Unread · ${unreadCount}` : "Unread" },
              { id: "mentions", label: "Mentions" },
              { id: "messages", label: "Messages" },
              { id: "invites", label: invitations.length ? `Invites · ${invitations.length}` : "Invites" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id as FilterTab)}
                className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all whitespace-nowrap border ${filter === t.id
                  ? "bg-[#2D3748] text-white border-[#2D3748]"
                  : "bg-white text-[#4A5568] border-[#E2E8F0] hover:bg-[#F7FAFC]"
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20 scroll-smooth">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-gray-400" />
          </div>
        ) : Object.entries(filteredItems).length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 gap-3 text-gray-400">
            <Bell size={32} strokeWidth={1.5} />
            <p className="text-sm font-medium">No notifications found</p>
          </div>
        ) : (
          Object.entries(filteredItems).map(([dateLabel, items]) => (
            <div key={dateLabel} className="mb-6">
              <h2 className="text-sm font-semibold text-[#718096] mx-5 md:mx-10 mb-3">{dateLabel}</h2>
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
              <Loader2 className="animate-spin text-gray-400" />
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