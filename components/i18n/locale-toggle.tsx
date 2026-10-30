"use client";

import { LocaleFlag } from "@/components/i18n/locale-flag";
import { routing, type Locale } from "@/i18n/routing";
import { LOCALE_SHORT_LABELS } from "@/lib/i18n/locale-display";
import { localeToggleButtonClass } from "@/lib/platform/nav-styles";
import { cn } from "@/lib/utils";

type LocaleToggleProps = {
  locale: Locale;
  onSwitch: (locale: Locale) => void;
  className?: string;
};

export function LocaleToggle({ locale, onSwitch, className }: LocaleToggleProps) {
  return (
    <div className={cn("flex gap-1", className)}>
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => onSwitch(loc)}
          aria-current={loc === locale ? "true" : undefined}
          className={localeToggleButtonClass(loc === locale)}
        >
          <LocaleFlag locale={loc} className="h-3 w-4" />
          {LOCALE_SHORT_LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
