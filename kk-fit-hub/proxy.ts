import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Admin guard (PRD 14.4): refreshes the Supabase session cookies and sends
 * anyone not signed in from /admin/* to /admin/login. The protected layout
 * and every admin action check staff status again on the server; this is
 * only the first, optimistic check.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const path = request.nextUrl.pathname;
  const isPublicAdmin = path === "/admin/login" || path === "/admin/accept";

  if (!url || !key) {
    if (isPublicAdmin) return response;
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet) {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });
  // Do not run code between createServerClient and getUser (session refresh).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicAdmin) {
    const login = new URL("/admin/login", request.url);
    if (path !== "/admin") login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
