import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import {
  isPlatformLocale,
  PLATFORM_LOCALE_COOKIE,
} from "@/lib/i18n/platform-locale";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  let locale = hasLocale(routing.locales, requested)
    ? requested
    : undefined;

  if (!locale) {
    const cookieStore = await cookies();
    const fromCookie = cookieStore.get(PLATFORM_LOCALE_COOKIE)?.value;
    if (fromCookie && isPlatformLocale(fromCookie)) {
      locale = fromCookie;
    }
  }

  const resolved = locale ?? routing.defaultLocale;

  return {
    locale: resolved,
    messages: (await import(`../messages/${resolved}.json`)).default,
  };
});
