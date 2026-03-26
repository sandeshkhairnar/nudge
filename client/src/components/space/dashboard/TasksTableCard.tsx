import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "@/components/global/Avatar";
import { Card, CardHeader } from "./DashboardBase";
import { strColor } from "@/lib/utils/color";

const STATUS_META = {
  todo: { label: "To Do", bg: "#F5F5F2", fg: "#6B7280" },
  in_progress: { label: "Active", bg: "#EFF9FE", fg: "#36C5F0" },
  review: { label: "Review", bg: "#FFFBEB", fg: "#D97706" },
  done: { label: "Done", bg: "#ECFDF5", fg: "#059669" },
};

interface Task {
  id: string;
  title: string;
  project_id: string;
  project_color: string | null;
  project_name: string | null;
  status: "todo" | "in_progress" | "review" | "done";
  stalled_days: number;
  assignee_id: string | null;
  assignee_avatar_url: string | null;
  assignee_name: string | null;
  assignee_email: string | null;
  created_at: string;
}

interface TasksTableCardProps {
  tasks: Task[];
  tab: "all" | "mine" | "stalled";
  onTabChange: (tab: "all" | "mine" | "stalled") => void;
}

const PAGE_SIZE = 8;

export default function TasksTableCard({ tasks, tab, onTabChange }: TasksTableCardProps) {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Reset to first page when changing tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [tab]);

  const totalPages = Math.ceil(tasks.length / PAGE_SIZE);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const currentTasks = tasks.slice(startIdx, startIdx + PAGE_SIZE);

  return (
    <Card className="min-h-[460px] flex flex-col">
      <CardHeader title="Tasks"
        right={
          <div className="flex bg-[#F5F5F2] rounded-lg p-0.5 gap-px">
            {(["all", "mine", "stalled"] as const).map(t => (
              <motion.button key={t} onClick={() => onTabChange(t)}
                className="relative px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer border-0 capitalize transition-colors"
                style={{ color: tab === t ? "#0D0D0D" : "#9CA3AF", background: "transparent", fontFamily: "inherit" }}>
                {tab === t && <motion.div layoutId="ttab" className="absolute inset-0 bg-white rounded-md" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }} />}
                <span className="relative">{t}</span>
              </motion.button>
            ))}
          </div>
        }
      />
      
      <div className="flex-1 overflow-x-auto min-h-0">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-[#F5F5F2]">
              {["Task", "Project", "Assignee", "Status", "Age"].map(h => (
                <th key={h} className="px-4 py-2 text-left text-[9.5px] font-black uppercase tracking-[0.08em] text-[#B0B0A8]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="relative">
            <AnimatePresence mode="wait">
              {tasks.length === 0 ? (
                <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-10">
                      <div className="w-9 h-9 rounded-xl bg-[#F5F5F2] flex items-center justify-center mb-2 text-[#C8C8C0]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2" /><path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="3 2" /></svg>
                      </div>
                      <p className="text-[12px] font-black text-[#0D0D0D] mb-0.5">
                        {tab === "mine" ? "No assigned tasks" : tab === "stalled" ? "No stalled tasks" : "No tasks yet"}
                      </p>
                      <p className="text-[10.5px] text-[#B0B0A8] text-center max-w-[160px] leading-relaxed">
                        {tab === "mine" ? "Tasks assigned to you appear here." : tab === "stalled" ? "Everything is moving!" : "Create tasks in your projects."}
                      </p>
                    </div>
                  </td>
                </motion.tr>
              ) : (
                <motion.tr key={`page-${currentPage}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <td colSpan={5} className="p-0">
                    <table className="w-full border-collapse border-0">
                      <tbody>
                        {currentTasks.map((task, i) => {
                          const s = STATUS_META[task.status];
                          const age = Math.floor((new Date().getTime() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24));
                          return (
                            <motion.tr key={task.id}
                              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.02, duration: 0.2 }}
                              whileHover={{ background: "#FAFAF8" }}
                              className="border-b border-[#F9F9F7] last:border-0 cursor-default">
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: task.project_color ?? "#9CA3AF" }} />
                                  <span className="text-[11.5px] font-semibold text-[#0D0D0D] truncate max-w-[140px]">{task.title}</span>
                                  {task.stalled_days >= 5 && (
                                    <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
                                      className="text-[8px] font-black bg-[#FFF8EC] text-[#ECB22E] px-1 py-0.5 rounded flex-shrink-0">⚡</motion.span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="text-[10.5px] text-[#6B7280] font-medium truncate max-w-[80px] block">{task.project_name ?? "—"}</span>
                              </td>
                              <td className="px-4 py-2.5">
                                {task.assignee_id ? (
                                  <div className="flex items-center gap-1.5">
                                    <Avatar
                                      url={task.assignee_avatar_url}
                                      name={task.assignee_name || "Unknown"}
                                      email={task.assignee_email}
                                      size={22}
                                      fallbackColor={strColor(task.assignee_id)}
                                    />
                                    <span className="text-[10.5px] text-[#6B7280] truncate max-w-[55px] font-medium">{task.assignee_name?.split(" ")[0]}</span>
                                  </div>
                                ) : <span className="text-[10.5px] text-[#D1D5DB] font-medium">—</span>}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color: s.fg, background: s.bg }}>{s.label}</span>
                              </td>
                              <td className="px-4 py-2.5 text-[10.5px] font-black whitespace-nowrap"
                                style={{ color: age >= 5 ? "#ECB22E" : "#B0B0A8" }}>
                                {age === 0 ? "Today" : `${age}d`}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-[#F5F5F2] flex items-center justify-between flex-shrink-0 bg-[#FAFAFA]/50 rounded-b-[22px]">
        <div className="flex items-center gap-1.5">
          <span className="text-[10.5px] font-black text-[#0D0D0D]">
            {Math.min(startIdx + 1, tasks.length)}-{Math.min(startIdx + PAGE_SIZE, tasks.length)}
          </span>
          <span className="text-[10.5px] font-medium text-[#B0B0A8]">of {tasks.length} tasks</span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border-0 bg-white border border-[#EBEBEB] text-[#0D0D0D] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all hover:border-[#36C5F0]"
              style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`min-w-[20px] h-5 rounded-md text-[10px] font-black transition-all border-0 cursor-pointer ${currentPage === i + 1 ? "bg-[#36C5F0] text-white" : "bg-transparent text-[#B0B0A8] hover:text-[#0D0D0D]"}`}>
                  {i + 1}
                </button>
              )).slice(Math.max(0, currentPage - 2), Math.min(totalPages, currentPage + 1))}
            </div>

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-lg border-0 bg-white border border-[#EBEBEB] text-[#0D0D0D] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all hover:border-[#36C5F0]"
              style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
