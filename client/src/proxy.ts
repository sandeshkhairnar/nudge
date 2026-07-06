// middleware.ts  ← this file must be at the ROOT of your project (next to /app or /pages)
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  console.log("Middleware is running for path:", request.nextUrl.pathname);
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match ALL paths except static assets AND PWA files.
     * ✅ This correctly covers /space, /dashboard, /api, etc.
     * ✅ sw.js and manifest.json must NOT be intercepted (PWA requirement)
     */
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|icon-.*\\.png|apple-touch-icon\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};