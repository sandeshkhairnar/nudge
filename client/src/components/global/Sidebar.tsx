"use client";

import { JSX, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/store/workspace-store";
import { getUserWorkspaces } from "@/lib/workspace";
import { WorkspaceSwitcher } from "@/components/space/workspace-switcher";
import { useNotificationStore } from "@/store/notification-store";
import { useProjectsStore } from "@/store/projects-store";
import Avatar from "@/components/global/Avatar";

function NudgeLogo({ collapsed }: { collapsed: boolean }) {
  const id = "sidebar-pills";
  return (
    <div className="overflow-hidden h-9">
      <AnimatePresence mode="wait">
        {collapsed ? (
          <motion.svg
            key="icon"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            width="36"
            height="36"
            viewBox="0 0 48 48"
            fill="none"
          >
            <g id={id + "-c"}>
              <rect x="6" y="6" width="16" height="16" rx="8" fill="#36C5F0" />
              <rect x="6" y="26" width="16" height="16" rx="4" fill="#36C5F0" opacity="0.4" />
              <rect x="26" y="6" width="16" height="16" rx="4" fill="#2EB67D" opacity="0.4" />
              <rect x="26" y="26" width="16" height="16" rx="8" fill="#2EB67D" />
              <animateTransform
                href={`#${id}-c`}
                attributeName="transform"
                type="rotate"
                values="0 24 24;-30 24 24;-60 24 24;-90 24 24;-120 24 24;-150 24 24;-180 24 24;-210 24 24;-240 24 24;-270 24 24;-300 24 24;-330 24 24;-360 24 24"
                keyTimes="0;0.05;0.1;0.15;0.25;0.35;0.45;0.55;0.65;0.75;0.85;0.95;1"
                dur="6s"
                repeatCount="indefinite"
              />
            </g>
          </motion.svg>
        ) : (
          <motion.svg
            key="full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            width="130"
            height="36"
            viewBox="0 0 220 56"
            fill="none"
          >
            <g id={id + "-f"}>
              <rect x="8" y="8" width="16" height="16" rx="8" fill="#36C5F0" />
              <rect x="8" y="26" width="16" height="16" rx="4" fill="#36C5F0" opacity="0.4" />
              <rect x="26" y="8" width="16" height="16" rx="4" fill="#2EB67D" opacity="0.4" />
              <rect x="26" y="26" width="16" height="16" rx="8" fill="#2EB67D" />
            </g>
            <text
              x="56"
              y="37"
              fontFamily="'Sora',sans-serif"
              fontWeight="800"
              fontSize="28"
              fill="#fff"
              letterSpacing="-1"
            >
              nudge
            </text>
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  );
}

const icons: Record<string, JSX.Element> = {
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  board: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="3" width="7" height="5" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="12" width="7" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="16" width="7" height="5" rx="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  inbox: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 8l7.9 5.3a2 2 0 002.2 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  team: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M21 20c0-2.8-1.8-5-4-5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  analytics: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 20h18M7 20V12M12 20V8M17 20V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  nudges: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  video: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M23 7l-7 5 7 5V7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};


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



const bottomItems: NavItemType[] = [{ label: "Settings", href: "/space/settings", icon: "settings" }];

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
  return (
    <Link href={item.href} className="no-underline" onClick={onClick}>
      <motion.div
        whileHover={{ x: collapsed ? 0 : 2 }}
        className="flex items-center gap-2.5 rounded-[10px] cursor-pointer relative transition-colors"
        style={{
          padding: collapsed ? "10px" : "10px 12px",
          justifyContent: collapsed ? "center" : "flex-start",
          background: active ? "rgba(255,255,255,0.1)" : "transparent",
        }}
      >
        {active && (
          <motion.div
            layoutId="nav-active"
            className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#36C5F0] rounded-r-sm"
          />
        )}

        <span className="relative flex-shrink-0" style={{ color: active ? "#fff" : "rgba(255,255,255,0.42)" }}>
          {icons[item.icon]}
          {collapsed && item.badge !== undefined && item.badge > 0 && (
            <motion.span
              key={item.badge}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full bg-[#36C5F0] flex items-center justify-center text-[8px] font-black text-white px-1"
            >
              {item.badge > 99 ? "99+" : item.badge}
            </motion.span>
          )}
        </span>

        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="text-[13px] whitespace-nowrap overflow-hidden"
              style={{ fontWeight: active ? 700 : 600, color: active ? "#fff" : "rgba(255,255,255,0.48)" }}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {!collapsed && item.badge !== undefined && item.badge > 0 && (
          <motion.span
            key={item.badge}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="ml-auto min-w-[18px] h-[18px] rounded-full bg-[#36C5F0] flex items-center justify-center text-[10px] font-black text-white px-1.5"
          >
            {item.badge > 99 ? "99+" : item.badge}
          </motion.span>
        )}
      </motion.div>
    </Link>
  );
}

interface Project {
  id: string;
  name: string;
  color: string;
  progress: number;
}

interface Profile {
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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
      if (workspaces.length > 0) {
        setWorkspaces(workspaces);
        const lastWorkspaceId = localStorage.getItem("lastWorkspaceId");
        const lastWorkspace = workspaces.find((w: { id: string | null }) => w.id === lastWorkspaceId);
        setWorkspace(lastWorkspace || workspaces[0]);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadProjects = async () => {
      if (!workspace || !currentUserId) return;

      const { data, error } = await supabase
        .from("project_members")
        .select("project_id, projects!project_members_project_id_fkey(id, name, color, progress, workspace_id)")
        .eq("user_id", currentUserId);

      if (error || !data) return;

      const filtered: Project[] = (data as any[])
        .map((row) => row.projects)
        .filter((p) => p && p.workspace_id === workspace.id)
        .map((p) => ({ id: p.id, name: p.name, color: p.color, progress: p.progress }));

      setStoreProjects(filtered, workspace.id);
    };

    loadProjects();

    const channel = supabase
      .channel(`sidebar-projects:${workspace?.id}:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_members",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => loadProjects()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "projects",
        },
        () => loadProjects()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [workspace?.id, currentUserId]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  const getInitials = (name: string | null) =>
    name
      ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
      : "?";

  const sidebarWidth = collapsed ? 68 : 240;

  const sidebarContent = (
    <motion.aside
      animate={{ width: isMobile ? 240 : sidebarWidth }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="h-screen flex flex-col flex-shrink-0 relative overflow-hidden"
      style={{ background: "#0D0D0D", borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div
        className="absolute -top-[60px] -right-[40px] w-[200px] h-[200px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse,rgba(54,197,240,0.08) 0%,transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      <div
        className="flex items-center justify-between flex-shrink-0 relative"
        style={{
          padding: collapsed && !isMobile ? "20px 16px" : "20px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <NudgeLogo collapsed={collapsed && !isMobile} />
        {isMobile ? (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileOpen(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
            style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(255,255,255,0.4)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCollapsed((c) => !c)}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
            style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(255,255,255,0.4)" }}
          >
            <motion.svg
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          </motion.button>
        )}
      </div>

      {workspace && <WorkspaceSwitcher collapsed={collapsed && !isMobile} />}

      <nav
        className="flex-1 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden relative"
        style={{ padding: collapsed && !isMobile ? "12px 10px" : "12px 12px" }}
      >
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

        {!(collapsed && !isMobile) && projects.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
            <div className="flex items-center justify-between px-3 mb-2">
              <span
                className="text-[10px] font-black uppercase tracking-[0.14em]"
                style={{ color: "rgba(255,255,255,0.22)" }}
              >
                Projects
              </span>
              <Link href="/space/new" className="no-underline">
                <motion.span
                  whileHover={{ scale: 1.1 }}
                  className="cursor-pointer"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </motion.span>
              </Link>
            </div>

            {projects.map((p, i) => {
              const isActiveProject = pathname === `/space/${p.id}`;

              return (
                <Link
                  key={p.id}
                  href={`/space/${p.id}`}
                  className="no-underline"
                  onClick={isMobile ? () => setMobileOpen(false) : undefined}
                >
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ x: 2, background: "rgba(255,255,255,0.04)" }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                    style={{
                      background: isActiveProject ? "rgba(255,255,255,0.08)" : "transparent",
                    }}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />

                    <span
                      className="text-[13px] font-semibold flex-1 truncate"
                      style={{
                        color: isActiveProject ? "#ffffff" : "rgba(255,255,255,0.5)",
                      }}
                    >
                      {p.name}
                    </span>

                    <div
                      className="w-9 h-[3px] rounded-sm flex-shrink-0 overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${p.progress}%` }}
                        className="h-full rounded-sm"
                        style={{ background: p.color }}
                      />
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </motion.div>
        )}
      </nav>

      <div
        className="flex-shrink-0 relative border-t"
        style={{
          padding: collapsed && !isMobile ? "12px 10px" : "12px 12px",
          borderTopColor: "rgba(255,255,255,0.05)",
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

        <div className="mt-3">
          <div className="flex items-center gap-3">
            <Avatar 
              url={profile?.avatar_url} 
              name={profile?.full_name} 
              email={profile?.email}
              role="You"
              size={32} 
              fallbackColor="#36C5F0" 
            />

            {!(collapsed && !isMobile) && profile && (
              <div className="flex-1 flex items-center justify-between overflow-hidden">
                <div className="flex flex-col overflow-hidden">
                  <p className="text-sm font-bold truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
                    {profile.full_name ?? "User"}
                  </p>
                  <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {profile.email}
                  </p>
                </div>
                <motion.button
                  onClick={signOut}
                  whileHover={{ scale: 1.1, background: "#EF4444", color: "#FFFFFF" }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-white font-semibold text-sm transition-all border-0 cursor-pointer flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)", fontFamily: "'Sora', sans-serif" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
                  </svg>
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  );

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-4 z-50 w-9 h-9 rounded-[10px] flex items-center justify-center"
          style={{ background: "#0D0D0D", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#36C5F0]" />
          )}
        </button>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 z-40"
                style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
              />
              <motion.div
                initial={{ x: -240 }}
                animate={{ x: 0 }}
                exit={{ x: -240 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
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