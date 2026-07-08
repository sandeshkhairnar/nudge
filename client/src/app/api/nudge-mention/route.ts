import { NextRequest, NextResponse } from "next/server";

const ENGINE_URL = process.env.AI_ENGINE_URL ?? "http://127.0.0.1:8000";
const ENGINE_SECRET = process.env.ENGINE_SECRET ?? "";

export async function POST(req: NextRequest) {
  try {
    const { message, channelId, workspaceId, projectId } = await req.json();

    if (!message || !channelId) {
      return NextResponse.json({ error: "message and channelId are required" }, { status: 400 });
    }

    const event = {
      event_type: "message",
      workspace_id: workspaceId,
      project_id: projectId ?? null,
      payload: {
        content: message,
        channel_id: channelId,
      },
      timestamp: "now",
    };

    // Fire-and-forget — don't await so the user's message sends instantly
    fetch(`${ENGINE_URL}/agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-engine-secret": ENGINE_SECRET,
      },
      body: JSON.stringify(event),
    }).catch((err) => console.error("[nudge-mention] Engine call failed:", err));

    return NextResponse.json({ status: "triggered" });
  } catch (err) {
    console.error("[nudge-mention]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
