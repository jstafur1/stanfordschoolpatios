import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

function isRefreshTokenError(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "refresh_token_not_found" ||
    Boolean(error.message?.toLowerCase().includes("refresh token"))
  );
}

export async function updateSession(
  request: NextRequest,
  response: NextResponse = NextResponse.next({ request }),
) {
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && isRefreshTokenError(error)) {
    await supabase.auth.signOut();
    return { supabase, user: null, response };
  }

  return { supabase, user: user ?? null, response };
}
