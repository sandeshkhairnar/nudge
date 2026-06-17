"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/store/workspace-store";
import { getUserWorkspaces } from "@/lib/workspace";
import { useNotificationStore } from "@/store/notification-store";
import { useProjectsStore } from "@/store/projects-store";

interface Project {
  id: string;
  name: string;
  color: string;
  progress: number;
  avatar_url?: string | null;
  task_count?: number;
  total_tasks?: number;
}

interface Profile {
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role?: string | null;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconDashboard() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="8" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="3" width="8" height="5" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="10" width="8" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="14" width="8" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function IconProjects() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M3 7h18M3 12h18M3 17h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconTasks() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconAnalytics() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M3 20h18M7 20V12M12 20V8M17 20V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconReport() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 2v6h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconCompanies() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconMessages() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconHelp() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

// ── NavItem ───────────────────────────────────────────────────────────────────

function NavItem({
  href,
  label,
  icon,
  badge,
  badgeVariant = "gray",
  active,
  collapsed,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: "gray" | "purple";
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <Link href={href} className="no-underline block" onClick={onClick}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="flex items-center rounded-xl cursor-pointer transition-colors duration-150"
        style={{
          padding: collapsed ? "9px 10px" : "9px 12px",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : 11,
          background: active ? "#111111" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!active) (e.currentTarget as HTMLElement).style.background = "#f4f4f5";
        }}
        onMouseLeave={(e) => {
          if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <span style={{ color: active ? "#ffffff" : "#71717a", flexShrink: 0 }}>
          {icon}
        </span>
        {!collapsed && (
          <span
            className="flex-1 text-[13.5px] truncate"
            style={{
              fontWeight: active ? 600 : 500,
              color: active ? "#ffffff" : "#3f3f46",
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "-0.01em",
            }}
          >
            {label}
          </span>
        )}
        {!collapsed && badge !== undefined && (
          <span
            className="flex items-center justify-center rounded-lg text-[11px] font-bold px-1.5 py-0.5 leading-none"
            style={
              badgeVariant === "purple"
                ? { background: "#ede9fe", color: "#7c3aed" }
                : { background: "#f4f4f5", color: "#71717a" }
            }
          >
            {badge}
          </span>
        )}
      </motion.div>
    </Link>
  );
}

// ── ProjectRow ────────────────────────────────────────────────────────────────

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
  const fraction = project.total_tasks
    ? `${Math.round((project.progress / 100) * project.total_tasks)}/${project.total_tasks}`
    : `${project.progress}%`;

  return (
    <Link href={`/space/${project.id}`} className="no-underline block" onClick={onClick}>
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.04 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center rounded-xl cursor-pointer transition-colors duration-150"
        style={{
          padding: collapsed ? "8px 10px" : "7px 12px",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: 10,
          background: active ? "#f4f4f5" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!active) (e.currentTarget as HTMLElement).style.background = "#f4f4f5";
        }}
        onMouseLeave={(e) => {
          if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: project.color }}
        />
        {!collapsed && (
          <>
            <span
              className="flex-1 text-[13px] truncate"
              style={{
                fontWeight: active ? 600 : 500,
                color: active ? "#111111" : "#3f3f46",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {project.name}
            </span>
            <span
              className="text-[11px] font-semibold px-1.5 py-0.5 rounded-lg leading-none flex-shrink-0"
              style={{ background: "#f4f4f5", color: "#a1a1aa" }}
            >
              {fraction}
            </span>
          </>
        )}
      </motion.div>
    </Link>
  );
}

// ── SectionLabel ─────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p
      className="text-[10px] font-black uppercase tracking-[0.13em] px-3 mb-1 mt-2"
      style={{ color: "#a1a1aa", fontFamily: "'DM Sans', sans-serif" }}
    >
      {label}
    </p>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const navRef = useRef<HTMLElement>(null);

  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const projects = useProjectsStore((s) => s.projects);
  const setStoreProjects = useProjectsStore((s) => s.setProjects);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const workspace = useWorkspaceStore((s) => s.workspace);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);

  const COLLAPSED_W = 64;
  const EXPANDED_W = 240;

  useEffect(() => {
    const check = () => {
      const m = window.innerWidth < 768;
      setIsMobile(m);
      if (m) setCollapsed(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url, role")
        .eq("id", user.id)
        .single();
      if (profileData) setProfile(profileData as Profile);

      const workspaces = await getUserWorkspaces(user.id);
      setWorkspaces(workspaces);
      if (workspaces.length > 0) {
        const lastId = localStorage.getItem("lastWorkspaceId");
        const last = workspaces.find((w: any) => w?.id === lastId);
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
      .map((p) => ({ id: p.id, name: p.name, color: p.color, progress: p.progress, avatar_url: p.avatar_url }));
    setStoreProjects(filtered, workspace.id);
  }, [workspace?.id, currentUserId]);

  useEffect(() => {
    loadProjects();
    const ch = supabase
      .channel(`sb-projects:${workspace?.id}:${currentUserId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_members", filter: `user_id=eq.${currentUserId}` }, loadProjects)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "projects" }, loadProjects)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [workspace?.id, currentUserId, loadProjects]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  const isCollapsed = collapsed && !isMobile;

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const sidebarContent = (
    <motion.aside
      animate={{ width: isMobile ? EXPANDED_W : (isCollapsed ? COLLAPSED_W : EXPANDED_W) }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="h-screen flex flex-col flex-shrink-0 relative overflow-hidden select-none"
      style={{ background: "#ffffff", borderRight: "1px solid #e4e4e7" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 flex-shrink-0 px-5"
        style={{ height: 68, borderBottom: "1px solid #f4f4f5" }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ width: 36, height: 36, background: "linear-gradient(135deg,#f97316,#ea580c)" }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <rect x="6" y="6" width="16" height="16" rx="8" fill="white" />
            <rect x="6" y="26" width="16" height="16" rx="4" fill="white" opacity="0.5" />
            <rect x="26" y="6" width="16" height="16" rx="4" fill="white" opacity="0.5" />
            <rect x="26" y="26" width="16" height="16" rx="8" fill="white" />
          </svg>
        </div>
        {!isCollapsed && (
          <span
            className="text-[20px] font-black tracking-[-0.03em] text-gray-900"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Nudge
          </span>
        )}
      </div>

      {/* Scrollable nav area */}
      <nav
        ref={navRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ padding: isCollapsed ? "12px 8px" : "12px 10px", scrollbarWidth: "none" }}
      >
        {/* MENU section */}
        {!isCollapsed && <SectionLabel label="Menu" />}

        <div className="flex flex-col gap-0.5">
          <NavItem
            href="/space"
            label="Dashboard"
            icon={<IconDashboard />}
            active={pathname === "/space"}
            collapsed={isCollapsed}
            onClick={isMobile ? () => setMobileOpen(false) : undefined}
          />
          <NavItem
            href="/space/nudges"
            label="Projects"
            icon={<IconProjects />}
            badge={projects.length > 0 ? projects.length : undefined}
            active={pathname === "/space/nudges" || pathname.startsWith("/space/nudges/")}
            collapsed={isCollapsed}
            onClick={isMobile ? () => setMobileOpen(false) : undefined}
          />
          <NavItem
            href="/space/boards"
            label="My Tasks"
            icon={<IconTasks />}
            active={pathname === "/space/boards" || pathname.startsWith("/space/boards/")}
            collapsed={isCollapsed}
            onClick={isMobile ? () => setMobileOpen(false) : undefined}
          />
          <NavItem
            href="/space/analytics"
            label="Analytics"
            icon={<IconAnalytics />}
            active={pathname === "/space/analytics" || pathname.startsWith("/space/analytics/")}
            collapsed={isCollapsed}
            onClick={isMobile ? () => setMobileOpen(false) : undefined}
          />
          <NavItem
            href="/space/inbox"
            label="Report"
            icon={<IconReport />}
            badge={unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : "New"}
            badgeVariant={unreadCount > 0 ? "gray" : "purple"}
            active={pathname === "/space/inbox" || pathname.startsWith("/space/inbox/")}
            collapsed={isCollapsed}
            onClick={isMobile ? () => setMobileOpen(false) : undefined}
          />
          <NavItem
            href="/space/team"
            label="Companies"
            icon={<IconCompanies />}
            active={pathname === "/space/team" || pathname.startsWith("/space/team/")}
            collapsed={isCollapsed}
            onClick={isMobile ? () => setMobileOpen(false) : undefined}
          />
          <NavItem
            href="/space/video-call"
            label="Messages"
            icon={<IconMessages />}
            badge={unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : undefined}
            active={pathname === "/space/video-call" || pathname.startsWith("/space/video-call/")}
            collapsed={isCollapsed}
            onClick={isMobile ? () => setMobileOpen(false) : undefined}
          />
        </div>

        {/* Divider */}
        <div className="my-4 mx-2" style={{ height: 1, background: "#f4f4f5" }} />

        {/* PINNED PROJECTS */}
        {!isCollapsed && <SectionLabel label="Pinned Projects" />}

        {projects.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {projects.map((p, i) => (
              <ProjectRow
                key={p.id}
                project={p}
                index={i}
                active={pathname === `/space/${p.id}`}
                collapsed={isCollapsed}
                onClick={isMobile ? () => setMobileOpen(false) : undefined}
              />
            ))}
          </div>
        )}
      </nav>

      {/* Bottom items */}
      <div
        className="flex-shrink-0"
        style={{ padding: isCollapsed ? "8px 8px" : "8px 10px", borderTop: "1px solid #f4f4f5" }}
      >
        <NavItem
          href="/space/help"
          label="Help Center"
          icon={<IconHelp />}
          active={pathname === "/space/help"}
          collapsed={isCollapsed}
          onClick={isMobile ? () => setMobileOpen(false) : undefined}
        />
        <NavItem
          href="/space/settings"
          label="Settings"
          icon={<IconSettings />}
          active={pathname === "/space/settings"}
          collapsed={isCollapsed}
          onClick={isMobile ? () => setMobileOpen(false) : undefined}
        />

        {/* User profile row */}
        <div
          className="flex items-center gap-2.5 mt-3 pt-3"
          style={{ borderTop: "1px solid #f4f4f5" }}
        >
          {/* Avatar */}
          <div
            className="flex items-center justify-center rounded-xl text-white text-[12px] font-black flex-shrink-0"
            style={{ width: 36, height: 36, background: "linear-gradient(135deg,#f97316,#ea580c)" }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} className="w-full h-full rounded-xl object-cover" alt="" />
            ) : (
              initials
            )}
          </div>

          <AnimatePresence>
            {!isCollapsed && profile && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-hidden"
              >
                <p className="text-[13px] font-bold text-gray-900 truncate leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {profile.full_name ?? "User"}
                </p>
                <p className="text-[11px] text-gray-400 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {(profile as any).role ?? profile.email}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {!isCollapsed && !isMobile && (
            <button
              onClick={() => setCollapsed(true)}
              className="flex items-center justify-center rounded-lg cursor-pointer flex-shrink-0 transition-colors"
              style={{ width: 26, height: 26, background: "#f4f4f5", border: "none", color: "#a1a1aa" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#e4e4e7"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#f4f4f5"; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {isCollapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="absolute bottom-4 right-2 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
              style={{ width: 26, height: 26, background: "#f4f4f5", border: "none", color: "#a1a1aa" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
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
          className="fixed top-3.5 left-4 z-50 flex items-center justify-center rounded-xl"
          style={{ width: 36, height: 36, background: "#fff", border: "1px solid #e4e4e7", color: "#3f3f46" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#f97316" }} />
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
                style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
              />
              <motion.div
                initial={{ x: -EXPANDED_W }}
                animate={{ x: 0 }}
                exit={{ x: -EXPANDED_W }}
                transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
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