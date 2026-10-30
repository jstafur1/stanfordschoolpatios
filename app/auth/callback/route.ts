import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { routing } from "@/i18n/routing";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const destination = next?.startsWith("/")
        ? next
        : `/${routing.defaultLocale}/reset-password`;
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/${routing.defaultLocale}/login?error=auth`,
  );
}
