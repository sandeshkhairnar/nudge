"use client";

import { useState } from "react";
import { Link2, Search, X, Link as LinkIcon, FileText } from "lucide-react";
import { linkTaskResource, unlinkTaskResource } from "@/lib/tasks";
import { Resource } from "@/types";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function TaskResourceLinker({
  targetId,
  targetType,
  projectId,
  linkedResources: initialResources,
  availableResources,
  onResourcesChange
}: {
  targetId: string;
  targetType: "task" | "subtask";
  projectId: string;
  linkedResources: Resource[];
  availableResources: Resource[];
  onResourcesChange?: (resources: Resource[]) => void;
}) {
  const [resources, setResources] = useState<Resource[]>(initialResources || []);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  const handleLink = async (resource: Resource) => {
    setIsLinking(true);
    const result = await linkTaskResource(targetType, targetId, resource.id, projectId);
    if (result.error) {
      toast.error(result.error);
    } else {
      const updated = [...resources, resource];
      setResources(updated);
      onResourcesChange?.(updated);
      toast.success("Resource linked");
    }
    setIsLinking(false);
    setIsSearching(false);
    setSearchQuery("");
  };

  const handleUnlink = async (resourceId: string) => {
    const result = await unlinkTaskResource(targetType, targetId, resourceId, projectId);
    if (!result.error) {
      const filtered = resources.filter(r => r.id !== resourceId);
      setResources(filtered);
      onResourcesChange?.(filtered);
    } else {
      toast.error(result.error);
    }
  };

  const unlinkedResources = availableResources.filter(
    ar => !resources.find(lr => lr.id === ar.id)
  );

  const filteredResources = unlinkedResources.filter(r => {
    const labelMatch = r.label ? r.label.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    const urlMatch = r.url ? r.url.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    return labelMatch || urlMatch;
  });

  return (
    <div className="space-y-3">
      {resources.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {resources.map((res) => (
            <div key={res.id} className="relative group border border-indigo-100 bg-indigo-50/50 rounded-lg p-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                {res.type === 'link' ? <LinkIcon size={14} /> : <FileText size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900 truncate">
                  {res.url ? <a href={res.url} target="_blank" rel="noreferrer" className="hover:underline">{res.label}</a> : res.label}
                </p>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider">{res.category}</p>
              </div>
              <button
                onClick={() => handleUnlink(res.id)}
                className="absolute top-1/2 -translate-y-1/2 right-2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                title="Unlink resource"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        {!isSearching ? (
          <button 
            onClick={() => setIsSearching(true)}
            className="w-full py-2.5 border border-dashed border-gray-300 rounded-lg text-[13px] font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white"
          >
            <Link2 size={16} /> Attach Project Resource
          </button>
        ) : (
          <div className="border border-indigo-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="flex items-center px-3 py-2 border-b border-indigo-100 bg-indigo-50/30">
              <Search size={14} className="text-gray-400 mr-2" />
              <input 
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search project resources..."
                className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-gray-400 text-gray-900"
              />
              <button onClick={() => setIsSearching(false)} className="p-1 rounded-md text-gray-400 hover:bg-gray-200 transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="max-h-[200px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {filteredResources.length === 0 ? (
                <div className="p-4 text-center text-[12px] text-gray-500">
                  {unlinkedResources.length === 0 ? "No more resources to link." : "No resources found matching search."}
                </div>
              ) : (
                <div className="p-1">
                  {filteredResources.map(res => (
                    <button
                      key={res.id}
                      disabled={isLinking}
                      onClick={() => handleLink(res)}
                      className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-3 cursor-pointer group border-0 disabled:opacity-50"
                    >
                      <div className="w-7 h-7 rounded bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 flex items-center justify-center flex-shrink-0 transition-colors">
                        {res.type === 'link' ? <LinkIcon size={12} /> : <FileText size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">{res.label}</p>
                        <p className="text-[11px] text-gray-500 truncate">{res.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
