import { routing, type Locale } from "@/i18n/routing";

export const PLATFORM_LOCALE_COOKIE = "platform_locale";

export function isPlatformLocale(value: string): value is Locale {
  return routing.locales.includes(value as Locale);
}
