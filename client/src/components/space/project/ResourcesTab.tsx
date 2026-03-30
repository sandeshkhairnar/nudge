"use client";

import { motion } from "framer-motion";
import { FolderOpen, Link as LinkIcon, FileText, X, Book, Download, Eye, EyeOff, Copy, Check, Key } from "lucide-react";
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
      <div className="h-full overflow-y-auto p-4 sm:p-5">
        <div className="text-center py-12 text-gray-300">
          <FolderOpen size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-[13px] font-semibold">No resources yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(grouped).map(([cat, items], ci) => (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ci * 0.08 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                {cat}
              </span>
              <div className="h-px bg-gray-100 flex-1" />
            </div>

            {items.map((item, ii) => {
              const isRevealed = revealedIds.includes(item.id);
              const credentialValue = item.metadata?.value || "";

              return (
                <div
                  key={item.id}
                  className="bg-white border border-gray-100 rounded-[20px] p-4 hover:border-gray-200 hover:shadow-xl hover:shadow-black/5 transition-all group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-[14px] bg-gray-50 flex items-center justify-center text-lg shadow-sm border border-black/[0.03]">
                        {item.emoji || (item.type === "file" ? <FileText size={18} /> : item.type === "credential" ? <Key size={18} /> : <LinkIcon size={18} />)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[13.5px] font-bold text-gray-900 truncate tracking-tight">{item.label}</h4>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                          {item.type === "file" ? "File" : item.type === "credential" ? "Credential" : "Link"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="w-7 h-7 rounded-lg bg-gray-50 text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer border-0"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {item.type === "file" ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
                        <span className="truncate max-w-[120px]">{item.file_name}</span>
                        <span className="text-gray-300 font-black">{formatFileSize(item.file_size)}</span>
                      </div>
                      <a
                        href={item.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0D0D0D] text-white rounded-xl text-[12px] font-bold hover:bg-black transition-all shadow-lg shadow-black/10 no-underline"
                      >
                        <Download size={13} />
                        Download File
                      </a>
                    </div>
                  ) : item.type === "credential" ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 min-h-[40px] border border-black/[0.02]">
                        <code className="text-[12px] font-mono text-gray-600 truncate flex-1 block">
                          {isRevealed ? credentialValue : "••••••••••••••••"}
                        </code>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => toggleReveal(item.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors border-0 bg-transparent cursor-pointer"
                          >
                            {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(item.id, credentialValue)}
                            className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors border-0 bg-transparent cursor-pointer"
                          >
                            {copiedId === item.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <a
                      href={item.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 text-gray-700 rounded-xl text-[12px] font-bold hover:bg-gray-100 transition-all border border-black/[0.03] no-underline"
                    >
                      <LinkIcon size={13} className="text-gray-400" />
                      Visit Site
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
