"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HomeLink } from "@/components/landing/home-link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function MobileNav() {
  const t = useTranslations();
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);

  const nav = [
    { href: "/" as const, label: t("nav.home"), home: true },
    { href: "/about" as const, label: t("nav.about"), home: false },
    { href: "/employment" as const, label: t("nav.employment"), home: false },
    { href: "/contact" as const, label: t("nav.contact"), home: false },
  ];

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="inline-flex size-10 items-center justify-center rounded-full border border-border text-foreground"
        aria-expanded={open}
        aria-label={open ? tCommon("menuClose") : tCommon("menuOpen")}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/30"
            aria-label={tCommon("menuClose")}
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-0 top-[73px] z-50 border-b border-border bg-background px-4 py-6 shadow-lg">
            <nav className="flex flex-col gap-1">
              {nav.map((item) =>
                item.home ? (
                  <HomeLink
                    key={item.href}
                    className="rounded-xl px-4 py-3 text-base font-medium text-foreground hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </HomeLink>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl px-4 py-3 text-base font-medium text-foreground hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </nav>
            <div className="mt-6 flex flex-col gap-4 border-t border-border pt-6">
              <ThemeToggle />
              <LocaleSwitcher />
              <Link
                href="/login"
                className={cn(buttonVariants(), "w-full rounded-full py-6")}
                onClick={() => setOpen(false)}
              >
                {tCommon("login")}
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
