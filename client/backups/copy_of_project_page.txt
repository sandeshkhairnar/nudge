"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { createChannel } from "@/lib/channels";
import { createTask, updateTask, deleteTask } from "@/lib/tasks";
import { addResource, deleteResource } from "@/lib/resources";
import { addProjectMember, getProjectMembers } from "@/lib/project-members";
import { useParams } from "next/navigation";
import {
  MessageSquare,
  CheckSquare,
  Users,
  FolderOpen,
  Plus,
  X,
  Hash,
  MoreVertical,
  Send,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  FileText,
  Sparkles
} from "lucide-react";

type Tab = "chat" | "tasks" | "team" | "resources";
type TaskStatus = "todo" | "in_progress" | "review" | "done";

interface Channel {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean;
}

interface MessageProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Message {
  id: string;
  content: string;
  is_ai: boolean;
  created_at: string;
  edited_at: string | null;
  user_id: string;
  profiles: MessageProfile | null;
}

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignee_id: string | null;
  stalled_days: number;
  due_date: string | null;
  assignee?: { id: string; full_name: string | null; avatar_url: string | null } | null;
}

interface TeamMember {
  id: string;
  role: string;
  profiles: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface Resource {
  id: string;
  category: string;
  label: string;
  url: string | null;
  emoji: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
  progress: number;
  workspace_id: string;
}

interface OnlineUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; bg: string; fg: string }> = {
  todo: { label: "To Do", bg: "#F5F5F2", fg: "#9CA3AF" },
  in_progress: { label: "In Progress", bg: "#EFF9FE", fg: "#36C5F0" },
  review: { label: "Review", bg: "#FFFBEB", fg: "#D97706" },
  done: { label: "Done", bg: "#ECFDF5", fg: "#059669" },
};

function colorFromString(s: string) {
  const palette = ["#36C5F0", "#2EB67D", "#ECB22E", "#E01E5A", "#A259FF", "#FF6B6B"];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function Avatar({
  name,
  userId,
  size = 28,
  online,
}: {
  name: string | null | undefined;
  userId: string;
  size?: number;
  online?: boolean;
}) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-full flex items-center justify-center font-black text-white select-none"
        style={{ background: colorFromString(userId), fontSize: size * 0.36 }}
      >
        {initials(name)}
      </div>
      {online !== undefined && (
        <span
          className={`absolute -bottom-px -right-px rounded-full border-2 border-white ${online ? "bg-emerald-400" : "bg-gray-300"
            }`}
          style={{ width: size * 0.36, height: size * 0.36 }}
        />
      )}
    </div>
  );
}

export default function SpacePage() {
  const supabase = createClient();
  const endRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const projectId = params.projectId as string;

  const [tab, setTab] = useState<Tab>("chat");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

  // Self-managed messages — no hook dependency for history
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [input, setInput] = useState("");

  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showNewResource, setShowNewResource] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [newResourceLabel, setNewResourceLabel] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");
  const [newResourceCategory, setNewResourceCategory] = useState("Documentation");
  const [actionLoading, setActionLoading] = useState(false);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Load project + static data ──────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", user.id)
        .single();
      if (prof) setCurrentUser(prof);

      const { data: proj } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (proj) setProject(proj);

      const { data: ch } = await supabase
        .from("channels")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at");
      if (ch?.length) {
        setChannels(ch);
        setActiveChannel(ch[0]);
      }

      const { data: ts } = await supabase
        .from("tasks")
        .select("*, assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url)")
        .eq("project_id", projectId)
        .order("created_at");
      if (ts) setTasks(ts as Task[]);

      const { members } = await getProjectMembers(projectId);
      if (members) setTeam(members as TeamMember[]);

      const { data: rs } = await supabase
        .from("resources")
        .select("*")
        .eq("project_id", projectId)
        .order("category");
      if (rs) setResources(rs);
    };
    load();
  }, [projectId]);

  // ── Fetch message history whenever channel changes ──────────
  const fetchMessages = useCallback(async (channelId: string) => {
    setMessagesLoading(true);
    setMessages([]); // clear while loading

    const { data, error } = await supabase
      .from("messages")
      .select(
        "id, content, is_ai, created_at, edited_at, user_id, profiles!messages_user_id_fkey(id, full_name, avatar_url)"
      )
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (!error && data) {
      setMessages(data as Message[]);
    }
    setMessagesLoading(false);
  }, []);

  useEffect(() => {
    if (!activeChannel?.id) return;
    fetchMessages(activeChannel.id);
  }, [activeChannel?.id, fetchMessages]);

  // ── Realtime subscription for new messages ──────────────────
  useEffect(() => {
    if (!activeChannel?.id) return;

    const channel = supabase
      .channel(`messages:${activeChannel.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${activeChannel.id}`,
        },
        async (payload) => {
          // Fetch the full message with profile join
          const { data } = await supabase
            .from("messages")
            .select(
              "id, content, is_ai, created_at, edited_at, user_id, profiles!messages_user_id_fkey(id, full_name, avatar_url)"
            )
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === data.id)) return prev;
              return [...prev, data as Message];
            });
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [activeChannel?.id]);

  // ── Presence for online users ───────────────────────────────
  useEffect(() => {
    if (!activeChannel?.id || !currentUser?.id) return;

    const presenceChannel = supabase.channel(`presence:${activeChannel.id}`, {
      config: { presence: { key: currentUser.id } },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const users: OnlineUser[] = Object.entries(state).map(([id, presences]) => ({
          id,
          full_name: (presences[0] as any)?.full_name ?? null,
          avatar_url: (presences[0] as any)?.avatar_url ?? null,
        }));
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            full_name: currentUser.full_name,
            avatar_url: currentUser.avatar_url,
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [activeChannel?.id, currentUser?.id]);

  // ── Send message ────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || !currentUser || !activeChannel) return;
    const text = input.trim();
    setInput("");

    // Optimistic insert
    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      content: text,
      is_ai: false,
      created_at: new Date().toISOString(),
      edited_at: null,
      user_id: currentUser.id,
      profiles: {
        id: currentUser.id,
        full_name: currentUser.full_name,
        avatar_url: currentUser.avatar_url,
      },
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        channel_id: activeChannel.id,
        user_id: currentUser.id,
        content: text,
        is_ai: false,
      })
      .select(
        "id, content, is_ai, created_at, edited_at, user_id, profiles!messages_user_id_fkey(id, full_name, avatar_url)"
      )
      .single();

    if (!error && data) {
      // Replace optimistic with real
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? (data as Message) : m))
      );
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    setActionLoading(true);
    const result = await createChannel({ projectId, name: newChannelName });
    if (result.channel) {
      const ch = result.channel as Channel;
      setChannels((prev) => [...prev, ch]);
      setActiveChannel(ch);
    }
    setNewChannelName("");
    setShowNewChannel(false);
    setActionLoading(false);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    setActionLoading(true);
    const result = await createTask({ projectId, title: newTaskTitle });
    if (result.task) setTasks((prev) => [...prev, result.task as Task]);
    setNewTaskTitle("");
    setShowNewTask(false);
    setActionLoading(false);
  };

  const handleTaskStatusChange = async (taskId: string, status: TaskStatus) => {
    await updateTask(taskId, { status }, projectId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId, projectId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setActionLoading(true);
    setInviteError("");
    const result = await addProjectMember(projectId, inviteEmail);
    if (result.error) {
      setInviteError(result.error);
    } else if (result.member) {
      setTeam((prev) => [...prev, result.member as TeamMember]);
      setInviteEmail("");
      setShowInvite(false);
    }
    setActionLoading(false);
  };

  const handleAddResource = async () => {
    if (!newResourceLabel.trim()) return;
    setActionLoading(true);
    const result = await addResource({
      projectId,
      category: newResourceCategory,
      label: newResourceLabel,
      url: newResourceUrl || undefined,
    });
    if (result.resource) setResources((prev) => [...prev, result.resource as Resource]);
    setNewResourceLabel("");
    setNewResourceUrl("");
    setShowNewResource(false);
    setActionLoading(false);
  };

  const handleDeleteResource = async (resourceId: string) => {
    await deleteResource(resourceId, projectId);
    setResources((prev) => prev.filter((r) => r.id !== resourceId));
  };

  const groupedResources = resources.reduce<Record<string, Resource[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  const taskCounts = {
    total: tasks.length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    review: tasks.filter((t) => t.status === "review").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  const getTabIcon = (tabId: Tab) => {
    switch (tabId) {
      case "chat": return <MessageSquare size={16} />;
      case "tasks": return <CheckSquare size={16} />;
      case "team": return <Users size={16} />;
      case "resources": return <FolderOpen size={16} />;
      default: return null;
    }
  };

  return (
    <div
      className="flex h-full overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-white"
      style={{ maxHeight: "calc(100vh - 40px)", fontFamily: "'Sora', sans-serif" }}
    >
      {/* ─────────────── SIDEBAR ─────────────── */}
      <div className="w-52 flex-shrink-0 flex flex-col bg-[#F9F9F7] border-r border-gray-100 overflow-hidden">
        <div className="px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: project?.color
                  ? `linear-gradient(135deg, ${project.color}, #2EB67D)`
                  : "linear-gradient(135deg,#36C5F0,#2EB67D)",
              }}
            >
              <span className="text-white font-extrabold text-sm">
                {project?.name?.[0] ?? "P"}
              </span>
            </div>

            <div className="min-w-0 flex flex-col">
              <p className="text-sm font-bold text-gray-900 truncate leading-snug">
                {project?.name ?? "Project"}
              </p>
              <p className="text-xs text-gray-500 leading-tight">
                Progress: {project?.progress ?? 0}%
              </p>

            </div>
          </div>
        </div>

        <nav className="px-2.5 pt-3 flex-shrink-0">
          {(
            [
              { id: "chat", label: "Chat" },
              { id: "tasks", label: "Tasks" },
              { id: "team", label: "Team" },
              { id: "resources", label: "Resources" },
            ] as { id: Tab; label: string }[]
          ).map((item) => (
            <motion.button
              key={item.id}
              onClick={() => setTab(item.id)}
              whileHover={{ x: 1.5 }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border-0 cursor-pointer transition-all text-left mb-0.5"
              style={{
                background: tab === item.id ? "#fff" : "transparent",
                color: tab === item.id ? "#111827" : "#9CA3AF",
                boxShadow: tab === item.id ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                fontFamily: "'Sora',sans-serif",
              }}
            >
              <span className="text-[13px]">{getTabIcon(item.id)}</span>
              <span className="text-[12.5px] font-semibold">{item.label}</span>
            </motion.button>
          ))}
        </nav>

        <AnimatePresence>
          {tab === "chat" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="px-2.5 mt-4 overflow-hidden"
            >
              <div className="flex items-center justify-between px-2.5 mb-1.5">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-300">
                  Channels
                </p>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => setShowNewChannel(true)}
                  className="cursor-pointer text-gray-300 hover:text-gray-500 transition-colors"
                  style={{ background: "none", border: "none", padding: 0 }}
                >
                  <Plus size={12} />
                </motion.button>
              </div>
              <div className="space-y-0.5">
                {channels.map((ch) => (
                  <motion.button
                    key={ch.id}
                    onClick={() => setActiveChannel(ch)}
                    whileHover={{ x: 1.5 }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border-0 cursor-pointer transition-all"
                    style={{
                      background: activeChannel?.id === ch.id ? "#fff" : "transparent",
                      color: activeChannel?.id === ch.id ? "#111827" : "#9CA3AF",
                      boxShadow:
                        activeChannel?.id === ch.id ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
                      fontFamily: "'Sora',sans-serif",
                    }}
                  >
                    <Hash size={11} className="text-gray-300" />
                    <span className="text-[12px] font-semibold flex-1 text-left truncate">
                      {ch.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-auto px-4 py-3 border-t border-gray-100 flex-shrink-0">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-gray-300 mb-2">
            Online · {onlineUsers.length}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {onlineUsers.length === 0 ? (
              <p className="text-[10px] text-gray-300 font-medium">No one online</p>
            ) : (
              onlineUsers.slice(0, 8).map((u) => (
                <div key={u.id} title={u.full_name ?? "User"}>
                  <Avatar name={u.full_name} userId={u.id} size={24} online={true} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─────────────── MAIN ─────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-gray-100 flex-shrink-0 bg-white">
          <div className="flex items-center gap-2">
            {tab === "chat" && (
              <Hash size={16} className="text-gray-300" />
            )}
            <h2 className="text-[15px] font-black text-gray-900 capitalize">
              {tab === "chat" ? (activeChannel?.name ?? "chat") : tab}
            </h2>
            {tab === "chat" && (
              <>
                <span className="text-[12px] text-gray-300 font-medium ml-0.5">
                  {messages.length} messages
                </span>
                <span
                  className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${isConnected
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-gray-50 text-gray-400"
                    }`}
                >
                  {isConnected ? "" : "○ connecting"}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {tab === "tasks" && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowNewTask(true)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-white cursor-pointer flex items-center gap-1.5"
                style={{ background: "#0D0D0D", border: "none", fontFamily: "'Sora',sans-serif" }}
              >
                <Plus size={14} />
                New task
              </motion.button>
            )}
            {tab === "team" && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setShowInvite(true); setInviteError(""); }}
                className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-white cursor-pointer flex items-center gap-1.5"
                style={{ background: "#0D0D0D", border: "none", fontFamily: "'Sora',sans-serif" }}
              >
                <Plus size={14} />
                Invite
              </motion.button>
            )}
            {tab === "resources" && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowNewResource(true)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-white cursor-pointer flex items-center gap-1.5"
                style={{ background: "#0D0D0D", border: "none", fontFamily: "'Sora',sans-serif" }}
              >
                <Plus size={14} />
                Add
              </motion.button>
            )}
            <div className="flex -space-x-1.5">
              {team.slice(0, 4).map((m, i) => {
                const p = m.profiles;
                if (!p) return null;
                return (
                  <div key={i} className="ring-2 ring-white rounded-full">
                    <Avatar name={p.full_name} userId={p.id} size={24} />
                  </div>
                );
              })}
            </div>
            <span className="text-[11px] text-gray-400 font-medium">{team.length} members</span>
          </div>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab + (activeChannel?.id ?? "")}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 overflow-y-auto min-h-0"
          >

            {/* ── CHAT ── */}
            {tab === "chat" && (
              <div className="px-5 py-4 flex flex-col">
                {messagesLoading && (
                  <div className="flex items-center justify-center h-20">
                    <Loader2 size={24} className="text-gray-300 animate-spin" />
                  </div>
                )}

                {!messagesLoading && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-300">
                    <MessageSquare size={32} className="mb-2 opacity-50" />
                    <p className="text-[13px] font-semibold">No messages yet. Say hello! 👋</p>
                  </div>
                )}

                {messages.map((m, i) => {
                  const isSelf = m.user_id === currentUser?.id;
                  const name = m.profiles?.full_name ?? "Unknown";
                  const prevMsg = i > 0 ? messages[i - 1] : null;
                  const isGrouped = prevMsg?.user_id === m.user_id;

                  return (
                    <div
                      key={m.id}
                      className={`flex items-end gap-2.5 ${isSelf ? "flex-row-reverse" : "flex-row"
                        } ${isGrouped ? "mt-0.5" : "mt-4 first:mt-0"}`}
                    >
                      {/* Avatar placeholder to keep alignment */}
                      <div style={{ width: 32, flexShrink: 0 }}>
                        {!isGrouped && (
                          <Avatar name={name} userId={m.user_id} size={32} />
                        )}
                      </div>

                      <div
                        className={`flex flex-col max-w-[60%] ${isSelf ? "items-end" : "items-start"
                          }`}
                      >
                        {!isGrouped && (
                          <div
                            className={`flex items-baseline gap-1.5 mb-1 ${isSelf ? "flex-row-reverse" : "flex-row"
                              }`}
                          >
                            <span
                              className={`text-[12px] font-black ${m.is_ai
                                  ? "text-violet-600"
                                  : isSelf
                                    ? "text-gray-500"
                                    : "text-gray-800"
                                }`}
                            >
                              {isSelf ? "You" : name}
                            </span>
                            <span className="text-[10px] text-gray-300">
                              {new Date(m.created_at).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })}
                            </span>
                            {m.is_ai && (
                              <span className="flex items-center gap-0.5 text-[9px] font-black tracking-wider text-violet-500 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded">
                                <Sparkles size={9} />
                                AI
                              </span>
                            )}
                          </div>
                        )}

                        <div
                          className="px-3.5 py-2.5 text-[13.5px] leading-relaxed break-words"
                          style={{
                            borderRadius: isSelf
                              ? "16px 16px 4px 16px"
                              : "16px 16px 16px 4px",
                            ...(m.is_ai
                              ? {
                                background: "#F5F0FF",
                                border: "1px solid #E9D5FF",
                                color: "#7C3AED",
                              }
                              : isSelf
                                ? { background: "#0D0D0D", color: "#fff" }
                                : { background: "#F3F4F6", color: "#111827" }),
                          }}
                        >
                          {m.content}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {typingUsers.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 ml-10">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
                          className="w-1.5 h-1.5 rounded-full bg-gray-300"
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-gray-400">
                      {typingUsers.join(", ")} typing…
                    </span>
                  </div>
                )}
                <div ref={endRef} className="h-2" />
              </div>
            )}

            {/* ── TASKS ── */}
            {tab === "tasks" && (
              <div className="p-5">
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {[
                    { label: "Total", val: taskCounts.total, color: "#0D0D0D" },
                    { label: "In Progress", val: taskCounts.inProgress, color: "#36C5F0" },
                    { label: "Review", val: taskCounts.review, color: "#D97706" },
                    { label: "Done", val: taskCounts.done, color: "#059669" },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-center"
                    >
                      <p className="text-[22px] font-black" style={{ color: s.color }}>
                        {s.val}
                      </p>
                      <p className="text-[11px] text-gray-400 font-semibold">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {tasks.map((t, i) => {
                    const s = STATUS_CONFIG[t.status];
                    return (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: s.fg }}
                        />
                        <p className="flex-1 text-[13px] font-semibold text-gray-800 truncate">
                          {t.title}
                        </p>
                        {t.stalled_days > 3 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">
                            <AlertCircle size={10} />
                            Stalled
                          </span>
                        )}
                        <select
                          value={t.status}
                          onChange={(e) =>
                            handleTaskStatusChange(t.id, e.target.value as TaskStatus)
                          }
                          className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 cursor-pointer outline-none border-0"
                          style={{
                            background: s.bg,
                            color: s.fg,
                            fontFamily: "'Sora',sans-serif",
                          }}
                        >
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                        {t.assignee && (
                          <Avatar name={t.assignee.full_name} userId={t.assignee.id} size={24} />
                        )}
                        <span className="text-[11px] text-gray-300 w-9 text-right flex-shrink-0">
                          {t.due_date
                            ? new Date(t.due_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                            : "—"}
                        </span>
                        <motion.button
                          onClick={() => handleDeleteTask(t.id)}
                          whileHover={{ scale: 1.1 }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-gray-300 hover:text-red-400"
                          style={{ background: "none", border: "none" }}
                        >
                          <X size={12} />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                  {tasks.length === 0 && (
                    <div className="text-center py-10 text-gray-300">
                      <CheckSquare size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-[13px] font-semibold">
                        No tasks yet. Create your first one!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TEAM ── */}
            {tab === "team" && (
              <div className="p-5">
                {onlineUsers.length > 0 && (
                  <div className="mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 mb-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Online now · {onlineUsers.length}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {onlineUsers.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full"
                        >
                          <Avatar name={u.full_name} userId={u.id} size={20} online={true} />
                          <span className="text-[12px] font-semibold text-emerald-700">
                            {u.full_name ?? "User"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 mb-3">
                  All members · {team.length}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {team.map((m, i) => {
                    const p = m.profiles;
                    if (!p) return null;
                    const isOnline = onlineUsers.some((u) => u.id === p.id);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                      >
                        <Avatar name={p.full_name} userId={p.id} size={38} online={isOnline} />
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-gray-900 truncate">
                            {p.full_name ?? "Unknown"}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">{p.email}</p>
                          <span className="text-[10px] font-semibold text-[#36C5F0] capitalize">
                            {m.role}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                  {team.length === 0 && (
                    <div className="col-span-2 text-center py-10 text-gray-300">
                      <Users size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-[13px] font-semibold">
                        No team members yet. Invite someone!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── RESOURCES ── */}
            {tab === "resources" && (
              <div className="p-5 space-y-4">
                {Object.keys(groupedResources).length === 0 && (
                  <div className="text-center py-10 text-gray-300">
                    <FolderOpen size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-[13px] font-semibold">
                      No resources yet. Add your first link!
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(groupedResources).map(([cat, items], ci) => (
                    <motion.div
                      key={cat}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: ci * 0.06 }}
                      className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[15px]">{items[0]?.emoji ?? <FileText size={16} />}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          {cat}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {items.map((item, ii) => (
                          <div
                            key={ii}
                            className="flex items-center justify-between group py-2 border-b border-gray-50 last:border-0"
                          >
                            {item.url ? (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-700 hover:text-gray-900 transition-colors no-underline flex-1"
                              >
                                <LinkIcon size={12} className="text-gray-400" />
                                {item.label}
                              </a>
                            ) : (
                              <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-700 flex-1">
                                <FileText size={12} className="text-gray-400" />
                                {item.label}
                              </span>
                            )}
                            <motion.button
                              onClick={() => handleDeleteResource(item.id)}
                              whileHover={{ scale: 1.1 }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-gray-300 hover:text-red-400 ml-2"
                              style={{ background: "none", border: "none" }}
                            >
                              <X size={11} />
                            </motion.button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Chat input ── */}
        {tab === "chat" && (
          <div className="flex-shrink-0 px-5 pb-4 pt-2 border-t border-gray-100 bg-white">
            <div
              className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-2.5 focus-within:bg-white transition-all"
              style={{ border: "1px solid #EBEBEB" }}
            >
              {currentUser && (
                <Avatar name={currentUser.full_name} userId={currentUser.id} size={26} />
              )}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={`Message #${activeChannel?.name ?? "general"}…`}
                className="flex-1 bg-transparent border-none outline-none text-[13px] font-medium text-gray-800 placeholder-gray-300"
                style={{ fontFamily: "'Sora',sans-serif" }}
              />
              <motion.button
                onClick={handleSend}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-1.5 rounded-xl text-[12px] font-black border-0 cursor-pointer transition-all flex-shrink-0 flex items-center gap-1.5 ${input.trim() ? "bg-[#0D0D0D] text-white" : "bg-gray-100 text-gray-300"
                  }`}
                style={{ fontFamily: "'Sora',sans-serif" }}
              >
                <Send size={12} />
                Send
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────── MODALS ─────────────── */}
      <AnimatePresence>
        {(showNewChannel || showNewTask || showInvite || showNewResource) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={() => {
              setShowNewChannel(false);
              setShowNewTask(false);
              setShowInvite(false);
              setShowNewResource(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-2xl p-6 w-[380px] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              style={{ fontFamily: "'Sora',sans-serif" }}
            >
              {showNewChannel && (
                <>
                  <h3 className="text-[18px] font-black text-gray-900 mb-1">New Channel</h3>
                  <p className="text-[13px] text-gray-400 mb-5">
                    Create a new chat channel for this project.
                  </p>
                  <input
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateChannel()}
                    placeholder="e.g. frontend, deployment"
                    autoFocus
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none mb-4 placeholder-gray-300"
                    style={{ fontFamily: "'Sora',sans-serif" }}
                  />
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setShowNewChannel(false)}
                      className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-[13px] font-bold cursor-pointer border-0 flex items-center justify-center gap-1.5"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                    <motion.button
                      onClick={handleCreateChannel}
                      whileTap={{ scale: 0.97 }}
                      disabled={actionLoading}
                      className="flex-1 py-3 bg-[#0D0D0D] text-white rounded-xl text-[13px] font-bold cursor-pointer border-0 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      {actionLoading ? "Creating…" : "Create"}
                    </motion.button>
                  </div>
                </>
              )}

              {showNewTask && (
                <>
                  <h3 className="text-[18px] font-black text-gray-900 mb-1">New Task</h3>
                  <p className="text-[13px] text-gray-400 mb-5">Add a task to this project.</p>
                  <input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
                    placeholder="Task title…"
                    autoFocus
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none mb-4 placeholder-gray-300"
                    style={{ fontFamily: "'Sora',sans-serif" }}
                  />
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setShowNewTask(false)}
                      className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-[13px] font-bold cursor-pointer border-0 flex items-center justify-center gap-1.5"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                    <motion.button
                      onClick={handleCreateTask}
                      whileTap={{ scale: 0.97 }}
                      disabled={actionLoading}
                      className="flex-1 py-3 bg-[#0D0D0D] text-white rounded-xl text-[13px] font-bold cursor-pointer border-0 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      {actionLoading ? "Creating…" : "Create"}
                    </motion.button>
                  </div>
                </>
              )}

              {showInvite && (
                <>
                  <h3 className="text-[18px] font-black text-gray-900 mb-1">Invite to Project</h3>
                  <p className="text-[13px] text-gray-400 mb-5">They must have a Nudge account.</p>
                  <input
                    value={inviteEmail}
                    onChange={(e) => { setInviteEmail(e.target.value); setInviteError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                    placeholder="colleague@company.com"
                    type="email"
                    autoFocus
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none mb-2 placeholder-gray-300"
                    style={{ fontFamily: "'Sora',sans-serif" }}
                  />
                  {inviteError && (
                    <p className="text-[12px] text-red-500 font-semibold mb-3 px-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {inviteError}
                    </p>
                  )}
                  <div className="flex gap-2.5 mt-2">
                    <button
                      onClick={() => { setShowInvite(false); setInviteError(""); }}
                      className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-[13px] font-bold cursor-pointer border-0 flex items-center justify-center gap-1.5"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                    <motion.button
                      onClick={handleInvite}
                      whileTap={{ scale: 0.97 }}
                      disabled={actionLoading}
                      className="flex-1 py-3 bg-[#0D0D0D] text-white rounded-xl text-[13px] font-bold cursor-pointer border-0 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
                      {actionLoading ? "Inviting…" : "Invite"}
                    </motion.button>
                  </div>
                </>
              )}

              {showNewResource && (
                <>
                  <h3 className="text-[18px] font-black text-gray-900 mb-1">Add Resource</h3>
                  <p className="text-[13px] text-gray-400 mb-5">
                    Add a link or document to this project.
                  </p>
                  <div className="flex flex-col gap-3 mb-4">
                    <input
                      value={newResourceLabel}
                      onChange={(e) => setNewResourceLabel(e.target.value)}
                      placeholder="Label (e.g. Figma File)"
                      autoFocus
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none placeholder-gray-300"
                      style={{ fontFamily: "'Sora',sans-serif" }}
                    />
                    <input
                      value={newResourceUrl}
                      onChange={(e) => setNewResourceUrl(e.target.value)}
                      placeholder="URL (optional)"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none placeholder-gray-300"
                      style={{ fontFamily: "'Sora',sans-serif" }}
                    />
                    <select
                      value={newResourceCategory}
                      onChange={(e) => setNewResourceCategory(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none"
                      style={{ fontFamily: "'Sora',sans-serif" }}
                    >
                      {["Documentation", "Credentials", "Deployment", "Testing", "Design", "Other"].map(
                        (c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setShowNewResource(false)}
                      className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-[13px] font-bold cursor-pointer border-0 flex items-center justify-center gap-1.5"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                    <motion.button
                      onClick={handleAddResource}
                      whileTap={{ scale: 0.97 }}
                      disabled={actionLoading}
                      className="flex-1 py-3 bg-[#0D0D0D] text-white rounded-xl text-[13px] font-bold cursor-pointer border-0 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      {actionLoading ? "Adding…" : "Add"}
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}