"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createChannel } from "@/lib/channels";
import { createTask, updateTask, deleteTask } from "@/lib/tasks";
import { addResource, deleteResource } from "@/lib/resources";
import { inviteProjectMember, getProjectMembers } from "@/lib/project-members";
import { getProjectIntegrations, upsertGitHubIntegration, deleteIntegration, Integration } from "@/lib/integrations";
import { useParams } from "next/navigation";
import { Hash, Menu, Mail, Plus, Video, Loader2, X, Camera } from "lucide-react";
import { useProjectsStore } from "@/store/projects-store";

import { Task as BoardTask } from "@/components/workspace/TaskBoard";
import GlobalAvatar from "@/components/global/Avatar";
import ProjectSidebar from "@/components/space/project/ProjectSidebar";
import ChatTab from "@/components/space/project/ChatTab";
import ChatInputBar from "@/components/space/project/ChatInputBar";
import ThreadPanel from "@/components/space/project/ThreadPanel";
import TasksTab from "@/components/space/project/TasksTab";
import TeamTab from "@/components/space/project/TeamTab";
import ResourcesTab from "@/components/space/project/ResourcesTab";
import SettingsTab from "@/components/space/project/SettingsTab";
import {
  NewChannelModal,
  NewTaskModal,
  InviteModal,
  NewResourceModal,
} from "@/components/space/project/ProjectModals";

import { strColor } from "@/lib/utils/color";
import {
  Tab, Channel, Message, MessageProfile, FileAttachment, Task, TeamMember,
  Resource, Project, OnlineUser, MentionSuggestion, Reaction,
} from "@/types";

export default function SpacePage() {
  const supabase = createClient();
  const endRef = useRef<HTMLDivElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const threadTextareaRef = useRef<HTMLTextAreaElement>(null);
  const updateProjectStore = useProjectsStore((s) => s.updateProject);
  const params = useParams();
  const projectId = params.projectId as string;

  const [tab, setTab] = useState<Tab>("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; full_name: string | null; avatar_url: string | null } | null>(null);

  const [input, setInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});

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
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskStatus, setNewTaskStatus] = useState("todo");
  const [newTaskAssigneeOpen, setNewTaskAssigneeOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");
  const [inviteError, setInviteError] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [newResourceLabel, setNewResourceLabel] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");
  const [newResourceCategory, setNewResourceCategory] = useState("Documentation");
  const [newResourceType, setNewResourceType] = useState<"link" | "file" | "credential">("link");
  const [newResourceCredentialValue, setNewResourceCredentialValue] = useState("");
  const [newResourceFile, setNewResourceFile] = useState<File | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [repoInput, setRepoInput] = useState("");
  const [intLoading, setIntLoading] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      const map: Record<string, Reaction[]> = {};
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
    setHasMore(true);
    const { data, error } = await supabase
      .from("messages")
      .select("id,content,is_ai,created_at,edited_at,user_id,parent_id,profiles!messages_user_id_fkey(id,full_name,avatar_url)")
      .eq("channel_id", channelId)
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) {
      const formatted = (data as (typeof data[0] & { profiles: MessageProfile | MessageProfile[] | null })[]).map((m) => ({
        ...m,
        profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
      })) as Message[];
      // Keep DESC order (newest first) for column-reverse
      setMessages(formatted);
      setHasMore(data.length === 50);
      fetchReactions(formatted.map((m) => m.id));
      fetchReplyCounts(formatted.map((m) => m.id));
    }
    setMessagesLoading(false);
  }, [fetchReactions, fetchReplyCounts]);

  const fetchOlderMessages = useCallback(async () => {
    if (!activeChannel?.id || !hasMore || isLoadingMore || messagesLoading || messages.length === 0) return;
    setIsLoadingMore(true);
    const oldestMessage = messages[messages.length - 1];
    const { data, error } = await supabase
      .from("messages")
      .select("id,content,is_ai,created_at,edited_at,user_id,parent_id,profiles!messages_user_id_fkey(id,full_name,avatar_url)")
      .eq("channel_id", activeChannel.id)
      .is("parent_id", null)
      .lt("created_at", oldestMessage.created_at)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) {
      const formatted = (data as (typeof data[0] & { profiles: MessageProfile | MessageProfile[] | null })[]).map((m) => ({
        ...m,
        profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
      })) as Message[];
      // Append older messages to the END of the array (bottom of DESC list)
      setMessages((prev) => [...prev, ...formatted]);
      setHasMore(data.length === 50);
      fetchReactions(formatted.map((m) => m.id));
      fetchReplyCounts(formatted.map((m) => m.id));
    }
    setIsLoadingMore(false);
  }, [activeChannel?.id, hasMore, isLoadingMore, messagesLoading, messages, fetchReactions, fetchReplyCounts]);

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
      fetchReactions([parentId, ...formatted.map((m) => m.id)]);
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
              // Add to FRONT for column-reverse
              setMessages((prev) => prev.some((m) => m.id === message.id) ? prev : [message, ...prev]);
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
      const msg = messages.find((m) => m.id === activeThreadId);
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
        email: (p[0] as { email?: string })?.email ?? null,
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

  const getMentionMembers = useCallback((): MentionSuggestion[] =>
    team.filter((m) => m.profiles).map((m) => ({
      id: m.profiles!.id,
      full_name: m.profiles!.full_name,
      email: m.profiles!.email,
      avatar_url: m.profiles!.avatar_url,
    })), [team]);

  const handleMentionInput = useCallback((value: string, cursorPos: number, isThread: boolean) => {
    const mentionMatch = value.slice(0, cursorPos).match(/@(\w*)$/);
    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      const start = cursorPos - mentionMatch[0].length;
      setMentionQuery(query);
      setMentionStart(start);
      setMentionIndex(0);
      setIsThreadMention(isThread);
      const members = getMentionMembers();
      setMentionSuggestions(members.filter((m) =>
        m.full_name?.toLowerCase().includes(query) || m.email.toLowerCase().includes(query)
      ).slice(0, 6));
    } else {
      setMentionQuery(null);
      setMentionSuggestions([]);
    }
  }, [getMentionMembers]);

  const insertMention = useCallback((member: MentionSuggestion) => {
    const name = member.full_name?.replace(/\s+/g, "_") ?? member.email.split("@")[0];
    const setter = isThreadMention ? setThreadInput : setInput;
    const ref = isThreadMention ? threadTextareaRef : textareaRef;
    setter((prev) => {
      const before = prev.slice(0, mentionStart);
      const after = prev.slice(ref.current?.selectionEnd ?? prev.length);
      return before + `@${name} ` + after;
    });
    setMentionQuery(null);
    setMentionSuggestions([]);
    setTimeout(() => ref.current?.focus(), 0);
  }, [mentionStart, isThreadMention]);

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, isThread: boolean) => {
    if (mentionSuggestions.length > 0 && mentionQuery !== null) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex((i) => Math.min(i + 1, mentionSuggestions.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setMentionIndex((i) => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); if (mentionSuggestions[mentionIndex]) insertMention(mentionSuggestions[mentionIndex]); return; }
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;

    const toastId = toast.loading("Uploading project avatar...");
    const ext = file.name.split(".").pop();
    const path = `${projectId}/avatar-${Date.now()}.${ext}`;

    try {
      // 1. Upload to bucket
      const { error: uploadError } = await supabase.storage
        .from("project-avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("project-avatars")
        .getPublicUrl(path);

      // 3. Update DB
      const { error: dbError } = await supabase
        .from("projects")
        .update({ avatar_url: publicUrl })
        .eq("id", projectId);

      if (dbError) throw dbError;

      // 4. Update local state
      if (project) setProject({ ...project, avatar_url: publicUrl });
      
      // 5. Update global store
      updateProjectStore(projectId, { avatar_url: publicUrl });
      
      toast.success("Project avatar updated", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update avatar", { id: toastId });
    } finally {
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const uploadFile = async (file: File): Promise<FileAttachment | null> => {
    const ext = file.name.split(".").pop();
    const path = `attachments/${projectId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("nudge-attachments").upload(path, file, { contentType: file.type });
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from("nudge-attachments").getPublicUrl(path);
    return { type: file.type.startsWith("image/") ? "image" : "file", name: file.name, url: publicUrl, size: file.size };
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
    // Add to FRONT for column-reverse
    setMessages((prev) => [optimistic, ...prev]);
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
    const optimistic: Message = {
      id: `opt-thread-${Date.now()}`, content: text, is_ai: false,
      created_at: new Date().toISOString(), edited_at: null, user_id: currentUser.id,
      profiles: { id: currentUser.id, full_name: currentUser.full_name, avatar_url: currentUser.avatar_url },
      parent_id: activeThreadId,
    };
    setThreadMessages((prev) => [...prev, optimistic]);
    setThreadUploading(false);
    const { data, error } = await supabase.from("messages")
      .insert({ channel_id: activeChannel.id, user_id: currentUser.id, content: text, is_ai: false, parent_id: activeThreadId })
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
    setter(value.slice(0, s) + wrap + selected + wrap + value.slice(e));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + wrap.length, e + wrap.length); }, 0);
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    setActionLoading(true);
    const result = await createChannel({ projectId, name: newChannelName });
    if (result.channel) {
      setChannels((p) => [...p, result.channel as Channel]);
      setActiveChannel(result.channel as Channel);
      toast.success("Channel created");
    }
    setNewChannelName(""); setShowNewChannel(false); setActionLoading(false);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    setActionLoading(true);
    const result = await createTask({ projectId, title: newTaskTitle, assigneeId: newTaskAssigneeId ?? undefined, dueDate: newTaskDueDate || undefined, priority: newTaskPriority, status: newTaskStatus as "todo" | "in_progress" | "review" | "done" });
    if (result.task) {
      setTasks((p) => [...p, result.task as Task]);
      toast.success("Task created");
    }
    setNewTaskTitle(""); setNewTaskAssigneeId(null); setNewTaskDueDate(""); setNewTaskPriority("medium"); setNewTaskStatus("todo"); setNewTaskAssigneeOpen(false); setShowNewTask(false); setActionLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setActionLoading(true); setInviteError("");
    const result = await inviteProjectMember(projectId, inviteEmail, inviteRole);
    setActionLoading(false);
    if (result.error) { setInviteError(result.error); toast.error(result.error); }
    else setInviteSent(true);
  };

  const handleCloseInvite = () => {
    setShowInvite(false); setInviteEmail(""); setInviteRole("member"); setInviteError(""); setInviteSent(false);
  };

  const handleAddResource = async () => {
    if (!newResourceLabel.trim()) return;
    setActionLoading(true);

    let finalUrl = newResourceUrl;
    let fileName = null;
    let fileSize = null;
    let metadata = null;

    if (newResourceType === "file" && newResourceFile) {
      const result = await uploadFile(newResourceFile);
      if (result) {
        finalUrl = result.url;
        fileName = result.name;
        fileSize = result.size;
      }
    } else if (newResourceType === "credential") {
      metadata = { value: newResourceCredentialValue };
      finalUrl = ""; // No URL for credentials
    }

    const { resource, error } = await addResource({
      projectId,
      category: newResourceCategory,
      label: newResourceLabel,
      url: finalUrl || undefined,
      type: newResourceType,
      file_name: fileName || undefined,
      file_size: fileSize || undefined,
      metadata
    });

    if (resource) {
      setResources((p) => [...p, resource as Resource]);
      toast.success("Resource added");
      setNewResourceLabel("");
      setNewResourceUrl("");
      setNewResourceCredentialValue("");
      setNewResourceFile(null);
      setNewResourceType("link");
      setShowNewResource(false);
    } else if (error) {
      toast.error(error);
    }
    setActionLoading(false);
  };

  const handleDeleteResource = async (id: string) => {
    await deleteResource(id, projectId);
    setResources((p) => p.filter((r) => r.id !== id));
    toast.success("Resource removed");
  };

  const refreshIntegrations = async () => {
    const { integrations: updated } = await getProjectIntegrations(projectId);
    if (updated) setIntegrations(updated);
  };

  const handleConnectRepo = async () => {
    if (!repoInput.trim() || !project) return;
    setIntLoading(true);
    const res = await upsertGitHubIntegration({ workspaceId: project.workspace_id, projectId: project.id, repoFullName: repoInput.trim() });
    if (res.success) {
      await refreshIntegrations();
      setRepoInput("");
      toast.success("Repository connected");
    } else {
      toast.error(res.error ?? "Failed to connect repository");
    }
    setIntLoading(false);
  };

  const handleDeleteIntegration = async (id: string) => {
    const res = await deleteIntegration(id, projectId);
    if (res.success) {
      setIntegrations((prev) => prev.filter((i) => i.id !== id));
      toast.success("Integration removed");
    }
  };

  const closeModal = () => {
    setShowNewChannel(false); setShowNewTask(false); setShowNewResource(false);
    setNewTaskTitle(""); setNewTaskAssigneeId(null); setNewTaskDueDate(""); setNewTaskPriority("medium"); setNewTaskStatus("todo"); setNewTaskAssigneeOpen(false);
    if (!inviteSent) { setShowInvite(false); setInviteEmail(""); setInviteRole("member"); setInviteError(""); }
  };

  const modalOpen = showNewChannel || showNewTask || showInvite || showNewResource;

  return (
    <div
      className="flex h-full overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-white"
      style={{ maxHeight: "calc(100vh - 40px)", fontFamily: "'Sora', sans-serif" }}
      onClick={() => { if (deleteConfirmId) setDeleteConfirmId(null); }}
    >
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <ProjectSidebar
        project={project}
        tab={tab}
        sidebarOpen={sidebarOpen}
        channels={channels}
        activeChannel={activeChannel}
        onlineUsers={onlineUsers}
        onTabChange={setTab}
        onChannelSelect={(ch) => { setActiveChannel(ch); setActiveThreadId(null); }}
        onAddChannel={() => setShowNewChannel(true)}
        onClose={() => setSidebarOpen(false)}
        onAvatarClick={() => avatarInputRef.current?.click()}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div
          className="flex-shrink-0 px-3 sm:px-5 flex items-center justify-between border-b border-gray-100 bg-white"
          style={{ height: 52 }}
        >
          <div className="flex items-center gap-2">
            <button
              className="lg:hidden border-0 bg-transparent cursor-pointer p-1 -ml-1 text-gray-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>
            {tab === "chat" && <Hash size={14} className="text-gray-300 flex-shrink-0" />}
            <h2 className="text-[14px] font-black text-gray-900 capitalize truncate">
              {tab === "chat" ? (activeChannel?.name ?? "chat") : tab}
            </h2>

          </div>
          <div className="flex items-center gap-2">
            {tab === "tasks" && (
              <button
                onClick={() => setShowNewTask(true)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-white cursor-pointer flex items-center gap-1 border-0"
                style={{ background: "#0D0D0D", fontFamily: "'Sora',sans-serif" }}
              >
                <Plus size={13} /><span className="hidden sm:inline">New task</span>
              </button>
            )}
            {tab === "team" && (
              <button
                onClick={() => { setShowInvite(true); setInviteError(""); setInviteSent(false); }}
                className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-white cursor-pointer flex items-center gap-1 border-0"
                style={{ background: "#0D0D0D", fontFamily: "'Sora',sans-serif" }}
              >
                <Mail size={13} /><span className="hidden sm:inline">Invite</span>
              </button>
            )}
            {tab === "resources" && (
              <button
                onClick={() => setShowNewResource(true)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-white cursor-pointer flex items-center gap-1 border-0"
                style={{ background: "#0D0D0D", fontFamily: "'Sora',sans-serif" }}
              >
                <Plus size={13} /><span className="hidden sm:inline">Add</span>
              </button>
            )}
            <Link
              href={`/space/video-call?room=project-${projectId}`}
              className="px-3 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer flex items-center gap-1.5 border border-[#EBEBEB] bg-white text-gray-900 hover:text-[#36C5F0] hover:border-[#36C5F0]/30 shadow-sm transition-all no-underline"
              style={{ fontFamily: "'Sora',sans-serif" }}
            >
              <Video size={13} className="text-[#36C5F0]" /><span className="hidden sm:inline">Meet</span>
            </Link>
            <div className="flex -space-x-1.5">
              {team.slice(0, 3).map((m, i) => {
                const p = m.profiles; if (!p) return null;
                return (
                  <div key={i} className="ring-2 ring-white rounded-full">
                    <GlobalAvatar url={p.avatar_url} name={p.full_name} email={p.email} size={24} fallbackColor={strColor(p.id)} />
                  </div>
                );
              })}
            </div>
            <span className="text-[11px] text-gray-400 hidden sm:block">{team.length}</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab + (activeChannel?.id ?? "")}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {tab === "chat" && (
              <ChatTab
                messages={messages}
                loading={messagesLoading}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
                onLoadMore={fetchOlderMessages}
                reactions={reactions}
                replyCounts={replyCounts}
                activeChannelName={activeChannel?.name}
                activeThreadId={activeThreadId}
                hoveredMsgId={hoveredMsgId}
                deleteConfirmId={deleteConfirmId}
                deletingId={deletingId}
                currentUserId={currentUser?.id ?? ""}
                endRef={endRef}
                onHover={setHoveredMsgId}
                onToggleReaction={toggleReaction}
                onOpenThread={setActiveThreadId}
                onDeleteRequest={setDeleteConfirmId}
                onDeleteConfirm={handleDeleteMessage}
                onDeleteCancel={() => setDeleteConfirmId(null)}
              />
            )}
            {tab === "tasks" && (
              <TasksTab
                tasks={tasks}
                project={project}
                team={team}
                projectId={projectId}
                onRefresh={async () => {
                  const { data: ts } = await supabase.from("tasks").select("*,assignee:profiles!tasks_assignee_id_fkey(id,full_name,avatar_url,email),projects!tasks_project_id_fkey(id,name,color)").eq("project_id", projectId).order("created_at");
                  if (ts) setTasks(ts as Task[]);
                }}
              />
            )}
            {tab === "team" && <TeamTab team={team} onlineUsers={onlineUsers} />}
            {tab === "resources" && <ResourcesTab resources={resources} onDelete={handleDeleteResource} />}
            {tab === "settings" && (
              <SettingsTab
                repoInput={repoInput}
                integrations={integrations}
                intLoading={intLoading}
                projectId={projectId}
                workspaceId={project?.workspace_id ?? ""}
                onRepoInputChange={setRepoInput}
                onConnectRepo={handleConnectRepo}
                onDeleteIntegration={handleDeleteIntegration}
                onIntegrationsChange={refreshIntegrations}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {tab === "chat" && (
          <ChatInputBar
            input={input}
            pendingFiles={pendingFiles}
            uploading={uploading}
            emojiPickerOpen={emojiPickerOpen}
            mentionSuggestions={mentionSuggestions}
            mentionQuery={mentionQuery}
            mentionIndex={mentionIndex}
            isThreadMention={isThreadMention}
            activeChannelName={activeChannel?.name}
            onInputChange={(value, cursorPos) => { setInput(value); resizeTextarea(textareaRef); handleMentionInput(value, cursorPos, false); }}
            onKeyDown={(e) => handleTextareaKeyDown(e, false)}
            onPaste={handlePaste}
            onSend={handleSend}
            onInsertFormat={(wrap) => insertFormat(wrap, textareaRef, setInput)}
            onInsertAt={() => {
              const ta = textareaRef.current;
              if (!ta) return;
              const pos = ta.selectionEnd;
              const newVal = input.slice(0, pos) + "@" + input.slice(pos);
              setInput(newVal);
              setTimeout(() => { ta.focus(); ta.setSelectionRange(pos + 1, pos + 1); handleMentionInput(newVal, pos + 1, false); }, 0);
            }}
            onToggleEmoji={() => setEmojiPickerOpen((v) => !v)}
            onSelectEmoji={(e) => { setInput((v) => v + e); setEmojiPickerOpen(false); textareaRef.current?.focus(); }}
            onRemoveFile={(i) => setPendingFiles((p) => p.filter((_, j) => j !== i))}
            onFileSelect={handleFileSelect}
            onFileClick={() => fileInputRef.current?.click()}
            onImageClick={() => {
              if (!fileInputRef.current) return;
              fileInputRef.current.accept = "image/*";
              fileInputRef.current.click();
              setTimeout(() => { if (fileInputRef.current) fileInputRef.current.accept = "image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.zip,.pptx"; }, 200);
            }}
            onMentionSelect={insertMention}
            textareaRef={textareaRef}
            fileInputRef={fileInputRef}
          />
        )}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />
    </div>

      <ThreadPanel
        activeThreadId={activeThreadId}
        activeThreadMsg={activeThreadMsg}
        threadMessages={threadMessages}
        threadLoading={threadLoading}
        threadInput={threadInput}
        threadUploading={threadUploading}
        threadEmojiOpen={threadEmojiOpen}
        reactions={reactions}
        replyCounts={replyCounts}
        hoveredThreadMsgId={hoveredThreadMsgId}
        deleteConfirmId={deleteConfirmId}
        deletingId={deletingId}
        currentUserId={currentUser?.id ?? ""}
        mentionSuggestions={mentionSuggestions}
        mentionQuery={mentionQuery}
        mentionIndex={mentionIndex}
        isThreadMention={isThreadMention}
        threadEndRef={threadEndRef}
        threadTextareaRef={threadTextareaRef}
        onClose={() => setActiveThreadId(null)}
        onSend={handleThreadSend}
        onInputChange={(value, cursorPos) => { setThreadInput(value); resizeTextarea(threadTextareaRef); handleMentionInput(value, cursorPos, true); }}
        onKeyDown={(e) => handleTextareaKeyDown(e, true)}
        onInsertFormat={(wrap) => insertFormat(wrap, threadTextareaRef, setThreadInput)}
        onInsertAt={() => {
          const ta = threadTextareaRef.current;
          if (!ta) return;
          const pos = ta.selectionEnd;
          const newVal = threadInput.slice(0, pos) + "@" + threadInput.slice(pos);
          setThreadInput(newVal);
          setTimeout(() => { ta.focus(); ta.setSelectionRange(pos + 1, pos + 1); handleMentionInput(newVal, pos + 1, true); }, 0);
        }}
        onToggleEmoji={() => setThreadEmojiOpen((v) => !v)}
        onSelectEmoji={(e) => { setThreadInput((v) => v + e); setThreadEmojiOpen(false); threadTextareaRef.current?.focus(); }}
        onToggleReaction={toggleReaction}
        onHover={setHoveredThreadMsgId}
        onDeleteRequest={setDeleteConfirmId}
        onDeleteConfirm={handleDeleteMessage}
        onDeleteCancel={() => setDeleteConfirmId(null)}
        onMentionSelect={insertMention}
      />

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-2xl p-6 w-full max-w-[380px] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              style={{ fontFamily: "'Sora',sans-serif" }}
            >
              {showNewChannel && (
                <NewChannelModal
                  name={newChannelName}
                  loading={actionLoading}
                  onNameChange={setNewChannelName}
                  onCreate={handleCreateChannel}
                  onCancel={closeModal}
                />
              )}
              {showNewTask && (
                <NewTaskModal
                  title={newTaskTitle}
                  assigneeId={newTaskAssigneeId}
                  dueDate={newTaskDueDate}
                  priority={newTaskPriority}
                  status={newTaskStatus}
                  assigneeOpen={newTaskAssigneeOpen}
                  loading={actionLoading}
                  team={team}
                  onTitleChange={setNewTaskTitle}
                  onAssigneeChange={setNewTaskAssigneeId}
                  onDueDateChange={setNewTaskDueDate}
                  onPriorityChange={setNewTaskPriority}
                  onStatusChange={setNewTaskStatus}
                  onAssigneeOpenToggle={() => setNewTaskAssigneeOpen((v) => !v)}
                  onAssigneeClose={() => setNewTaskAssigneeOpen(false)}
                  onCreate={handleCreateTask}
                  onCancel={closeModal}
                />
              )}
              {showInvite && (
                <InviteModal
                  email={inviteEmail}
                  role={inviteRole}
                  error={inviteError}
                  sent={inviteSent}
                  loading={actionLoading}
                  onEmailChange={(v) => { setInviteEmail(v); setInviteError(""); }}
                  onRoleChange={setInviteRole}
                  onInvite={handleInvite}
                  onClose={handleCloseInvite}
                  onInviteAnother={() => { setInviteSent(false); setInviteEmail(""); setInviteRole("member"); }}
                />
              )}
              {showNewResource && (
                <NewResourceModal
                  label={newResourceLabel}
                  url={newResourceUrl}
                  category={newResourceCategory}
                  type={newResourceType}
                  credentialValue={newResourceCredentialValue}
                  selectedFile={newResourceFile}
                  loading={actionLoading}
                  onLabelChange={setNewResourceLabel}
                  onUrlChange={setNewResourceUrl}
                  onCategoryChange={setNewResourceCategory}
                  onTypeChange={setNewResourceType}
                  onCredentialValueChange={setNewResourceCredentialValue}
                  onFileSelect={setNewResourceFile}
                  onAdd={handleAddResource}
                  onCancel={closeModal}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}