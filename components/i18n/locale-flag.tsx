"use client";

import { useId } from "react";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type LocaleFlagProps = {
  locale: Locale;
  className?: string;
};

export function LocaleFlag({ locale, className }: LocaleFlagProps) {
  const id = useId();
  const clipS = `${id}-s`;
  const clipT = `${id}-t`;

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-[2px] shadow-sm ring-1 ring-black/10",
        className,
      )}
    >
      {locale === "es" ? (
        <svg viewBox="0 0 20 15" className="h-full w-full">
          <rect width="20" height="15" fill="#c60b1e" />
          <rect y="3.75" width="20" height="7.5" fill="#ffc400" />
        </svg>
      ) : null}
      {locale === "en" ? (
        <svg viewBox="0 0 60 30" className="h-full w-full">
          <clipPath id={clipS}>
            <path d="M0,0 v30 h60 v-30 z" />
          </clipPath>
          <clipPath id={clipT}>
            <path d="M30,15 h30 v15 z v-15 h-30 z h-30 z v15 z v-15 h30 z" />
          </clipPath>
          <g clipPath={`url(#${clipS})`}>
            <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
            <path d="M0,0 60,30 M60,0 0,30" stroke="#fff" strokeWidth="6" />
            <path
              d="M0,0 60,30 M60,0 0,30"
              clipPath={`url(#${clipT})`}
              stroke="#c8102e"
              strokeWidth="4"
            />
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
            <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6" />
          </g>
        </svg>
      ) : null}
      {locale === "fr" ? (
        <svg viewBox="0 0 20 15" className="h-full w-full">
          <rect width="6.67" height="15" fill="#002395" />
          <rect x="6.67" width="6.67" height="15" fill="#fff" />
          <rect x="13.33" width="6.67" height="15" fill="#ed2939" />
        </svg>
      ) : null}
    </span>
  );
}
