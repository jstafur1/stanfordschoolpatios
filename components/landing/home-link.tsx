"use client";

import type { ComponentProps } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

type Props = Omit<ComponentProps<"a">, "href"> & {
  href?: never;
};

/**
 * Full document navigation to the landing home.
 * Avoids flaky App Router soft-nav when leaving about/contact/login.
 */
export function HomeLink({ className, children, ...props }: Props) {
  const locale = useLocale();

  return (
    <a href={`/${locale}`} className={cn(className)} {...props}>
      {children}
    </a>
  );
}
