import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const pathname = request.nextUrl.pathname;

  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/manifesto") ||
    pathname.startsWith("/product") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/get-started") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  const isSpaceRoute = pathname.startsWith("/space");

  const isStaticFile =
    pathname === "/sw.js" ||
    pathname === "/manifest.json" ||
    pathname === "/apple-touch-icon.png" ||
    pathname.startsWith("/icon-") ||
    pathname.startsWith("/sounds/");

  // ✅ Always serve static/PWA files directly — never redirect them
  if (isStaticFile) {
    return supabaseResponse;
  }

  // ❌ Block /space if user not logged in
  if (!user && isSpaceRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // ❌ Block other private routes if needed
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // ✅ Logged-in users shouldn't see auth pages
  if (user && (pathname === "/sign-in" || pathname === "/get-started")) {
    const url = request.nextUrl.clone();
    url.pathname = "/space";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
