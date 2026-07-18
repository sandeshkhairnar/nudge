export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskType = "task" | "bug" | "feature" | "improvement" | "epic" | "question" | "documentation";

export type Tab = "chat" | "tasks" | "team" | "resources" | "integrations" | "settings";

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean;
}

export interface MessageProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface FileAttachment {
  type: "image" | "file";
  name: string;
  url: string;
  size?: number;
}

export interface Message {
  id: string;
  content: string;
  is_ai: boolean;
  created_at: string;
  edited_at: string | null;
  user_id: string;
  profiles: MessageProfile | null;
  attachments?: FileAttachment[];
  parent_id?: string | null;
  reply_count?: number;
}

export interface Subtask {
  id: string;
  parent_task_id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  type: TaskType;
  priority?: "high" | "medium" | "low";
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
  assignee?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  } | null;
  attachments?: TaskAttachment[];
  linked_resources?: Resource[];
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  type: TaskType;
  priority?: "high" | "medium" | "low";
  assignee_id: string | null;
  stalled_days: number;
  due_date: string | null;
  created_at: string;
  project_id: string;
  parent_task_id?: string | null;
  assignee?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  } | null;
  projects?: { id: string; name: string; color: string } | null;
  subtasks?: Subtask[];
  attachments?: TaskAttachment[];
  linked_resources?: Resource[];
  _subtask_count?: number;
}

export interface TaskAttachment {
  id: string;
  task_id?: string | null;
  subtask_id?: string | null;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export interface TeamMember {
  id: string;
  role: string;
  profiles: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

export interface Resource {
  id: string;
  category: string;
  label: string;
  url: string | null;
  emoji: string;
  type?: "link" | "file" | "credential";
  file_name?: string | null;
  file_size?: number | null;
  metadata?: {
    value?: string;
  } | null;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  progress: number;
  workspace_id: string;
  avatar_url?: string | null;
}

export interface OnlineUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email?: string | null;
}

export interface MentionSuggestion {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

export interface CurrentUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export type Reaction = {
  emoji: string;
  count: number;
  user_ids: string[];
  mine: boolean;
};

export const STATUS_CONFIG: Record<TaskStatus, { label: string; bg: string; fg: string }> = {
  todo: { label: "To Do", bg: "#F5F5F2", fg: "#9CA3AF" },
  in_progress: { label: "In Progress", bg: "#EFF9FE", fg: "#36C5F0" },
  review: { label: "Review", bg: "#FFFBEB", fg: "#D97706" },
  done: { label: "Done", bg: "#ECFDF5", fg: "#059669" },
};

export const TASK_TYPE_CONFIG: Record<TaskType, { label: string; color: string; bg: string; icon: string }> = {
  task:          { label: 'Task',          color: 'text-gray-700',   bg: 'bg-gray-100',    icon: '○' },
  bug:           { label: 'Bug',           color: 'text-red-700',    bg: 'bg-red-50',      icon: '🐛' },
  feature:       { label: 'Feature',       color: 'text-purple-700', bg: 'bg-purple-50',   icon: '✨' },
  improvement:   { label: 'Improvement',   color: 'text-blue-700',   bg: 'bg-blue-50',     icon: '⚡' },
  epic:          { label: 'Epic',          color: 'text-indigo-700', bg: 'bg-indigo-50',   icon: '🚀' },
  question:      { label: 'Question',      color: 'text-amber-700',  bg: 'bg-amber-50',    icon: '?' },
  documentation: { label: 'Docs',          color: 'text-teal-700',   bg: 'bg-teal-50',     icon: '📄' },
};

export const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "✅", "🎉", "👀", "🚀", "💯", "⚡", "😮", "🙏"];
