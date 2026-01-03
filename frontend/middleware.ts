import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  // Create Supabase client for middleware
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        req.cookies.set({
          name,
          value,
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: req.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: any) {
        req.cookies.set({
          name,
          value: "",
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: req.headers,
          },
        });
        response.cookies.set({
          name,
          value: "",
          ...options,
        });
      },
    },
  });

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;

  // Admin routes that require admin role
  const adminRoutes = ["/dashboard", "/interview-admin", "/interview-report"];

  // Check if current path is an admin route
  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If accessing admin route
  if (isAdminRoute) {
    // Not authenticated -> redirect to login
    if (!session?.user) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/login";
      return NextResponse.redirect(redirectUrl);
    }

    // Authenticated -> check role
    try {
      // Try to get role from profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      let isAdmin = false;

      if (profile?.role) {
        const role = String(profile.role).toLowerCase().trim();
        isAdmin = role === "admin";
      } else {
        // Fallback: check admins table
        if (session.user.email) {
          const { data: adminRecord } = await supabase
            .from("admins")
            .select("email")
            .eq("email", session.user.email.toLowerCase())
            .maybeSingle();

          isAdmin = !!adminRecord;
        }

        // Also check metadata
        if (!isAdmin) {
          const metadataRole =
            typeof session.user.user_metadata?.role === "string"
              ? session.user.user_metadata.role.toLowerCase().trim()
              : undefined;

          const appMetadataRoles = Array.isArray(
            session.user.app_metadata?.roles
          )
            ? session.user.app_metadata.roles.map((r: string) =>
                String(r).toLowerCase().trim()
              )
            : [];

          isAdmin =
            metadataRole === "admin" || appMetadataRoles.includes("admin");
        }
      }

      // Not admin -> redirect to user home
      if (!isAdmin) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = "/interview-info";
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error) {
      console.error("[Middleware] Error checking admin role:", error);
      // On error, allow access (fail open) but log it
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

