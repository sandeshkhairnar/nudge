"use client";

import React, { useState, useEffect, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, X, Loader2, AlertCircle, LayoutGrid, List, Paperclip, CheckSquare, Link2, Calendar, ArrowUp, ArrowRight, ArrowDown, CheckCircle2, Bug, Sparkles, Zap, Rocket, HelpCircle, FileText } from "lucide-react";
import { updateTask, createTask, createSubtask, updateSubtask, uploadTaskAttachment, createMagicTasksBulk } from "@/lib/tasks";
import Avatar from "@/components/global/Avatar";
import { TaskType, TASK_TYPE_CONFIG, TaskAttachment, Resource } from "@/types";
import TaskAttachmentUploader from "./TaskAttachmentUploader";
import TaskResourceLinker from "./TaskResourceLinker";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { strColor } from "@/lib/utils/color";

/* ═══════════════════════════
   TYPES
═══════════════════════════ */
type Priority = "high" | "medium" | "low";
type Status = "todo" | "in_progress" | "review" | "done";

export interface Task {
  id: string;
  title: string;
  project: string;
  project_id: string;
  projectColor: string;
  assignee: string;
  assignee_id: string | null;
  assigneeColor: string;
  priority: Priority;
  dueDate: string | null;
  tags: string[];
  status: Status;
  type: TaskType;
  description?: string | null;
  parent_task_id?: string | null;
  subtasks?: any[];
  attachments?: TaskAttachment[];
  linked_resources?: any[];
  _subtask_count?: number;
  stalled?: boolean;
  avatar_url?: string | null;
  email?: string | null;
  role?: string | null;
}

interface Column {
  id: Status;
  label: string;
  color: string;
  bg: string;
  border: string;
}

const COLUMNS: Column[] = [
  { id: "todo", label: "To Do", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
  { id: "in_progress", label: "In Progress", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  { id: "review", label: "In Review", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { id: "done", label: "Done", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
];

const PRIORITY_ICONS: Record<Priority, React.ReactNode> = {
  high: <ArrowUp size={14} strokeWidth={3} />,
  medium: <ArrowRight size={14} strokeWidth={3} />,
  low: <ArrowDown size={14} strokeWidth={3} />,
};

const TYPE_ICONS: Record<TaskType, React.ReactNode> = {
  task: <CheckCircle2 size={14} />,
  bug: <Bug size={14} />,
  feature: <Sparkles size={14} />,
  improvement: <Zap size={14} />,
  epic: <Rocket size={14} />,
  question: <HelpCircle size={14} />,
  documentation: <FileText size={14} />
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  high: { label: "High", color: "text-red-700", bg: "bg-red-50", icon: <ArrowUp size={14} strokeWidth={3} /> },
  medium: { label: "Medium", color: "text-amber-700", bg: "bg-amber-50", icon: <ArrowRight size={14} strokeWidth={3} /> },
  low: { label: "Low", color: "text-gray-600", bg: "bg-gray-100", icon: <ArrowDown size={14} strokeWidth={3} /> },
};

/* ═══════════════════════════
   BOARD COMPONENT
═══════════════════════════ */
export function TaskBoard({ 
  tasks: initialTasks, 
  projects, 
  members, 
  projectId,
  resources = [],
  onRefresh 
}: { 
  tasks: Task[]; 
  projects: any[]; 
  members: any[]; 
  projectId?: string;
  resources?: Resource[];
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [filter, setFilter] = useState("All projects");
  const [memberFilter, setMemberFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStatus, setAddStatus] = useState<Status>("todo");
  
  // New Task form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<TaskType>("task");
  const [newProjectId, setNewProjectId] = useState(projectId || "");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isSubtaskModal, setIsSubtaskModal] = useState(false);
  const [newParentTaskId, setNewParentTaskId] = useState("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [magicFile, setMagicFile] = useState<File | null>(null);
  const magicFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleMagicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMagicFile(file);
    setIsAnalyzing(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/ai/extract-task", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.status === "success" && data.data) {
        if (data.data.tasks) {
          setExtractedData(data.data);
        } else if (data.data.title) {
          setExtractedData({ tasks: [data.data] });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
      if (magicFileInputRef.current) magicFileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const parentTaskOptions = [
    { value: "", label: "Select Parent Task..." },
    ...tasks.filter(t => !t.parent_task_id).map(t => ({ value: t.id, label: t.title }))
  ];

  const projectOptions = [
    { value: "", label: "Select Project..." },
    ...projects.map(p => ({ 
      value: p.id, 
      label: p.name, 
      icon: <div className="w-2 h-2 rounded-full" style={{ background: p.color || '#ccc' }} /> 
    }))
  ];

  const assigneeOptions = [
    { value: "", label: "Unassigned", icon: <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-500">?</div> },
    ...members.map(m => ({ 
      value: m.profiles.id, 
      label: m.profiles.full_name || m.profiles.email, 
      subtitle: m.profiles.email,
      icon: <Avatar url={m.profiles.avatar_url} name={m.profiles.full_name || m.profiles.email} email={m.profiles.email} size={16} fallbackColor={strColor(m.profiles.id)} />
    }))
  ];

  const priorityOptions = [
    { value: "low", label: "Low", icon: <span className="text-gray-500">{PRIORITY_ICONS.low}</span> },
    { value: "medium", label: "Medium", icon: <span className="text-amber-500">{PRIORITY_ICONS.medium}</span> },
    { value: "high", label: "High", icon: <span className="text-red-500">{PRIORITY_ICONS.high}</span> }
  ];

  const typeOptions = Object.entries(TASK_TYPE_CONFIG).map(([k, v]) => ({
    value: k,
    label: v.label,
    icon: <span className={v.color}>{TYPE_ICONS[k as TaskType]}</span>
  }));

  const statusOptions = COLUMNS.map(c => ({ value: c.id, label: c.label }));

  const filtered = tasks.filter(t => {
    const isTopLevel = !t.parent_task_id;
    const matchProject = filter === "All projects" || t.project === filter;
    const matchMember = memberFilter === "all" || t.assignee_id === memberFilter;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    return isTopLevel && matchProject && matchMember && matchSearch;
  });

  const handleUpdateStatus = async (taskId: string, newStatus: Status) => {
    const result = await updateTask(taskId, { status: newStatus }, projectId || "workspace");
    if (!("error" in result)) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      if (openTask?.id === taskId) setOpenTask(prev => prev ? { ...prev, status: newStatus } : null);
      onRefresh();
    }
  };

  const handleUpdateType = async (taskId: string, newType: TaskType) => {
    const result = await updateTask(taskId, { type: newType }, projectId || "workspace");
    if (!("error" in result)) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, type: newType } : t));
      if (openTask?.id === taskId) setOpenTask(prev => prev ? { ...prev, type: newType } : null);
      onRefresh();
    }
  };

  const handleUpdateDescription = async (taskId: string, newDesc: string) => {
    const result = await updateTask(taskId, { description: newDesc }, projectId || "workspace");
    if (!("error" in result)) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, description: newDesc } : t));
      if (openTask?.id === taskId) setOpenTask(prev => prev ? { ...prev, description: newDesc } : null);
      onRefresh(); // Might not need to refresh the whole board for a description change
    }
  };

  const handleUpdateDueDate = async (taskId: string, newDueDate: string) => {
    const result = await updateTask(taskId, { due_date: newDueDate }, projectId || "workspace");
    if (!("error" in result)) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, dueDate: newDueDate } : t));
      if (openTask?.id === taskId) setOpenTask(prev => prev ? { ...prev, dueDate: newDueDate } : null);
      onRefresh();
    }
  };

  const handleUpdateAssignee = async (taskId: string, newAssigneeId: string) => {
    const isSubtask = !!openTask?.parent_task_id;
    if (isSubtask) {
      await updateSubtask(taskId, { assignee_id: newAssigneeId || null }, projectId || "workspace");
    } else {
      await updateTask(taskId, { assignee_id: newAssigneeId || null }, projectId || "workspace");
    }
    
    const member = members.find(m => m.profiles.id === newAssigneeId);
    if (openTask?.id === taskId) {
      if (isSubtask) {
        setOpenTask({
          ...openTask,
          assignee_id: newAssigneeId || null,
          assignee: member?.profiles?.full_name || member?.profiles?.email || "Unassigned",
          avatar_url: member?.profiles?.avatar_url || null,
          email: member?.profiles?.email || null
        });
      } else {
        setOpenTask({
          ...openTask,
          assignee_id: newAssigneeId || null,
          assignee: member?.profiles?.full_name || member?.profiles?.email || "Unassigned",
          avatar_url: member?.profiles?.avatar_url || null,
          email: member?.profiles?.email || null
        });
      }
    }
    onRefresh();
  };

  const handleCreateTask = async (inlineParentId?: string) => {
    const isInline = !!inlineParentId;
    const titleToUse = isInline ? newSubtaskTitle.trim() : (isSubtaskModal ? newSubtaskTitle.trim() : newTitle.trim());
    const finalParentId = isInline ? inlineParentId : (isSubtaskModal ? newParentTaskId : undefined);
    
    if (!titleToUse || (!newProjectId && !finalParentId)) return;
    if ((isSubtaskModal || isInline) && !finalParentId) return;
    
    setSubmitting(true);
    let result: any;
    
    if (isSubtaskModal || isInline) {
      result = await createSubtask({
        projectId: openTask?.project_id || newProjectId || "",
        title: titleToUse,
        description: newDescription || undefined,
        status: addStatus,
        type: newType,
        priority: newPriority,
        assigneeId: newAssigneeId || undefined,
        dueDate: newDueDate || undefined,
        parentTaskId: finalParentId!,
      });
    } else {
      result = await createTask({
        projectId: openTask?.project_id || newProjectId || "",
        title: titleToUse,
        description: newDescription || undefined,
        status: addStatus,
        type: newType,
        priority: newPriority,
        assigneeId: newAssigneeId || undefined,
        dueDate: newDueDate || undefined,
      });
    }
    if (!("error" in result)) {
      if (finalParentId) {
        setNewSubtaskTitle("");
        if (isSubtaskModal) {
          setShowAddModal(false);
          setNewParentTaskId("");
        }
        if (openTask && openTask.id === finalParentId) {
           setOpenTask({
             ...openTask,
             subtasks: [...(openTask.subtasks || []), result.task]
           });
        }
        setShowAddModal(false);
      }
      onRefresh();
    }
    setSubmitting(false);
  };

  const handleMagicCreate = async () => {
    if (!extractedData || !extractedData.tasks || extractedData.tasks.length === 0 || !newProjectId) return;
    setSubmitting(true);
    
    const result = await createMagicTasksBulk(newProjectId, extractedData.tasks);

    if (result && !result.error) {
      if (magicFile && result.firstTaskId) {
        const formData = new FormData();
        formData.append("file", magicFile);
        formData.append("id", result.firstTaskId);
        formData.append("type", "task");
        formData.append("projectId", newProjectId);
        await uploadTaskAttachment(formData);
      }
    }

    setExtractedData(null);
    setMagicFile(null);
    setNewProjectId(projectId || "");
    onRefresh();
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-50/30">
      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-gray-200 bg-white z-10 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-[13px] font-medium text-gray-900 placeholder:text-gray-400 outline-none w-[200px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {!projectId && (
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700 text-[13px] font-medium outline-none cursor-pointer hover:bg-gray-50 transition-colors appearance-none min-w-[130px]"
            >
              <option value="All projects">All projects</option>
              {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          )}

          <select
            value={memberFilter}
            onChange={e => setMemberFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700 text-[13px] font-medium outline-none cursor-pointer hover:bg-gray-50 transition-colors appearance-none min-w-[130px]"
          >
            <option value="all">Everyone</option>
            {members.map(m => (
              <option key={m.profiles.id} value={m.profiles.id}>
                {m.profiles.full_name || m.profiles.email}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            {(["board", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`p-1.5 rounded-md text-[13px] font-medium transition-all border-0 cursor-pointer flex items-center justify-center w-8 h-8 ${
                  viewMode === v ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-700"
                }`}
                title={v === "board" ? "Board View" : "List View"}
              >
                {v === "board" ? <LayoutGrid size={15} /> : <List size={15} />}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setAddStatus("todo"); setShowAddModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[13px] font-semibold transition-colors shadow-sm cursor-pointer border-0"
          >
            <Plus size={15} /> New task
          </button>
          {!projectId && (
            <>
              <input type="file" ref={magicFileInputRef} onChange={handleMagicUpload} className="hidden" accept="image/*,application/pdf,text/plain" />
              <button 
                onClick={() => magicFileInputRef.current?.click()} 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-[13px] font-bold shadow-sm hover:opacity-90 transition-opacity border-0 cursor-pointer whitespace-nowrap"
              >
                <Sparkles size={15} /> Magic Extract
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 min-w-0 relative p-4 sm:p-5 overflow-hidden">
        {viewMode === "board" ? (
          <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 h-full" style={{ scrollbarWidth: "thin" }}>
            {COLUMNS.map(col => {
              const colTasks = filtered.filter(t => t.status === col.id);
              return (
                <div key={col.id} className="flex flex-col w-[280px] flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-[12px] font-semibold border ${col.bg} ${col.color} ${col.border}`}>
                        {col.label}
                      </span>
                    </div>
                    <span className="text-[12px] font-medium text-gray-400">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-10" style={{ scrollbarWidth: "none" }}>
                    {colTasks.map((t, i) => (
                      <TaskCardInternal key={t.id} task={t} onOpen={setOpenTask} index={i} />
                    ))}
                    <button 
                      onClick={() => { setAddStatus(col.id); setShowAddModal(true); }}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-gray-300 bg-white/50 hover:bg-white text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-all cursor-pointer font-medium text-[13px] shadow-sm"
                    >
                      <Plus size={14} /> Add Task
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm h-full flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-[12px] font-semibold text-gray-500">Task</th>
                    {!projectId && <th className="px-6 py-3 text-[12px] font-semibold text-gray-500">Project</th>}
                    <th className="px-6 py-3 text-[12px] font-semibold text-gray-500">Assignee</th>
                    <th className="px-6 py-3 text-[12px] font-semibold text-gray-500">Priority</th>
                    <th className="px-6 py-3 text-[12px] font-semibold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((t) => {
                    const p = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
                    const col = COLUMNS.find(c => c.id === t.status) || COLUMNS[0];
                    return (
                      <Fragment key={t.id}>
                        <tr onClick={() => setOpenTask(t)} className="cursor-pointer bg-white hover:bg-indigo-50/30 transition-all group">
                          <td className="px-6 py-4 border-l-4 border-transparent group-hover:border-indigo-500">
                            <p className={`text-[14px] font-bold tracking-tight ${t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{t.title}</p>
                          </td>
                          {!projectId && (
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ background: t.projectColor }} />
                                <span className="text-[13px] font-medium text-gray-600">{t.project}</span>
                              </div>
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar 
                                url={t.avatar_url} 
                                name={t.assignee} 
                                email={t.email}
                                size={24} 
                                fallbackColor={t.assigneeColor} 
                              />
                              <span className="text-[13px] font-medium text-gray-700">{t.assignee}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 text-[11.5px] font-bold px-2.5 py-1 rounded-md ${p.bg} ${p.color}`}>
                              {p.icon} {p.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex text-[11.5px] font-bold px-2.5 py-1 rounded-md ${col.bg} ${col.color} border ${col.border}`}>
                              {col.label}
                            </span>
                          </td>
                        </tr>
                        {t.subtasks && t.subtasks.map((st: any) => {
                          const stP = PRIORITY_CONFIG[st.priority as Priority] || PRIORITY_CONFIG.medium;
                          const stCol = COLUMNS.find(c => c.id === st.status) || COLUMNS[0];
                          return (
                            <tr key={st.id} onClick={() => setOpenTask(st)} className="cursor-pointer bg-gray-50/40 hover:bg-gray-100 transition-colors group">
                              <td className="px-6 py-2.5 pl-12 border-l-2 border-transparent group-hover:border-indigo-300">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                  <p className={`text-[12.5px] font-medium ${st.status === 'done' ? 'line-through text-gray-400' : 'text-gray-600'}`}>{st.title}</p>
                                </div>
                              </td>
                              {!projectId && <td className="px-6 py-2.5"></td>}
                              <td className="px-6 py-2.5">
                                {st.assignee ? (
                                  <div className="flex items-center gap-2.5">
                                    <Avatar 
                                      url={st.assignee.avatar_url} 
                                      name={st.assignee.full_name || st.assignee.email} 
                                      email={st.assignee.email}
                                      size={20} 
                                      fallbackColor={strColor(st.assignee.id)} 
                                    />
                                    <span className="text-[12px] text-gray-600">{st.assignee.full_name || st.assignee.email || "Unassigned"}</span>
                                  </div>
                                ) : (
                                  <span className="text-[12px] text-gray-400 italic">Unassigned</span>
                                )}
                              </td>
                              <td className="px-6 py-2.5">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${stP.bg} ${stP.color}`}>
                                  {stP.icon} {stP.label}
                                </span>
                              </td>
                              <td className="px-6 py-2.5">
                                <span className={`inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${stCol.bg} ${stCol.color} border ${stCol.border}`}>
                                  {stCol.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Drawer */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md relative shadow-xl" 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[18px] font-bold text-gray-900">New Task</h2>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent border-0 hover:bg-gray-100 cursor-pointer text-gray-400 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                  <button 
                    onClick={() => setIsSubtaskModal(false)}
                    className={`flex-1 py-1.5 rounded-md text-[12px] font-semibold transition-all border-0 cursor-pointer ${!isSubtaskModal ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-700"}`}
                  >Task</button>
                  <button 
                    onClick={() => setIsSubtaskModal(true)}
                    className={`flex-1 py-1.5 rounded-md text-[12px] font-semibold transition-all border-0 cursor-pointer ${isSubtaskModal ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-700"}`}
                  >Subtask</button>
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">
                    {isSubtaskModal ? "Subtask Title" : "Task Title"}
                  </label>
                  <input 
                    autoFocus
                    value={isSubtaskModal ? newSubtaskTitle : newTitle}
                    onChange={e => isSubtaskModal ? setNewSubtaskTitle(e.target.value) : setNewTitle(e.target.value)}
                    placeholder={isSubtaskModal ? "What subtask needs to be done?" : "What needs to be done?"}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {isSubtaskModal && (
                  <div>
                    <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">Parent Task</label>
                    <CustomSelect 
                      value={newParentTaskId}
                      onChange={val => {
                        setNewParentTaskId(val);
                        const pt = tasks.find(t => t.id === val);
                        if (pt) setNewProjectId(pt.project_id);
                      }}
                      options={parentTaskOptions}
                      searchable={true}
                    />
                  </div>
                )}

                {!projectId && !isSubtaskModal && (
                  <div>
                    <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">Project</label>
                    <CustomSelect 
                      value={newProjectId}
                      onChange={setNewProjectId}
                      options={projectOptions}
                      searchable={true}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">Assign To</label>
                    <CustomSelect 
                      value={newAssigneeId}
                      onChange={setNewAssigneeId}
                      options={assigneeOptions}
                      searchable={true}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">Due Date</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Calendar size={14} className="text-gray-400" />
                      </div>
                      <input 
                        type="date"
                        value={newDueDate}
                        onChange={e => setNewDueDate(e.target.value)}
                        className="w-full pl-3 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-[13px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">Priority</label>
                    <CustomSelect 
                      value={newPriority}
                      onChange={(v) => setNewPriority(v as Priority)}
                      options={priorityOptions}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">Type</label>
                    <CustomSelect 
                      value={newType}
                      onChange={(v) => setNewType(v as TaskType)}
                      options={typeOptions}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">Status</label>
                    <CustomSelect 
                      value={addStatus}
                      onChange={(v) => setAddStatus(v as Status)}
                      options={statusOptions}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button 
                    disabled={submitting || (isSubtaskModal ? (!newSubtaskTitle.trim() || !newParentTaskId) : (!newTitle.trim() || !newProjectId))}
                    onClick={() => handleCreateTask()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold cursor-pointer disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-sm border-0"
                  >
                    {submitting ? "Creating..." : "Create Task"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {(isAnalyzing || extractedData) && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { if (!isAnalyzing) { setExtractedData(null); setMagicFile(null); } }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white rounded-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col relative shadow-2xl overflow-hidden" 
              onClick={e => e.stopPropagation()}
            >
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-20 px-8">
                  <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner relative overflow-hidden">
                    <Sparkles size={32} className="relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-200 to-purple-200 opacity-50 animate-pulse" />
                  </div>
                  <h2 className="text-[24px] font-bold text-gray-900 mb-2">Analyzing your file...</h2>
                  <p className="text-[14px] text-gray-500 max-w-sm text-center">Nudge Engine is extracting the task details, description, and mapping out the perfect subtasks.</p>
                  <div className="w-48 h-1 bg-gray-100 rounded-full mt-8 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full w-1/2 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h2 className="text-[18px] font-bold text-gray-900">Review Magic Extraction</h2>
                        <p className="text-[13px] text-gray-500">Edit and verify the details before creating the task.</p>
                      </div>
                    </div>
                    <button onClick={() => { setExtractedData(null); setMagicFile(null); }} className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50" style={{ scrollbarWidth: 'thin' }}>
                    <div className="space-y-8">
                      {!projectId && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between shadow-sm mb-4">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 size={18} className="text-indigo-500" />
                            <span className="text-[14px] font-bold text-indigo-900">Global Project Destination</span>
                          </div>
                          <div className="w-[250px]">
                            <CustomSelect value={newProjectId} onChange={setNewProjectId} options={projectOptions} searchable={true} />
                          </div>
                        </div>
                      )}
                      
                      {extractedData.tasks?.map((task: any, tIdx: number) => (
                        <div key={tIdx} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden relative">
                          <button 
                            onClick={() => {
                              const newTasks = extractedData.tasks.filter((_:any, i:number) => i !== tIdx);
                              setExtractedData({...extractedData, tasks: newTasks});
                            }}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors cursor-pointer z-10"
                          >
                            <X size={16} />
                          </button>
                          
                          <div className="p-6 border-b border-gray-100">
                            <h3 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <CheckCircle2 size={18} className="text-indigo-500" /> Parent Task {tIdx + 1}
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">Title</label>
                                <input 
                                  value={task.title || ""}
                                  onChange={e => {
                                    const newTasks = [...extractedData.tasks];
                                    newTasks[tIdx].title = e.target.value;
                                    setExtractedData({...extractedData, tasks: newTasks});
                                  }}
                                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-lg text-[14px] font-bold text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                />
                              </div>
                              <div>
                                <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">Description</label>
                                <textarea 
                                  value={task.description || ""}
                                  onChange={e => {
                                    const newTasks = [...extractedData.tasks];
                                    newTasks[tIdx].description = e.target.value;
                                    setExtractedData({...extractedData, tasks: newTasks});
                                  }}
                                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:bg-white focus:border-indigo-500 transition-all min-h-[80px] resize-y"
                                />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                  <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">Assignee</label>
                                  <CustomSelect 
                                    value={task.assigneeId || ""} 
                                    onChange={(v) => {
                                      const newTasks = [...extractedData.tasks];
                                      newTasks[tIdx].assigneeId = v;
                                      setExtractedData({...extractedData, tasks: newTasks});
                                    }} 
                                    options={assigneeOptions} searchable={true} 
                                  />
                                </div>
                                <div>
                                  <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">Due Date</label>
                                  <div className="relative">
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                      <Calendar size={14} className="text-gray-400" />
                                    </div>
                                    <input 
                                      type="date"
                                      value={task.due_date || task.dueDate || ""}
                                      onChange={e => {
                                        const newTasks = [...extractedData.tasks];
                                        newTasks[tIdx].due_date = e.target.value;
                                        setExtractedData({...extractedData, tasks: newTasks});
                                      }}
                                      className="w-full pl-3 pr-10 py-1.5 bg-gray-50 focus:bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer h-[38px] appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">Priority</label>
                                  <CustomSelect 
                                    value={task.priority || "medium"} 
                                    onChange={(v) => {
                                      const newTasks = [...extractedData.tasks];
                                      newTasks[tIdx].priority = v as Priority;
                                      setExtractedData({...extractedData, tasks: newTasks});
                                    }} 
                                    options={priorityOptions} 
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-6 bg-gray-50/30">
                            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                              <h3 className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
                                <List size={16} className="text-indigo-500" /> Subtasks
                              </h3>
                              <span className="text-[12px] font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                                {task.subtasks?.length || 0}
                              </span>
                            </div>
                            
                            {task.subtasks && task.subtasks.length > 0 ? (
                              <div className="space-y-3">
                                {task.subtasks.map((st: any, idx: number) => (
                                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-indigo-300 transition-colors group relative">
                                    <button 
                                      onClick={() => {
                                        const newTasks = [...extractedData.tasks];
                                        newTasks[tIdx].subtasks = task.subtasks.filter((_:any, i:number) => i !== idx);
                                        setExtractedData({...extractedData, tasks: newTasks});
                                      }} 
                                      className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 shadow-sm opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                    >
                                      <X size={12} />
                                    </button>
                                    
                                    <div className="mb-3">
                                      <input 
                                        value={st.title}
                                        placeholder="Subtask title..."
                                        onChange={(e) => {
                                          const newTasks = [...extractedData.tasks];
                                          newTasks[tIdx].subtasks[idx].title = e.target.value;
                                          setExtractedData({...extractedData, tasks: newTasks});
                                        }}
                                        className="w-full text-[14px] font-bold text-gray-900 border-none outline-none bg-transparent placeholder:text-gray-300 focus:bg-gray-50 focus:ring-2 focus:ring-indigo-100 rounded-md px-2 py-1 -ml-2 transition-all"
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                      <div>
                                        <label className="text-[11px] font-semibold text-gray-500 mb-1 block uppercase tracking-wider">Assignee</label>
                                        <CustomSelect 
                                          value={st.assigneeId || ""} 
                                          onChange={(val) => {
                                            const newTasks = [...extractedData.tasks];
                                            newTasks[tIdx].subtasks[idx].assigneeId = val;
                                            setExtractedData({...extractedData, tasks: newTasks});
                                          }} 
                                          options={assigneeOptions} 
                                          searchable={true} 
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[11px] font-semibold text-gray-500 mb-1 block uppercase tracking-wider">Priority</label>
                                        <CustomSelect 
                                          value={st.priority || "medium"} 
                                          onChange={(val) => {
                                            const newTasks = [...extractedData.tasks];
                                            newTasks[tIdx].subtasks[idx].priority = val as Priority;
                                            setExtractedData({...extractedData, tasks: newTasks});
                                          }} 
                                          options={priorityOptions} 
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[11px] font-semibold text-gray-500 mb-1 block uppercase tracking-wider">Due Date</label>
                                        <div className="relative">
                                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <Calendar size={14} className="text-gray-400" />
                                          </div>
                                          <input 
                                            type="date"
                                            value={st.due_date || st.dueDate || ""}
                                            onChange={(e) => {
                                              const newTasks = [...extractedData.tasks];
                                              newTasks[tIdx].subtasks[idx].due_date = e.target.value;
                                              setExtractedData({...extractedData, tasks: newTasks});
                                            }}
                                            className="w-full pl-3 pr-10 py-1.5 bg-white border border-gray-300 rounded-lg text-[13px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer h-[34px]"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                
                                <button 
                                  onClick={() => {
                                    const newTasks = [...extractedData.tasks];
                                    newTasks[tIdx].subtasks = [...(task.subtasks || []), { title: "", priority: "medium" }];
                                    setExtractedData({...extractedData, tasks: newTasks});
                                  }}
                                  className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 hover:bg-white text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-all cursor-pointer font-semibold text-[13px]"
                                >
                                  <Plus size={14} /> Add Subtask Manually
                                </button>
                              </div>
                            ) : (
                              <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-[13px] text-gray-500 font-medium mb-3">No subtasks extracted.</p>
                                <button 
                                  onClick={() => {
                                    const newTasks = [...extractedData.tasks];
                                    newTasks[tIdx].subtasks = [{ title: "", priority: "medium" }];
                                    setExtractedData({...extractedData, tasks: newTasks});
                                  }}
                                  className="px-4 py-1.5 bg-white border border-gray-200 rounded-lg text-[12px] font-bold text-gray-700 shadow-sm hover:bg-gray-50"
                                >
                                  Add Subtask
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      <button 
                        onClick={() => {
                          setExtractedData({
                            ...extractedData, 
                            tasks: [...(extractedData.tasks || []), { title: "", subtasks: [] }]
                          });
                        }}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-gray-300 bg-white hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-all cursor-pointer font-bold text-[14px]"
                      >
                        <Plus size={16} strokeWidth={3} /> Add Another Task
                      </button>
                    </div>
                  </div>

                  <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between rounded-b-2xl">
                    <div className="flex items-center gap-2">
                      <Paperclip size={16} className="text-gray-400" />
                      <span className="text-[13px] font-medium text-gray-600">
                        File will be attached: <span className="font-bold text-gray-900">{magicFile?.name}</span>
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => { setExtractedData(null); setMagicFile(null); }} className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-xl text-[13px] font-bold shadow-sm hover:bg-gray-50 transition-colors cursor-pointer">
                        Cancel
                      </button>
                      <button 
                        disabled={submitting || !newProjectId || !extractedData.tasks?.length}
                        onClick={handleMagicCreate}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[13px] font-bold shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50 border-0 flex items-center gap-2 cursor-pointer"
                      >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {submitting ? "Creating..." : "Confirm & Create"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}

        {openTask && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpenTask(null)} className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[120]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-full max-w-[440px] bg-white border-l border-gray-200 z-[121] shadow-2xl flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {openTask.parent_task_id ? (
                    <button 
                      onClick={() => setOpenTask(tasks.find(t => t.id === openTask.parent_task_id) || null)}
                      className="text-[12px] font-semibold text-indigo-600 flex items-center gap-1 hover:underline cursor-pointer border-0 bg-transparent"
                    >
                      ← Back to Parent
                    </button>
                  ) : (
                    <>
                      <div className="w-3 h-3 rounded-full" style={{ background: openTask.projectColor }} />
                      <span className="text-[13px] font-semibold text-gray-700">{openTask.project}</span>
                    </>
                  )}
                </div>
                <button onClick={() => setOpenTask(null)} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer border-0">
                  <X size={16} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                <h2 className="text-[20px] font-bold text-gray-900 leading-snug">{openTask.title}</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Priority</p>
                    <div className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-md ${PRIORITY_CONFIG[openTask.priority]?.bg} ${PRIORITY_CONFIG[openTask.priority]?.color}`}>
                      {PRIORITY_ICONS[openTask.priority]} {PRIORITY_CONFIG[openTask.priority]?.label}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Assignee</p>
                    <CustomSelect 
                      value={openTask.assignee_id || ""}
                      onChange={(val) => handleUpdateAssignee(openTask.id, val)}
                      options={assigneeOptions}
                      searchable={true}
                    />
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Status</p>
                    <CustomSelect 
                      value={openTask.status}
                      onChange={(v) => handleUpdateStatus(openTask.id, v as Status)}
                      options={statusOptions}
                    />
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Due Date</p>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Calendar size={14} className="text-gray-400" />
                      </div>
                      <input 
                        type="date"
                        value={openTask.dueDate || ""}
                        onChange={(e) => handleUpdateDueDate(openTask.id, e.target.value)}
                        className="w-full pl-3 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-[13px] font-medium text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Type</p>
                    <CustomSelect 
                      value={openTask.type}
                      onChange={(v) => handleUpdateType(openTask.id, v as TaskType)}
                      options={typeOptions}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[13px] font-bold text-gray-900 mb-2">Description</p>
                  <textarea
                    value={openTask.description || ""}
                    onChange={(e) => setOpenTask({ ...openTask, description: e.target.value })}
                    onBlur={(e) => handleUpdateDescription(openTask.id, e.target.value)}
                    placeholder="Add a more detailed description..."
                    className="w-full min-h-[100px] px-3 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-indigo-500 rounded-xl text-[13px] text-gray-900 placeholder:text-gray-400 outline-none transition-all resize-y"
                  />
                </div>

                {!openTask.parent_task_id && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckSquare size={16} className="text-gray-500" />
                      <p className="text-[13px] font-bold text-gray-900">Subtasks</p>
                    </div>
                    <div className="space-y-2 mb-3">
                      {openTask.subtasks?.map((subtask: any) => (
                        <div key={subtask.id} className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                          <input
                            type="checkbox"
                            checked={subtask.status === "done"}
                            onChange={(e) => {
                              const newStatus = e.target.checked ? "done" : "todo";
                              updateSubtask(subtask.id, { status: newStatus }, openTask.project_id || "workspace");
                              setOpenTask({
                                ...openTask,
                                subtasks: openTask.subtasks?.map(st => 
                                  st.id === subtask.id ? { ...st, status: newStatus } : st
                                )
                              });
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span 
                            onClick={() => {
                              const fullSubtask = openTask.subtasks?.find(st => st.id === subtask.id);
                              if (fullSubtask) setOpenTask(fullSubtask as any);
                            }}
                            className={`text-[13px] font-medium cursor-pointer hover:text-indigo-600 hover:underline ${subtask.status === "done" ? "text-gray-400 line-through" : "text-gray-700"}`}
                          >
                            {subtask.title}
                          </span>
                        </div>
                      ))}
                      {(!openTask.subtasks || openTask.subtasks.length === 0) && (
                        <p className="text-[12px] text-gray-400 italic">No subtasks yet.</p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Paperclip size={16} className="text-gray-500" />
                    <p className="text-[13px] font-bold text-gray-900">Attachments</p>
                  </div>
                  <TaskAttachmentUploader
                    targetId={openTask.id}
                    targetType={'parent_task_id' in openTask ? 'subtask' : 'task'}
                    projectId={projectId || "workspace"}
                    attachments={openTask.attachments || []}
                    onAttachmentsChange={(newAtt) => {
                      setOpenTask({ ...openTask, attachments: newAtt });
                      onRefresh();
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 size={16} className="text-gray-500" />
                    <p className="text-[13px] font-bold text-gray-900">Linked Resources</p>
                  </div>
                  <TaskResourceLinker
                    targetId={openTask.id}
                    targetType={'parent_task_id' in openTask ? 'subtask' : 'task'}
                    projectId={projectId || "workspace"}
                    linkedResources={openTask.linked_resources || (openTask as any).task_resources?.map((tr: any) => tr.resources) || []}
                    availableResources={resources}
                    onResourcesChange={(newRes) => {
                      setOpenTask({ ...openTask, linked_resources: newRes });
                      onRefresh();
                    }}
                  />
                </div>

                {openTask.stalled && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 mt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
                      <div>
                        <p className="text-[14px] font-bold text-red-800">Stalled Task</p>
                        <p className="text-[12.5px] text-red-600 mt-1 mb-3">No progress in over 3 days. Might need attention.</p>
                        <button className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-[12px] font-semibold shadow-sm hover:bg-red-700 transition-colors cursor-pointer border-0">
                          Follow Up
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function TaskCardInternal({ task, onOpen, index }: { task: Task; onOpen: (t: Task) => void; index: number }) {
  const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const tConf = TASK_TYPE_CONFIG[task.type] || TASK_TYPE_CONFIG.task;
  const isDone = task.status === "done";
  
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter(s => s.status === 'done').length;
  const totalSubtasks = subtasks.length;
  
  return (
    <motion.div
      layout
      layoutId={task.id}
      whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
      onClick={() => onOpen(task)}
      className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer select-none transition-all relative overflow-hidden group shadow-sm flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2 relative z-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border border-transparent ${tConf.bg} ${tConf.color}`}>
            {TYPE_ICONS[task.type as TaskType]} {tConf.label}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: task.projectColor }} />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate max-w-[100px]">{task.project}</span>
          </div>
        </div>
        {task.stalled && (
          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 flex-shrink-0">
            Stalled
          </span>
        )}
      </div>

      <p className={`text-[13.5px] font-semibold leading-snug ${isDone ? "line-through text-gray-400" : "text-gray-900"}`}>
        {task.title}
      </p>

      {totalSubtasks > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-gray-500">
            <div className="flex items-center gap-1"><CheckSquare size={12}/> {completedSubtasks}/{totalSubtasks}</div>
            <span>{Math.round((completedSubtasks/totalSubtasks)*100)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all duration-300" 
              style={{ width: `${(completedSubtasks/totalSubtasks)*100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${p.bg} ${p.color}`}>
            {PRIORITY_ICONS[task.priority as Priority]} {p.label}
          </span>
          {task.attachments && task.attachments.length > 0 && (
            <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
              <Paperclip size={12} /> {task.attachments.length}
            </span>
          )}
          {task.dueDate && <span className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
        </div>
        <Avatar 
          url={task.avatar_url} 
          name={task.assignee} 
          email={task.email}
          size={24} 
          fallbackColor={task.assigneeColor}
        />
      </div>
    </motion.div>
  );
}
