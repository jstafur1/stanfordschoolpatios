"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  isPlatformLocale,
  PLATFORM_LOCALE_COOKIE,
} from "@/lib/i18n/platform-locale";

export async function setPlatformLocaleAction(locale: string) {
  if (!isPlatformLocale(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(PLATFORM_LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/teacher", "layout");
  revalidatePath("/student", "layout");
}
