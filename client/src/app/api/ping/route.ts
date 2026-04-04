import { NextResponse } from "next/server";

export async function GET() {
  const engineUrl = process.env.AI_ENGINE_URL;

  if (!engineUrl) {
    return NextResponse.json({ error: "AI_ENGINE_URL not configured" }, { status: 500 });
  }

  try {
    // Ping the /health endpoint of the Nudge Engine
    const res = await fetch(`${engineUrl}/health`, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Engine ping failed: ${res.status}`);
    }

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error: any) {
    const isConnectionError = error.message.includes("fetch failed") || error.code === "ECONNREFUSED";
    const errorMessage = isConnectionError 
      ? `AI Engine unreachable at ${engineUrl}. Ensure the backend is running.`
      : error.message;

    console.error("Backend Keep-Alive Error:", errorMessage);
    
    return NextResponse.json(
      { error: errorMessage, details: error.code || "FETCH_ERROR" }, 
      { status: 503 } // Use 503 Service Unavailable for connection issues
    );
  }
}
