"use client";

import { motion } from "framer-motion";
import { FolderOpen, Link as LinkIcon, FileText, X, Book } from "lucide-react";
import { Resource } from "@/types";

interface ResourcesTabProps {
  resources: Resource[];
  onDelete: (id: string) => void;
}

export default function ResourcesTab({ resources, onDelete }: ResourcesTabProps) {
  const grouped = resources.reduce<Record<string, Resource[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  if (Object.keys(grouped).length === 0) {
    return (
      <div className="p-4 sm:p-5">
        <div className="text-center py-12 text-gray-300">
          <FolderOpen size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-[13px] font-semibold">No resources yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(grouped).map(([cat, items], ci) => (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ci * 0.06 }}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-200 transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">
                {items[0]?.emoji ? items[0].emoji : <Book size={16} />}
              </span>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white bg-gray-500">
                {cat}
              </span>
            </div>
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
                    className="flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-700 hover:text-gray-900 no-underline flex-1 min-w-0"
                  >
                    <LinkIcon size={11} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </a>
                ) : (
                  <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-700 flex-1 min-w-0">
                    <FileText size={11} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                )}
                <button
                  onClick={() => onDelete(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-gray-300 hover:text-red-400 ml-2 border-0 bg-transparent flex-shrink-0"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
