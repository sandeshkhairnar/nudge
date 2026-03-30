"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, X, Github, AlertCircle, GitCommit, GitPullRequest,
  GitMerge, CircleDot, ExternalLink, Star, GitFork, RefreshCw,
  Plus, ArrowUpRight, Lock, Search,
  LogOut, Key, Pencil, GitBranch, ChevronRight, Zap, Tag
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

/* ── Language colours ────────────────────────────────────── */
const LANG: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Go: "#00ADD8", Rust: "#dea584", Ruby: "#701516",
  "C#": "#178600", Java: "#b07219", Kotlin: "#A97BFF", Swift: "#F05138",
};

function LangDot({ lang }: { lang: string | null }) {
  if (!lang) return null;
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#888" }}>
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: LANG[lang] ?? "#aaa" }} />
      {lang}
    </span>
  );
}

function UA({ url, name, size = 20 }: { url?: string; name: string; size?: number }) {
  const s = `${size}px`;
  const base: React.CSSProperties = { width: s, height: s, borderRadius: "50%", flexShrink: 0, border: "2px solid #fff", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" };
  if (url) return <img src={url} alt={name} style={base} />;
  return (
    <div style={{ ...base, background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: 8, fontWeight: 900, color: "#374151", textTransform: "uppercase" }}>{name[0]}</span>
    </div>
  );
}

/* ── Feed type icon ───────────────────────────────────── */
type FeedType = "commit" | "pr" | "issue" | "release";
const FEED_STYLE: Record<FeedType, { bg: string; icon: React.ReactNode }> = {
  commit: { bg: "#18181B", icon: <GitCommit size={11} color="#fff" /> },
  pr: { bg: "#36C5F0", icon: <GitPullRequest size={11} color="#fff" /> },
  issue: { bg: "#E01E5A", icon: <CircleDot size={11} color="#fff" /> },
  release: { bg: "#2EB67D", icon: <Tag size={11} color="#fff" /> },
};
function FeedDot({ type, merged }: { type: FeedType; merged?: boolean }) {
  const bg = type === "pr" && merged ? "#8B5CF6" : FEED_STYLE[type].bg;
  const icon = type === "pr" && merged ? <GitMerge size={11} color="#fff" /> : FEED_STYLE[type].icon;
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center rounded-full"
      style={{ width: 28, height: 28, background: bg, boxShadow: `0 0 0 3px #fff, 0 0 0 4px ${bg}22` }}
    >
      {icon}
    </div>
  );
}

/* ── Stat chip ──────────────────────────────────────────── */
function StatChip({ icon, value, color }: { icon: React.ReactNode; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "#F4F4F1" }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#555" }}>{value}</span>
    </div>
  );
}

/* ── Section card ───────────────────────────────────────── */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[20px] overflow-hidden ${className}`}
      style={{ background: "#fff", border: "1px solid #EBEBEB", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}
    >
      {children}
    </div>
  );
}

/* ── Card header (dark) ─────────────────────────────────── */
function CardHeader({ icon, title, subtitle, right }: {
  icon: React.ReactNode; title: string; subtitle?: string; right?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4"
      style={{ background: "#0C0C0C", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex items-center justify-center rounded-[10px] flex-shrink-0"
          style={{ width: 34, height: 34, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate" style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{title}</p>
          {subtitle && <p className="truncate" style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginTop: 1 }}>{subtitle}</p>}
        </div>
      </div>
      {right && <div className="flex-shrink-0 ml-3">{right}</div>}
    </div>
  );
}

/* ── Tab pill row ───────────────────────────────────────── */
function TabRow({ tabs, active, onChange }: {
  tabs: { id: string; label: string; count: number }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 px-4 py-2.5 overflow-x-auto" style={{ borderBottom: "1px solid #F0F0EB", scrollbarWidth: "none" }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-0 cursor-pointer transition-all whitespace-nowrap flex-shrink-0"
          style={{
            fontSize: 12, fontWeight: 700,
            background: active === t.id ? "#0C0C0C" : "transparent",
            color: active === t.id ? "#fff" : "#9CA3AF",
          }}
        >
          {t.label}
          <span
            className="flex items-center justify-center rounded-full"
            style={{
              minWidth: 16, height: 16, paddingLeft: 4, paddingRight: 4,
              fontSize: 9, fontWeight: 900,
              background: active === t.id ? "rgba(255,255,255,0.15)" : "#F0F0EB",
              color: active === t.id ? "#fff" : "#9CA3AF",
            }}
          >
            {t.count}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── Feed item row ───────────────────── */
function FeedItem({ type, merged, title, meta, href, isLast }: {
  type: FeedType; merged?: boolean;
  title: string; meta: React.ReactNode;
  href: string; isLast: boolean;
}) {
  return (
    <div className="flex gap-4 px-5" style={{ paddingTop: 14, paddingBottom: isLast ? 14 : 0 }}>
      <div className="flex flex-col items-center flex-shrink-0">
        <FeedDot type={type} merged={merged} />
        {!isLast && <div style={{ width: 1.5, flex: 1, background: "#F0F0EB", marginTop: 8, minHeight: 18 }} />}
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-w-0 no-underline group pb-4"
        style={{ borderBottom: isLast ? "none" : "1px solid #F7F7F5" }}
      >
        <div
          className="rounded-2xl px-4 py-3.5 transition-all"
          style={{ background: "#FAFAFA" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#F4F4F1";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#FAFAFA";
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="line-clamp-2 leading-relaxed flex-1" style={{ fontSize: 13, fontWeight: 600, color: "#111", letterSpacing: "-0.01em" }}>
              {title}
            </p>
            <ChevronRight size={14} style={{ color: "#D1D5DB", marginTop: 2 }} className="group-hover:text-gray-500 transition-colors" />
          </div>
          <div className="flex items-center gap-2.5 flex-wrap mt-2">{meta}</div>
        </div>
      </a>
    </div>
  );
}

function MetaTag({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{children}</span>;
}
function Dot() {
  return <span style={{ color: "#E5E7EB", fontSize: 10 }}>·</span>;
}
function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full"
      style={{ fontSize: 9, fontWeight: 900, color, background: bg, letterSpacing: "0.06em", textTransform: "uppercase" }}
    >
      {label}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function SettingsTab({
  repoInput, integrations, intLoading, projectId, workspaceId,
  onRepoInputChange, onConnectRepo, onDeleteIntegration, onIntegrationsChange,
}: SettingsTabProps) {
  const accountIntg = integrations.find((i) => i.provider === "github_account") ?? null;
  const repoIntg = integrations.find((i) => i.provider === "github") ?? null;

  const githubLogin = accountIntg?.metadata?.github_login as string | undefined;
  const githubAvatar = accountIntg?.metadata?.github_avatar_url as string | undefined;
  const githubName = accountIntg?.metadata?.github_name as string | undefined;

  const [feed, setFeed] = useState<FeedData | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [feedTab, setFeedTab] = useState<"commits" | "prs" | "issues" | "releases">("commits");

  const [showPicker, setShowPicker] = useState(false);
  const [userRepos, setUserRepos] = useState<GitHubUserRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [repoSearch, setRepoSearch] = useState("");
  const [connectingId, setConnectingId] = useState<number | null>(null);

  const [showPatInput, setShowPatInput] = useState(false);
  const [patValue, setPatValue] = useState("");
  const [savingPat, setSavingPat] = useState(false);

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
    setFeedLoading(true); setFeedError(null);
    try {
      const qs = new URLSearchParams({ repo: intg.repo_full_name });
      const token = intg.access_token ?? accountIntg?.access_token ?? null;
      if (token) qs.set("token", token);
      const res = await fetch(`/api/github/repo-data?${qs}`);
      const data = await res.json();
      if (!res.ok) setFeedError(data.error ?? "Failed to load feed");
      else setFeed(data);
    } catch { setFeedError("GitHub unreachable"); }
    finally { setFeedLoading(false); }
  }, [accountIntg?.access_token]);

  useEffect(() => { if (repoIntg) loadFeed(repoIntg); }, [repoIntg?.id]);

  const fetchUserRepos = async () => {
    if (!accountIntg?.access_token) return;
    setReposLoading(true);
    try {
      const res = await fetch(`/api/github/user-repos?token=${accountIntg.access_token}${repoSearch ? `&q=${encodeURIComponent(repoSearch)}` : ""}`);
      const data = await res.json();
      if (res.ok) setUserRepos(data.repos ?? []);
      else toast.error("Failed to load repos");
    } catch { toast.error("Network error"); }
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
    setFeed(null); onIntegrationsChange?.();
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
    <div className="h-full overflow-y-auto p-4 sm:p-8 space-y-8 max-w-[1440px] mx-auto">
      <div className="flex flex-col lg:flex-row items-start gap-8">
        
        {/* ── Left: Connection Management ── */}
        <div className={`w-full ${repoIntg ? "lg:w-[340px] xl:w-[400px] lg:sticky lg:top-8" : "max-w-xl mx-auto"} space-y-6`}>
          <Card className="w-full">
            <CardHeader
              icon={<Github size={16} color="rgba(255,255,255,0.85)" />}
              title="GitHub"
              subtitle={repoIntg ? "Integration Active" : "Connect Activity"}
              right={repoIntg && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2EB67D]/15 border border-[#2EB67D]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2EB67D] animate-pulse" />
                  <span style={{ fontSize: 9, fontWeight: 900, color: "#2EB67D", textTransform: "uppercase" }}>Live</span>
                </div>
              )}
            />

            <div className="p-6">
              {/* No Connection at all */}
              {!repoIntg && !accountIntg && (
                <div className="space-y-6 py-4 text-center">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
                    <GitBranch size={24} color="#9CA3AF" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-gray-900">No Repo Connected</h4>
                    <p className="text-[12.5px] text-gray-400 mt-2 leading-relaxed">Connect your GitHub to track commits and PRs directly in the project.</p>
                  </div>
                  <div className="space-y-2">
                    {oauthUrl ? (
                      <a href={oauthUrl} className="flex items-center justify-center gap-2 h-11 w-full rounded-xl bg-[#09090B] text-white no-underline font-bold text-[13px] hover:bg-black transition-colors">
                        <Github size={15} /> Connect via OAuth
                      </a>
                    ) : (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11.5px] text-amber-900 text-left leading-relaxed">
                        <AlertCircle size={14} className="inline mr-2 -mt-0.5" /> Client ID missing in .env
                      </div>
                    )}
                    <button onClick={() => setShowPatInput(!showPatInput)} className="h-11 w-full rounded-xl bg-gray-100 text-gray-600 border-0 font-bold text-[13px] cursor-pointer hover:bg-gray-200 transition-colors">
                      Use Access Token
                    </button>
                  </div>
                  <AnimatePresence>
                    {showPatInput && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden pt-4 text-left border-t border-gray-100 mt-4 space-y-3">
                        <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Single Repo Token</span></div>
                        <input value={repoInput} onChange={(e) => onRepoInputChange(e.target.value)} placeholder="owner/repo" className="h-10 w-full px-3 rounded-xl border border-gray-200 bg-gray-50 text-[13px] outline-none focus:border-black transition-colors" />
                        <input value={patValue} onChange={(e) => setPatValue(e.target.value)} type="password" placeholder="github_pat_..." className="h-10 w-full px-3 rounded-xl border border-gray-200 bg-gray-50 text-[12px] font-mono outline-none focus:border-black transition-colors" />
                        <button onClick={savePat} disabled={savingPat || !patValue || !repoInput} className="h-10 w-full rounded-xl bg-black text-white font-bold text-[13px] cursor-pointer disabled:opacity-50">{savingPat ? "Connecting..." : "Connect Repository"}</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Account connected, waiting for repo */}
              {accountIntg && !repoIntg && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <UA url={githubAvatar} name={githubLogin ?? "G"} size={40} />
                      <div><p className="font-bold text-[14px]">@{githubLogin}</p><p className="text-[11px] text-gray-400">Account Access Active</p></div>
                    </div>
                  </div>
                  <button onClick={openPicker} className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 font-bold text-[13px] text-gray-600 cursor-pointer hover:border-black hover:text-black transition-all">
                    Pick a Repository
                  </button>
                  <button onClick={disconnectAccount} className="w-full bg-transparent border-0 text-red-500 font-bold text-[11px] cursor-pointer py-2">Disconnect Account</button>
                </div>
              )}

              {/* Fully connected */}
              {repoIntg && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm"><Github size={18} /></div>
                      <div className="truncate"><p className="font-bold text-[14px] truncate">{connectedFullName}</p><p className="text-[11px] text-gray-400">Added {timeAgo(repoIntg.created_at)}</p></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {accountIntg && <button onClick={openPicker} className="flex-1 h-10 rounded-xl border border-gray-200 bg-white font-bold text-[12px] cursor-pointer hover:border-black transition-all">Change Repo</button>}
                    <button onClick={() => { onDeleteIntegration(repoIntg.id); setFeed(null); }} className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center cursor-pointer text-gray-400 hover:text-red-500 hover:border-red-100 transition-all"><X size={15} /></button>
                  </div>
                  {accountIntg && (
                    <div className="flex items-center justify-between px-1 pt-2">
                      <div className="flex items-center gap-2"><UA url={githubAvatar} name={githubLogin ?? ""} size={16} /><span className="text-[11px] text-gray-500 whitespace-nowrap">Authed as <strong className="text-gray-700">@{githubLogin}</strong></span></div>
                      <button onClick={disconnectAccount} className="bg-transparent border-0 text-red-500 font-bold text-[11px] cursor-pointer px-0">Log Out</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Webhook Hint (Centered/Sidebar position) */}
          {!repoIntg && (
            <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-3xl flex gap-4">
              <Zap size={16} className="text-blue-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-[12.5px] font-bold text-blue-900">Real-time Webhook</p>
                <p className="text-[11px] text-blue-700/70 mt-1 leading-relaxed">Add this URL to your GitHub Repo Settings → Webhooks for instant push notifications.</p>
                <code className="block mt-3 p-2 bg-white/80 border border-blue-100 rounded-lg text-[10px] break-all font-mono text-blue-800">
                  {typeof window !== "undefined" ? window.location.origin.replace("3000", "8000") : ""}/webhooks/github
                </code>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Activity Visualization ── */}
        <div className="flex-1 w-full min-w-0">
          <AnimatePresence mode="wait">
            {!repoIntg ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-24 text-gray-300">
                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6"><Github size={32} /></div>
                <p className="font-bold text-[15px] text-gray-400">Connect to see activity</p>
              </motion.div>
            ) : (
              <motion.div key="feed" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-8">
                <Card>
                  {feed?.repoData && !feedLoading ? (
                    <CardHeader 
                      icon={<img src={feed.repoData.owner.avatar_url} alt="" className="w-full h-full rounded-lg" />}
                      title={feed.repoData.full_name}
                      subtitle={feed.repoData.description || "Active Repository"}
                      right={<div className="flex items-center gap-2"><button onClick={() => loadFeed(repoIntg)} className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 border-0 rounded-xl cursor-pointer text-white/50 hover:text-white transition-all"><RefreshCw size={14} /></button><a href={feed.repoData.html_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 border-0 rounded-xl text-white transition-all"><ArrowUpRight size={14} /></a></div>}
                    />
                  ) : (
                    <CardHeader icon={<Github size={16} color="rgba(255,255,255,0.85)" />} title="Activity Feed" subtitle="Tracking Live Streams" />
                  )}

                  {feed?.repoData && !feedLoading && (
                    <div className="flex items-center gap-3 flex-wrap px-6 py-4 border-b border-gray-100 bg-gray-50/30">
                      <StatChip icon={<Star size={12} />} value={feed.repoData.stargazers_count.toLocaleString()} color="#F59E0B" />
                      <StatChip icon={<GitFork size={12} />} value={feed.repoData.forks_count.toLocaleString()} color="#36C5F0" />
                      <StatChip icon={<CircleDot size={12} />} value={feed.repoData.open_issues_count} color="#E01E5A" />
                      <LangDot lang={feed.repoData.language} />
                      <div className="ml-auto">{feed.repoData.private ? <Badge label="Private" color="#555" bg="#F3F4F6" /> : <Badge label="Public" color="#2563EB" bg="#EFF6FF" />}</div>
                    </div>
                  )}

                  {feedLoading && (
                    <div className="py-24 flex flex-col items-center justify-center gap-4 text-gray-400">
                      <Loader2 size={24} className="animate-spin" /><p className="font-bold text-[13px]">Streaming from GitHub...</p>
                    </div>
                  )}

                  {feedError && !feedLoading && (
                    <div className="p-8"><div className="p-6 rounded-[24px] bg-red-50 border border-red-100 text-red-900 text-center"><p className="font-bold text-[14px]">{feedError}</p><button onClick={() => setShowPatInput(true)} className="mt-4 h-10 px-6 rounded-xl bg-red-600 text-white font-bold border-0 cursor-pointer">Re-configure Token</button></div></div>
                  )}

                  {feed && !feedLoading && (
                    <>
                      <TabRow tabs={feedTabs} active={feedTab} onChange={(id) => setFeedTab(id as any)} />
                      <div className="overflow-y-auto overscroll-contain">
                        <div className="py-2">
                          <AnimatePresence mode="wait">
                            {feedTab === "commits" && (
                              <motion.div key="commits" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {feed.commits.length === 0 && <p className="py-20 text-center text-gray-400 font-bold">No commits found</p>}
                                {feed.commits.map((c, i) => (
                                  <FeedItem key={c.sha} type="commit" href={c.html_url} title={c.commit.message.split("\n")[0]} isLast={i === feed.commits.length - 1} meta={<><UA url={c.author?.avatar_url} name={c.commit.author.name} /><MetaTag>{c.author?.login || c.commit.author.name}</MetaTag><Dot /><MetaTag>{timeAgo(c.commit.author.date)}</MetaTag><span className="ml-auto font-mono text-[10px] text-gray-300">{c.sha.slice(0, 7)}</span></>} />
                                ))}
                              </motion.div>
                            )}
                            {feedTab === "prs" && (
                              <motion.div key="prs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {feed.pullRequests.length === 0 && <p className="py-20 text-center text-gray-400 font-bold">No pull requests</p>}
                                {feed.pullRequests.map((pr, i) => (
                                  <FeedItem key={pr.id} type="pr" merged={!!pr.merged_at} href={pr.html_url} title={pr.title} isLast={i === feed.pullRequests.length - 1} meta={<><UA url={pr.user.avatar_url} name={pr.user.login} /><MetaTag>#{pr.number}</MetaTag><Dot /><MetaTag>{timeAgo(pr.created_at)}</MetaTag><Badge label={pr.merged_at ? "Merged" : pr.state} color={pr.merged_at ? "#8B5CF6" : pr.state === "open" ? "#10B981" : "#6B7280"} bg={pr.merged_at ? "#F5F3FF" : pr.state === "open" ? "#ECFDF5" : "#F9FAFB"} /></>} />
                                ))}
                              </motion.div>
                            )}
                            {feedTab === "issues" && (
                              <motion.div key="issues" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {feed.issues.length === 0 && <p className="py-20 text-center text-gray-400 font-bold">No issues opened</p>}
                                {feed.issues.map((issue, i) => (
                                  <FeedItem key={issue.id} type="issue" href={issue.html_url} title={issue.title} isLast={i === feed.issues.length - 1} meta={<><UA url={issue.user.avatar_url} name={issue.user.login} /><MetaTag>#{issue.number}</MetaTag><Dot /><MetaTag>{timeAgo(issue.created_at)}</MetaTag><Badge label={issue.state} color={issue.state === "open" ? "#EF4444" : "#6B7280"} bg={issue.state === "open" ? "#FEF2F2" : "#F9FAFB"} /></>} />
                                ))}
                              </motion.div>
                            )}
                            {feedTab === "releases" && (
                              <motion.div key="releases" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {feed.releases.length === 0 && <p className="py-20 text-center text-gray-400 font-bold">No releases yet</p>}
                                {feed.releases.map((rel, i) => (
                                  <FeedItem key={rel.id} type="release" href={rel.html_url} title={rel.name || rel.tag_name} isLast={i === feed.releases.length - 1} meta={<><Badge label={rel.tag_name} color="#10B981" bg="#ECFDF5" /><UA url={rel.author.avatar_url} name={rel.author.login} /><Dot /><MetaTag>{timeAgo(rel.published_at)}</MetaTag></>} />
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#2EB67D] animate-pulse" /><span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Stream Active · API v3</span></div>
                        <a href={`https://github.com/${connectedFullName}`} target="_blank" rel="noopener noreferrer" className="no-underline text-[11px] font-bold text-gray-400 hover:text-black transition-colors flex items-center gap-1">Repository Details <ExternalLink size={10} /></a>
                      </div>
                    </>
                  )}
                </Card>

                {/* Webhook Hint (Dashboard position) */}
                <div className="p-6 bg-amber-50 rounded-[32px] border border-amber-100 flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0"><Zap size={22} className="text-amber-600" /></div>
                  <div className="min-w-0">
                    <h5 className="text-[14px] font-bold text-amber-900">Optional: Connect Real-time Sync</h5>
                    <p className="text-[12px] text-amber-800/70 mt-1 leading-relaxed">Add this endpoint as a webhook in GitHub Settings to see live push events and PR updates without refreshing.</p>
                    <div className="mt-4 flex gap-2">
                       <code className="flex-1 p-3 bg-white/60 rounded-xl text-[11px] font-mono text-amber-900 border border-amber-200 truncate">
                        {typeof window !== "undefined" ? window.location.origin.replace("3000", "8000") : ""}/webhooks/github
                       </code>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Repository Picker Modal ── */}
      <AnimatePresence>
        {showPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setShowPicker(false)}>
            <motion.div initial={{ scale: 0.95, y: 32 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 32 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-white rounded-[32px] overflow-hidden flex flex-col shadow-2xl" style={{ maxHeight: "85vh" }}>
              <div style={{ background: "#09090B", padding: "28px" }}>
                <div className="flex items-center justify-between text-white mb-6">
                  <div><h3 className="text-[18px] font-bold tracking-tight">Connect Repository</h3><p className="text-[12px] text-white/40 mt-1">Select a repo to stream its activity feed</p></div>
                  <button onClick={() => setShowPicker(false)} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 border-0 rounded-2xl cursor-pointer text-white/50 transition-all"><X size={18} /></button>
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input value={repoSearch} onChange={(e) => setRepoSearch(e.target.value)} placeholder="Filter repositories..." className="w-full h-12 bg-white/10 border border-white/10 rounded-2xl px-12 text-white text-[14px] outline-none focus:border-white/30 transition-all font-medium" autoFocus />
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-3" style={{ scrollbarWidth: "none" }}>
                {reposLoading ? (
                  <div className="py-20 flex flex-col items-center gap-4 text-gray-400"><Loader2 size={32} className="animate-spin text-black" /><p className="font-bold text-[13px] text-black">Scanning repositories...</p></div>
                ) : filteredRepos.length === 0 ? (
                  <div className="py-20 text-center"><p className="text-gray-400 font-bold">No repositories found</p></div>
                ) : filteredRepos.map((repo) => {
                  const isActive = connectedFullName === repo.full_name;
                  const isLoading = connectingId === repo.id;
                  return (
                    <div key={repo.id} onClick={() => !isLoading && handlePickRepo(repo)} className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all mb-1 ${isActive ? "bg-blue-50/50" : "hover:bg-gray-50"}`}>
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100">{repo.private ? <Lock size={16} color="#9CA3AF" /> : <GitBranch size={16} color="#9CA3AF" />}</div>
                        <div className="min-w-0"><p className="font-bold text-[14px] text-gray-900 truncate">{repo.full_name}</p><div className="flex items-center gap-3 mt-1.5"><LangDot lang={repo.language} /><Dot /><span className="text-[10px] font-bold text-gray-400">Updated {timeAgo(repo.updated_at)}</span></div></div>
                      </div>
                      <div className="ml-4">
                        {isActive ? <Badge label="Active" color="#3B82F6" bg="#EFF6FF" /> : isLoading ? <Loader2 size={16} className="animate-spin text-gray-300" /> : <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400"><Plus size={14} /></div>}
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