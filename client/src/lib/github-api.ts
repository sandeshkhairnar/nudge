/**
 * GitHub REST API helpers — uses the public API for unauthenticated requests.
 * For private repos, pass an access_token.
 */

/**
 * Normalizes any GitHub repo reference to "owner/repo" format.
 * Handles:
 *   https://github.com/owner/repo.git  →  owner/repo
 *   https://github.com/owner/repo      →  owner/repo
 *   git@github.com:owner/repo.git      →  owner/repo
 *   owner/repo                         →  owner/repo  (no-op)
 * Returns null if the input is not a recognizable repo reference.
 */
export function normalizeRepoName(input: string): string | null {
  if (!input) return null;
  let s = input.trim();

  // Strip .git suffix
  if (s.endsWith(".git")) s = s.slice(0, -4);

  // HTTPS URL: https://github.com/owner/repo
  const httpsMatch = s.match(/github\.com[/:](([^/]+)\/([^/?#]+))/);
  if (httpsMatch) return httpsMatch[1];

  // SSH URL: git@github.com:owner/repo
  const sshMatch = s.match(/git@github\.com:([^/]+\/[^/]+)/);
  if (sshMatch) return sshMatch[1];

  // Already owner/repo
  const slashCount = (s.match(/\//g) ?? []).length;
  if (slashCount === 1 && !s.startsWith("http") && !s.startsWith("git@")) return s;

  return null;
}

export interface GitHubRepo {
  id: number;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  default_branch: string;
  html_url: string;
  private: boolean;
  owner: { login: string; avatar_url: string };
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
  author: { login: string; avatar_url: string } | null;
  html_url: string;
}

export interface GitHubPR {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  merged_at: string | null;
  user: { login: string; avatar_url: string };
  html_url: string;
  created_at: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  user: { login: string; avatar_url: string };
  html_url: string;
  created_at: string;
  pull_request?: object; // if present, it's a PR not an issue
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  published_at: string;
  author: { login: string; avatar_url: string };
  html_url: string;
}

const BASE = "https://api.github.com";

async function ghFetch<T>(
  path: string,
  token?: string | null
): Promise<T | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, { headers, next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export async function fetchRepo(
  repoFullName: string,
  token?: string | null
): Promise<GitHubRepo | null> {
  return ghFetch<GitHubRepo>(`/repos/${repoFullName}`, token);
}

export async function fetchCommits(
  repoFullName: string,
  token?: string | null,
  perPage = 10
): Promise<GitHubCommit[]> {
  const data = await ghFetch<GitHubCommit[]>(
    `/repos/${repoFullName}/commits?per_page=${perPage}`,
    token
  );
  return data ?? [];
}

export async function fetchPullRequests(
  repoFullName: string,
  token?: string | null,
  state: "open" | "closed" | "all" = "all",
  perPage = 10
): Promise<GitHubPR[]> {
  const data = await ghFetch<GitHubPR[]>(
    `/repos/${repoFullName}/pulls?state=${state}&per_page=${perPage}&sort=updated`,
    token
  );
  return data ?? [];
}

export async function fetchIssues(
  repoFullName: string,
  token?: string | null,
  perPage = 10
): Promise<GitHubIssue[]> {
  const data = await ghFetch<GitHubIssue[]>(
    `/repos/${repoFullName}/issues?per_page=${perPage}&state=all&sort=updated`,
    token
  );
  // Filter out pull requests which appear in the issues endpoint
  return (data ?? []).filter((i) => !i.pull_request);
}

export async function fetchReleases(
  repoFullName: string,
  token?: string | null,
  perPage = 5
): Promise<GitHubRelease[]> {
  const data = await ghFetch<GitHubRelease[]>(
    `/repos/${repoFullName}/releases?per_page=${perPage}`,
    token
  );
  return data ?? [];
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
