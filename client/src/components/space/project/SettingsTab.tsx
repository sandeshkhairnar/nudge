"use client";

import { Loader2, X, Github, AlertCircle } from "lucide-react";
import { Integration } from "@/lib/integrations";

interface SettingsTabProps {
  repoInput: string;
  integrations: Integration[];
  intLoading: boolean;
  onRepoInputChange: (value: string) => void;
  onConnectRepo: () => void;
  onDeleteIntegration: (id: string) => void;
}

export default function SettingsTab({
  repoInput,
  integrations,
  intLoading,
  onRepoInputChange,
  onConnectRepo,
  onDeleteIntegration,
}: SettingsTabProps) {
  const githubIntegrations = integrations.filter((i) => i.provider === "github");

  return (
    <div className="p-4 sm:p-5 max-w-2xl">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white">
            <Github size={20} />
          </div>
          <div>
            <h3 className="text-[15px] font-black text-gray-900">GitHub Integration</h3>
            <p className="text-[12px] text-gray-400">
              Connect a repository to track activity and automate nudges.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={repoInput}
              onChange={(e) => onRepoInputChange(e.target.value)}
              placeholder="org/repo (e.g. google/nudge)"
              className="flex-1 px-4 py-2.5 bg-[#F9F9F7] border border-gray-100 rounded-xl text-[13.5px] font-medium outline-none focus:border-gray-300 transition-all"
            />
            <button
              onClick={onConnectRepo}
              disabled={intLoading || !repoInput.trim()}
              className="px-6 py-2.5 bg-[#0D0D0D] text-white rounded-xl text-[13px] font-bold disabled:opacity-50 cursor-pointer border-0"
            >
              {intLoading ? <Loader2 size={14} className="animate-spin" /> : "Connect"}
            </button>
          </div>

          <div className="pt-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
              Active Connections
            </p>
            {githubIntegrations.length === 0 ? (
              <p className="text-[12px] text-gray-300 italic">No repositories connected yet.</p>
            ) : (
              <div className="space-y-2">
                {githubIntegrations.map((intg) => (
                  <div
                    key={intg.id}
                    className="flex items-center justify-between p-3 bg-[#F9F9F7] rounded-xl border border-gray-100 group"
                  >
                    <div className="flex items-center gap-3">
                      <Github size={14} className="text-gray-400" />
                      <span className="text-[13px] font-semibold text-gray-700">
                        {intg.repo_full_name}
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteIntegration(intg.id)}
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
            {typeof window !== "undefined"
              ? window.location.origin.replace("3000", "8000")
              : ""}
            /webhooks/github
          </code>
        </div>
      </div>
    </div>
  );
}
