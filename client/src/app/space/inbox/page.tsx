"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Bell, Hash, ArrowRight, Check,
  CheckCheck, Loader2, Search, X,
  AtSign, AlertCircle, Clock, Archive,
  UserPlus, Building2, ExternalLink, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { useInvitations, type Invitation } from "@/hooks/useInvitations";
import { ToastContainer, ToastProps } from "@/components/global/toast";
import { useNotificationSound } from "@/hooks/useNotificationSound";

type NotifType = "mention" | "message" | "task" | "system";
type FilterTab = "all" | "mentions" | "messages" | "unread" | "invites";

function colorFromString(s: string) {
  const palette = ["#36C5F0", "#2EB67D", "#ECB22E", "#E01E5A", "#A259FF", "#FF6B6B"];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
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

const TYPE_CONFIG: Record<NotifType, { icon: React.ReactNode; accent: string; label: string }> = {
  mention: { icon: <AtSign size={10} strokeWidth={2.5} />, accent: "#36C5F0", label: "Mention" },
  message: { icon: <MessageSquare size={10} strokeWidth={2.5} />, accent: "#2EB67D", label: "Message" },
  task: { icon: <AlertCircle size={10} strokeWidth={2.5} />, accent: "#ECB22E", label: "Task" },
  system: { icon: <Bell size={10} strokeWidth={2.5} />, accent: "#A259FF", label: "System" },
};

function Avatar({ name, userId, size = 36 }: { name: string | null | undefined; userId: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-black text-white flex-shrink-0 select-none"
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, ${colorFromString(userId)}, ${colorFromString(userId + "x")})`,
        fontSize: size * 0.34, letterSpacing: "-0.5px",
      }}
    >
      {initials(name)}
    </div>
  );
}

// ─── Invitation Tile ──────────────────────────────────────────────────────────

function InvitationTile({
  invitation, currentUserId, onAccept, onDecline,
}: {
  invitation: Invitation;
  currentUserId: string;
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
}) {
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [decided, setDecided] = useState<"accepted" | "declined" | null>(null);

  // Server already filters invitations to only the current user's — always show buttons
  const isInvitedUser = true;
  const projectColor = invitation.projects?.color ?? "#36C5F0";
  const inviterName = invitation.profiles?.full_name ?? invitation.profiles?.email ?? "Someone";
  const inviterId = invitation.profiles?.id ?? "system";
  const projectName = invitation.projects?.name ?? invitation.workspaces?.name ?? "a project";
  const workspaceName = invitation.workspaces?.name;

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setAccepting(true);
    await onAccept(invitation.id);
    setDecided("accepted");
    setAccepting(false);
  };

  const handleDecline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeclining(true);
    await onDecline(invitation.id);
    setDecided("declined");
    setDeclining(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.18 } }}
      className=" overflow-hidden"
      style={{
        background: "#fff",
        border: `1.5px solid ${projectColor}28`,
        boxShadow: `0 2px 12px ${projectColor}14`,
      }}
    >
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${projectColor}, ${projectColor}66)` }} />

      <div className="px-4 pt-3 pb-3">
        {/* Inviter row */}
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <Avatar name={inviterName} userId={inviterId} size={38} />
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: projectColor }}>
              <UserPlus size={8} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12.5px] font-black text-gray-900 truncate">{inviterName}</p>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: `${projectColor}18`, color: projectColor }}>invite</span>
                <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Clock size={8} />{relativeTime(invitation.created_at)}</span>
              </div>
            </div>
            <p className="text-[11.5px] text-gray-500 mt-0.5 truncate">
              Invited you to join <span className="font-bold text-gray-700">{projectName}</span>
            </p>
          </div>
        </div>

        {/* Project pill */}
        <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl" style={{ background: `${projectColor}08`, border: `1px solid ${projectColor}18` }}>
          <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: projectColor }}>
            {projectName
              ? <span className="text-white text-[10px] font-black">{String(projectName)[0]}</span>
              : <Building2 size={12} className="text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11.5px] font-black text-gray-800 truncate">{projectName}</p>
            {workspaceName && (
              <p className="text-[10px] text-gray-400 truncate flex items-center gap-1"><Building2 size={7} />{workspaceName}</p>
            )}
          </div>
          {invitation.role && (
            <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${projectColor}15`, color: projectColor, border: `1px solid ${projectColor}25` }}>
              {invitation.role}
            </span>
          )}
        </div>

        {/* Actions — invited user only */}
        {isInvitedUser && (
          <div className="mt-3">
            {decided ? (
              <motion.div
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={decided === "accepted"
                  ? { background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }
                  : { background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}
              >
                {decided === "accepted" ? (
                  <>
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"><Check size={11} strokeWidth={3} className="text-white" /></div>
                    <div><p className="text-[12px] font-black text-emerald-700">You're in!</p><p className="text-[10px] text-emerald-500">Invitation accepted</p></div>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"><X size={11} strokeWidth={3} className="text-gray-500" /></div>
                    <div><p className="text-[12px] font-black text-gray-500">Invitation declined</p><p className="text-[10px] text-gray-400">You can ask for a new one anytime</p></div>
                  </>
                )}
              </motion.div>
            ) : (
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleAccept} disabled={accepting || declining}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-black text-white border-0 cursor-pointer disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${projectColor}, ${projectColor}bb)`, boxShadow: `0 4px 14px ${projectColor}40`, fontFamily: "'Sora', sans-serif" }}
                >
                  {accepting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2.5} />}
                  {accepting ? "Accepting…" : "Accept"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleDecline} disabled={accepting || declining}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-bold cursor-pointer disabled:opacity-50 border-0 transition-all"
                  style={{ background: "rgba(0,0,0,0.04)", color: "#9CA3AF", fontFamily: "'Sora', sans-serif" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FEE2E2"; (e.currentTarget as HTMLButtonElement).style.color = "#DC2626"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF"; }}
                >
                  {declining ? <Loader2 size={13} className="animate-spin" /> : <X size={13} strokeWidth={2.5} />}
                  {declining ? "Declining…" : "Decline"}
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Notification Tile ────────────────────────────────────────────────────────

function NotificationTile({
  notif, onMarkRead, onArchive,
}: {
  notif: Notification;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[notif.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.18 } }}
      className="overflow-hidden"
      style={{
        background: "#fff",
        border: `1.5px solid ${notif.read ? "rgba(0,0,0,0.06)" : `${cfg.accent}22`}`,
        boxShadow: notif.read ? "none" : `0 2px 10px ${cfg.accent}10`,
      }}
    >

      <div className="px-4 pt-3 pb-3">
        {/* Top row */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 pt-0.5">
            {notif.sender
              ? <Avatar name={notif.sender.full_name} userId={notif.sender.id} size={36} />
              : <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${cfg.accent}12` }}><span style={{ color: cfg.accent }}>{cfg.icon}</span></div>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[12.5px] font-black text-gray-900 truncate">{notif.sender?.full_name ?? "System"}</span>
                <span className="flex items-center gap-0.5 text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: `${cfg.accent}12`, color: cfg.accent }}>
                  {cfg.icon}<span className="ml-0.5">{cfg.label}</span>
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!notif.read && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.accent }} />}
                <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Clock size={8} />{relativeTime(notif.created_at)}</span>
              </div>
            </div>
            {(notif.project_name || notif.channel_name) && (
              <div className="flex items-center gap-0.5 mt-0.5">
                {notif.project_name && <span className="text-[10px] font-semibold text-gray-400 truncate">{notif.project_name}</span>}
                {notif.channel_name && (<><ChevronRight size={8} className="text-gray-300 flex-shrink-0" /><Hash size={8} className="text-gray-400 flex-shrink-0" /><span className="text-[10px] font-semibold text-gray-400 truncate">{notif.channel_name}</span></>)}
              </div>
            )}
            <p className="text-[12px] leading-relaxed mt-1.5 line-clamp-2" style={{ color: notif.read ? "#9CA3AF" : "#374151", fontWeight: notif.read ? 400 : 500 }}>
              {notif.preview}
            </p>
          </div>
        </div>

        {/* Bottom action row */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t" style={{ borderTopColor: "rgba(0,0,0,0.05)" }}>

          <div className="flex items-center gap-1">
            {!notif.read && (
              <button onClick={() => onMarkRead(notif.id)} title="Mark as read" className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:text-emerald-500 transition-colors bg-transparent border-0 cursor-pointer">
                <Check size={12} />
              </button>
            )}
            <button onClick={() => onArchive(notif.id)} title="Archive" className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors bg-transparent border-0 cursor-pointer">
              <Archive size={12} />
            </button>
          </div>
          <div>
            {notif.project_id && (
              <Link href={`/space/${notif.project_id}`}>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white border-0 cursor-pointer"
                  style={{ background: "#0D0D0D", fontFamily: "'Sora', sans-serif" }}
                >
                  {notif.type === "message"
                    ? <><ExternalLink size={11} />View in Chat</>
                    : <><ArrowRight size={11} />View</>}
                </motion.button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [userId, setUserId] = useState<string>("");

  const { playSound } = useNotificationSound();

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      createClient().auth.getUser().then(({ data }) => {
        if (data.user?.id) setUserId(data.user.id);
      });
    });
  }, []);

  const { invitations, accept: acceptInvite, decline: declineInvite } = useInvitations(userId);

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

  const { notifications, loading, unreadCount, markRead: handleMarkRead, markAllRead: handleMarkAllRead, archive: handleArchive } = useNotifications({
    enableSound: true, enableToast: true, onNewNotification: handleNewNotification,
  });

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const filteredNotifications = notifications.filter((n) => {
    if (n.type === "system" && /invited you to join/i.test(n.content)) return false;
    if (filter === "unread" && n.read) return false;
    if (filter === "mentions" && n.type !== "mention") return false;
    if (filter === "messages" && n.type !== "message") return false;
    if (filter === "invites") return false;
    if (search && !n.content.toLowerCase().includes(search.toLowerCase()) && !n.sender?.full_name?.toLowerCase().includes(search.toLowerCase()) && !n.project_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredInvitations = filter === "invites" || filter === "all" ? invitations : [];
  const hasContent = filteredInvitations.length > 0 || filteredNotifications.length > 0;
  const totalUnread = unreadCount + invitations.length;

  const handleAcceptInvite = async (id: string) => {
    const result = await acceptInvite(id);
    if (result.error) {
      setToasts((prev) => [{ id: `err-${id}`, type: "system", title: "Error", message: result.error, onClose: (tid) => setToasts((p) => p.filter((t) => t.id !== tid)) }, ...prev]);
    }
  };

  const TABS: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: unreadCount ? `Unread · ${unreadCount}` : "Unread" },
    { id: "mentions", label: "Mentions" },
    { id: "messages", label: "Messages" },
    { id: "invites", label: invitations.length ? `Invites · ${invitations.length}` : "Invites" },
  ];

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: "'Sora', sans-serif", background: "#F7F7F5" }}>
        {/* Header */}
        <div className="flex-shrink-0 px-4 sm:px-5 pt-5 pb-3 bg-white border-b" style={{ borderBottomColor: "rgba(0,0,0,0.05)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-[20px] font-black text-gray-900 tracking-tight">Inbox</h1>
              <p className="text-[11.5px] text-gray-400 mt-0.5">
                {loading ? "Loading…" : totalUnread > 0 ? `${totalUnread} pending` : "All caught up 🎉"}
              </p>
            </div>
            {unreadCount > 0 && (
              <motion.button whileTap={{ scale: 0.96 }} onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border-0 transition-colors"
                style={{ background: "rgba(0,0,0,0.04)", color: "#6B7280", fontFamily: "'Sora', sans-serif" }}
              >
                <CheckCheck size={11} />Mark all read
              </motion.button>
            )}
          </div>

          <div className="relative mb-3">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications…"
              className="w-full pl-8 pr-8 py-2 rounded-xl text-[12px] text-gray-700 placeholder-gray-300 outline-none transition-all"
              style={{ background: "rgba(0,0,0,0.04)", border: "1px solid transparent", fontFamily: "'Sora', sans-serif" }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
              onBlur={(e) => (e.target.style.borderColor = "transparent")}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 border-0 bg-transparent cursor-pointer">
                <X size={11} />
              </button>
            )}
          </div>

          <div className="flex gap-0.5 flex-wrap">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setFilter(t.id)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border-0 transition-all"
                style={{ background: filter === t.id ? "#0D0D0D" : "transparent", color: filter === t.id ? "#fff" : "#9CA3AF", fontFamily: "'Sora', sans-serif" }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pt-3 pb-4">
          {loading ? (
            <div className="flex items-center justify-center h-40"><Loader2 size={18} className="animate-spin text-gray-300" /></div>
          ) : (
            <AnimatePresence mode="popLayout">
              {!hasContent ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-48 gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center"><Bell size={18} className="text-gray-300" /></div>
                  <p className="text-[12.5px] font-semibold text-gray-400">No notifications</p>
                </motion.div>
              ) : (
                <>
                  {filteredInvitations.length > 0 && (
                    <>
                      {filter === "all" && (
                        <div className="px-4 pb-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Invitations · {filteredInvitations.length}</span>
                        </div>
                      )}
                      {filteredInvitations.map((inv) => (
                        <InvitationTile key={inv.id} invitation={inv} currentUserId={userId} onAccept={handleAcceptInvite} onDecline={async (id) => { await declineInvite(id); }} />
                      ))}
                      {filter === "all" && filteredNotifications.length > 0 && (
                        <div className="px-4 pt-2 pb-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Notifications</span>
                        </div>
                      )}
                    </>
                  )}
                  {filteredNotifications.map((n) => (
                    <NotificationTile key={n.id} notif={n} onMarkRead={handleMarkRead} onArchive={handleArchive} />
                  ))}
                </>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </>
  );
}