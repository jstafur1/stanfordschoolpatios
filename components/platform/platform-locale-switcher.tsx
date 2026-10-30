"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { setPlatformLocaleAction } from "@/app/actions/locale";
import { LocaleToggle } from "@/components/i18n/locale-toggle";
import { type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function PlatformLocaleSwitcher({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("app.common");
  const router = useRouter();

  async function switchLocale(next: Locale) {
    await setPlatformLocaleAction(next);
    router.refresh();
  }

  return (
    <div className={cn(compact ? "" : "space-y-2", className)}>
      {!compact ? (
        <p className="text-xs font-medium text-muted-foreground">{t("language")}</p>
      ) : null}
      <LocaleToggle locale={locale} onSwitch={switchLocale} />
    </div>
  );
}
