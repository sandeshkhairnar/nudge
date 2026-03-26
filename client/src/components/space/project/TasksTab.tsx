"use client";

import { TaskBoard, Task as BoardTask } from "@/components/workspace/TaskBoard";
import { Task, TeamMember, Project } from "@/types";
import { strColor } from "@/lib/utils/color";

interface TasksTabProps {
  tasks: Task[];
  project: Project | null;
  team: TeamMember[];
  projectId: string;
  onRefresh: () => Promise<void>;
}

export default function TasksTab({ tasks, project, team, projectId, onRefresh }: TasksTabProps) {
  const boardTasks: BoardTask[] = tasks.map((t) => ({
    ...t,
    project: t.projects?.name || project?.name || "Project",
    project_id: projectId,
    projectColor: t.projects?.color || project?.color || "#36C5F0",
    assignee: t.assignee?.full_name || "Unassigned",
    assignee_id: t.assignee_id,
    assigneeColor: strColor(t.assignee_id || "unassigned"),
    avatar_url: t.assignee?.avatar_url,
    email: t.assignee?.email,
    role: team.find((m) => m.profiles?.id === t.assignee_id)?.role || "Member",
    tags: [],
    status: t.status,
    priority: ((t as Task & { priority?: string }).priority || "medium") as "high" | "medium" | "low",
    stalled:
      t.status !== "done" &&
      Math.floor(
        (new Date().getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24)
      ) >= 3,
    dueDate: t.due_date,
  }));

  return (
    <div className="p-6 h-full flex flex-col">
      <TaskBoard
        tasks={boardTasks}
        projects={project ? [project] : []}
        members={team}
        projectId={projectId}
        onRefresh={onRefresh}
      />
    </div>
  );
}
