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
  if (isToday(date)) return "TODAY";
  if (isYesterday(date)) return "YESTERDAY";
  if (isTomorrow(date)) return "TOMORROW";
  return format(date, "d MMM").toUpperCase();
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
  if (m < 1) return "JUST NOW";
  if (m < 60) return `${m}M AGO`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}H AGO`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}D AGO`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
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
        label: "MEETING MINUTES",
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
        label: "NUDGE",
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
        label: "STALL ALERT",
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
        label: "STARTED MEETING",
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
        label: "ARCHIVED MEETING",
        icon: <Archive size={12} />,
        accent: "#A0A09B",
        bg: "#F9F9F8",
        preview: previewText,
      };

    case "system_call_ringing":
      return {
        type,
        text,
        label: "INCOMING CALL",
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
        label: "SYSTEM",
        icon: <Info size={12} />,
        accent: "#A0A09B",
        bg: "#F9F9F8",
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
        label: "MEETING MINUTES",
        icon: <ClipboardList size={12} />,
        accent: "#36C5F0",
        bg: "#E8F5FD",
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
  mention: { icon: <AtSign size={10} strokeWidth={3} />, accent: "#36C5F0", label: "MENTION" },
  message: { icon: <MessageSquare size={10} strokeWidth={3} />, accent: "#2EB67D", label: "MESSAGE" },
  task: { icon: <AlertCircle size={10} strokeWidth={3} />, accent: "#ECB22E", label: "TASK" },
  system: { icon: <Bell size={10} strokeWidth={3} />, accent: "#A259FF", label: "SYSTEM" },
} as const;

function SystemBadge({ label, icon, accent, bg }: { label: string; icon: React.ReactNode; accent: string; bg: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] shadow-sm text-[9px] font-[800] tracking-wider whitespace-nowrap flex-shrink-0"
      style={{ color: accent, background: bg, border: `1px solid color-mix(in srgb, ${accent}, transparent 85%)` }}
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
        bg-white mx-3 md:mx-10 px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between
        border border-[#F4F4F0] rounded-[24px] mb-3 transition-all duration-300
        hover:shadow-[0_12px_48px_rgba(0,0,0,0.04)] hover:-translate-y-0.5
        ${!item.read && !isInvite ? "ring-2 ring-[#36C5F0]/20 shadow-[0_4px_16px_rgba(54,197,240,0.08)]" : "shadow-[0_2px_8px_rgba(0,0,0,0.02)]"}
      `}
    >
      <div className="flex items-start gap-4 flex-1 min-w-0 w-full mb-3 md:mb-0">
        <div className="relative flex-shrink-0">
          {isSystemType && !avatarUrl ? (
            <div
              className="w-[42px] h-[42px] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ background: systemParsed?.bg ?? "#F9F9F8", border: `2px solid color-mix(in srgb, ${systemParsed?.accent ?? "#A0A09B"}, transparent 85%)` }}
            >
              <span style={{ color: systemParsed?.accent ?? "#A0A09B" }}>
                {systemParsed?.icon ?? <Bell size={18} strokeWidth={2.5} />}
              </span>
            </div>
          ) : (
            <div className="w-[42px] h-[42px] rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
              <GlobalAvatar
                url={avatarUrl}
                name={avatarName}
                email={avatarEmail}
                size={38}
                fallbackColor={colorFromString(avatarId || "system")}
              />
            </div>
          )}
          {!item.read && !isInvite && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#36C5F0] border-[3px] border-white shadow-sm" />
          )}
        </div>

        <div className="min-w-0 flex-1 mt-0.5">
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className="text-[14px] font-[800] text-[#111111] truncate">{title}</span>
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
                label="INVITE"
                icon={<Bell size={10} strokeWidth={3} />}
                accent="#2EB67D"
                bg="#ECFDF5"
              />
            )}
            <span className="text-[10px] font-[800] text-[#A0A09B] whitespace-nowrap ml-auto tracking-wider">{relativeTime(item.created_at)}</span>
          </div>
          <p className="text-[13.5px] font-[500] text-[#111111] leading-relaxed line-clamp-2 md:pr-8">{preview}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 w-full md:w-auto md:ml-4 flex-shrink-0">
        {isInvite ? (
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => onAccept?.(item.id)}
              className="flex-1 md:flex-none py-2 px-5 rounded-[12px] text-[12px] font-[800] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:scale-105 active:scale-95 transition-all cursor-pointer border-0 shadow-sm"
            >
              ACCEPT
            </button>
            <button
              onClick={() => onDecline?.(item.id)}
              className="flex-1 md:flex-none py-2 px-5 rounded-[12px] text-[12px] font-[800] text-red-700 bg-red-50 hover:bg-red-100 hover:scale-105 active:scale-95 transition-all cursor-pointer border-0 shadow-sm"
            >
              DECLINE
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {!item.read && (
              <button
                onClick={() => onMarkRead?.(item.id)}
                className="text-emerald-500 bg-emerald-50 border border-transparent hover:border-emerald-200 cursor-pointer p-2 rounded-[12px] hover:scale-105 active:scale-95 transition-all shadow-sm"
                title="Mark as Read"
              >
                <Check size={16} strokeWidth={3} />
              </button>
            )}
            <button
              onClick={() => onArchive?.(item.id)}
              className="text-[#A0A09B] bg-[#F9F9F8] border border-transparent hover:border-[#E0E0E0] hover:text-[#111111] cursor-pointer p-2 rounded-[12px] hover:scale-105 active:scale-95 transition-all shadow-sm"
              title="Archive"
            >
              <Archive size={16} strokeWidth={2.5} />
            </button>
            {item.project_id && (
              <Link
                href={`/space/${item.project_id}`}
                className="text-white text-[12px] font-[800] bg-[#111111] px-5 py-2 rounded-[12px] hover:bg-[#222222] hover:scale-105 active:scale-95 shadow-md hover:shadow-lg transition-all no-underline whitespace-nowrap tracking-wider flex items-center gap-1.5"
              >
                VIEW <ArrowRight size={12} strokeWidth={3} />
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
    <div className="bg-transparent text-[#111111] min-h-screen flex flex-col font-sans">
      <header className="p-6 md:p-10 pb-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-[32px] font-[800] text-[#111111] mb-1.5 tracking-[-0.02em]">Inbox</h1>
            <p className="text-[14px] text-[#A0A09B] font-[600] tracking-tight">
              You have{" "}
              <span className="text-[#36C5F0] font-[800]">{totalUnreadCount}</span>{" "}
              unread notifications
            </p>
          </div>
          <button
            onClick={handleMarkAllRead}
            className="bg-white border border-[#F4F4F0] px-5 py-2.5 rounded-[12px] text-[12px] font-[800] text-[#111111] shadow-sm hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer tracking-wider"
          >
            MARK ALL READ
          </button>
        </div>

        <div className="flex flex-col xl:flex-row gap-5 xl:items-center">
          <div className="relative w-full max-w-[420px] group flex-shrink-0 z-20">
            <Search size={16} strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A09B] group-focus-within:text-[#111111] transition-colors" />
            <input
              type="text"
              placeholder="SEARCH..."
              className="w-full px-5 py-3.5 pl-[42px] pr-12 bg-white border border-[#F4F4F0] rounded-[16px] text-[13px] font-[700] text-[#111111] placeholder:text-[#A0A09B] focus:outline-none focus:border-[#E0E0E0] focus:ring-4 focus:ring-[#E0E0E0]/30 shadow-sm hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all uppercase tracking-wider"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A09B] hover:text-[#111111] bg-[#F9F9F8] rounded-full p-1.5 border-0 cursor-pointer transition-colors"
                onClick={() => setSearch("")}
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full hide-scrollbar sm:flex-wrap">
            {[
              { id: "all", label: "ALL" },
              { id: "unread", label: unreadCount ? `UNREAD · ${unreadCount}` : "UNREAD" },
              { id: "mentions", label: "MENTIONS" },
              { id: "messages", label: "MESSAGES" },
              { id: "invites", label: invitations.length ? `INVITES · ${invitations.length}` : "INVITES" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id as FilterTab)}
                className={`px-5 py-3 rounded-[14px] text-[11px] font-[800] transition-all tracking-wider ${filter === t.id
                  ? "bg-[#111111] text-white shadow-md -translate-y-0.5"
                  : "bg-white text-[#A0A09B] border border-[#F4F4F0] hover:text-[#111111] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 cursor-pointer"
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20 scroll-smooth px-3 lg:px-0 relative z-0">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-[#36C5F0]" size={32} />
          </div>
        ) : Object.entries(filteredItems).length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-32 gap-4 text-[#A0A09B]">
            <div className="w-16 h-16 rounded-full bg-white border border-[#F4F4F0] shadow-sm flex items-center justify-center">
              <Bell size={28} strokeWidth={2.5} className="text-[#A0A09B]/50" />
            </div>
            <p className="text-[14px] font-[800] text-[#A0A09B] tracking-widest uppercase">ALL CAUGHT UP</p>
          </div>
        ) : (
          Object.entries(filteredItems).map(([dateLabel, items]) => (
            <div key={dateLabel} className="mb-10">
              <h2 className="text-[10px] font-[900] text-[#A0A09B] mx-6 md:mx-12 mb-4 tracking-[0.15em] uppercase">{dateLabel}</h2>
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
              <Loader2 className="animate-spin text-[#36C5F0]" size={24} />
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