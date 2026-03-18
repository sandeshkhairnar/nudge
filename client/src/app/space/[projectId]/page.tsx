"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { createChannel } from "@/lib/channels";
import { createTask, updateTask, deleteTask } from "@/lib/tasks";
import { addResource, deleteResource } from "@/lib/resources";
import { inviteProjectMember, getProjectMembers } from "@/lib/project-members";
import { getProjectIntegrations, upsertGitHubIntegration, deleteIntegration, Integration } from "@/lib/integrations";
import { useParams } from "next/navigation";
import {
  MessageSquare, CheckSquare, Users, FolderOpen, Plus, X, Hash,
  Send, Loader2, AlertCircle, Link as LinkIcon, FileText, Sparkles,
  Paperclip, ImageIcon, Smile, Bold, Italic, Code, Menu,
  Book, Mail, CheckCircle2, Settings as SettingsIcon, Github,
  MessageCircle, CornerDownRight, Trash2, AtSign
} from "lucide-react";
import { TaskBoard, Task as BoardTask } from "@/components/workspace/TaskBoard";
import GlobalAvatar from "@/components/global/Avatar";

type Tab = "chat" | "tasks" | "team" | "resources" | "settings";
type TaskStatus = "todo" | "in_progress" | "review" | "done";

interface Channel { id: string; name: string; description: string | null; is_private: boolean; }
interface MessageProfile { id: string; full_name: string | null; avatar_url: string | null; }
interface FileAttachment { type: "image" | "file"; name: string; url: string; size?: number; }
interface Message {
  id: string; content: string; is_ai: boolean; created_at: string;
  edited_at: string | null; user_id: string; profiles: MessageProfile | null;
  attachments?: FileAttachment[];
  parent_id?: string | null;
  reply_count?: number;
}
interface Task {
  id: string; title: string; status: TaskStatus; assignee_id: string | null;
  stalled_days: number; due_date: string | null;
  created_at: string;
  assignee?: { id: string; full_name: string | null; avatar_url: string | null; email: string; } | null;
  projects?: { id: string; name: string; color: string } | null;
}
interface TeamMember {
  id: string; role: string;
  profiles: { id: string; full_name: string | null; email: string; avatar_url: string | null; } | null;
}
interface Resource { id: string; category: string; label: string; url: string | null; emoji: string; }
interface Project { id: string; name: string; color: string; progress: number; workspace_id: string; }
interface OnlineUser { id: string; full_name: string | null; avatar_url: string | null; email?: string | null; }

interface MentionSuggestion {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; bg: string; fg: string }> = {
  todo: { label: "To Do", bg: "#F5F5F2", fg: "#9CA3AF" },
  in_progress: { label: "In Progress", bg: "#EFF9FE", fg: "#36C5F0" },
  review: { label: "Review", bg: "#FFFBEB", fg: "#D97706" },
  done: { label: "Done", bg: "#ECFDF5", fg: "#059669" },
};

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "✅", "🎉", "👀", "🚀", "💯", "⚡", "😮", "🙏"];

function colorFromString(s: string) {
  const palette = ["#36C5F0", "#2EB67D", "#ECB22E", "#E01E5A", "#A259FF", "#FF6B6B"];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}
function formatBytes(b: number) {
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  return (b / 1048576).toFixed(1) + " MB";
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}
function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-5 px-1 select-none">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[11px] font-semibold text-gray-400 px-3 py-1 bg-white border border-gray-100 rounded-full shadow-sm">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

function renderMarkdown(text: string) {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/```([\s\S]*?)```/g, '<pre style="background:#F3F4F6;color:#374151;padding:10px 14px;border-radius:8px;font-size:12px;font-family:monospace;overflow-x:auto;margin:4px 0;line-height:1.6"><code>$1</code></pre>')
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code style="background:#F3F4F6;color:#374151;padding:1px 5px;border-radius:4px;font-size:12px;font-family:monospace">$1</code>')
    .replace(/^#{3}\s(.+)$/gm, '<h3 style="font-size:14px;font-weight:800;color:#111827;margin:8px 0 2px">$1</h3>')
    .replace(/^#{2}\s(.+)$/gm, '<h2 style="font-size:15px;font-weight:800;color:#111827;margin:8px 0 2px">$1</h2>')
    .replace(/^#{1}\s(.+)$/gm, '<h1 style="font-size:16px;font-weight:900;color:#111827;margin:8px 0 2px">$1</h1>')
    .replace(/^[-*]\s(.+)$/gm, '<li style="margin-left:16px;list-style:disc;color:#374151;font-size:13.5px">$1</li>')
    .replace(/@(\w+)/g, '<span style="color:#3B82F6;font-weight:700;background:#EFF6FF;border-radius:4px;padding:0 3px">@$1</span>')
    .replace(/\n/g, "<br/>");
}

export default function SpacePage() {
  const supabase = createClient();
  const endRef = useRef<HTMLDivElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const threadTextareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const projectId = params.projectId as string;

  const [tab, setTab] = useState<Tab>("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; full_name: string | null; avatar_url: string | null; } | null>(null);

  const [input, setInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, { emoji: string; count: number; user_ids: string[]; mine: boolean }[]>>({});

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number>(0);
  const [isThreadMention, setIsThreadMention] = useState(false);

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeThreadMsg, setActiveThreadMsg] = useState<Message | null>(null);
  const [threadInput, setThreadInput] = useState("");
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadUploading, setThreadUploading] = useState(false);
  const [threadEmojiOpen, setThreadEmojiOpen] = useState(false);
  const [hoveredThreadMsgId, setHoveredThreadMsgId] = useState<string | null>(null);
  const [replyCounts, setReplyCounts] = useState<Record<string, number>>({});

  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showNewResource, setShowNewResource] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<string | null>(null);
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<string>("medium");
  const [newTaskStatus, setNewTaskStatus] = useState<string>("todo");
  const [newTaskAssigneeOpen, setNewTaskAssigneeOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");
  const [inviteError, setInviteError] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [newResourceLabel, setNewResourceLabel] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");
  const [newResourceCategory, setNewResourceCategory] = useState("Documentation");
  const [actionLoading, setActionLoading] = useState(false);

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [repoInput, setRepoInput] = useState("");
  const [intLoading, setIntLoading] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { threadEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [threadMessages]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("id,full_name,avatar_url").eq("id", user.id).single();
      if (prof) setCurrentUser(prof);
      const { data: proj } = await supabase.from("projects").select("*").eq("id", projectId).single();
      if (proj) setProject(proj);
      const { data: ch } = await supabase.from("channels").select("*").eq("project_id", projectId).order("created_at");
      if (ch?.length) { setChannels(ch); setActiveChannel(ch[0]); }
      const { data: ts } = await supabase.from("tasks").select("*,assignee:profiles!tasks_assignee_id_fkey(id,full_name,avatar_url,email),projects!tasks_project_id_fkey(id,name,color)").eq("project_id", projectId).order("created_at");
      if (ts) setTasks(ts as Task[]);
      const { members } = await getProjectMembers(projectId);
      if (members) setTeam(members as unknown as TeamMember[]);
      const { data: rs } = await supabase.from("resources").select("*").eq("project_id", projectId).order("category");
      if (rs) setResources(rs);
      const { integrations: intgs } = await getProjectIntegrations(projectId);
      if (intgs) setIntegrations(intgs);
      await supabase.from("notifications").update({ read: true }).eq("recipient_id", user.id).eq("project_id", projectId).eq("read", false);
    };
    load();
  }, [projectId]);

  const fetchReactions = useCallback(async (msgIds: string[]) => {
    if (!msgIds.length) return;
    const { data, error } = await supabase.from("message_reactions").select("*").in("message_id", msgIds);
    if (!error && data) {
      const { data: { user } } = await supabase.auth.getUser();
      const map: Record<string, { emoji: string; count: number; user_ids: string[]; mine: boolean }[]> = {};
      data.forEach((r) => {
        if (!map[r.message_id]) map[r.message_id] = [];
        const existing = map[r.message_id].find((x) => x.emoji === r.emoji);
        if (existing) {
          existing.count++;
          existing.user_ids.push(r.user_id);
          if (r.user_id === user?.id) existing.mine = true;
        } else {
          map[r.message_id].push({ emoji: r.emoji, count: 1, user_ids: [r.user_id], mine: r.user_id === user?.id });
        }
      });
      setReactions((prev) => ({ ...prev, ...map }));
    }
  }, []);

  const fetchReplyCounts = useCallback(async (msgIds: string[]) => {
    if (!msgIds.length) return;
    const { data, error } = await supabase.from("messages").select("parent_id").in("parent_id", msgIds);
    if (!error && data) {
      const counts: Record<string, number> = {};
      data.forEach((r: { parent_id: string }) => { counts[r.parent_id] = (counts[r.parent_id] ?? 0) + 1; });
      setReplyCounts((prev) => ({ ...prev, ...counts }));
    }
  }, []);

  const fetchMessages = useCallback(async (channelId: string) => {
    setMessagesLoading(true);
    setMessages([]);
    const { data, error } = await supabase
      .from("messages")
      .select("id,content,is_ai,created_at,edited_at,user_id,parent_id,profiles!messages_user_id_fkey(id,full_name,avatar_url)")
      .eq("channel_id", channelId)
      .is("parent_id", null)
      .order("created_at", { ascending: true })
      .limit(100);
    if (!error && data) {
      const formatted = (data as (typeof data[0] & { profiles: MessageProfile | MessageProfile[] | null })[]).map((m) => ({
        ...m,
        profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
      })) as Message[];
      setMessages(formatted);
      fetchReactions(formatted.map(m => m.id));
      fetchReplyCounts(formatted.map(m => m.id));
    }
    setMessagesLoading(false);
  }, [fetchReactions, fetchReplyCounts]);

  const fetchThreadMessages = useCallback(async (parentId: string) => {
    setThreadLoading(true);
    const { data, error } = await supabase
      .from("messages")
      .select("id,content,is_ai,created_at,edited_at,user_id,parent_id,profiles!messages_user_id_fkey(id,full_name,avatar_url)")
      .eq("parent_id", parentId)
      .order("created_at", { ascending: true });
    if (!error && data) {
      const formatted = (data as (typeof data[0] & { profiles: MessageProfile | MessageProfile[] | null })[]).map((m) => ({
        ...m,
        profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
      })) as Message[];
      setThreadMessages(formatted);
      fetchReactions([parentId, ...formatted.map(m => m.id)]);
    }
    setThreadLoading(false);
  }, [fetchReactions]);

  useEffect(() => { if (activeChannel?.id) fetchMessages(activeChannel.id); }, [activeChannel?.id, fetchMessages]);

  useEffect(() => {
    if (!activeChannel?.id) return;
    const ch = supabase.channel(`project_chat:${activeChannel.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${activeChannel.id}` },
        async (payload) => {
          const { data } = await supabase.from("messages")
            .select("id,content,is_ai,created_at,edited_at,user_id,parent_id,profiles!messages_user_id_fkey(id,full_name,avatar_url,email)")
            .eq("id", payload.new.id).single();
          if (data) {
            const raw = data as typeof data & { profiles: MessageProfile | MessageProfile[] | null; parent_id?: string | null };
            const message: Message = { ...raw, profiles: Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles };
            if (message.parent_id) {
              if (message.parent_id === activeThreadId) {
                setThreadMessages((prev) => prev.some((m) => m.id === message.id) ? prev : [...prev, message]);
              }
              setReplyCounts((prev) => ({ ...prev, [message.parent_id!]: (prev[message.parent_id!] ?? 0) + 1 }));
            } else {
              setMessages((prev) => prev.some((m) => m.id === message.id) ? prev : [...prev, message]);
            }
          }
        })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
          setThreadMessages((prev) => prev.filter((m) => m.id !== deletedId));
          if (activeThreadId === deletedId) setActiveThreadId(null);
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" },
        (payload) => {
          const msgId = (payload.new as { message_id?: string })?.message_id || (payload.old as { message_id?: string })?.message_id;
          if (msgId) fetchReactions([msgId]);
        })
      .subscribe((s) => setIsConnected(s === "SUBSCRIBED"));
    return () => { supabase.removeChannel(ch); setIsConnected(false); };
  }, [activeChannel?.id, activeThreadId, fetchReactions]);

  useEffect(() => {
    if (activeThreadId) {
      fetchThreadMessages(activeThreadId);
      const msg = messages.find(m => m.id === activeThreadId);
      if (msg) setActiveThreadMsg(msg);
    } else {
      setThreadMessages([]);
      setActiveThreadMsg(null);
    }
  }, [activeThreadId, fetchThreadMessages]);

  useEffect(() => {
    if (!activeChannel?.id || !currentUser?.id) return;
    const pch = supabase.channel(`presence:${activeChannel.id}`, { config: { presence: { key: currentUser.id } } });
    pch.on("presence", { event: "sync" }, () => {
      const state = pch.presenceState();
      setOnlineUsers(Object.entries(state).map(([id, p]) => ({
        id,
        full_name: (p[0] as { full_name?: string })?.full_name ?? null,
        avatar_url: (p[0] as { avatar_url?: string })?.avatar_url ?? null,
        email: (p[0] as { email?: string })?.email ?? null
      })));
    }).subscribe(async (s) => {
      if (s === "SUBSCRIBED") await pch.track({ full_name: currentUser.full_name, avatar_url: currentUser.avatar_url });
    });
    return () => { supabase.removeChannel(pch); };
  }, [activeChannel?.id, currentUser?.id]);

  const resizeTextarea = (ref: React.RefObject<HTMLTextAreaElement | null>) => {
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  };

  const getMentionMembers = useCallback((): MentionSuggestion[] => {
    return team
      .filter(m => m.profiles)
      .map(m => ({
        id: m.profiles!.id,
        full_name: m.profiles!.full_name,
        email: m.profiles!.email,
        avatar_url: m.profiles!.avatar_url,
      }));
  }, [team]);

  const handleMentionInput = useCallback((value: string, cursorPos: number, isThread: boolean) => {
    const textUpToCursor = value.slice(0, cursorPos);
    const mentionMatch = textUpToCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      const start = cursorPos - mentionMatch[0].length;
      setMentionQuery(query);
      setMentionStart(start);
      setMentionIndex(0);
      setIsThreadMention(isThread);
      const members = getMentionMembers();
      const filtered = members.filter(m =>
        (m.full_name?.toLowerCase().includes(query) || m.email.toLowerCase().includes(query))
      ).slice(0, 6);
      setMentionSuggestions(filtered);
    } else {
      setMentionQuery(null);
      setMentionSuggestions([]);
    }
  }, [getMentionMembers]);

  const insertMention = useCallback((member: MentionSuggestion) => {
    const name = member.full_name?.replace(/\s+/g, "_") ?? member.email.split("@")[0];
    const setter = isThreadMention ? setThreadInput : setInput;
    const ref = isThreadMention ? threadTextareaRef : textareaRef;
    setter(prev => {
      const before = prev.slice(0, mentionStart);
      const after = prev.slice(ref.current?.selectionEnd ?? prev.length);
      return before + `@${name} ` + after;
    });
    setMentionQuery(null);
    setMentionSuggestions([]);
    setTimeout(() => ref.current?.focus(), 0);
  }, [mentionStart, isThreadMention]);

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    isThread: boolean
  ) => {
    if (mentionSuggestions.length > 0 && mentionQuery !== null) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, mentionSuggestions.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (mentionSuggestions[mentionIndex]) insertMention(mentionSuggestions[mentionIndex]);
        return;
      }
      if (e.key === "Escape") { setMentionQuery(null); setMentionSuggestions([]); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isThread) handleThreadSend();
      else handleSend();
    }
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const imgs = Array.from(e.clipboardData.items).filter((i) => i.type.startsWith("image/"));
    if (!imgs.length) return;
    e.preventDefault();
    imgs.forEach((item) => {
      const file = item.getAsFile();
      if (!file) return;
      setPendingFiles((prev) => [...prev, { file, preview: URL.createObjectURL(file) }]);
    });
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach((file) => {
      setPendingFiles((prev) => [...prev, { file, preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "" }]);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadFile = async (file: File): Promise<FileAttachment | null> => {
    const ext = file.name.split(".").pop();
    const path = `attachments/${projectId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("nudge-attachments").upload(path, file, { contentType: file.type });
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from("nudge-attachments").getPublicUrl(path);
    return { type: file.type.startsWith("image/") ? "image" : "file", name: file.name, url: publicUrl, size: file.size };
  };

  const parseContent = (raw: string): { text: string; attachments?: FileAttachment[] } => {
    try {
      const p = JSON.parse(raw);
      if (p.text !== undefined || p.attachments !== undefined) return { text: p.text ?? "", attachments: p.attachments };
    } catch { }
    return { text: raw };
  };

  const handleSend = async () => {
    if (!input.trim() && pendingFiles.length === 0) return;
    if (!currentUser || !activeChannel) return;
    const text = input.trim();
    const files = [...pendingFiles];
    setInput(""); setPendingFiles([]);
    setMentionQuery(null); setMentionSuggestions([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    setUploading(files.length > 0);
    let attachments: FileAttachment[] = [];
    if (files.length > 0) {
      const results = await Promise.all(files.map((f) => uploadFile(f.file)));
      attachments = results.filter(Boolean) as FileAttachment[];
      files.forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });
    }
    setUploading(false);

    const contentPayload = attachments.length > 0 ? JSON.stringify({ text, attachments }) : text;
    const optimistic: Message = {
      id: `opt-${Date.now()}`, content: contentPayload, is_ai: false,
      created_at: new Date().toISOString(), edited_at: null, user_id: currentUser.id,
      profiles: { id: currentUser.id, full_name: currentUser.full_name, avatar_url: currentUser.avatar_url },
      attachments: attachments.length ? attachments : undefined,
    };
    setMessages((prev) => [...prev, optimistic]);

    const { data, error } = await supabase.from("messages")
      .insert({ channel_id: activeChannel.id, user_id: currentUser.id, content: contentPayload, is_ai: false })
      .select("id,content,is_ai,created_at,edited_at,user_id,profiles!messages_user_id_fkey(id,full_name,avatar_url)")
      .single();
    if (!error && data) {
      const raw = data as typeof data & { profiles: MessageProfile | MessageProfile[] | null };
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? { ...raw, profiles: Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles, attachments: attachments.length ? attachments : undefined } as Message : m));
    }
  };

  const handleThreadSend = async () => {
    if (!threadInput.trim() || !currentUser || !activeChannel || !activeThreadId) return;
    const text = threadInput.trim();
    setThreadInput("");
    setMentionQuery(null); setMentionSuggestions([]);
    if (threadTextareaRef.current) threadTextareaRef.current.style.height = "auto";

    setThreadUploading(true);
    const contentPayload = text;
    const optimistic: Message = {
      id: `opt-thread-${Date.now()}`, content: contentPayload, is_ai: false,
      created_at: new Date().toISOString(), edited_at: null, user_id: currentUser.id,
      profiles: { id: currentUser.id, full_name: currentUser.full_name, avatar_url: currentUser.avatar_url },
      parent_id: activeThreadId,
    };
    setThreadMessages((prev) => [...prev, optimistic]);
    setThreadUploading(false);

    const { data, error } = await supabase.from("messages")
      .insert({ channel_id: activeChannel.id, user_id: currentUser.id, content: contentPayload, is_ai: false, parent_id: activeThreadId })
      .select("id,content,is_ai,created_at,edited_at,user_id,parent_id,profiles!messages_user_id_fkey(id,full_name,avatar_url)")
      .single();
    if (!error && data) {
      const raw = data as typeof data & { profiles: MessageProfile | MessageProfile[] | null };
      setThreadMessages((prev) => prev.map((m) => m.id === optimistic.id ? { ...raw, profiles: Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles } as Message : m));
      setReplyCounts((prev) => ({ ...prev, [activeThreadId]: (prev[activeThreadId] ?? 0) + 1 }));
    }
  };

  const handleDeleteMessage = async (msgId: string, isThread: boolean) => {
    setDeletingId(msgId);
    const { error } = await supabase.from("messages").delete().eq("id", msgId);
    if (!error) {
      if (isThread) {
        setThreadMessages((prev) => prev.filter((m) => m.id !== msgId));
        if (activeThreadId) {
          setReplyCounts((prev) => ({ ...prev, [activeThreadId]: Math.max((prev[activeThreadId] ?? 1) - 1, 0) }));
        }
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
        if (activeThreadId === msgId) setActiveThreadId(null);
      }
    }
    setDeletingId(null);
    setDeleteConfirmId(null);
  };

  const toggleReaction = async (msgId: string, emoji: string) => {
    if (!currentUser) return;
    const list = reactions[msgId] ?? [];
    const existing = list.find((r) => r.emoji === emoji);
    const mine = existing?.user_ids.includes(currentUser.id);
    if (mine) {
      await supabase.from("message_reactions").delete().eq("message_id", msgId).eq("user_id", currentUser.id).eq("emoji", emoji);
    } else {
      await supabase.from("message_reactions").insert({ message_id: msgId, user_id: currentUser.id, emoji });
    }
    fetchReactions([msgId]);
  };

  const insertFormat = (wrap: string, ref: React.RefObject<HTMLTextAreaElement | null>, setter: (v: string | ((p: string) => string)) => void) => {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const selected = value.slice(s, e);
    const newVal = value.slice(0, s) + wrap + selected + wrap + value.slice(e);
    setter(newVal);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + wrap.length, e + wrap.length); }, 0);
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    setActionLoading(true);
    const result = await createChannel({ projectId, name: newChannelName });
    if (result.channel) { setChannels((p) => [...p, result.channel as Channel]); setActiveChannel(result.channel as Channel); }
    setNewChannelName(""); setShowNewChannel(false); setActionLoading(false);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    setActionLoading(true);
    const result = await createTask({ projectId, title: newTaskTitle, assigneeId: newTaskAssigneeId ?? undefined, dueDate: newTaskDueDate || undefined, priority: newTaskPriority, status: newTaskStatus as TaskStatus });
    if (result.task) setTasks((p) => [...p, result.task as Task]);
    setNewTaskTitle(""); setNewTaskAssigneeId(null); setNewTaskDueDate(""); setNewTaskPriority("medium"); setNewTaskStatus("todo"); setNewTaskAssigneeOpen(false); setShowNewTask(false); setActionLoading(false);
  };

  const handleTaskStatus = async (taskId: string, status: TaskStatus) => {
    await updateTask(taskId, { status }, projectId);
    setTasks((p) => p.map((t) => t.id === taskId ? { ...t, status } : t));
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId, projectId);
    setTasks((p) => p.filter((t) => t.id !== taskId));
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setActionLoading(true); setInviteError("");
    const result = await inviteProjectMember(projectId, inviteEmail, inviteRole);
    setActionLoading(false);
    if (result.error) setInviteError(result.error);
    else setInviteSent(true);
  };

  const handleCloseInvite = () => {
    setShowInvite(false); setInviteEmail(""); setInviteRole("member"); setInviteError(""); setInviteSent(false);
  };

  const handleAddResource = async () => {
    if (!newResourceLabel.trim()) return;
    setActionLoading(true);
    const result = await addResource({ projectId, category: newResourceCategory, label: newResourceLabel, url: newResourceUrl || undefined });
    if (result.resource) setResources((p) => [...p, result.resource as Resource]);
    setNewResourceLabel(""); setNewResourceUrl(""); setShowNewResource(false); setActionLoading(false);
  };

  const handleDeleteResource = async (id: string) => {
    await deleteResource(id, projectId);
    setResources((p) => p.filter((r) => r.id !== id));
  };

  const handleConnectRepo = async () => {
    if (!repoInput.trim() || !project) return;
    setIntLoading(true);
    const res = await upsertGitHubIntegration({ workspaceId: project.workspace_id, projectId: project.id, repoFullName: repoInput.trim() });
    if (res.success) {
      const { integrations: updated } = await getProjectIntegrations(projectId);
      if (updated) setIntegrations(updated);
      setRepoInput("");
    }
    setIntLoading(false);
  };

  const handleDeleteIntegration = async (id: string) => {
    const res = await deleteIntegration(id, projectId);
    if (res.success) setIntegrations((prev) => prev.filter((i) => i.id !== id));
  };

  const groupedResources = resources.reduce<Record<string, Resource[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = []; acc[r.category].push(r); return acc;
  }, {});

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "chat", label: "Chat", icon: <MessageSquare size={14} /> },
    { id: "tasks", label: "Tasks", icon: <CheckSquare size={14} /> },
    { id: "team", label: "Team", icon: <Users size={14} /> },
    { id: "resources", label: "Resources", icon: <FolderOpen size={14} /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon size={14} /> },
  ];

  const buildMessageRow = (m: Message, isSelf: boolean, sameSender: boolean, isThread = false) => {
    const name = m.profiles?.full_name ?? "Unknown";
    const parsed = parseContent(m.content);
    const msgReactions = reactions[m.id] ?? [];
    const replyCount = replyCounts[m.id] ?? 0;
    const isHovered = isThread ? hoveredThreadMsgId === m.id : hoveredMsgId === m.id;
    const setHovered = isThread
      ? (id: string | null) => setHoveredThreadMsgId(id)
      : (id: string | null) => setHoveredMsgId(id);
    const canDelete = isSelf;
    const isDeleting = deletingId === m.id;
    const showDeleteConfirm = deleteConfirmId === m.id;

    return (
      <div key={m.id}
        className="group relative flex gap-0 px-3 sm:px-4 hover:bg-[#F9F9F7] rounded-lg transition-colors"
        style={{ paddingTop: sameSender ? 2 : 12, paddingBottom: 2 }}
        onMouseEnter={() => setHovered(m.id)}
        onMouseLeave={() => { setHovered(null); }}>

        <div style={{ width: 40, flexShrink: 0, paddingTop: 2 }}>
          {!sameSender
            ? <GlobalAvatar url={m.profiles?.avatar_url} name={name} email={(m.profiles as { email?: string })?.email} size={32} fallbackColor={colorFromString(m.user_id)} />
            : isHovered
              ? <span className="text-[10px] text-gray-300 block text-right pr-1 leading-loose select-none" style={{ paddingTop: 5 }}>
                {new Date(m.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
              </span>
              : null
          }
        </div>

        <div className="flex-1 min-w-0 pl-2.5">
          {!sameSender && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className={`text-[13.5px] font-black ${m.is_ai ? "text-violet-600" : "text-gray-900"}`}>
                {isSelf ? "You" : name}
              </span>
              <span className="text-[11px] text-gray-400">{formatTime(m.created_at)}</span>
              {m.is_ai && (
                <span className="flex items-center gap-0.5 text-[9px] font-black tracking-wider text-violet-500 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded-full">
                  <Sparkles size={8} /> AI
                </span>
              )}
            </div>
          )}

          {parsed.text && (
            <p className={`text-[14px] leading-[1.6] break-words ${m.is_ai ? "text-violet-700" : "text-gray-800"}`}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(parsed.text) }} />
          )}

          {parsed.attachments && parsed.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {parsed.attachments.map((a, ai) =>
                a.type === "image" ? (
                  <a key={ai} href={a.url} target="_blank" rel="noopener noreferrer">
                    <img src={a.url} alt={a.name} className="rounded-xl border border-gray-100 object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                      style={{ maxWidth: "min(280px, 90vw)", maxHeight: 200 }} />
                  </a>
                ) : (
                  <a key={ai} href={a.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl no-underline hover:bg-gray-50 transition-colors shadow-sm">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-[12.5px] font-semibold text-gray-800">{a.name}</p>
                      {a.size && <p className="text-[10px] text-gray-400">{formatBytes(a.size)}</p>}
                    </div>
                  </a>
                )
              )}
            </div>
          )}

          {msgReactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {msgReactions.map((r, ri) => (
                <button key={ri} onClick={() => toggleReaction(m.id, r.emoji)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] border cursor-pointer transition-all ${r.mine ? "bg-blue-50 border-blue-200 text-blue-800" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                  {r.emoji}<span className="text-[11px] font-semibold">{r.count}</span>
                </button>
              ))}
            </div>
          )}

          {!isThread && replyCount > 0 && (
            <button onClick={() => setActiveThreadId(m.id)}
              className="flex items-center gap-1.5 mt-1.5 text-[11.5px] font-semibold text-blue-500 hover:text-blue-700 hover:underline cursor-pointer border-0 bg-transparent p-0 transition-colors">
              <CornerDownRight size={11} />
              {replyCount} {replyCount === 1 ? "reply" : "replies"}
            </button>
          )}

          {showDeleteConfirm && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mt-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
              <span className="text-[11.5px] text-red-600 font-semibold flex-1">Delete this message?</span>
              <button
                onClick={() => handleDeleteMessage(m.id, isThread)}
                disabled={isDeleting}
                className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-[11px] font-bold cursor-pointer border-0 flex items-center gap-1 disabled:opacity-60">
                {isDeleting ? <Loader2 size={10} className="animate-spin" /> : null}
                Delete
              </button>
              <button onClick={() => setDeleteConfirmId(null)}
                className="px-2.5 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg text-[11px] font-bold cursor-pointer">
                Cancel
              </button>
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {isHovered && !showDeleteConfirm && (
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.1 }}
              className="absolute right-3 -top-4 flex items-center gap-0.5 bg-white border border-gray-200 rounded-xl shadow-lg px-1.5 py-1 z-10">
              {QUICK_EMOJIS.slice(0, 5).map((emoji) => (
                <button key={emoji} onClick={() => toggleReaction(m.id, emoji)}
                  className="text-base w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg cursor-pointer border-0 bg-transparent hover:scale-110 transition-all">
                  {emoji}
                </button>
              ))}
              <div className="w-px h-4 bg-gray-200 mx-0.5" />
              {!isThread && (
                <button onClick={() => setActiveThreadId(m.id)}
                  title="Reply in thread"
                  className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg cursor-pointer border-0 bg-transparent text-gray-400 hover:text-gray-700 transition-colors">
                  <MessageCircle size={13} />
                </button>
              )}
              <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg cursor-pointer border-0 bg-transparent text-gray-400">
                <Smile size={13} />
              </button>
              {canDelete && (
                <>
                  <div className="w-px h-4 bg-gray-200 mx-0.5" />
                  <button
                    onClick={() => setDeleteConfirmId(m.id)}
                    title="Delete message"
                    className="w-7 h-7 flex items-center justify-center hover:bg-red-50 rounded-lg cursor-pointer border-0 bg-transparent text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const buildMessageGroups = () => {
    const out: React.ReactNode[] = [];
    let lastDate = "";
    messages.forEach((m, i) => {
      const dateLabel = formatDate(m.created_at);
      if (dateLabel !== lastDate) { out.push(<DateDivider key={`d-${m.id}`} label={dateLabel} />); lastDate = dateLabel; }
      const prev = messages[i - 1];
      const sameSender = prev?.user_id === m.user_id && formatDate(prev.created_at) === dateLabel
        && (new Date(m.created_at).getTime() - new Date(prev.created_at).getTime()) < 5 * 60 * 1000;
      const isSelf = m.user_id === currentUser?.id;
      out.push(buildMessageRow(m, isSelf, sameSender, false));
    });
    return out;
  };

  const closeModal = () => {
    setShowNewChannel(false); setShowNewTask(false); setShowNewResource(false);
    setNewTaskTitle(""); setNewTaskAssigneeId(null); setNewTaskDueDate(""); setNewTaskPriority("medium"); setNewTaskStatus("todo"); setNewTaskAssigneeOpen(false);
    if (!inviteSent) { setShowInvite(false); setInviteEmail(""); setInviteRole("member"); setInviteError(""); }
  };

  const modalOpen = showNewChannel || showNewTask || showInvite || showNewResource;

  const MentionDropdown = ({ isThread }: { isThread: boolean }) => {
    if (mentionQuery === null || mentionSuggestions.length === 0 || isThreadMention !== isThread) return null;
    return (
      <motion.div
        ref={mentionDropdownRef}
        initial={{ opacity: 0, y: 6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.97 }}
        transition={{ duration: 0.12 }}
        className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-30"
      >
        <div className="px-3 py-2 border-b border-gray-50 flex items-center gap-1.5">
          <AtSign size={11} className="text-blue-400" />
          <span className="text-[10.5px] font-black uppercase tracking-wider text-gray-400">Mention someone</span>
        </div>
        {mentionSuggestions.map((member, idx) => (
          <button
            key={member.id}
            onMouseDown={(e) => { e.preventDefault(); insertMention(member); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 cursor-pointer border-0 bg-transparent text-left transition-colors"
            style={{ background: idx === mentionIndex ? "#EFF6FF" : "transparent" }}
          >
            <GlobalAvatar url={member.avatar_url} name={member.full_name} email={member.email} size={26} fallbackColor={colorFromString(member.id)} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-gray-800 truncate" style={{ fontFamily: "'Sora',sans-serif" }}>
                {member.full_name ?? member.email}
              </p>
              <p className="text-[10.5px] text-gray-400 truncate">{member.email}</p>
            </div>
            {idx === mentionIndex && (
              <span className="text-[9px] text-blue-400 font-bold border border-blue-200 bg-blue-50 px-1.5 py-0.5 rounded-md flex-shrink-0">Enter</span>
            )}
          </button>
        ))}
      </motion.div>
    );
  };

  return (
    <div
      className="flex h-full overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-white"
      style={{ maxHeight: "calc(100vh - 40px)", fontFamily: "'Sora', sans-serif" }}
      onClick={() => { if (deleteConfirmId) setDeleteConfirmId(null); }}
    >
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      <div className={`flex-shrink-0 flex flex-col bg-[#F9F9F7] border-r border-gray-100 overflow-hidden transition-all duration-300
        fixed inset-y-0 left-0 z-40 lg:static lg:z-auto lg:translate-x-0
        ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}`}
        style={{ width: 210 }}>

        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: project?.color ? `linear-gradient(135deg,${project.color},#2EB67D)` : "linear-gradient(135deg,#36C5F0,#2EB67D)" }}>
              <span className="text-white font-extrabold text-sm">{project?.name?.[0] ?? "P"}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-black text-gray-900 truncate leading-tight">{project?.name ?? "Project"}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${project?.progress ?? 0}%`, background: project?.color ?? "#36C5F0" }} />
                </div>
                <span className="text-[9px] text-gray-400 font-bold flex-shrink-0">{project?.progress ?? 0}%</span>
              </div>
            </div>
            <button className="lg:hidden border-0 bg-transparent cursor-pointer p-1 text-gray-400" onClick={() => setSidebarOpen(false)}>
              <X size={14} />
            </button>
          </div>
        </div>

        <nav className="px-2 pt-2.5 pb-1 flex-shrink-0 space-y-0.5">
          {TABS.map((item) => (
            <motion.button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false); }}
              whileHover={{ x: 1.5 }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border-0 cursor-pointer transition-all text-left"
              style={{
                background: tab === item.id ? "#fff" : "transparent",
                color: tab === item.id ? "#111827" : "#9CA3AF",
                boxShadow: tab === item.id ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                fontFamily: "'Sora',sans-serif",
              }}>
              {item.icon}
              <span className="text-[12.5px] font-semibold">{item.label}</span>
            </motion.button>
          ))}
        </nav>

        <AnimatePresence>
          {tab === "chat" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
              className="px-2 mt-2 overflow-hidden flex-shrink-0">
              <div className="flex items-center justify-between px-2.5 mb-1">
                <span className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-300">Channels</span>
                <button onClick={() => setShowNewChannel(true)}
                  className="cursor-pointer text-gray-300 hover:text-gray-600 border-0 bg-transparent p-0.5 transition-colors">
                  <Plus size={12} />
                </button>
              </div>
              <div className="space-y-0.5">
                {channels.map((ch) => (
                  <button key={ch.id} onClick={() => { setActiveChannel(ch); setSidebarOpen(false); setActiveThreadId(null); }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border-0 cursor-pointer transition-all text-left"
                    style={{
                      background: activeChannel?.id === ch.id ? "#fff" : "transparent",
                      color: activeChannel?.id === ch.id ? "#111827" : "#9CA3AF",
                      boxShadow: activeChannel?.id === ch.id ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
                      fontFamily: "'Sora',sans-serif",
                    }}>
                    <Hash size={11} className="text-gray-300 flex-shrink-0" />
                    <span className="text-[12px] font-semibold flex-1 text-left truncate">{ch.name}</span>
                  </button>
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
            {onlineUsers.length === 0
              ? <p className="text-[10px] text-gray-300">No one online</p>
              : onlineUsers.slice(0, 8).map((u) => (
                <div key={u.id} title={u.full_name ?? "User"} className="relative">
                  <GlobalAvatar url={u.avatar_url} name={u.full_name} email={u.email} size={22} fallbackColor={colorFromString(u.id)} />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white bg-emerald-400" />
                </div>
              ))
            }
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <div className="flex-shrink-0 px-3 sm:px-5 flex items-center justify-between border-b border-gray-100 bg-white" style={{ height: 52 }}>
          <div className="flex items-center gap-2">
            <button className="lg:hidden border-0 bg-transparent cursor-pointer p-1 -ml-1 text-gray-500" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} />
            </button>
            {tab === "chat" && <Hash size={14} className="text-gray-300 flex-shrink-0" />}
            <h2 className="text-[14px] font-black text-gray-900 capitalize truncate">
              {tab === "chat" ? (activeChannel?.name ?? "chat") : tab}
            </h2>
            {tab === "chat" && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${isConnected ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"}`}>
                {isConnected ? "● live" : "○ …"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {tab === "tasks" && (
              <button onClick={() => setShowNewTask(true)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-white cursor-pointer flex items-center gap-1 border-0"
                style={{ background: "#0D0D0D", fontFamily: "'Sora',sans-serif" }}>
                <Plus size={13} /><span className="hidden sm:inline">New task</span>
              </button>
            )}
            {tab === "team" && (
              <button onClick={() => { setShowInvite(true); setInviteError(""); setInviteSent(false); }}
                className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-white cursor-pointer flex items-center gap-1 border-0"
                style={{ background: "#0D0D0D", fontFamily: "'Sora',sans-serif" }}>
                <Mail size={13} /><span className="hidden sm:inline">Invite</span>
              </button>
            )}
            {tab === "resources" && (
              <button onClick={() => setShowNewResource(true)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-white cursor-pointer flex items-center gap-1 border-0"
                style={{ background: "#0D0D0D", fontFamily: "'Sora',sans-serif" }}>
                <Plus size={13} /><span className="hidden sm:inline">Add</span>
              </button>
            )}
            <div className="flex -space-x-1.5">
              {team.slice(0, 3).map((m, i) => {
                const p = m.profiles; if (!p) return null;
                return (
                  <div key={i} className="ring-2 ring-white rounded-full">
                    <GlobalAvatar url={p.avatar_url} name={p.full_name} email={p.email} size={24} fallbackColor={colorFromString(p.id)} />
                  </div>
                );
              })}
            </div>
            <span className="text-[11px] text-gray-400 hidden sm:block">{team.length}</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab + (activeChannel?.id ?? "")}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex-1 overflow-y-auto min-h-0">

            {tab === "chat" && (
              <div className="pb-2">
                {messagesLoading && (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 size={22} className="text-gray-300 animate-spin" />
                  </div>
                )}
                {!messagesLoading && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-52 px-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                      <Hash size={24} className="text-gray-300" />
                    </div>
                    <p className="text-[15px] font-bold text-gray-700 mb-1">
                      Welcome to #{activeChannel?.name ?? "general"}
                    </p>
                    <p className="text-[13px] text-gray-400">
                      This is the start of the channel. Say hello! 👋
                    </p>
                  </div>
                )}
                {buildMessageGroups()}
                <div ref={endRef} className="h-3" />
              </div>
            )}

            {tab === "tasks" && (
              <div className="p-6 h-full flex flex-col">
                <TaskBoard
                  tasks={tasks.map(t => ({
                    ...t,
                    project: t.projects?.name || project?.name || "Project",
                    project_id: projectId,
                    projectColor: t.projects?.color || project?.color || "#36C5F0",
                    assignee: t.assignee?.full_name || "Unassigned",
                    assignee_id: t.assignee_id,
                    assigneeColor: colorFromString(t.assignee_id || "unassigned"),
                    avatar_url: t.assignee?.avatar_url,
                    email: t.assignee?.email,
                    role: team.find(m => m.profiles?.id === t.assignee_id)?.role || "Member",
                    tags: [],
                    status: t.status as TaskStatus,
                    priority: (t as Task & { priority?: string }).priority || "medium",
                    stalled: t.status !== 'done' && (Math.floor((new Date().getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24))) >= 3,
                    dueDate: t.due_date
                  })) as BoardTask[]}
                  projects={project ? [project] : []}
                  members={team}
                  projectId={projectId}
                  onRefresh={async () => {
                    const { data: ts } = await supabase.from("tasks").select("*,assignee:profiles!tasks_assignee_id_fkey(id,full_name,avatar_url,email),projects!tasks_project_id_fkey(id,name,color)").eq("project_id", projectId).order("created_at");
                    if (ts) setTasks(ts as Task[]);
                  }}
                />
              </div>
            )}

            {tab === "team" && (
              <div className="p-4 sm:p-5">
                {onlineUsers.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 mb-2.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />Online now · {onlineUsers.length}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {onlineUsers.map((u) => (
                        <div key={u.id} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
                          <div className="relative">
                            <GlobalAvatar url={u.avatar_url} name={u.full_name} email={u.email} size={20} fallbackColor={colorFromString(u.id)} />
                            <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white bg-emerald-400" />
                          </div>
                          <span className="text-[12px] font-semibold text-emerald-700">{u.full_name ?? "User"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 mb-3">All members · {team.length}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {team.map((m, i) => {
                    const p = m.profiles; if (!p) return null;
                    const isOnline = onlineUsers.some((u) => u.id === p.id);
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                        <div className="relative">
                          <GlobalAvatar url={p.avatar_url} name={p.full_name} email={p.email} role={m.role} size={38} fallbackColor={colorFromString(p.id)} />
                          {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-400" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-gray-900 truncate">{p.full_name ?? "Unknown"}</p>
                          <p className="text-[11px] text-gray-400 truncate">{p.email}</p>
                          <span className="text-[10px] font-semibold capitalize" style={{ color: "#36C5F0" }}>{m.role}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                  {team.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-gray-300">
                      <Users size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="text-[13px] font-semibold">No team members yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === "resources" && (
              <div className="p-4 sm:p-5">
                {Object.keys(groupedResources).length === 0 && (
                  <div className="text-center py-12 text-gray-300">
                    <FolderOpen size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-[13px] font-semibold">No resources yet.</p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(groupedResources).map(([cat, items], ci) => (
                    <motion.div key={cat} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.06 }}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-200 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-base">{items[0]?.emoji ? items[0].emoji : <Book />}</span>
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white bg-gray-500">{cat}</span>
                      </div>
                      {items.map((item, ii) => (
                        <div key={ii} className="flex items-center justify-between group py-2 border-b border-gray-50 last:border-0">
                          {item.url ? (
                            <a href={item.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-700 hover:text-gray-900 no-underline flex-1 min-w-0">
                              <LinkIcon size={11} className="text-gray-400 flex-shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </a>
                          ) : (
                            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-700 flex-1 min-w-0">
                              <FileText size={11} className="text-gray-400 flex-shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </span>
                          )}
                          <button onClick={() => handleDeleteResource(item.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-gray-300 hover:text-red-400 ml-2 border-0 bg-transparent flex-shrink-0">
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {tab === "settings" && (
              <div className="p-4 sm:p-5 max-w-2xl">
                <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white">
                      <Github size={20} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-black text-gray-900">GitHub Integration</h3>
                      <p className="text-[12px] text-gray-400">Connect a repository to track activity and automate nudges.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        value={repoInput}
                        onChange={(e) => setRepoInput(e.target.value)}
                        placeholder="org/repo (e.g. google/nudge)"
                        className="flex-1 px-4 py-2.5 bg-[#F9F9F7] border border-gray-100 rounded-xl text-[13.5px] font-medium outline-none focus:border-gray-300 transition-all"
                      />
                      <button
                        onClick={handleConnectRepo}
                        disabled={intLoading || !repoInput.trim()}
                        className="px-6 py-2.5 bg-[#0D0D0D] text-white rounded-xl text-[13px] font-bold disabled:opacity-50 cursor-pointer border-0"
                      >
                        {intLoading ? <Loader2 size={14} className="animate-spin" /> : "Connect"}
                      </button>
                    </div>
                    <div className="pt-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Active Connections</p>
                      {integrations.filter(i => i.provider === 'github').length === 0 ? (
                        <p className="text-[12px] text-gray-300 italic">No repositories connected yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {integrations.filter(i => i.provider === 'github').map((intg) => (
                            <div key={intg.id} className="flex items-center justify-between p-3 bg-[#F9F9F7] rounded-xl border border-gray-100 group">
                              <div className="flex items-center gap-3">
                                <Github size={14} className="text-gray-400" />
                                <span className="text-[13px] font-semibold text-gray-700">{intg.repo_full_name}</span>
                              </div>
                              <button
                                onClick={() => handleDeleteIntegration(intg.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer border-0 bg-transparent"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-amber-900 mb-1">Webhook Configuration</h4>
                    <p className="text-[12px] text-amber-800 leading-relaxed mb-3">
                      To receive updates, add this URL as a webhook in your GitHub repository settings:
                    </p>
                    <code className="block p-3 bg-white/50 border border-amber-200 rounded-xl text-[11px] font-mono text-amber-900 break-all">
                      {typeof window !== 'undefined' ? window.location.origin.replace('3000', '8000') : ""}/webhooks/github
                    </code>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {tab === "chat" && (
          <div className="flex-shrink-0 px-3 sm:px-4 pb-4 pt-2">
            <div className="relative border border-gray-200 rounded-2xl overflow-visible focus-within:border-gray-300 focus-within:shadow-md transition-all bg-white"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

              <AnimatePresence>
                <MentionDropdown isThread={false} />
              </AnimatePresence>

              <AnimatePresence>
                {pendingFiles.length > 0 && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="flex gap-2 flex-wrap px-3 pt-3 overflow-hidden">
                    {pendingFiles.map((f, i) => {
                      const isImg = f.file.type.startsWith("image/");
                      return (
                        <motion.div key={i} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                          className="relative flex-shrink-0 rounded-xl overflow-hidden border border-gray-200"
                          style={{ width: isImg ? 76 : 140, height: isImg ? 76 : 64 }}>
                          {isImg
                            ? <img src={f.preview} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-1 p-2">
                              <FileText size={18} className="text-gray-400" />
                              <span className="text-[9px] text-gray-500 font-semibold text-center truncate w-full">{f.file.name}</span>
                              <span className="text-[9px] text-gray-400">{formatBytes(f.file.size)}</span>
                            </div>
                          }
                          <button onClick={() => setPendingFiles((p) => p.filter((_, j) => j !== i))}
                            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center cursor-pointer border-0">
                            <X size={8} color="white" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-0.5 px-3 pt-2.5 pb-1">
                {([["**", "bold", <Bold size={11} />], ["_", "italic", <Italic size={11} />], ["`", "code", <Code size={11} />]] as [string, string, React.ReactNode][]).map(([wrap, label, icon]) => (
                  <button key={label} onClick={() => insertFormat(wrap, textareaRef, setInput)} title={label}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer border-0 bg-transparent transition-colors">
                    {icon}
                  </button>
                ))}
                <div className="w-px h-3.5 bg-gray-200 mx-1" />
                <button
                  onClick={() => {
                    const ta = textareaRef.current;
                    if (!ta) return;
                    const pos = ta.selectionEnd;
                    const newVal = input.slice(0, pos) + "@" + input.slice(pos);
                    setInput(newVal);
                    setTimeout(() => {
                      ta.focus();
                      ta.setSelectionRange(pos + 1, pos + 1);
                      handleMentionInput(newVal, pos + 1, false);
                    }, 0);
                  }}
                  title="Mention someone"
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer border-0 bg-transparent transition-colors">
                  <AtSign size={11} />
                </button>
                <div className="w-px h-3.5 bg-gray-200 mx-1" />
                <div className="relative">
                  <button onClick={() => setEmojiPickerOpen((v) => !v)}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer border-0 bg-transparent transition-colors">
                    <Smile size={11} />
                  </button>
                  <AnimatePresence>
                    {emojiPickerOpen && (
                      <motion.div initial={{ opacity: 0, scale: 0.9, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.12 }}
                        className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-2xl shadow-xl p-2.5 z-20">
                        <div className="grid grid-cols-6 gap-0.5">
                          {QUICK_EMOJIS.map((e) => (
                            <button key={e} onClick={() => { setInput((v) => v + e); setEmojiPickerOpen(false); textareaRef.current?.focus(); }}
                              className="text-lg w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg cursor-pointer border-0 bg-transparent hover:scale-110 transition-all">
                              {e}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <textarea ref={textareaRef} value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  resizeTextarea(textareaRef);
                  handleMentionInput(e.target.value, e.target.selectionEnd, false);
                }}
                onKeyDown={(e) => handleTextareaKeyDown(e, false)}
                onPaste={handlePaste}
                placeholder={`Message #${activeChannel?.name ?? "general"} — type @ to mention`}
                rows={1}
                className="w-full px-3 py-2 bg-transparent border-none outline-none text-[13.5px] font-medium text-gray-800 placeholder-gray-300 resize-none"
                style={{ fontFamily: "'Sora',sans-serif", minHeight: 40, maxHeight: 160 }} />

              <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
                <div className="flex items-center gap-0.5">
                  <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.zip,.pptx" />
                  <button onClick={() => fileInputRef.current?.click()} title="Attach file"
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer border-0 bg-transparent transition-colors">
                    <Paperclip size={14} />
                  </button>
                  <button title="Upload image"
                    onClick={() => {
                      if (!fileInputRef.current) return;
                      fileInputRef.current.accept = "image/*";
                      fileInputRef.current.click();
                      setTimeout(() => { if (fileInputRef.current) fileInputRef.current.accept = "image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.zip,.pptx"; }, 200);
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer border-0 bg-transparent transition-colors">
                    <ImageIcon size={14} />
                  </button>
                  <span className="text-[10px] text-gray-300 ml-1.5 hidden sm:block select-none">@ to mention · Ctrl+V to paste</span>
                </div>
                <motion.button onClick={handleSend} whileTap={{ scale: 0.94 }}
                  disabled={uploading || (!input.trim() && pendingFiles.length === 0)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-black cursor-pointer border-0 transition-all disabled:cursor-not-allowed"
                  style={{
                    background: (input.trim() || pendingFiles.length > 0) && !uploading ? "#0D0D0D" : "#F3F4F6",
                    color: (input.trim() || pendingFiles.length > 0) && !uploading ? "#fff" : "#9CA3AF",
                    fontFamily: "'Sora',sans-serif",
                  }}>
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  <span className="hidden sm:inline">{uploading ? "Uploading…" : "Send"}</span>
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeThreadId && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex-shrink-0 flex flex-col border-l border-gray-100 bg-white overflow-hidden"
            style={{ minWidth: 0 }}
          >
            <div className="flex-shrink-0 flex items-center justify-between px-4 border-b border-gray-100" style={{ height: 52 }}>
              <div className="flex items-center gap-2">
                <MessageCircle size={14} className="text-gray-400" />
                <span className="text-[13px] font-black text-gray-900">Thread</span>
              </div>
              <button onClick={() => setActiveThreadId(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer border-0 bg-transparent transition-colors">
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {activeThreadMsg && (
                <div className="px-3 pt-4 pb-3 border-b border-gray-100">
                  <div className="flex gap-3 items-start">
                    <GlobalAvatar
                      url={activeThreadMsg.profiles?.avatar_url}
                      name={activeThreadMsg.profiles?.full_name ?? "Unknown"}
                      size={32}
                      fallbackColor={colorFromString(activeThreadMsg.user_id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-[13px] font-black text-gray-900">
                          {activeThreadMsg.user_id === currentUser?.id ? "You" : (activeThreadMsg.profiles?.full_name ?? "Unknown")}
                        </span>
                        <span className="text-[11px] text-gray-400">{formatTime(activeThreadMsg.created_at)}</span>
                      </div>
                      {(() => {
                        const parsed = parseContent(activeThreadMsg.content);
                        return parsed.text ? (
                          <p className="text-[13.5px] leading-[1.6] text-gray-800 break-words"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(parsed.text) }} />
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-[10.5px] font-semibold text-gray-400 flex-shrink-0">
                      {(replyCounts[activeThreadId] ?? 0)} {(replyCounts[activeThreadId] ?? 0) === 1 ? "reply" : "replies"}
                    </span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                </div>
              )}

              <div className="pb-2">
                {threadLoading && (
                  <div className="flex items-center justify-center h-20">
                    <Loader2 size={18} className="text-gray-300 animate-spin" />
                  </div>
                )}
                {!threadLoading && threadMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <CornerDownRight size={20} className="text-gray-200 mb-2" />
                    <p className="text-[12px] text-gray-300 font-semibold">No replies yet.</p>
                    <p className="text-[11px] text-gray-200">Start the thread below.</p>
                  </div>
                )}
                {threadMessages.map((m, i) => {
                  const prev = threadMessages[i - 1];
                  const sameSender = prev?.user_id === m.user_id
                    && (new Date(m.created_at).getTime() - new Date(prev.created_at).getTime()) < 5 * 60 * 1000;
                  const isSelf = m.user_id === currentUser?.id;
                  return buildMessageRow(m, isSelf, sameSender, true);
                })}
                <div ref={threadEndRef} className="h-3" />
              </div>
            </div>

            <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-gray-100">
              <div className="relative border border-gray-200 rounded-xl overflow-visible focus-within:border-gray-300 focus-within:shadow-sm transition-all bg-white">

                <AnimatePresence>
                  <MentionDropdown isThread={true} />
                </AnimatePresence>

                <div className="flex items-center gap-0.5 px-2.5 pt-2 pb-0.5">
                  {([["**", "bold", <Bold size={10} />], ["_", "italic", <Italic size={10} />], ["`", "code", <Code size={10} />]] as [string, string, React.ReactNode][]).map(([wrap, label, icon]) => (
                    <button key={label} onClick={() => insertFormat(wrap, threadTextareaRef, setThreadInput)} title={label}
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer border-0 bg-transparent transition-colors">
                      {icon}
                    </button>
                  ))}
                  <div className="w-px h-3 bg-gray-200 mx-1" />
                  <button
                    onClick={() => {
                      const ta = threadTextareaRef.current;
                      if (!ta) return;
                      const pos = ta.selectionEnd;
                      const newVal = threadInput.slice(0, pos) + "@" + threadInput.slice(pos);
                      setThreadInput(newVal);
                      setTimeout(() => {
                        ta.focus();
                        ta.setSelectionRange(pos + 1, pos + 1);
                        handleMentionInput(newVal, pos + 1, true);
                      }, 0);
                    }}
                    title="Mention someone"
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 cursor-pointer border-0 bg-transparent transition-colors">
                    <AtSign size={10} />
                  </button>
                  <div className="w-px h-3 bg-gray-200 mx-1" />
                  <div className="relative">
                    <button onClick={() => setThreadEmojiOpen(v => !v)}
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 cursor-pointer border-0 bg-transparent transition-colors">
                      <Smile size={10} />
                    </button>
                    <AnimatePresence>
                      {threadEmojiOpen && (
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.1 }}
                          className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 z-20">
                          <div className="grid grid-cols-6 gap-0.5">
                            {QUICK_EMOJIS.map((e) => (
                              <button key={e} onClick={() => { setThreadInput(v => v + e); setThreadEmojiOpen(false); threadTextareaRef.current?.focus(); }}
                                className="text-base w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg cursor-pointer border-0 bg-transparent transition-all">
                                {e}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <textarea ref={threadTextareaRef} value={threadInput}
                  onChange={(e) => {
                    setThreadInput(e.target.value);
                    resizeTextarea(threadTextareaRef);
                    handleMentionInput(e.target.value, e.target.selectionEnd, true);
                  }}
                  onKeyDown={(e) => handleTextareaKeyDown(e, true)}
                  placeholder="Reply in thread… (@ to mention)"
                  rows={1}
                  className="w-full px-3 py-2 bg-transparent border-none outline-none text-[13px] font-medium text-gray-800 placeholder-gray-300 resize-none"
                  style={{ fontFamily: "'Sora',sans-serif", minHeight: 36, maxHeight: 120 }} />

                <div className="flex justify-end px-2.5 pb-2">
                  <motion.button onClick={handleThreadSend} whileTap={{ scale: 0.94 }}
                    disabled={threadUploading || !threadInput.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-black cursor-pointer border-0 transition-all disabled:cursor-not-allowed"
                    style={{
                      background: threadInput.trim() && !threadUploading ? "#0D0D0D" : "#F3F4F6",
                      color: threadInput.trim() && !threadUploading ? "#fff" : "#9CA3AF",
                      fontFamily: "'Sora',sans-serif",
                    }}>
                    {threadUploading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    Reply
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={closeModal}>
            <motion.div initial={{ scale: 0.93, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-2xl p-6 w-full max-w-[380px] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              style={{ fontFamily: "'Sora',sans-serif" }}>

              {showNewChannel && <>
                <h3 className="text-[18px] font-black text-gray-900 mb-1">New Channel</h3>
                <p className="text-[12.5px] text-gray-400 mb-5">Create a channel for your project.</p>
                <input value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateChannel()}
                  placeholder="e.g. frontend, design, general" autoFocus
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none mb-4 placeholder-gray-300"
                  style={{ fontFamily: "'Sora',sans-serif" }} />
                <div className="flex gap-2.5">
                  <button onClick={closeModal} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-[13px] font-bold cursor-pointer border-0">Cancel</button>
                  <button onClick={handleCreateChannel} disabled={actionLoading}
                    className="flex-1 py-3 bg-[#0D0D0D] text-white rounded-xl text-[13px] font-bold cursor-pointer border-0 disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    {actionLoading ? "Creating…" : "Create"}
                  </button>
                </div>
              </>}

              {showNewTask && (() => {
                const selectedMember = team.find((m) => m.profiles?.id === newTaskAssigneeId);
                return (
                  <>
                    <h3 className="text-[18px] font-black text-gray-900 mb-1">New Task</h3>
                    <p className="text-[12.5px] text-gray-400 mb-5">Add a task to this project.</p>
                    <div className="flex flex-col gap-3 mb-4">
                      <input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !newTaskAssigneeOpen && handleCreateTask()}
                        placeholder="Task title…" autoFocus
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none placeholder-gray-300"
                        style={{ fontFamily: "'Sora',sans-serif" }} />
                      <div className="relative">
                        <button
                          onClick={() => setNewTaskAssigneeOpen((v) => !v)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[13px] font-medium text-left flex items-center gap-2.5 cursor-pointer bg-white"
                          style={{ fontFamily: "'Sora',sans-serif" }}
                        >
                          {selectedMember ? (
                            <>
                              <GlobalAvatar url={selectedMember.profiles?.avatar_url} name={selectedMember.profiles?.full_name || selectedMember.profiles?.email} size={24} fallbackColor={colorFromString(selectedMember.profiles?.id ?? "")} />
                              <span className="text-gray-900 flex-1 truncate">{selectedMember.profiles?.full_name ?? selectedMember.profiles?.email}</span>
                              <button onClick={(e) => { e.stopPropagation(); setNewTaskAssigneeId(null); }} className="text-gray-300 hover:text-gray-500 border-0 bg-transparent cursor-pointer p-0"><X size={13} /></button>
                            </>
                          ) : (
                            <>
                              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                  <circle cx="12" cy="8" r="4" stroke="#9CA3AF" strokeWidth="1.8" />
                                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                              </div>
                              <span className="text-gray-400 flex-1">Assign to…</span>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-gray-300">
                                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              </svg>
                            </>
                          )}
                        </button>
                        <AnimatePresence>
                          {newTaskAssigneeOpen && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setNewTaskAssigneeOpen(false)} />
                              <motion.div initial={{ opacity: 0, y: 4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 2, scale: 0.97 }} transition={{ duration: 0.15 }}
                                className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                                <div className="py-1 max-h-[200px] overflow-y-auto">
                                  <button onClick={() => { setNewTaskAssigneeId(null); setNewTaskAssigneeOpen(false); }}
                                    className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-gray-50 cursor-pointer border-0 bg-transparent text-left">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"><X size={10} className="text-gray-400" /></div>
                                    <span className="text-[13px] text-gray-400" style={{ fontFamily: "'Sora',sans-serif" }}>Unassigned</span>
                                  </button>
                                  {team.map((member) => {
                                    const p = member.profiles; if (!p) return null;
                                    const isSelected = newTaskAssigneeId === p.id;
                                    return (
                                      <button key={p.id} onClick={() => { setNewTaskAssigneeId(p.id); setNewTaskAssigneeOpen(false); }}
                                        className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-gray-50 cursor-pointer border-0 bg-transparent text-left transition-colors"
                                        style={{ background: isSelected ? "#F0FDF4" : undefined }}>
                                        <GlobalAvatar url={p.avatar_url} name={p.full_name || p.email} size={24} fallbackColor={colorFromString(p.id)} />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[13px] font-semibold text-gray-800 truncate" style={{ fontFamily: "'Sora',sans-serif" }}>{p.full_name ?? "Unknown"}</p>
                                          <p className="text-[11px] text-gray-400 truncate" style={{ fontFamily: "'Sora',sans-serif" }}>{p.email}</p>
                                        </div>
                                        {isSelected && <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 block">Priority</label>
                          <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px] font-medium outline-none bg-white">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 block">Status</label>
                          <select value={newTaskStatus} onChange={(e) => setNewTaskStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px] font-medium outline-none bg-white">
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 block">Due Date</label>
                          <input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-900 outline-none bg-white"
                            style={{ fontFamily: "'Sora',sans-serif", colorScheme: "light" }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2.5">
                      <button onClick={closeModal} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-[13px] font-bold cursor-pointer border-0">Cancel</button>
                      <button onClick={handleCreateTask} disabled={actionLoading}
                        className="flex-1 py-3 bg-[#0D0D0D] text-white rounded-xl text-[13px] font-bold cursor-pointer border-0 disabled:opacity-50 flex items-center justify-center gap-1.5">
                        {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                        {actionLoading ? "Creating…" : "Create"}
                      </button>
                    </div>
                  </>
                );
              })()}

              {showInvite && (
                <>
                  {inviteSent ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                      <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={28} className="text-emerald-500" />
                      </div>
                      <h3 className="text-[18px] font-black text-gray-900 mb-1">Invite sent!</h3>
                      <p className="text-[12.5px] text-gray-400 mb-1">An email was sent to</p>
                      <p className="text-[13px] font-bold text-gray-700 mb-5">{inviteEmail}</p>
                      <p className="text-[11.5px] text-gray-400 mb-6">They&apos;ll get a link to accept the invitation. If they don&apos;t have an account yet, they&apos;ll be prompted to sign up first.</p>
                      <div className="flex gap-2.5">
                        <button onClick={() => { setInviteSent(false); setInviteEmail(""); setInviteRole("member"); }}
                          className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-[13px] font-bold cursor-pointer border-0">Invite another</button>
                        <button onClick={handleCloseInvite} className="flex-1 py-3 bg-[#0D0D0D] text-white rounded-xl text-[13px] font-bold cursor-pointer border-0">Done</button>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Mail size={14} className="text-blue-500" />
                        </div>
                        <h3 className="text-[18px] font-black text-gray-900">Invite to Project</h3>
                      </div>
                      <p className="text-[12.5px] text-gray-400 mb-5">Works for anyone — existing users get a notification, new users receive a sign-up link.</p>
                      <input value={inviteEmail} onChange={(e) => { setInviteEmail(e.target.value); setInviteError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                        placeholder="colleague@company.com" type="email" autoFocus
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none mb-3 placeholder-gray-300"
                        style={{ fontFamily: "'Sora',sans-serif" }} />
                      <div className="mb-3">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 block">Role</label>
                        <div className="flex gap-2">
                          {(["member", "admin", "viewer"] as const).map((r) => (
                            <button key={r} onClick={() => setInviteRole(r)}
                              className="flex-1 py-2 rounded-xl text-[11.5px] font-bold border cursor-pointer transition-all capitalize"
                              style={{ background: inviteRole === r ? "#0D0D0D" : "#F9F9F7", color: inviteRole === r ? "#fff" : "#6B7280", borderColor: inviteRole === r ? "#0D0D0D" : "#E5E7EB", fontFamily: "'Sora',sans-serif" }}>
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                      {inviteError && (
                        <p className="text-[12px] text-red-500 font-semibold mb-3 flex items-center gap-1">
                          <AlertCircle size={11} />{inviteError}
                        </p>
                      )}
                      <div className="flex gap-2.5 mt-1">
                        <button onClick={handleCloseInvite} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-[13px] font-bold cursor-pointer border-0">Cancel</button>
                        <button onClick={handleInvite} disabled={actionLoading || !inviteEmail.trim()}
                          className="flex-1 py-3 bg-[#0D0D0D] text-white rounded-xl text-[13px] font-bold cursor-pointer border-0 disabled:opacity-50 flex items-center justify-center gap-1.5">
                          {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                          {actionLoading ? "Sending…" : "Send Invite"}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}

              {showNewResource && <>
                <h3 className="text-[18px] font-black text-gray-900 mb-1">Add Resource</h3>
                <p className="text-[12.5px] text-gray-400 mb-5">Link or document for this project.</p>
                <div className="flex flex-col gap-3 mb-4">
                  <input value={newResourceLabel} onChange={(e) => setNewResourceLabel(e.target.value)}
                    placeholder="Label (e.g. Figma File)" autoFocus
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none placeholder-gray-300"
                    style={{ fontFamily: "'Sora',sans-serif" }} />
                  <input value={newResourceUrl} onChange={(e) => setNewResourceUrl(e.target.value)}
                    placeholder="URL (optional)"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none placeholder-gray-300"
                    style={{ fontFamily: "'Sora',sans-serif" }} />
                  <select value={newResourceCategory} onChange={(e) => setNewResourceCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none"
                    style={{ fontFamily: "'Sora',sans-serif" }}>
                    {["Documentation", "Credentials", "Deployment", "Testing", "Design", "Other"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex gap-2.5">
                  <button onClick={closeModal} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-[13px] font-bold cursor-pointer border-0">Cancel</button>
                  <button onClick={handleAddResource} disabled={actionLoading}
                    className="flex-1 py-3 bg-[#0D0D0D] text-white rounded-xl text-[13px] font-bold cursor-pointer border-0 disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    {actionLoading ? "Adding…" : "Add"}
                  </button>
                </div>
              </>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}