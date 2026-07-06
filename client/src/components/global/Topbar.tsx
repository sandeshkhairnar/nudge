"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell, Check, AtSign, MessageSquare,
  AlertCircle, ClipboardList, Zap, AlertTriangle,
  ArrowRight, X, Search, Hash, Layout, User,
  CornerDownLeft, Command,
} from "lucide-react";
import { useNotificationStore } from "@/store/notification-store";
import { useNotificationActions } from "@/components/global/notification-provider";
import { useProjectsStore } from "@/store/projects-store";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";

// ── helpers ──────────────────────────────────────────────────────────────────

type NotifType = "mention" | "message" | "task" | "system";

const TYPE_META: Record<
  NotifType,
  { icon: React.ReactNode; accent: string; bg: string; label: string }
> = {
  mention: { icon: <AtSign size={11} strokeWidth={2.5} />, accent: "#36C5F0", bg: "#EBF8FF", label: "Mention" },
  message: { icon: <MessageSquare size={11} strokeWidth={2.5} />, accent: "#2EB67D", bg: "#F0FFF4", label: "Message" },
  task: { icon: <AlertCircle size={11} strokeWidth={2.5} />, accent: "#ECB22E", bg: "#FFFBEB", label: "Task" },
  system: { icon: <Bell size={11} strokeWidth={2.5} />, accent: "#A259FF", bg: "#FAF5FF", label: "System" },
};

function parseSystemIcon(type: string): React.ReactNode {
  switch (type) {
    case "mom_card": return <ClipboardList size={11} />;
    case "system_nudge":
    case "nudge": return <Zap size={11} strokeWidth={3} />;
    case "stall_alert":
    case "stall_warning": return <AlertTriangle size={11} />;
    default: return <Bell size={11} />;
  }
}

function parseSystemAccent(type: string): { accent: string; bg: string } {
  switch (type) {
    case "mom_card": return { accent: "#36C5F0", bg: "#EBF8FF" };
    case "system_nudge":
    case "nudge": return { accent: "#10B981", bg: "#ECFDF5" };
    case "stall_alert":
    case "stall_warning": return { accent: "#ECB22E", bg: "#FFFBEB" };
    default: return { accent: "#A259FF", bg: "#FAF5FF" };
  }
}

/** Tries to parse JSON content from a notification and return a clean preview */
function resolvePreview(raw: string): { preview: string; sysType?: string } {
  if (!raw) return { preview: "" };

  // Legacy [MOM_CARD] prefix
  if (raw.includes("[MOM_CARD]")) {
    const cleaned = raw
      .replace(/\[MOM_CARD\]\s*/gi, "")
      .replace(/#{1,4}\s*/g, "")
      .replace(/\*+/g, "")
      .replace(/\n+/g, " ")
      .trim();
    return { preview: cleaned.slice(0, 100) + (cleaned.length > 100 ? "…" : ""), sysType: "mom_card" };
  }

  // JSON blob
  if (raw.trim().startsWith("{")) {
    try {
      const data = JSON.parse(raw);
      const text = (data.text ?? "")
        .replace(/#{1,4}\s*/g, "")
        .replace(/\*+/g, "")
        .replace(/\[MOM_CARD\]\s*/gi, "")
        .replace(/\n+/g, " ")
        .trim();
      return {
        preview: text.slice(0, 100) + (text.length > 100 ? "…" : ""),
        sysType: data.type,
      };
    } catch {
      /* fall through */
    }
  }

  return { preview: raw.slice(0, 100) + (raw.length > 100 ? "…" : "") };
}

// ── SearchBar ────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  type: "page" | "project" | "task";
  title: string;
  subtitle?: string;
  href: string;
  color?: string;
}

const STATIC_PAGES: SearchResult[] = [
  { id: "p1", type: "page", title: "Inbox", subtitle: "All notifications", href: "/space/inbox" },
  { id: "p2", type: "page", title: "Team", subtitle: "Manage members", href: "/space/team" },
  { id: "p3", type: "page", title: "My Nudges", subtitle: "Stalled tasks", href: "/space/nudges" },
  { id: "p4", type: "page", title: "Analytics", subtitle: "Project stats", href: "/space/analytics" },
];

function SearchBar() {
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const projects = useProjectsStore((s) => s.projects);

  // 1. Hotkey support (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 2. Search Logic (Debounced)
  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const query = search.toLowerCase();

      // Local pages filter
      const pageResults = STATIC_PAGES.filter(p => p.title.toLowerCase().includes(query));

      // Local projects filter
      const projectResults: SearchResult[] = projects
        .filter(p => p.name.toLowerCase().includes(query))
        .map(p => ({
          id: p.id,
          type: "project",
          title: p.name,
          subtitle: "Project Board",
          href: `/space/${p.id}`,
          color: p.color
        }));

      // Remote tasks search
      const { data: taskData } = await supabase
        .from("tasks")
        .select("id, title, project_id, projects!tasks_project_id_fkey(name, color)")
        .ilike("title", `%${query}%`)
        .limit(5);

      const taskResults: SearchResult[] = (taskData || []).map((t: any) => ({
        id: t.id,
        type: "task",
        title: t.title,
        subtitle: `in ${t.projects?.name || "Unknown"}`,
        href: `/space/${t.project_id}`, // Jump to board for now
        color: t.projects?.color
      }));

      setResults([...pageResults, ...projectResults, ...taskResults]);
      setActiveIndex(0);
      setLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [search, projects]);

  // 3. Keyboard Nav
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      const target = results[activeIndex];
      router.push(target.href);
      setSearch("");
      setFocused(false);
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative group">
      <motion.div
        animate={{
          width: focused ? 320 : 240,
          boxShadow: focused
            ? "0 0 0 2px rgba(54,197,240,0.2), 0 8px 24px rgba(0,0,0,0.08)"
            : "0 0 0 1px #EBEBEB",
        }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="hidden sm:flex rounded-[12px] bg-[#F9F9F7] items-center gap-2 px-3 h-10 overflow-hidden flex-shrink-0 relative z-[101]"
      >
        {loading ? (
          <div className="w-4 h-4 rounded-full border-2 border-[#36C5F0] border-t-transparent animate-spin flex-shrink-0" />
        ) : (
          <Search size={15} className="text-[#9CA3AF] flex-shrink-0" />
        )}
        
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => {
            setFocused(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search projects, tasks..."
          className="bg-transparent border-none outline-none text-[13.5px] font-medium text-[#0D0D0D] w-full placeholder-[#B0B0A8]"
        />

        <AnimatePresence>
          {!search && !focused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-[#EBEBEB] text-[10px] font-bold text-[#9CA3AF] absolute right-2"
            >
              <Command size={9} />
              <span>K</span>
            </motion.div>
          )}
          {search && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => {
                setSearch("");
                inputRef.current?.focus();
              }}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-[#EBEBEB] text-[#6B7280] hover:bg-[#D1D5DB] transition-colors border-0 cursor-pointer flex-shrink-0"
            >
              <X size={12} />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {focused && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setFocused(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              className="absolute top-12 left-0 w-full min-w-[320px] bg-white border border-[#EBEBEB] rounded-2xl z-[101] overflow-hidden p-1.5 shadow-2xl"
              style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.05)" }}
            >
              {!search ? (
                <div className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#F9F9F7] flex items-center justify-center mx-auto mb-2 text-[#9CA3AF]">
                    <Search size={18} />
                  </div>
                  <p className="text-[12.5px] font-bold text-[#0D0D0D]">Quick Search</p>
                  <p className="text-[11.5px] text-[#9CA3AF] mt-0.5">Find projects, tasks, or settings</p>
                </div>
              ) : results.length === 0 && !loading ? (
                <div className="p-6 text-center">
                  <p className="text-[13px] text-[#6B7280] font-medium">No results found for "{search}"</p>
                </div>
              ) : (
                <div className="max-h-[380px] overflow-y-auto">
                  {results.map((res, i) => {
                    const isSelected = i === activeIndex;
                    return (
                      <div
                        key={`${res.type}-${res.id}`}
                        onMouseMove={() => setActiveIndex(i)}
                        onClick={() => {
                          router.push(res.href);
                          setSearch("");
                          setFocused(false);
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-[#F4F4F1]' : 'hover:bg-[#F9F9F7]'}`}
                      >
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: res.color ? `${res.color}15` : '#F4F4F1',
                            color: res.color || '#9CA3AF'
                          }}
                        >
                          {res.type === "page" && <Layout size={16} />}
                          {res.type === "project" && <Hash size={16} />}
                          {res.type === "task" && <Check size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-bold truncate ${isSelected ? 'text-[#0D0D0D]' : 'text-[#374151]'}`}>
                            {res.title}
                          </p>
                          {res.subtitle && (
                            <p className="text-[11px] text-[#9CA3AF] truncate mt-0.5 font-medium">
                              {res.subtitle}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-1 text-[10px] font-black text-[#9CA3AF] animate-in fade-in slide-in-from-right-1">
                            <span>Open</span>
                            <CornerDownLeft size={10} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer Tip */}
              <div className="px-3 py-2 border-t border-[#F5F5F2] flex items-center justify-between text-[10px] font-bold text-[#C4C4BC]">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-[#F9F9F7] border border-[#EBEBEB]">
                    <ArrowRight size={8} rotate={90} className="rotate-90" />
                  </span>
                  <span>to navigate</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-[#F9F9F7] border border-[#EBEBEB]">Enter</span>
                  <span>to select</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── NotificationBell ─────────────────────────────────────────────────────────

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { markAsRead, markAllAsRead } = useNotificationActions();

  // Only unread notifications, newest first, capped at 8
  const unread = notifications
    .filter((n) => !n.read)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative flex-shrink-0" ref={panelRef}>
      {/* Bell button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className={`w-9 h-9 rounded-xl flex items-center justify-center relative cursor-pointer transition-all border ${
          open ? "bg-white shadow-sm border-gray-200" : "bg-[#F9F9F7] border-transparent hover:border-gray-200 hover:bg-white hover:shadow-sm"
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
            stroke={open ? "#111827" : "#4B5563"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center shadow-sm"
            >
              <span className="text-[9px] font-bold text-white leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-12 right-0 w-[min(380px,calc(100vw-24px))] bg-white border border-gray-200 rounded-2xl z-[99] overflow-hidden shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-gray-900">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-[12px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors bg-transparent border-0 cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Notification list */}
            <div className="max-h-[400px] overflow-y-auto">
              {unread.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                    <Check size={20} className="text-gray-400" strokeWidth={2.5} />
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-semibold text-gray-900">You're all caught up!</p>
                    <p className="text-[12px] text-gray-500 mt-0.5">No new notifications.</p>
                  </div>
                </div>
              ) : (
                <div className="py-1">
                  {unread.map((n, i) => {
                    const rawContent = (n as any).content ?? n.preview ?? "";
                    const { preview, sysType } = resolvePreview(rawContent);
                    const meta = TYPE_META[n.type as NotifType] ?? TYPE_META.system;
                    const { accent, bg } = sysType
                      ? parseSystemAccent(sysType)
                      : { accent: meta.accent, bg: meta.bg };
                    const icon = sysType ? parseSystemIcon(sysType) : meta.icon;
                    const senderName = n.sender?.full_name;

                    return (
                      <div
                        key={n.id}
                        className="group flex items-start gap-3.5 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-0 relative"
                        onClick={() => {
                          markAsRead(n.id);
                          setOpen(false);
                          window.location.href = "/space/inbox";
                        }}
                      >
                        {/* Unread dot indicator */}
                        <div className="absolute left-2 top-[28px] w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        
                        {/* Icon / avatar */}
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-black/5"
                          style={{ background: bg, color: accent }}
                        >
                          {icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                              {senderName ? (
                                <span className="text-[13px] font-semibold text-gray-900 truncate">
                                  {senderName}
                                </span>
                              ) : (
                                <span
                                  className="text-[11px] font-semibold px-2 py-0.5 rounded-md border border-black/5"
                                  style={{ color: accent, background: bg }}
                                >
                                  {sysType
                                    ? sysType === "mom_card"
                                      ? "Meeting Notes"
                                      : meta.label
                                    : meta.label}
                                </span>
                              )}
                              {n.project_name && (
                                <span className="text-[12px] font-medium text-gray-400 truncate">
                                  · {n.project_name}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5 font-medium">
                              {formatDistanceToNow(new Date(n.created_at))}
                            </span>
                          </div>

                          <p className="text-[13px] text-gray-600 leading-snug line-clamp-2 mt-1">
                            {preview || n.preview}
                          </p>

                          {/* Channel tag */}
                          {(n as any).channel_name && (
                            <span className="inline-block mt-1.5 text-[11px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                              #{(n as any).channel_name}
                            </span>
                          )}
                        </div>

                        {/* Mark read button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n.id);
                          }}
                          title="Mark as read"
                          className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 bg-transparent cursor-pointer flex-shrink-0 mt-0.5 text-gray-400 hover:text-green-600"
                        >
                          <Check size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <span className="text-[12px] font-medium text-gray-500">
                {unreadCount > 8 ? `+${unreadCount - 8} older unread` : ""}
              </span>
              <Link
                href="/space/inbox"
                onClick={() => setOpen(false)}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors no-underline"
              >
                View Inbox
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

// ── Breadcrumb ────────────────────────────────────────────────────────────────

/** Map URL segments → human-readable labels */
const BREADCRUMB_LABELS: Record<string, string> = {
  space: "Home",
  boards: "Boards",
  inbox: "Inbox",
  nudges: "My Nudges",
  team: "Team",
  analytics: "Analytics",
  "video-call": "Video Call",
  settings: "Settings",
  new: "New Project",
};

/** Route-level icons (small, 13px) */
const SEGMENT_ICONS: Record<string, React.ReactNode> = {
  space: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  boards: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="5" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="12" width="7" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="16" width="7" height="5" rx="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  inbox: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M3 8l7.9 5.3a2 2 0 002.2 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  nudges: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  team: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 20c0-2.8-1.8-5-4-5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  analytics: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M3 20h18M7 20V12M12 20V8M17 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "video-call": (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M23 7l-7 5 7 5V7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  settings: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
};

/** Separator chevron */
function BreadSep() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
      <path d="M9 18l6-6-6-6" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface BreadcrumbProps {
  /** Optional override label for the last segment (e.g. project name from the store) */
  overrideLabel?: string;
  /** Optional color dot for project segments */
  projectColor?: string;
}

function Breadcrumb({ overrideLabel, projectColor }: BreadcrumbProps) {
  const pathname = usePathname();

  // Build crumb list from path
  // e.g. /space/boards  → [{ label:"Home", href:"/space" }, { label:"Boards", href:"/space/boards" }]
  // e.g. /space/:id     → [{ label:"Home", href:"/space" }, { label:"Project Name" }]
  const segments = pathname.split("/").filter(Boolean); // ["space", "boards"] or ["space", "abc123"]

  type Crumb = { label: string; href?: string; icon?: React.ReactNode; isLast: boolean; isDynamic?: boolean; color?: string };
  const crumbs: Crumb[] = [];

  segments.forEach((seg, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    const isLast = idx === segments.length - 1;
    const known = BREADCRUMB_LABELS[seg];

    if (known) {
      crumbs.push({
        label: isLast && overrideLabel ? overrideLabel : known,
        href: isLast ? undefined : href,
        icon: SEGMENT_ICONS[seg],
        isLast,
      });
    } else {
      // Dynamic segment (project ID etc.)
      crumbs.push({
        label: overrideLabel ?? "…",
        href: undefined,
        isLast: true,
        isDynamic: true,
        color: projectColor,
      });
    }
  });

  // Collapse middle crumbs on very small screens (keep first + last)
  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1 min-w-0 flex-1">
      {crumbs.map((crumb, i) => (
        <div key={i} className="flex items-center gap-1 min-w-0">
          {i > 0 && <BreadSep />}

          {crumb.isLast ? (
            // Current page — bold, with optional colored project dot
            <div className="flex items-center gap-1.5 min-w-0">
              {crumb.color && (
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: crumb.color }}
                />
              )}
              <motion.span
                key={crumb.label}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="text-[14px] font-black text-[#0D0D0D] tracking-[-0.02em] truncate"
              >
                {crumb.label}
              </motion.span>
            </div>
          ) : (
            // Ancestor — muted, clickable
            <Link
              href={crumb.href!}
              className="flex items-center gap-1.5 no-underline group"
            >
              <span className="text-[13px] font-semibold text-[#B0B0A8] group-hover:text-[#6B7280] transition-colors truncate hidden sm:block">
                {crumb.label}
              </span>
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

// ── Topbar ───────────────────────────────────────────────────────────────────

interface TopbarProps {
  /** Optional project name / page title to show as the last breadcrumb segment */
  title?: string;
  /** Optional hex color for project breadcrumb dot */
  projectColor?: string;
  onOpenCreate: () => void;
}

export default function Topbar({ title, projectColor, onOpenCreate }: TopbarProps) {
  return (
    <header
      className="h-[60px] border-b border-[#EBEBEB] flex items-center px-4 md:px-7 gap-3 md:gap-4 bg-white shrink-0 sticky top-0 z-40"
      style={{ boxShadow: "0 1px 0 #F5F5F2" }}
    >
      {/* Breadcrumb — takes all available space */}
      <div className="flex-1 min-w-0 pl-10 md:pl-0 flex items-center">
        <Breadcrumb overrideLabel={title} projectColor={projectColor} />
      </div>

      <SearchBar />
      <NotificationBell />

      <motion.button
        whileHover={{ y: -1, boxShadow: "0 6px 20px rgba(79, 70, 229, 0.3)" }}
        whileTap={{ scale: 0.96 }}
        onClick={onOpenCreate}
        className="h-9 px-3 md:px-4 bg-[#4F46E5] text-white rounded-[10px] text-[13px] font-black flex items-center gap-1.5 border-0 cursor-pointer flex-shrink-0 hover:bg-[#4338CA] transition-colors"
        style={{ boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)" }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">New project</span>
      </motion.button>
    </header>
  );
}