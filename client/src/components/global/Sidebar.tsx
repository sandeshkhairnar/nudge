"use client";

import { JSX, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/store/workspace-store";
import { getUserWorkspaces } from "@/lib/workspace";
import { WorkspaceSwitcher } from "@/components/space/workspace-switcher";
import { useNotificationStore } from "@/store/notification-store";
import { useProjectsStore } from "@/store/projects-store";
import Avatar from "@/components/global/Avatar";

// ─── Logo ────────────────────────────────────────────────────────────────────

function NudgeLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="overflow-hidden flex items-center h-9">
      <AnimatePresence mode="wait">
        {collapsed ? (
          <motion.div
            key="icon"
            initial={{ opacity: 0, scale: 0.7, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.7, rotate: 20 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
              <path d="M28 72V28" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" />
              <path d="M72 72V28" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" />
              <path d="M28 28L72 72" stroke="#4F46E5" strokeWidth="14" strokeLinecap="round" />
            </svg>
          </motion.div>
        ) : (
          <motion.div
            key="full"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-0"
          >
            <svg style={{ height: "15px", width: "auto", marginRight: "1px" }} viewBox="21 21 58 58" fill="none">
              <path d="M28 72V28" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" />
              <path d="M72 72V28" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" />
              <path d="M28 28L72 72" stroke="#4F46E5" strokeWidth="14" strokeLinecap="round" />
            </svg>
            <span
              className="text-[20px] font-[800] tracking-tight text-white leading-none"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              udge
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const icons: Record<string, JSX.Element> = {
  home: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  board: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="9" rx="2" stroke="currentColor" strokeWidth="1.9" />
      <rect x="14" y="3" width="7" height="5" rx="2" stroke="currentColor" strokeWidth="1.9" />
      <rect x="14" y="12" width="7" height="9" rx="2" stroke="currentColor" strokeWidth="1.9" />
      <rect x="3" y="16" width="7" height="5" rx="2" stroke="currentColor" strokeWidth="1.9" />
    </svg>
  ),
  inbox: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M3 8l7.9 5.3a2 2 0 002.2 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  ),
  team: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.9" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="17" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M21 20c0-2.8-1.8-5-4-5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  analytics: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M3 20h18M7 20V12M12 20V8M17 20V4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  ),
  nudges: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.9" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.9" />
    </svg>
  ),
  video: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M23 7l-7 5 7 5V7z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavItemType {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

const staticNavItems: Omit<NavItemType, "badge">[] = [
  { label: "Dashboard", href: "/space", icon: "home" },
  { label: "Boards", href: "/space/boards", icon: "board" },
  { label: "Inbox", href: "/space/inbox", icon: "inbox" },
  { label: "My Nudges", href: "/space/nudges", icon: "nudges" },
  { label: "Team", href: "/space/team", icon: "team" },
  { label: "Analytics", href: "/space/analytics", icon: "analytics" },
  { label: "Video Call", href: "/space/video-call", icon: "video" },
];

const bottomItems: NavItemType[] = [
  { label: "Settings", href: "/space/settings", icon: "settings" },
];

interface Project {
  id: string;
  name: string;
  color: string;
  progress: number;
  avatar_url?: string | null;
}

interface Profile {
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

// ─── Tooltip (for collapsed state) ───────────────────────────────────────────

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, x: -4, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -4, scale: 0.94 }}
            transition={{ duration: 0.12 }}
            className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 z-[200] pointer-events-none"
          >
            <div
              className="px-2.5 py-1.5 rounded-lg text-[12px] font-bold text-white whitespace-nowrap"
              style={{
                background: "rgba(22,22,22,0.96)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                backdropFilter: "blur(8px)",
              }}
            >
              {label}
              <div
                className="absolute right-full top-1/2 -translate-y-1/2"
                style={{
                  borderTop: "5px solid transparent",
                  borderBottom: "5px solid transparent",
                  borderRight: "5px solid rgba(22,22,22,0.96)",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({
  item,
  collapsed,
  active,
  onClick,
}: {
  item: NavItemType;
  collapsed: boolean;
  active: boolean;
  onClick?: () => void;
}) {
  const inner = (
    <Link href={item.href} className="no-underline block" onClick={onClick}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="relative flex items-center rounded-[12px] cursor-pointer transition-all duration-150 group/nav"
        style={{
          padding: collapsed ? "10px" : "10px 14px",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : 12,
          background: active ? "#4F46E5" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }
        }}
      >

        <span
          className="flex-shrink-0 transition-all duration-150"
          style={{
            color: active ? "#FFFFFF" : "#9CA3AF",
          }}
        >
          {icons[item.icon]}
        </span>

        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-[14px] whitespace-nowrap overflow-hidden flex-1"
              style={{
                fontWeight: active ? 700 : 500,
                color: active ? "#FFFFFF" : "#9CA3AF",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: "-0.01em",
              }}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {item.badge !== undefined && item.badge > 0 && (
            <motion.span
              key={item.badge}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 35 }}
              className="flex items-center justify-center rounded-full text-white font-black leading-none"
              style={{
                minWidth: collapsed ? 16 : 18,
                height: collapsed ? 16 : 18,
                fontSize: collapsed ? 9 : 10,
                paddingLeft: 4,
                paddingRight: 4,
                background: "#EF4444",
                position: collapsed ? "absolute" : "relative",
                top: collapsed ? 4 : "auto",
                right: collapsed ? 4 : "auto",
                marginLeft: collapsed ? 0 : "auto",
                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)",
              }}
            >
              {item.badge > 99 ? "99+" : item.badge}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );

  if (collapsed) return <Tooltip label={item.label}>{inner}</Tooltip>;
  return inner;
}


function ProjectRow({
  project,
  index,
  active,
  collapsed,
  onClick,
}: {
  project: Project;
  index: number;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const inner = (
    <Link
      href={`/space/${project.id}`}
      className="no-underline block"
      onClick={onClick}
    >
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05, duration: 0.25 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center rounded-xl cursor-pointer transition-all duration-150"
        style={{
          gap: 9,
          padding: collapsed ? "8px 10px" : "7px 11px",
          justifyContent: collapsed ? "center" : "flex-start",
          background: active ? "#4F46E5" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!active)
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
        }}
        onMouseLeave={(e) => {
          if (!active)
            (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <div className="relative flex-shrink-0 w-5 h-5 flex items-center justify-center">
          {project.avatar_url ? (
            <img
              src={project.avatar_url}
              alt=""
              className="w-full h-full rounded-md object-cover ring-1 ring-white/10 border border-white/5"
            />
          ) : (
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: project.color,
                boxShadow: active ? `0 0 6px ${project.color}90` : "none",
              }}
            />
          )}
        </div>

        {!collapsed && (
          <>
            <span
              className="text-[12.5px] flex-1 truncate"
              style={{
                fontWeight: active ? 700 : 500,
                color: active ? "#FFFFFF" : "#9CA3AF",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: "-0.01em",
              }}
            >
              {project.name}
            </span>

            <div
              className="rounded-full overflow-hidden flex-shrink-0"
              style={{ width: 32, height: 3, background: "rgba(255,255,255,0.1)" }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 0.6, delay: index * 0.05, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: project.color }}
              />
            </div>

            <span
              className="text-[10px] font-bold tabular-nums flex-shrink-0"
              style={{ color: "#9CA3AF", minWidth: 24, textAlign: "right" }}
            >
              {project.progress}%
            </span>
          </>
        )}
      </motion.div>
    </Link>
  );

  if (collapsed) return <Tooltip label={project.name}>{inner}</Tooltip>;
  return inner;
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const navRef = useRef<HTMLElement>(null);

  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const projects = useProjectsStore((s) => s.projects);
  const setStoreProjects = useProjectsStore((s) => s.setProjects);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const workspace = useWorkspaceStore((s) => s.workspace);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);

  const navItems: NavItemType[] = staticNavItems.map((item) =>
    item.href === "/space/inbox"
      ? { ...item, badge: unreadCount > 0 ? unreadCount : undefined }
      : item
  );

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const checkScroll = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    setCanScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 8);
  }, []);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [checkScroll, projects, collapsed]);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url")
        .eq("id", user.id)
        .single();
      if (profileData) setProfile(profileData as Profile);

      const workspaces = await getUserWorkspaces(user.id);
      setWorkspaces(workspaces);
      if (workspaces.length > 0) {
        const lastWorkspaceId = localStorage.getItem("lastWorkspaceId");
        const last = workspaces.find((w: any) => w?.id === lastWorkspaceId);
        setWorkspace(last || workspaces[0]);
      }
    };
    loadData();
  }, []);

  const loadProjects = useCallback(async () => {
    if (!workspace || !currentUserId) return;
    const { data, error } = await supabase
      .from("project_members")
      .select("project_id, projects!project_members_project_id_fkey(id, name, color, progress, workspace_id, avatar_url)")
      .eq("user_id", currentUserId);
    if (error || !data) return;
    const filtered: Project[] = (data as any[])
      .map((row) => row.projects)
      .filter((p) => p && p.workspace_id === workspace.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        progress: p.progress,
        avatar_url: p.avatar_url,
      }));
    setStoreProjects(filtered, workspace.id);
  }, [workspace?.id, currentUserId]);

  useEffect(() => {
    loadProjects();
    const channel = supabase
      .channel(`sidebar-projects:${workspace?.id}:${currentUserId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_members", filter: `user_id=eq.${currentUserId}` }, () => loadProjects())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "projects" }, () => loadProjects())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [workspace?.id, currentUserId, loadProjects]);

  useEffect(() => {
    if (!currentUserId) return;
    const wsChannel = supabase
      .channel(`sidebar-workspaces:${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "workspace_members", filter: `user_id=eq.${currentUserId}` },
        async () => {
          const workspaces = await getUserWorkspaces(currentUserId);
          if (workspaces.length > 0) {
            setWorkspaces(workspaces);
            const lastWorkspaceId = localStorage.getItem("lastWorkspaceId");
            const last = workspaces.find((w: any) => w?.id === lastWorkspaceId);
            setWorkspace(last || workspaces[0]);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(wsChannel); };
  }, [currentUserId]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  const COLLAPSED_W = 64;
  const EXPANDED_W = 236;

  const sidebarContent = (
    <motion.aside
      animate={{ width: isMobile ? EXPANDED_W : (collapsed ? COLLAPSED_W : EXPANDED_W) }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="h-screen flex flex-col flex-shrink-0 relative overflow-hidden select-none"
      style={{
        background: "#111827",
        borderRight: "1px solid #1F2937",
      }}
    >
      <div
        className="flex items-center justify-between flex-shrink-0 relative"
        style={{
          padding: collapsed && !isMobile ? "24px 16px" : "24px 20px",
          minHeight: 64,
        }}
      >
        <NudgeLogo collapsed={collapsed && !isMobile} />

        {!isMobile && (
          <motion.button
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center justify-center rounded-lg cursor-pointer flex-shrink-0 transition-colors"
            style={{
              width: 26,
              height: 26,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#9CA3AF",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)";
              (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLElement).style.color = "#9CA3AF";
            }}
          >
            <motion.svg
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          </motion.button>
        )}

        {isMobile && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center rounded-lg cursor-pointer"
            style={{
              width: 26,
              height: 26,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </motion.button>
        )}
      </div>

      {workspace && (
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <WorkspaceSwitcher collapsed={collapsed && !isMobile} />
        </div>
      )}

      <div className="flex-1 relative min-h-0">
        <nav
          ref={navRef}
          className="h-full flex flex-col overflow-y-auto overflow-x-hidden"
          style={{
            padding: collapsed && !isMobile ? "10px 8px" : "10px 10px",
            gap: 1,
            scrollbarWidth: "none",
          }}
        >
          <div className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                collapsed={collapsed && !isMobile}
                active={
                  item.href === "/space"
                    ? pathname === "/space"
                    : pathname === item.href || pathname.startsWith(item.href + "/")
                }
                onClick={isMobile ? () => setMobileOpen(false) : undefined}
              />
            ))}
          </div>

          <AnimatePresence>
            {!(collapsed && !isMobile) && projects.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.22 }}
                className="mt-5"
              >
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <span
                    className="text-[9.5px] font-black uppercase tracking-[0.16em]"
                    style={{ color: "#9CA3AF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Projects
                  </span>
                  <Link href="/space/new" className="no-underline">
                    <motion.div
                      whileHover={{ scale: 1.15, color: "#111827" }}
                      className="flex items-center justify-center rounded cursor-pointer"
                      style={{ color: "#6B7280" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
                      </svg>
                    </motion.div>
                  </Link>
                </div>

                <div className="flex flex-col gap-0.5">
                  {projects.map((p, i) => (
                    <ProjectRow
                      key={p.id}
                      project={p}
                      index={i}
                      active={pathname === `/space/${p.id}`}
                      collapsed={collapsed && !isMobile}
                      onClick={isMobile ? () => setMobileOpen(false) : undefined}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {(collapsed && !isMobile) && projects.length > 0 && (
            <div className="mt-4 flex flex-col gap-1 items-center">
              <div
                className="w-5 h-px mb-1.5"
                style={{ background: "rgba(255,255,255,0.1)" }}
              />
              {projects.slice(0, 6).map((p, i) => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  index={i}
                  active={pathname === `/space/${p.id}`}
                  collapsed
                  onClick={undefined}
                />
              ))}
            </div>
          )}
        </nav>

        <AnimatePresence>
          {canScrollDown && (
            <motion.div
              key="scroll-hint"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pointer-events-none"
              style={{
                height: 52,
                background: "linear-gradient(to bottom, transparent, #111827 70%)",
              }}
            >
              <div className="flex flex-col items-center pb-1.5" style={{ gap: 0 }}>
                <motion.svg
                  width="20" height="8" viewBox="0 0 14 8" fill="none"
                  animate={{ y: [0, 3, 0] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                >
                  <path d="M1 1l6 6 6-6" stroke="rgba(59, 130, 246, 0.28)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
                <motion.svg
                  width="20" height="8" viewBox="0 0 14 8" fill="none"
                  animate={{ y: [0, 3, 0] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: 0.18 }}
                  style={{ marginTop: -2 }}
                >
                  <path d="M1 1l6 6 6-6" stroke="rgba(255,255,255,0.14)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        className="flex-shrink-0 relative"
        style={{
          padding: collapsed && !isMobile ? "10px 8px" : "10px 10px",
          borderTop: "1px solid #1F2937",
        }}
      >
        {bottomItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            collapsed={collapsed && !isMobile}
            active={pathname === item.href}
            onClick={isMobile ? () => setMobileOpen(false) : undefined}
          />
        ))}

        <div
          className="mt-2 rounded-xl overflow-hidden transition-all"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
            padding: collapsed && !isMobile ? "8px" : "10px 10px",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="relative flex-shrink-0">
              <Avatar
                url={profile?.avatar_url}
                name={profile?.full_name}
                email={profile?.email}
                userId={currentUserId || undefined}
                showStatus={true}
                role="You"
                size={30}
                fallbackColor="#4F46E5"
              />
            </div>

            <AnimatePresence>
              {!(collapsed && !isMobile) && profile && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="flex-1 overflow-hidden"
                >
                  <p
                    className="text-[12.5px] font-bold truncate leading-tight"
                    style={{ color: "#FFFFFF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {profile.full_name ?? "User"}
                  </p>
                  <p
                    className="text-[10.5px] truncate"
                    style={{ color: "#6B7280", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {profile.email}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {!(collapsed && !isMobile) && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={signOut}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.92 }}
                  className="flex items-center justify-center rounded-lg border-0 cursor-pointer flex-shrink-0 transition-all"
                  style={{
                    width: 28,
                    height: 28,
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.28)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.15)";
                    (e.currentTarget as HTMLElement).style.color = "#EF4444";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.28)";
                  }}
                  title="Sign out"
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.aside>
  );

  if (isMobile) {
    return (
      <>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => setMobileOpen(true)}
          className="fixed top-3.5 left-4 z-50 flex items-center justify-center rounded-[10px]"
          style={{
            width: 36,
            height: 36,
            background: "#0A0A0A",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "white",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {unreadCount > 0 && (
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ background: "#4F46E5" }}
            />
          )}
        </motion.button>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 z-40"
                style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
              />
              <motion.div
                initial={{ x: -EXPANDED_W }}
                animate={{ x: 0 }}
                exit={{ x: -EXPANDED_W }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-0 left-0 h-screen z-50"
              >
                {sidebarContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return sidebarContent;
}


