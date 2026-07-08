"use client";

import { motion } from "framer-motion";
import { FolderOpen, Link as LinkIcon, FileText, X, Download, Eye, EyeOff, Copy, Check, Key, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Resource } from "@/types";

interface ResourcesTabProps {
  resources: Resource[];
  onDelete: (id: string) => void;
}

export default function ResourcesTab({ resources, onDelete }: ResourcesTabProps) {
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleReveal = (id: string) => {
    setRevealedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const copyToClipboard = (id: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const grouped = resources.reduce<Record<string, Resource[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (Object.keys(grouped).length === 0) {
    return (
      <div className="h-full overflow-y-auto p-4 sm:p-8">
        <div className="flex flex-col items-center justify-center py-20 text-gray-300 max-w-sm mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-150 flex items-center justify-center mb-4 shadow-sm text-gray-400">
            <FolderOpen size={24} />
          </div>
          <p className="text-[14px] font-bold text-gray-900 mb-1">No shared resources</p>
          <p className="text-[12.5px] font-medium text-gray-400">Share files, credentials, or website links directly with your team in channels.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-8">
      <div className="flex flex-col gap-1.5 pb-6">
        <h1 className="text-2xl font-black tracking-tight text-gray-900">Project Resources</h1>
        <p className="text-[13px] font-medium text-gray-500">Access documentation, links, and credentials stored inside this workspace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Object.entries(grouped).map(([cat, items], ci) => (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ci * 0.06 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center gap-3.5 mb-1 px-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                {cat}
              </span>
              <div className="h-px bg-gray-100 flex-1" />
              <span className="text-[10px] font-black text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            </div>

            {items.map((item) => {
              const isRevealed = revealedIds.includes(item.id);
              const credentialValue = item.metadata?.value || "";

              let colorClasses = "bg-blue-50 text-blue-600 border border-blue-100/50";
              let typeIcon = <FileText size={18} />;

              if (item.type === "credential") {
                colorClasses = "bg-amber-50 text-amber-600 border border-amber-100/50";
                typeIcon = <Key size={18} />;
              } else if (item.type === "link") {
                colorClasses = "bg-indigo-50 text-indigo-600 border border-indigo-100/50";
                typeIcon = <LinkIcon size={18} />;
              }

              return (
                <div
                  key={item.id}
                  className="bg-white border border-gray-100 rounded-2xl p-4.5 hover:border-gray-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all duration-350 group relative overflow-visible"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm ${colorClasses}`}>
                        {item.emoji || typeIcon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[13.5px] font-bold text-gray-800 truncate tracking-tight">{item.label}</h4>
                        <p className="text-[9.5px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                          {item.type === "file" ? "File Share" : item.type === "credential" ? "Secure Token" : "External URL"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-300 hover:text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer border-0 shadow-sm"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {item.type === "file" ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 bg-gray-50/60 border border-gray-100 rounded-xl px-3.5 py-2.5">
                        <span className="truncate max-w-[140px] text-gray-700">{item.file_name}</span>
                        <span className="text-gray-400 font-bold flex-shrink-0">{formatFileSize(item.file_size)}</span>
                      </div>
                      <a
                        href={item.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-[12px] font-black transition-all shadow-sm no-underline"
                      >
                        <Download size={13} />
                        Download File
                      </a>
                    </div>
                  ) : item.type === "credential" ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between bg-gray-50/60 border border-gray-100 rounded-xl px-3.5 py-2 min-h-[40px]">
                        <code className="text-[12px] font-mono text-gray-650 truncate flex-1 block select-all">
                          {isRevealed ? credentialValue : "••••••••••••••••"}
                        </code>
                        <div className="flex items-center gap-0.5 ml-2">
                          <button
                            onClick={() => toggleReveal(item.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-950 transition-colors border-0 bg-transparent cursor-pointer rounded-lg hover:bg-gray-200/40"
                          >
                            {isRevealed ? <EyeOff size={13.5} /> : <Eye size={13.5} />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(item.id, credentialValue)}
                            className="p-1.5 text-gray-400 hover:text-gray-950 transition-colors border-0 bg-transparent cursor-pointer rounded-lg hover:bg-gray-200/40"
                          >
                            {copiedId === item.id ? <Check size={13.5} className="text-emerald-500" /> : <Copy size={13.5} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <a
                      href={item.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-[12px] font-black transition-all no-underline"
                    >
                      <LinkIcon size={12} className="text-gray-400" />
                      <span>Visit Site</span>
                      <ExternalLink size={10} className="text-gray-450" />
                    </a>
                  )}
                </div>
              );
            })}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
