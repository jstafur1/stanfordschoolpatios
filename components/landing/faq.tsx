"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  landingContentMt,
  landingLabel,
  landingSectionAlt,
  landingTitle,
} from "@/lib/landing/section-styles";

const faqKeys = ["q1", "q2", "q3", "q4"] as const;

export function FaqSection() {
  const t = useTranslations("faq");
  const [openKey, setOpenKey] = useState<string | null>("q1");

  return (
    <section id="faq" className={landingSectionAlt}>
      <div className="mx-auto max-w-7xl">
        <p className={landingLabel}>{t("label")}</p>
        <h2 className={landingTitle}>{t("title")}</h2>

        <div className={`${landingContentMt} grid gap-3 sm:gap-4 lg:grid-cols-2`}>
          {faqKeys.map((key) => {
            const isOpen = openKey === key;
            return (
              <button
                key={key}
                type="button"
                className={cn(
                  "rounded-3xl border p-4 text-left transition-colors sm:p-5",
                  isOpen
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card",
                )}
                onClick={() => setOpenKey(isOpen ? null : key)}
                aria-expanded={isOpen}
              >
                <span className="flex w-full items-start justify-between gap-3">
                  <span className="text-sm font-medium sm:text-base">
                    {t(`items.${key}.question`)}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      isOpen
                        ? "bg-primary-foreground text-primary"
                        : "bg-primary text-primary-foreground",
                    )}
                  >
                    {isOpen ? (
                      <Minus className="size-4" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                  </span>
                </span>
                {isOpen ? (
                  <span className="mt-3 block text-sm leading-relaxed opacity-90">
                    {t(`items.${key}.answer`)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
