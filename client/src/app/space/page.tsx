"use client";

import { useQuery } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/store/workspace-store";
import { DashboardService } from "@/services/dashboard.service";
import DashboardClient from "@/components/space/dashboard/DashboardClient";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { strColor } from "@/lib/utils/color";
import { useProjectsStore } from "@/store/projects-store";

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5 pb-8 relative min-h-full">
      <div className="absolute top-0 left-0 w-full h-[600px] pointer-events-none -z-10" />
      <div className="absolute top-20 right-10 w-[600px] h-[600px] bg-emerald-500/[0.05] blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-80 left-10 w-[500px] h-[500px] bg-purple-500/[0.05] blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Greeting Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-gray-200">
        <div className="space-y-3">
          <div className="h-3 w-40 bg-gray-100 rounded-full animate-pulse" />
          <div className="h-8 w-72 bg-gray-100 rounded-full animate-pulse" />
        </div>
        <div className="h-10 w-48 bg-gray-100 rounded-lg animate-pulse" />
      </div>

      {/* StatsRow Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-50 rounded-xl border border-gray-100 animate-pulse" />
        ))}
      </div>

      {/* Velocity & AI Skeleton */}
      <div className="grid grid-cols-12 gap-4 items-stretch">
        <div className="col-span-12 lg:col-span-8 h-[400px] bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
        <div className="col-span-12 lg:col-span-4 h-[500px] lg:h-auto bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
      </div>

      {/* Tasks & Feed Skeleton */}
      <div className="grid grid-cols-12 gap-4 items-stretch">
        <div className="col-span-12 lg:col-span-8 h-[400px] bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
        <div className="col-span-12 lg:col-span-4 h-[400px] bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
      </div>

      {/* Bottom Row Skeleton */}
      <div className="grid grid-cols-12 gap-4 items-stretch">
        <div className="col-span-12 md:col-span-6 lg:col-span-4 h-[350px] bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
        <div className="col-span-12 md:col-span-6 lg:col-span-4 h-[350px] bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
        <div className="col-span-12 lg:col-span-4 h-[350px] bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const [me, setMe] = useState<any>(null);
  const [engineActive, setEngineActive] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("id,full_name,avatar_url,email").eq("id", user.id).single();
      if (prof) setMe(prof);
      
      if (workspace?.id) {
        const { data: wsData } = await supabase
          .from("workspaces")
          .select("nudge_engine_active")
          .eq("id", workspace.id)
          .single();
        if (wsData) setEngineActive(wsData.nudge_engine_active);
      }
    })();
  }, [workspace?.id]);

  const userProjects = useProjectsStore((s) => s.projects);

  const { data: initialData, isLoading } = useQuery({
    queryKey: ["dashboard", "v2", workspace?.id],
    queryFn: () => DashboardService.getStats(workspace!.id),
    enabled: !!workspace?.id,
  });

  if (isLoading || !initialData) {
    return <DashboardSkeleton />;
  }

  const userProjectIds = new Set(userProjects.map(p => p.id));

  // Format data dynamically for the client UI
  const WEEKS = ["W-5", "W-4", "W-3", "W-2", "W-1", "Now"];
  const wk = WEEKS.map(w => ({ week: w, done: 0, inProgress: 0, review: 0, todo: 0 }));
  const mmap: Record<string, any> = {};
  (initialData.team || []).forEach((m: any) => {
    mmap[m.id] = { ...m, task_count: 0, done_count: 0 };
  });

  const pmap: Record<string, any> = {};
  const filteredProjects = (initialData.projects || []).filter((p: any) => userProjectIds.has(p.id));
  filteredProjects.forEach((p: any) => {
    pmap[p.id] = p;
  });

  const filteredTasks = (initialData.tasks || []).filter((t: any) => userProjectIds.has(t.project_id));

  const shaped = filteredTasks.map((t: any) => ({
    ...t,
    assignee: mmap[t.assignee_id]?.full_name ?? null,
    avatar_url: mmap[t.assignee_id]?.avatar_url ?? null,
    project: pmap[t.project_id]?.name ?? null,
    projectColor: pmap[t.project_id]?.color ?? null,
    assigneeColor: strColor(t.assignee_id || "unassigned"),
    stalled_days: t.stalled_days ?? 0,
    project_name: pmap[t.project_id]?.name ?? null,
    project_color: pmap[t.project_id]?.color ?? null,
    assignee_name: mmap[t.assignee_id]?.full_name ?? null,
    assignee_avatar_url: mmap[t.assignee_id]?.avatar_url ?? null,
    assignee_email: mmap[t.assignee_id]?.email ?? null,
  }));
  const bs = Math.max(Math.ceil(shaped.length / 6), 1);
  shaped.forEach((t: any, i: number) => {
    const b = Math.min(Math.floor(i / bs), 5);
    if (t.status === "done") wk[b].done++;
    else if (t.status === "in_progress") wk[b].inProgress++;
    else if (t.status === "review") wk[b].review++;
    else wk[b].todo++;
  });

  shaped.forEach((t: any) => {
    if (t.assignee_id && mmap[t.assignee_id]) {
      mmap[t.assignee_id].task_count++;
      if (t.status === "done") mmap[t.assignee_id].done_count++;
    }
  });
  const formattedTeam = Object.values(mmap).sort((a, b) => b.task_count - a.task_count).slice(0, 6);

  const formattedData = {
    ...initialData,
    projects: filteredProjects,
    tasks: shaped,
    weekly: wk,
    team: formattedTeam,
    stats: {
      total: shaped.length,
      done: shaped.filter((t: any) => t.status === "done").length,
      inProgress: shaped.filter((t: any) => t.status === "in_progress").length,
      stalled: shaped.filter((t: any) => t.stalled_days >= 3).length,
      projects: filteredProjects.length,
      members: initialData.team?.length || 0
    }
  };

  return (
    <DashboardClient 
      initialData={formattedData} 
      me={me} 
      engineActive={engineActive} 
    />
  );
}
