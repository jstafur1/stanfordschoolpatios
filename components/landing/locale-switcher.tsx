"use client";

import { useLocale } from "next-intl";
import { LocaleToggle } from "@/components/i18n/locale-toggle";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(next: Locale) {
    router.replace(pathname, { locale: next });
  }

  return (
    <LocaleToggle
      locale={locale}
      onSwitch={switchLocale}
      className={className}
    />
  );
}
