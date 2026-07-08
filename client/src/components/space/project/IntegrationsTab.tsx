"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, X, Github, GitCommit, GitPullRequest,
  GitMerge, CircleDot, ExternalLink, Star, GitFork, RefreshCw,
  Plus, Lock, Search, LogOut, Key, GitBranch, Zap, Tag, ChevronRight,
  Copy, Check
} from "lucide-react";
import { Integration, connectRepoToProject, deleteIntegration } from "@/lib/integrations";
import { timeAgo, normalizeRepoName } from "@/lib/github-api";
import { toast } from "sonner";

/* ── Types ───────────────────────────────────────────────── */
interface GitHubUserRepo {
  id: number; full_name: string; name: string; description: string | null;
  private: boolean; language: string | null; stargazers_count: number;
  updated_at: string; html_url: string;
  owner: { login: string; avatar_url: string };
}
interface GitHubRepoMeta {
  full_name: string; description: string | null; stargazers_count: number;
  forks_count: number; open_issues_count: number; language: string | null;
  html_url: string; private: boolean; owner: { login: string; avatar_url: string };
  default_branch: string;
}
interface GitHubCommit { sha: string; commit: { message: string; author: { name: string; date: string } }; author: { login: string; avatar_url: string } | null; html_url: string }
interface GitHubPR { id: number; number: number; title: string; state: string; merged_at: string | null; user: { login: string; avatar_url: string }; html_url: string; created_at: string }
interface GitHubIssue { id: number; number: number; title: string; state: string; user: { login: string; avatar_url: string }; html_url: string; created_at: string }
interface GitHubRelease { id: number; tag_name: string; name: string | null; published_at: string; author: { login: string; avatar_url: string }; html_url: string }
interface FeedData { repoData: GitHubRepoMeta; commits: GitHubCommit[]; pullRequests: GitHubPR[]; issues: GitHubIssue[]; releases: GitHubRelease[] }

/* ── Props ───────────────────────────────────────────────── */
interface SettingsTabProps {
  repoInput: string;
  integrations: Integration[];
  intLoading: boolean;
  projectId: string;
  workspaceId: string;
  onRepoInputChange: (v: string) => void;
  onConnectRepo: () => void;
  onDeleteIntegration: (id: string) => void;
  onIntegrationsChange?: () => void;
}

/* ── UI Components ───────────────────────────────────────── */
const LANG: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Go: "#00ADD8", Rust: "#dea584", Ruby: "#701516",
  "C#": "#178600", Java: "#b07219", Kotlin: "#A97BFF", Swift: "#F05138",
};

function LangDot({ lang }: { lang: string | null }) {
  if (!lang) return null;
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: LANG[lang] ?? "#aaa" }} />
      {lang}
    </span>
  );
}

function UA({ url, name, size = 20 }: { url?: string; name: string; size?: number }) {
  const s = `${size}px`;
  if (url) return <img src={url} alt={name} className="rounded-full border border-gray-100 shadow-sm flex-shrink-0" style={{ width: s, height: s }} />;
  return (
    <div className="rounded-full border border-gray-200 shadow-sm flex-shrink-0 bg-gray-100 flex items-center justify-center" style={{ width: s, height: s }}>
      <span className="text-[10px] font-black text-gray-500 uppercase">{name[0]}</span>
    </div>
  );
}

type FeedType = "commit" | "pr" | "issue" | "release" | "ring";
const FEED_STYLE: Record<FeedType, { bg: string; icon: React.ReactNode }> = {
  commit: { bg: "#0D0D0D", icon: <GitCommit size={12} color="#fff" /> },
  pr: { bg: "#4F46E5", icon: <GitPullRequest size={12} color="#fff" /> },
  issue: { bg: "#EF4444", icon: <CircleDot size={12} color="#fff" /> },
  ring: { bg: "#10B981", icon: <Tag size={12} color="#fff" /> },
  release: { bg: "#10B981", icon: <Tag size={12} color="#fff" /> },
};
function FeedDot({ type, merged }: { type: FeedType; merged?: boolean }) {
  const bg = type === "pr" && merged ? "#8B5CF6" : FEED_STYLE[type].bg;
  const icon = type === "pr" && merged ? <GitMerge size={12} color="#fff" /> : FEED_STYLE[type].icon;
  return (
    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full shadow-[0_0_0_4px_#fff,0_1px_3px_rgba(0,0,0,0.1)]" style={{ background: bg }}>
      {icon}
    </div>
  );
}

function StatChip({ icon, value, color }: { icon: React.ReactNode; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
      <span style={{ color }}>{icon}</span>
      <span className="text-[11px] font-bold text-gray-600">{value}</span>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white border border-gray-100/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function TabRow({ tabs, active, onChange }: { tabs: { id: string; label: string; count: number }[]; active: string; onChange: (id: string) => void; }) {
  return (
    <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 bg-gray-50/55 overflow-x-auto no-scrollbar">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-0 cursor-pointer transition-all duration-200 whitespace-nowrap ${active === t.id
              ? "bg-[#0D0D0D] text-white shadow-sm"
              : "bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
            }`}
        >
          <span className="text-[12px] font-bold">{t.label}</span>
          <span className={`flex items-center justify-center h-4.5 min-w-[18px] px-1.5 rounded-full text-[9px] font-black ${active === t.id ? "bg-white/20 text-white" : "bg-gray-200/60 text-gray-500"}`}>{t.count}</span>
        </button>
      ))}
    </div>
  );
}

function FeedItem({ title, meta, href, isLast, type, merged }: { title: string; meta: React.ReactNode; href: string; isLast: boolean; type: FeedType; merged?: boolean }) {
  return (
    <div className="flex gap-4 px-6 pt-5 group">
      <div className="flex flex-col items-center">
        <FeedDot type={type} merged={merged} />
        {!isLast && <div className="w-0.5 flex-1 bg-gray-100 mt-2 min-h-[24px]" />}
      </div>
      <a href={href} target="_blank" rel="noopener noreferrer" className={`flex-1 min-w-0 no-underline pb-5 ${!isLast ? "border-b border-gray-100" : ""}`}>
        <div className="p-4 rounded-xl border border-transparent bg-gray-50/40 group-hover:bg-gray-50/90 group-hover:border-gray-100 transition-all duration-200">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-semibold text-gray-900 leading-relaxed line-clamp-2">{title}</p>
            <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all mt-1 flex-shrink-0" />
          </div>
          <div className="flex items-center gap-2 mt-2">{meta}</div>
        </div>
      </a>
    </div>
  );
}

function MetaTag({ children }: { children: React.ReactNode }) { return <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{children}</span>; }
function Dot() { return <span className="text-gray-300 text-[10px]">·</span>; }
function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider" style={{ color, background: bg }}>{label}</span>;
}

/* ── Main Component ───────────────────────────────────────── */
export default function IntegrationsTab({
  repoInput, integrations, intLoading, projectId, workspaceId,
  onRepoInputChange, onConnectRepo, onDeleteIntegration, onIntegrationsChange,
}: SettingsTabProps) {
  const accountIntg = integrations.find(i => i.provider === "github_account") ?? null;
  const repoIntg = integrations.find(i => i.provider === "github") ?? null;

  const githubLogin = accountIntg?.metadata?.github_login as string | undefined;
  const githubAvatar = accountIntg?.metadata?.github_avatar_url as string | undefined;

  const [feed, setFeed] = useState<FeedData | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedTab, setFeedTab] = useState<"commits" | "prs" | "issues" | "releases">("commits");

  const [showPicker, setShowPicker] = useState(false);
  const [userRepos, setUserRepos] = useState<GitHubUserRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [repoSearch, setRepoSearch] = useState("");
  const [connectingId, setConnectingId] = useState<number | null>(null);

  const [showPatInput, setShowPatInput] = useState(false);
  const [patValue, setPatValue] = useState("");
  const [savingPat, setSavingPat] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("github_connected") === "1") {
      toast.success("GitHub account connected!");
      sp.delete("github_connected"); sp.delete("github_login");
      window.history.replaceState({}, "", window.location.pathname + (sp.toString() ? `?${sp}` : ""));
      onIntegrationsChange?.();
    }
  }, []);

  const loadFeed = useCallback(async (intg: Integration) => {
    if (!intg.repo_full_name) return;
    setFeedLoading(true);
    try {
      const qs = new URLSearchParams({ repo: intg.repo_full_name });
      const token = intg.access_token ?? accountIntg?.access_token ?? null;
      if (token) qs.set("token", token);
      const res = await fetch(`/api/github/repo-data?${qs}`);
      const data = await res.json();
      if (res.ok) setFeed(data);
    } catch { toast.error("Failed to load activity feed"); }
    finally { setFeedLoading(false); }
  }, [accountIntg?.access_token]);

  useEffect(() => { if (repoIntg) loadFeed(repoIntg); }, [repoIntg?.id, loadFeed]);

  const fetchUserRepos = async () => {
    if (!accountIntg?.access_token) return;
    setReposLoading(true);
    try {
      const res = await fetch(`/api/github/user-repos?token=${accountIntg.access_token}${repoSearch ? `&q=${encodeURIComponent(repoSearch)}` : ""}`);
      const data = await res.json();
      if (res.ok) setUserRepos(data.repos ?? []);
    } catch { toast.error("Failed to fetch repositories"); }
    finally { setReposLoading(false); }
  };

  const openPicker = () => { setShowPicker(true); fetchUserRepos(); };

  const handlePickRepo = async (repo: GitHubUserRepo) => {
    setConnectingId(repo.id);
    if (repoIntg) await deleteIntegration(repoIntg.id, projectId);
    const res = await connectRepoToProject({ workspaceId, projectId, repoFullName: repo.full_name, repoId: repo.id, accessToken: accountIntg?.access_token ?? "" });
    if (!res.error) { toast.success(`${repo.name} connected!`); setShowPicker(false); onIntegrationsChange?.(); }
    setConnectingId(null);
  };

  const savePat = async () => {
    const normalized = normalizeRepoName(repoInput.trim()) ?? repoInput.trim();
    if (!normalized) return toast.error("Invalid repo format");
    setSavingPat(true);
    if (repoIntg) await deleteIntegration(repoIntg.id, projectId);
    const res = await connectRepoToProject({ workspaceId, projectId, repoFullName: normalized, accessToken: patValue.trim() });
    if (!res.error) { toast.success("Connected via token!"); setShowPatInput(false); setPatValue(""); onIntegrationsChange?.(); }
    setSavingPat(false);
  };

  const disconnectAccount = async () => {
    if (repoIntg) await deleteIntegration(repoIntg.id, projectId);
    if (accountIntg) await deleteIntegration(accountIntg.id, projectId);
    toast.success("GitHub disconnected");
    setFeed(null);
    onIntegrationsChange?.();
  };

  const handleCopyWebhook = () => {
    const origin = typeof window !== "undefined" ? window.location.origin.replace("3000", "8000") : "";
    const url = `${origin}/webhooks/github`;
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    toast.success("Webhook URL copied to clipboard!");
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const oauthUrl = (() => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    if (!clientId || typeof window === "undefined") return null;
    const state = btoa(JSON.stringify({ projectId, workspaceId, returnUrl: window.location.href }));
    return `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read%3Auser%2Crepo&state=${state}`;
  })();

  const connectedFullName = repoIntg?.repo_full_name
    ? normalizeRepoName(repoIntg.repo_full_name) ?? repoIntg.repo_full_name
    : null;

  const feedTabs = [
    { id: "commits", label: "Commits", count: feed?.commits.length ?? 0 },
    { id: "prs", label: "PRs", count: feed?.pullRequests.length ?? 0 },
    { id: "issues", label: "Issues", count: feed?.issues.length ?? 0 },
    { id: "releases", label: "Releases", count: feed?.releases.length ?? 0 },
  ];

  const filteredRepos = userRepos.filter(r => r.full_name.toLowerCase().includes(repoSearch.toLowerCase()));

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-1.5 pb-2">
        <h1 className="text-2xl font-black tracking-tight text-gray-900">Codebase Integrations</h1>
        <p className="text-[13px] font-medium text-gray-500">Connect GitHub to monitor commits, pull requests, releases, and stream activity to Nudge.</p>
      </div>

      {/* ── Status Card ── */}
      <Card>
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 bg-gray-50/40">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white border border-gray-150 flex items-center justify-center shadow-sm">
              <Github size={22} className="text-gray-900" />
            </div>
            <div>
              <h3 className="text-[15px] font-black text-gray-900">GitHub Workspace</h3>
              <p className="text-[12px] text-gray-400 font-bold">
                {repoIntg ? "Connected and streaming repository telemetry" : "Sync codebase updates directly to Nudge channels"}
              </p>
            </div>
          </div>
          {repoIntg && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
            </div>
          )}
        </div>

        <div className="p-6">
          {!repoIntg && !accountIntg && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="flex flex-col justify-center space-y-4 pr-0 md:pr-6 border-r-0 md:border-r border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Zap size={20} className="fill-indigo-600" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-gray-900">OAuth Connection</h4>
                  <p className="text-[12px] text-gray-500 mt-1 leading-relaxed font-medium">
                    Authenticate directly using GitHub. This grants access to scan your repositories, branches, and stream webhooks instantly.
                  </p>
                </div>
                {oauthUrl ? (
                  <a href={oauthUrl} className="h-11 px-5 rounded-xl bg-gray-900 text-white no-underline font-bold text-[13px] flex items-center justify-center gap-2 hover:bg-black transition-all cursor-pointer shadow-sm">
                    <Github size={16} /> Connect GitHub Account
                  </a>
                ) : (
                  <div className="px-4 py-2.5 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-700 font-bold">
                    Client ID missing in environment setup.
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between space-y-4 pl-0 md:pl-6">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                    <Key size={18} />
                  </div>
                  <h4 className="text-[14px] font-bold text-gray-900 mt-4">Personal Access Token</h4>
                  <p className="text-[12px] text-gray-500 mt-1 leading-relaxed font-medium">
                    Prefer scoped access? Link a single repository directly by providing a Personal Access Token (PAT).
                  </p>
                </div>
                <div>
                  <button onClick={() => setShowPatInput(!showPatInput)} className="h-11 w-full px-5 rounded-xl bg-gray-100 text-gray-700 border border-gray-200/80 font-bold text-[13px] cursor-pointer hover:bg-gray-200/80 transition-all">
                    {showPatInput ? "Collapse Inputs" : "Use Token Credentials"}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showPatInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="col-span-1 md:col-span-2 overflow-hidden pt-4 border-t border-gray-100"
                  >
                    <div className="max-w-md mx-auto space-y-3.5 text-left py-2">
                      <div>
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">Repository URL / Name</label>
                        <input value={repoInput} onChange={(e) => onRepoInputChange(e.target.value)} placeholder="e.g. facebook/react" className="h-11 w-full px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-[13px] outline-none focus:border-gray-900 focus:bg-white transition-all font-semibold text-gray-800" />
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">Personal Access Token</label>
                        <input value={patValue} onChange={(e) => setPatValue(e.target.value)} type="password" placeholder="ghp_..." className="h-11 w-full px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-[12px] font-mono outline-none focus:border-gray-900 focus:bg-white transition-all text-gray-800" />
                      </div>
                      <button onClick={savePat} disabled={savingPat || !patValue || !repoInput} className="h-11 w-full rounded-xl bg-gray-900 text-white font-black text-[13px] cursor-pointer disabled:opacity-50 hover:bg-black transition-colors shadow-sm mt-2">
                        {savingPat ? "Connecting Codebase..." : "Save Credentials"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {accountIntg && !repoIntg && (
            <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-150 shadow-inner">
              <div className="flex items-center gap-3.5">
                <UA url={githubAvatar} name={githubLogin ?? "G"} size={42} />
                <div>
                  <p className="font-black text-[14px] text-gray-900">@{githubLogin}</p>
                  <button onClick={openPicker} className="bg-transparent border-0 text-indigo-600 font-bold text-[12px] cursor-pointer p-0 mt-1 hover:underline hover:text-indigo-800 transition-colors">
                    Link a repository to this project
                  </button>
                </div>
              </div>
              <button onClick={disconnectAccount} title="Disconnect Github" className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors bg-white hover:bg-red-50 border border-gray-200 rounded-xl cursor-pointer shadow-sm">
                <LogOut size={16} />
              </button>
            </div>
          )}

          {repoIntg && (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-gray-50/60 border border-gray-100 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-white border border-gray-150 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                  {feed?.repoData?.owner.avatar_url ? (
                    <img src={feed.repoData.owner.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Github size={22} className="text-gray-600" />
                  )}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-[15px] text-gray-900 truncate">{connectedFullName}</p>
                    {feed?.repoData?.private ? (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 border border-gray-200 text-gray-500 rounded text-[9px] font-black uppercase">
                        <Lock size={8} /> Private
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded text-[9px] font-black uppercase">
                        Public
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 font-bold mt-0.5">Linked {timeAgo(repoIntg.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                {accountIntg && (
                  <button onClick={openPicker} className="flex-1 md:flex-none h-10 px-4 rounded-xl bg-white border border-gray-200 text-[12px] font-bold text-gray-700 hover:border-gray-900 transition-all cursor-pointer shadow-sm">
                    Change Repo
                  </button>
                )}
                <button onClick={() => { onDeleteIntegration(repoIntg.id); setFeed(null); }} className="h-10 px-4 flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-red-50 border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 transition-all cursor-pointer shadow-sm">
                  <X size={15} /> <span className="text-[12px] font-bold">Disconnect</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ── Activity Feed ── */}
      {repoIntg && (
        <AnimatePresence mode="wait">
          {feedLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-gray-400 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <Loader2 size={28} className="animate-spin text-indigo-600" />
              <p className="font-black text-[11px] text-gray-800 tracking-wider uppercase">Loading repository telemetry...</p>
            </div>
          ) : feedTab && feed ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Repository Feed</h4>
                <div className="flex items-center gap-2.5">
                  <StatChip icon={<Star size={12} className="fill-amber-400 text-amber-400" />} value={feed.repoData.stargazers_count} color="#F59E0B" />
                  <StatChip icon={<GitFork size={12} />} value={feed.repoData.forks_count} color="#00ADD8" />
                  <div className="w-px h-4 bg-gray-200 mx-1" />
                  <button onClick={() => loadFeed(repoIntg)} title="Reload activity" className="w-8 h-8 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors cursor-pointer shadow-sm">
                    <RefreshCw size={13} />
                  </button>
                </div>
              </div>

              <Card>
                <TabRow tabs={feedTabs} active={feedTab} onChange={(id) => setFeedTab(id as any)} />
                <div className="divide-y divide-gray-100 min-h-[300px] pb-4">
                  {feedTab === "commits" && feed.commits.length === 0 && <div className="py-24 text-center font-bold text-gray-400 text-[13px]">No recent commits found</div>}
                  {feedTab === "commits" && feed.commits.slice(0, 8).map((c, i) => (
                    <FeedItem key={c.sha} type="commit" href={c.html_url} title={c.commit.message.split("\n")[0]} isLast={i === 7 || i === feed.commits.length - 1} meta={<><UA url={c.author?.avatar_url} name={c.commit.author.name} size={18} /><MetaTag>{c.author?.login || c.commit.author.name}</MetaTag><Dot /><MetaTag>{timeAgo(c.commit.author.date)}</MetaTag></>} />
                  ))}

                  {feedTab === "prs" && feed.pullRequests.length === 0 && <div className="py-24 text-center font-bold text-gray-400 text-[13px]">No open pull requests</div>}
                  {feedTab === "prs" && feed.pullRequests.slice(0, 8).map((pr, i) => (
                    <FeedItem key={pr.id} type="pr" merged={!!pr.merged_at} href={pr.html_url} title={pr.title} isLast={i === 7 || i === feed.pullRequests.length - 1} meta={<><UA url={pr.user.avatar_url} name={pr.user.login} size={18} /><MetaTag>#{pr.number}</MetaTag><Dot /><MetaTag>{timeAgo(pr.created_at)}</MetaTag></>} />
                  ))}

                  {feedTab === "issues" && feed.issues.length === 0 && <div className="py-24 text-center font-bold text-gray-400 text-[13px]">No active issues</div>}
                  {feedTab === "issues" && feed.issues.slice(0, 8).map((issue, i) => (
                    <FeedItem key={issue.id} type="issue" href={issue.html_url} title={issue.title} isLast={i === 7 || i === feed.issues.length - 1} meta={<><UA url={issue.user.avatar_url} name={issue.user.login} size={18} /><MetaTag>#{issue.number}</MetaTag><Dot /><MetaTag>{timeAgo(issue.created_at)}</MetaTag></>} />
                  ))}

                  {feedTab === "releases" && feed.releases.length === 0 && <div className="py-24 text-center font-bold text-gray-400 text-[13px]">No releases found</div>}
                  {feedTab === "releases" && feed.releases.slice(0, 8).map((rel, i) => (
                    <FeedItem key={rel.id} type="release" href={rel.html_url} title={rel.name || rel.tag_name} isLast={i === 7 || i === feed.releases.length - 1} meta={<><Badge label={rel.tag_name} color="#10B981" bg="#ECFDF5" /><Dot /><MetaTag>{timeAgo(rel.published_at)}</MetaTag></>} />
                  ))}
                </div>
                <div className="px-6 py-4 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Synchronized telemetry</span>
                  </div>
                  <a href={`https://github.com/${connectedFullName}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 no-underline">
                    VIEW ON GITHUB <ExternalLink size={10} />
                  </a>
                </div>
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>
      )}

      {/* ── Webhook Info ── */}
      {!repoIntg && (
        <div className="p-6 rounded-2xl bg-gray-50/55 border border-gray-100 flex items-start gap-4 shadow-inner">
          <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Zap size={18} className="text-amber-500 fill-amber-500/10" />
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-[13.5px] font-bold text-gray-900">Enable Push Notifications</h5>
            <p className="text-[12px] text-gray-500 mt-1 leading-relaxed font-semibold">
              Get instant chat alerts when team members push code or open PRs. Add this Webhook URL in your GitHub repository settings under **Settings &gt; Webhooks**:
            </p>
            <div className="flex items-center gap-2 mt-3.5 max-w-xl">
              <code className="flex-1 p-3 bg-white rounded-xl text-[11px] font-mono text-gray-600 border border-gray-150 truncate select-all">
                {typeof window !== "undefined" ? window.location.origin.replace("3000", "8000") : ""}/webhooks/github
              </code>
              <button
                onClick={handleCopyWebhook}
                className="h-10 px-4 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                {copiedWebhook ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                {copiedWebhook ? "Copied!" : "Copy URL"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Picker Modal ── */}
      <AnimatePresence>
        {showPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/45 backdrop-blur-sm" onClick={() => setShowPicker(false)}>
            <motion.div initial={{ scale: 0.96, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 16 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-white rounded-[24px] overflow-hidden flex flex-col shadow-2xl h-[75vh] border border-gray-100">
              <div className="px-8 py-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[17px] font-black tracking-tight text-gray-900">Select Repository</h3>
                    <p className="text-[12px] font-bold text-gray-400 mt-1">Connect repository to sync commits &amp; metadata</p>
                  </div>
                  <button onClick={() => setShowPicker(false)} className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-150 rounded-2xl cursor-pointer text-gray-400 hover:text-gray-900 transition-colors">
                    <X size={18} />
                  </button>
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={repoSearch} onChange={(e) => setRepoSearch(e.target.value)} placeholder="Search repositories..." className="w-full h-12 bg-gray-50/50 border border-gray-200/80 rounded-xl pl-11 pr-4 text-gray-900 text-[13.5px] outline-none focus:border-gray-900 focus:bg-white transition-all font-semibold" autoFocus />
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-4 no-scrollbar divide-y divide-gray-50">
                {reposLoading ? (
                  <div className="py-24 flex flex-col items-center gap-3 text-gray-400">
                    <Loader2 size={28} className="animate-spin text-indigo-600" />
                    <p className="font-black text-[12px] text-gray-800 tracking-wider uppercase">Loading repositories</p>
                  </div>
                ) : filteredRepos.length === 0 ? (
                  <div className="py-20 text-center font-bold text-gray-400 text-[13px]">No repositories found</div>
                ) : filteredRepos.map((repo) => {
                  const isActive = connectedFullName === repo.full_name;
                  const isLoading = connectingId === repo.id;
                  return (
                    <div key={repo.id} onClick={() => !isLoading && handlePickRepo(repo)} className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${isActive ? "bg-indigo-50/40" : "hover:bg-gray-50"}`}>
                      <div className="flex items-center gap-4.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200/60 shadow-inner">
                          {repo.private ? <Lock size={15} className="text-gray-500" /> : <GitBranch size={15} className="text-gray-500" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[13.5px] text-gray-900 truncate">{repo.full_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <LangDot lang={repo.language} />
                            <Dot />
                            <span className="text-[10px] font-bold text-gray-400">Modified {timeAgo(repo.updated_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        {isActive ? (
                          <Badge label="Active" color="#4F46E5" bg="#EEF2F6" />
                        ) : isLoading ? (
                          <Loader2 size={16} className="animate-spin text-gray-300" />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                            <Plus size={14} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}