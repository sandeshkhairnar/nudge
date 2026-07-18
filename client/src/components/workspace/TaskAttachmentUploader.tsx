"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, File as FileIcon, Loader2 } from "lucide-react";
import { uploadTaskAttachment, deleteTaskAttachment } from "@/lib/tasks";
import { TaskAttachment } from "@/types";
import { toast } from "sonner";

export default function TaskAttachmentUploader({
  targetId,
  targetType,
  projectId,
  attachments: initialAttachments,
  onAttachmentsChange
}: {
  targetId: string;
  targetType: "task" | "subtask";
  projectId: string;
  attachments: TaskAttachment[];
  onAttachmentsChange?: (attachments: TaskAttachment[]) => void;
}) {
  const [attachments, setAttachments] = useState<TaskAttachment[]>(initialAttachments || []);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<TaskAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAttachments = [...attachments];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("id", targetId);
      formData.append("type", targetType);
      formData.append("projectId", projectId);

      const result = await uploadTaskAttachment(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.attachment) {
        newAttachments.push(result.attachment as TaskAttachment);
      }
    }

    setAttachments(newAttachments);
    onAttachmentsChange?.(newAttachments);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (id: string) => {
    const result = await deleteTaskAttachment(id, projectId);
    if (!result.error) {
      const filtered = attachments.filter(a => a.id !== id);
      setAttachments(filtered);
      onAttachmentsChange?.(filtered);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-3">
      {attachments.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          {attachments.map((att) => (
            <div key={att.id} onClick={() => setViewingAttachment(att)} className="relative group border border-gray-200 rounded-lg p-2 flex items-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              {att.file_type.startsWith("image/") ? (
                <img src={att.file_url} alt={att.file_name} className="w-10 h-10 object-cover rounded-md border border-gray-200" />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-md border border-gray-200 text-gray-500">
                  <FileIcon size={18} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-gray-900 truncate">{att.file_name}</p>
                <p className="text-[10px] text-gray-500">{(att.file_size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(att.id); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          isUploading ? "border-gray-200 bg-gray-50 cursor-not-allowed" : "border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/50"
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          accept="image/*,application/pdf"
          onChange={handleUpload}
          disabled={isUploading}
        />
        {isUploading ? (
          <Loader2 className="animate-spin text-indigo-500 mb-2" size={20} />
        ) : (
          <UploadCloud className="text-gray-400 mb-2" size={20} />
        )}
        <p className="text-[12px] font-semibold text-gray-700">
          {isUploading ? "Uploading..." : "Click or drag to upload"}
        </p>
        {!isUploading && <p className="text-[11px] text-gray-500 mt-1">Images or PDF up to 10MB</p>}
      </div>

      <AnimatePresence>
        {viewingAttachment && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setViewingAttachment(null)} 
              className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white rounded-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-w-4xl w-full max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3 truncate pr-4">
                  <span className="text-[14px] font-bold text-gray-900 truncate">{viewingAttachment.file_name}</span>
                  <span className="text-[12px] font-medium text-gray-500 flex-shrink-0">{(viewingAttachment.file_size / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex items-center gap-2">
                  <a href={viewingAttachment.file_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-[12px] font-semibold transition-colors flex-shrink-0 no-underline border border-indigo-200">
                    Open Original
                  </a>
                  <button onClick={() => setViewingAttachment(null)} className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent border-0 hover:bg-gray-200 cursor-pointer text-gray-500 transition-colors flex-shrink-0">
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-gray-100/50 p-4 flex justify-center items-center min-h-[300px]">
                {viewingAttachment.file_type.startsWith("image/") ? (
                  <img src={viewingAttachment.file_url} alt={viewingAttachment.file_name} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                ) : (
                  <iframe src={viewingAttachment.file_url} className="w-full h-[70vh] rounded-lg shadow-sm bg-white border border-gray-200" title={viewingAttachment.file_name} />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
