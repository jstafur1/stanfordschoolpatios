import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/utils/supabase/middleware";
import { getDashboardPath, getRoleForPath } from "@/lib/auth/roles";
import { resolveRoleForUser } from "@/lib/auth/resolve-role";
import type { User } from "@supabase/supabase-js";

const intlMiddleware = createIntlMiddleware(routing);

async function getProfileRole(
  supabase: Awaited<ReturnType<typeof updateSession>>["supabase"],
  user: User,
) {
  return resolveRoleForUser(supabase, user);
}


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API and auth routes must not get a locale prefix (/es/api/... → 404).
  if (pathname.startsWith("/api") || pathname.startsWith("/auth")) {
    const { response } = await updateSession(request);
    return response;
  }

  const platformPaths = ["/admin", "/teacher", "/student"];

  if (platformPaths.some((p) => pathname.startsWith(p))) {
    const { supabase, user, response } = await updateSession(request);
    const requiredRole = getRoleForPath(pathname);

    if (!user) {
      return NextResponse.redirect(
        new URL(`/${routing.defaultLocale}/login`, request.url),
      );
    }

    const role = await getProfileRole(supabase, user);
    if (!role) {
      return NextResponse.redirect(
        new URL(`/${routing.defaultLocale}/login`, request.url),
      );
    }

    if (requiredRole && role !== requiredRole) {
      return NextResponse.redirect(
        new URL(getDashboardPath(role), request.url),
      );
    }

    return response;
  }

  const intlResponse = intlMiddleware(request);
  const { supabase, user, response } = await updateSession(
    request,
    intlResponse,
  );

  const authPageMatch = pathname.match(/^\/(es|en|fr)\/(login|register)\/?$/);
  if (authPageMatch && user) {
    const role = await getProfileRole(supabase, user);
    if (role) {
      return NextResponse.redirect(
        new URL(getDashboardPath(role, authPageMatch[1]), request.url),
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mjs|js|ico|woff2|woff|ttf|mp4|webm|pdf)$).*)",
    "/api/:path*",
    "/auth/:path*",
  ],
};
