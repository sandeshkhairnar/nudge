/**
 * GET /api/github/callback
 * GitHub OAuth callback. Exchanges the code for an access token,
 * fetches the authenticated user's profile, stores it in the integrations
 * table, then redirects back to the project settings page.
 *
 * State param (base64-encoded JSON): { projectId, workspaceId, returnUrl }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}?github_error=missing_params`);
  }

  // Decode state
  let projectId = "";
  let workspaceId = "";
  let returnUrl = `${appUrl}/space`;

  try {
    const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
    projectId   = decoded.projectId   ?? "";
    workspaceId = decoded.workspaceId ?? "";
    returnUrl   = decoded.returnUrl   ?? returnUrl;
  } catch {
    return NextResponse.redirect(`${appUrl}?github_error=invalid_state`);
  }

  // Exchange code for access token
  const clientId     = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const back = new URL(returnUrl);
    back.searchParams.set("github_error", "oauth_not_configured");
    return NextResponse.redirect(back.toString());
  }

  let accessToken = "";
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });
    const tokenData = await tokenRes.json();
    accessToken = tokenData.access_token ?? "";
    if (!accessToken) throw new Error(tokenData.error_description ?? "No token");
  } catch (err: any) {
    const back = new URL(returnUrl);
    back.searchParams.set("github_error", "token_exchange_failed");
    return NextResponse.redirect(back.toString());
  }

  // Fetch authenticated GitHub user
  let githubUser: { login: string; id: number; avatar_url: string; name: string | null } | null = null;
  try {
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });
    githubUser = await userRes.json();
  } catch {
    const back = new URL(returnUrl);
    back.searchParams.set("github_error", "user_fetch_failed");
    return NextResponse.redirect(back.toString());
  }

  // Save to integrations table — safe select-then-update/insert
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("integrations")
    .select("id")
    .eq("project_id", projectId)
    .eq("provider", "github_account")
    .maybeSingle();

  const accountPayload = {
    access_token: accessToken,
    metadata: {
      github_login:      githubUser?.login,
      github_id:         githubUser?.id,
      github_avatar_url: githubUser?.avatar_url,
      github_name:       githubUser?.name,
    },
  };

  if (existing) {
    await supabase.from("integrations").update(accountPayload).eq("id", existing.id);
  } else {
    await supabase.from("integrations").insert({
      workspace_id:   workspaceId,
      project_id:     projectId,
      provider:       "github_account",
      repo_full_name: null,
      ...accountPayload,
    });
  }

  // Redirect back with success signal
  const back = new URL(returnUrl);
  back.searchParams.set("github_connected", "1");
  back.searchParams.set("github_login", githubUser?.login ?? "");
  return NextResponse.redirect(back.toString());
}
