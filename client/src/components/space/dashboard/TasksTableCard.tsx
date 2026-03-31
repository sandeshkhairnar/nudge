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
      <CardHeader 
        title="Tasks"
        sub={`${tasks.length} items total`}
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" /></svg>}
        right={
          <div className="flex bg-[#F9F9F8] rounded-xl p-1 gap-1 border border-[#F4F4F0]">
            {(["all", "mine", "stalled"] as const).map(t => (
              <motion.button key={t} onClick={() => onTabChange(t)}
                className="relative px-3.5 py-1.5 rounded-lg text-[10px] font-[800] cursor-pointer border-0 capitalize transition-all"
                style={{ color: tab === t ? "#111111" : "#A0A09B", background: "transparent", fontFamily: "inherit" }}>
                {tab === t && <motion.div layoutId="ttab" className="absolute inset-0 bg-white rounded-lg shadow-sm border border-[#F4F4F0]" />}
                <span className="relative">{t}</span>
              </motion.button>
            ))}
          </div>
        }
      />
      
      <div className="flex-1 overflow-x-auto min-h-0 px-2">
        <table className="w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            <tr>
              {["Task", "Project", "Assignee", "Status", "Age"].map(h => (
                <th key={h} className="px-5 py-4 text-left text-[10px] font-[800] uppercase tracking-[0.1em] text-[#A0A09B] border-b border-[#F4F4F0]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="relative">
            <AnimatePresence mode="wait">
              {tasks.length === 0 ? (
                <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="w-12 h-12 rounded-2xl bg-[#F9F9F8] flex items-center justify-center mb-4 text-[#A0A09B] border border-[#F4F4F0]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>
                      </div>
                      <p className="text-[14px] font-[800] text-[#111111] mb-1">
                        {tab === "mine" ? "No assigned tasks" : tab === "stalled" ? "Clear skies!" : "No tasks found"}
                      </p>
                      <p className="text-[11px] text-[#A0A09B] font-[500] text-center max-w-[200px] leading-relaxed">
                        {tab === "mine" ? "Relax, you're all caught up for now." : tab === "stalled" ? "Nothing is stuck. Keep up the momentum!" : "Time to create some new goals."}
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
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.03, duration: 0.3 }}
                              whileHover={{ background: "#FAFAFA" }}
                              className="group cursor-default">
                              <td className="px-5 py-4 border-b border-[#F4F4F0] group-last:border-0">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full flex-shrink-0 shadow-sm" style={{ background: task.project_color ?? "#9CA3AF" }} />
                                  <span className="text-[12px] font-[700] text-[#111111] tracking-tight truncate max-w-[150px]">{task.title}</span>
                                  {task.stalled_days >= 5 && (
                                    <motion.span animate={{ scale: [1, 1.15, 1], opacity: [1, 0.7, 1] }} transition={{ duration: 2, repeat: Infinity }}
                                      className="text-[9px] bg-[#FFF8EC] text-[#ECB22E] px-1.5 py-0.5 rounded-md border border-[#FDEBC8] font-[800]">STALLED</motion.span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-4 border-b border-[#F4F4F0] group-last:border-0">
                                <span className="text-[11px] text-[#8C8C83] font-[600] truncate max-w-[90px] block">{task.project_name ?? "—"}</span>
                              </td>
                              <td className="px-5 py-4 border-b border-[#F4F4F0] group-last:border-0">
                                {task.assignee_id ? (
                                  <div className="flex items-center gap-2">
                                    <Avatar
                                      url={task.assignee_avatar_url}
                                      name={task.assignee_name || "Unknown"}
                                      email={task.assignee_email}
                                      size={24}
                                      fallbackColor={strColor(task.assignee_id)}
                                    />
                                    <span className="text-[11px] text-[#111111] font-[700] truncate max-w-[60px]">{task.assignee_name?.split(" ")[0]}</span>
                                  </div>
                                ) : <span className="text-[11px] text-[#D1D5DB]">—</span>}
                              </td>
                              <td className="px-5 py-4 border-b border-[#F4F4F0] group-last:border-0">
                                <span className="text-[10px] font-[800] px-2.5 py-1 rounded-md shadow-sm inline-block tracking-tight" 
                                  style={{ color: s.fg, background: s.bg, border: `1px solid color-mix(in srgb, ${s.fg}, transparent 85%)` }}>
                                  {s.label.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-5 py-4 border-b border-[#F4F4F0] group-last:border-0 text-[11px] font-[800]"
                                style={{ color: age >= 5 ? "#ECB22E" : "#A0A09B" }}>
                                {age === 0 ? "TODAY" : `${age}D`}
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
 
      <div className="px-6 py-4 border-t border-[#F4F4F0] flex items-center justify-between flex-shrink-0 bg-[#FDFDFD]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-[800] text-[#111111]">
            {Math.min(startIdx + 1, tasks.length)}-{Math.min(startIdx + PAGE_SIZE, tasks.length)}
          </span>
          <span className="text-[11px] font-[600] text-[#A0A09B]">of {tasks.length} items</span>
        </div>
 
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-[#F4F4F0] text-[#111111] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all hover:bg-[#F9F9F8] hover:border-[#E0E0E0] active:scale-95 shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-6 h-6 rounded-md text-[11px] font-[800] transition-all border-0 cursor-pointer ${currentPage === i + 1 ? "bg-[#36C5F0] text-white shadow-sm" : "bg-transparent text-[#A0A09B] hover:text-[#111111]"}`}>
                  {i + 1}
                </button>
              )).slice(Math.max(0, currentPage - 2), Math.min(totalPages, currentPage + 1))}
            </div>
 
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-[#F4F4F0] text-[#111111] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all hover:bg-[#F9F9F8] hover:border-[#E0E0E0] active:scale-95 shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
