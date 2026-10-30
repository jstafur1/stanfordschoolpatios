import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HomeLink } from "@/components/landing/home-link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";

type Props = {
  locale?: string;
};

export async function LandingHeader({ locale }: Props = {}) {
  void locale;
  const t = await getTranslations();

  const nav = [
    { href: "/" as const, label: t("nav.home"), home: true },
    { href: "/about" as const, label: t("nav.about"), home: false },
    { href: "/employment" as const, label: t("nav.employment"), home: false },
    { href: "/contact" as const, label: t("nav.contact"), home: false },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <HomeLink className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Image
            src="/logo.png"
            alt={t("common.brand")}
            width={44}
            height={44}
            className="size-10 shrink-0 rounded-full sm:size-12"
            priority
          />
          <span className="truncate text-xs font-bold leading-tight text-foreground sm:max-w-none sm:text-sm">
            {t("common.brand")}
          </span>
        </HomeLink>

        <nav className="hidden items-center gap-8 lg:flex">
          {nav.map((item) =>
            item.home ? (
              <HomeLink
                key={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </HomeLink>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle compact className="hidden md:inline-flex" />
          <LocaleSwitcher className="hidden md:flex" />
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "hidden rounded-full px-4 sm:inline-flex sm:px-6 sm:text-sm",
            )}
          >
            {t("common.login")}
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
