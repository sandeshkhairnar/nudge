"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/store/workspace-store";
import { getVisibleProjects } from "@/lib/project-members";
import { TaskBoard, Task } from "@/components/workspace/TaskBoard";
import { Loader2 } from "lucide-react";

export default function BoardsPage() {
  const supabase = createClient();
  const workspace = useWorkspaceStore(s => s.workspace);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workspace?.id) {
      loadData();
    }
  }, [workspace?.id]);

  const loadData = async (isBackgroundRefresh = false) => {
    if (!workspace?.id) return;
    if (!isBackgroundRefresh) setLoading(true);

    const { projects: visibleProjects } = await getVisibleProjects(workspace.id);
    const validProjects = visibleProjects || [];
    setProjects(validProjects);

    const { data: mems } = await supabase
      .from("workspace_members")
      .select("role, profiles(id, full_name, email, avatar_url)")
      .eq("workspace_id", workspace.id);
    setMembers(mems || []);

    const projectIds = validProjects.map((p: any) => p.id);
    if (projectIds.length > 0) {
      const { data: taskRows } = await supabase
        .from("tasks")
        .select("*, assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url, email), projects!tasks_project_id_fkey(id, name, color)")
        .in("project_id", projectIds);

      if (taskRows) {
        const hydratedTasks = taskRows.map((t: any) => {
          const wsMember = (mems || []).find((m: any) => m.profiles.id === t.assignee_id);
          return {
            ...t,
            project: t.projects?.name || "Unknown",
            projectColor: t.projects?.color || "#9CA3AF",
            assignee: t.assignee?.full_name || t.assignee?.email || "Unassigned",
            assignee_id: t.assignee_id,
            assigneeColor: colorFromString(t.assignee_id || "unassigned"),
            avatar_url: t.assignee?.avatar_url,
            email: t.assignee?.email,
            role: wsMember?.role || "Member",
            tags: [],
            stalled: t.stalled_days > 3,
            dueDate: t.due_date,
            status: t.status
          };
        });
        setTasks(hydratedTasks as Task[]);
      }
    } else {
      setTasks([]);
    }
    if (!isBackgroundRefresh) setLoading(false);
  };

  function colorFromString(s: string) {
    const palette = ["#36C5F0", "#2EB67D", "#ECB22E", "#E01E5A", "#A259FF", "#FF6B6B"];
    let h = 0;
    for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
    return palette[Math.abs(h) % palette.length];
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[400px]">
      <Loader2 className="animate-spin text-indigo-500" size={32} />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden w-full">
      <div className="flex items-center justify-between px-2 mb-4 flex-shrink-0">
        <h1 className="text-[20px] font-bold text-gray-900 tracking-tight">Boards</h1>
        <p className="text-[13px] text-gray-500 font-medium">
          {tasks.length} total tasks · {tasks.filter(t => t.status === "in_progress").length} in progress
        </p>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <TaskBoard
          tasks={tasks}
          projects={projects}
          members={members}
          onRefresh={() => loadData(true)}
        />
      </div>
    </div>
  );
}