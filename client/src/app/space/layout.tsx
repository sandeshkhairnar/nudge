"use client";

import { useState } from "react";
import Sidebar from "@/components/global/Sidebar";
import Topbar from "@/components/global/Topbar";
import CreateProjectModal from "@/components/space/CreateProjectModal";
import { createProject } from "@/lib/projects";
import { useWorkspaceStore } from "@/store/workspace-store";
import { useProjectsStore } from "@/store/projects-store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const workspace = useWorkspaceStore((s) => s.workspace);
  const addProject = useProjectsStore((s) => s.addProject);

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

      <div className="flex h-screen overflow-hidden bg-[#F9F9F7]">
        <div className="hidden md:flex flex-shrink-0">
          <Sidebar />
        </div>
        <div className="flex md:hidden">
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar onOpenCreate={() => setOpen(true)} />
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-7 bg-[#F9F9F7]">
            {children}
          </div>
        </div>
      </div>

      <CreateProjectModal open={open} onClose={() => setOpen(false)} onCreate={handleCreate} />
    </>
  );
}