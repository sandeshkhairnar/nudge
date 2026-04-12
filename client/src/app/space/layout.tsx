"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/global/Sidebar";
import Topbar from "@/components/global/Topbar";
import CreateProjectModal from "@/components/space/CreateProjectModal";
import { createProject } from "@/lib/projects";
import { useWorkspaceStore } from "@/store/workspace-store";
import { useProjectsStore } from "@/store/projects-store";

// Segment → static page title (mirrors SEGMENT_LABELS in Topbar)
const PAGE_TITLES: Record<string, string> = {
  boards: "Boards",
  inbox: "Inbox",
  nudges: "My Nudges",
  team: "Team",
  analytics: "Analytics",
  "video-call": "Video Call",
  settings: "Settings",
  new: "New Project",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const workspace = useWorkspaceStore((s) => s.workspace);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const workspacesLoaded = useWorkspaceStore((s) => s.workspacesLoaded);
  const projects = useProjectsStore((s) => s.projects);
  const addProject = useProjectsStore((s) => s.addProject);

  // ── Redirect logic ────────────────────────────────────────────────────────
  useEffect(() => {
    if (workspacesLoaded && workspaces.length === 0 && pathname !== "/space/settings") {
      router.push("/space/settings");
    }
  }, [workspacesLoaded, workspaces.length, pathname, router]);

  // ── Resolve title + projectColor from the current path ──────────────────
  const segments = pathname.split("/").filter(Boolean);
  // e.g. ["space"]            → Dashboard
  // e.g. ["space","boards"]   → Boards (static)
  // e.g. ["space","abc123"]   → project name from store
  const lastSeg = segments[segments.length - 1];

  let title: string | undefined;
  let projectColor: string | undefined;

  if (lastSeg === "space" || segments.length === 1) {
    title = "Dashboard";
  } else if (PAGE_TITLES[lastSeg]) {
    title = PAGE_TITLES[lastSeg];
  } else {
    // Assume it's a project ID — look it up in the store
    const proj = projects.find((p) => p.id === lastSeg);
    title = proj?.name ?? undefined;          // undefined → Topbar shows "…" until loaded
    projectColor = proj?.color ?? undefined;
  }

  // ── Project creation ─────────────────────────────────────────────────────
  const handleCreate = async (name: string, description: string) => {
    if (!workspace) return;
    const res = await createProject({ workspaceId: workspace.id, name, description });
    if (res?.error) return;
    if (res.project) {
      addProject({
        id: res.project.id,
        name: res.project.name,
        color: res.project.color ?? "#36C5F0",
        progress: res.project.progress ?? 0,
      });
    }
    setOpen(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { font-family: 'Sora', sans-serif; box-sizing: border-box; }
        ::selection { background: #36C5F0; color: #fff; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E0E0D8; border-radius: 4px; }
        input::placeholder { color: #C4C4BC; }
      `}</style>

      <div className="flex h-screen overflow-hidden bg-[#FAFAFA]">
        {/* Desktop sidebar */}
        <div className="hidden md:flex flex-shrink-0">
          <Sidebar />
        </div>
        {/* Mobile sidebar (renders its own trigger button internally) */}
        <div className="flex md:hidden">
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white/50">
          <Topbar
            title={title}
            projectColor={projectColor}
            onOpenCreate={() => setOpen(true)}
          />
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-7 relative z-0 bg-[#F9F9F7]">
            {children}
          </div>
        </div>
      </div>

      <CreateProjectModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={handleCreate}
      />
    </>
  );
}