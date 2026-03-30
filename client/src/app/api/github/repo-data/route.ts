/**
 * GET /api/github/repo-data?repo=owner/repo&token=xxx
 * Proxies GitHub API calls server-side to avoid CORS issues and keep tokens secure.
 * Accepts any GitHub URL format — normalized to owner/repo before calling the API.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  fetchRepo,
  fetchCommits,
  fetchPullRequests,
  fetchIssues,
  fetchReleases,
  normalizeRepoName,
} from "@/lib/github-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawRepo = searchParams.get("repo") ?? "";
  const token   = searchParams.get("token") || null;

  // Normalize: accepts full URLs, SSH refs, or bare owner/repo
  const repo = normalizeRepoName(rawRepo);

  if (!repo) {
    return NextResponse.json(
      { error: `Cannot parse repository identifier: "${rawRepo}". Use owner/repo format or paste the repo URL.` },
      { status: 400 }
    );
  }

  const [repoData, commits, pullRequests, issues, releases] = await Promise.all([
    fetchRepo(repo, token),
    fetchCommits(repo, token, 8),
    fetchPullRequests(repo, token, "all", 6),
    fetchIssues(repo, token, 6),
    fetchReleases(repo, token, 3),
  ]);

  if (!repoData) {
    // Give a more helpful error message
    const isPrivate = !!token;
    return NextResponse.json(
      {
        error: isPrivate
          ? `Repository "${repo}" not found. Check the repo name or ensure your token has "repo" scope.`
          : `Repository "${repo}" not found or is private. Connect your GitHub account to access private repos.`,
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ repoData, commits, pullRequests, issues, releases });
}
