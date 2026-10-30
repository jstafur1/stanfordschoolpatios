"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getDashboardPath } from "@/lib/auth/roles";
import { resolveRoleForUser } from "@/lib/auth/resolve-role";
import { isPasswordLongEnough } from "@/lib/auth/password";
import { getSiteUrl } from "@/lib/auth/site-url";
import {
  isPlatformLocale,
  PLATFORM_LOCALE_COOKIE,
} from "@/lib/i18n/platform-locale";

export type LoginState = {
  error?: string;
  redirectTo?: string;
};

export type RegisterState = {
  error?: string;
  success?: boolean;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const locale = String(formData.get("locale") ?? "es");

  if (!email || !password) {
    return { error: "missingFields" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    if (error?.message?.toLowerCase().includes("email not confirmed")) {
      return { error: "emailNotConfirmed" };
    }
    return { error: "invalidCredentials" };
  }

  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    return { error: "emailNotConfirmed" };
  }

  const role = await resolveRoleForUser(supabase, data.user);
  if (!role) {
    await supabase.auth.signOut();
    return { error: "generic" };
  }

  if (isPlatformLocale(locale)) {
    const cookieStore = await cookies();
    cookieStore.set(PLATFORM_LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  redirect(getDashboardPath(role, locale));
}

export async function logoutAction(locale = "es") {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const locale = String(formData.get("locale") ?? "es");

  if (!email || !password || !fullName) {
    return { error: "missingFields" };
  }

  if (!isPasswordLongEnough(password)) {
    return { error: "weakPassword" };
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const emailRedirectTo = `${siteUrl}/auth/callback?next=/${locale}/login?verified=1`;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "emailTaken" };
    }
    return { error: "generic" };
  }

  return { success: true };
}
