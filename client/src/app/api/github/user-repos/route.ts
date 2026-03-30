/**
 * GET /api/github/user-repos?token=xxx&page=1&q=searchQuery
 * Returns the authenticated user's GitHub repositories.
 * Sorted by updated_at desc, paginated.
 */
import { NextRequest, NextResponse } from "next/server";

interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  description: string | null;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  html_url: string;
  owner: { login: string; avatar_url: string };
  default_branch: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const page  = searchParams.get("page") ?? "1";
  const q     = searchParams.get("q") ?? "";

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    // Fetch up to 100 repos sorted by recently updated
    const res = await fetch(
      `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: body.message ?? "GitHub API error" },
        { status: res.status }
      );
    }

    let repos: GitHubRepo[] = await res.json();

    // Client-side filter by search query
    if (q.trim()) {
      const lq = q.toLowerCase();
      repos = repos.filter(
        (r) =>
          r.full_name.toLowerCase().includes(lq) ||
          (r.description ?? "").toLowerCase().includes(lq)
      );
    }

    return NextResponse.json({ repos });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
