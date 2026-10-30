import { getTranslations } from "next-intl/server";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { buttonVariants } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { PlatformLocaleSwitcher } from "@/components/platform/platform-locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { PlatformNav } from "@/components/platform/platform-nav";
import { PlatformSidebarBrand } from "@/components/platform/platform-sidebar-brand";
import { PlatformUserCard } from "@/components/platform/platform-user-card";
import type { PlatformNavItem } from "@/lib/platform/platform-nav";
import { cn } from "@/lib/utils";

type PlatformUser = {
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  profileHref: string;
};

type PlatformShellProps = {
  roleLabel: string;
  homeHref: string;
  nav: PlatformNavItem[];
  locale: string;
  user: PlatformUser;
  children: React.ReactNode;
};

export async function PlatformShell({
  roleLabel,
  homeHref,
  nav,
  locale,
  user,
  children,
}: PlatformShellProps) {
  const t = await getTranslations("app.common");
  const viewAllLabel = t("viewAll");

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-card p-4 md:hidden">
        <PlatformSidebarBrand
          homeHref={homeHref}
          roleLabel={roleLabel}
          compact
        />
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle compact />
          <PlatformLocaleSwitcher compact />
          <form action={logoutAction.bind(null, locale)}>
            <button
              type="submit"
              className={cn(
                buttonVariants({ variant: "destructive", size: "sm" }),
                "rounded-full",
              )}
              aria-label={t("logout")}
            >
              <LogOut className="size-3.5" />
            </button>
          </form>
        </div>
      </header>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex md:min-h-screen">
        <div className="flex flex-1 flex-col p-6">
          <PlatformSidebarBrand homeHref={homeHref} roleLabel={roleLabel} />
          <div className="mt-6">
            <PlatformUserCard
              fullName={user.fullName}
              email={user.email}
              avatarUrl={user.avatarUrl}
              profileHref={user.profileHref}
            />
          </div>
          <div className="mt-6">
            <PlatformNav
              items={nav}
              viewAllLabel={viewAllLabel}
              variant="sidebar"
            />
          </div>
          <div className="mt-auto space-y-6 pt-8">
            <ThemeToggle />
            <PlatformLocaleSwitcher />
            <form action={logoutAction.bind(null, locale)}>
              <button
                type="submit"
                className={cn(
                  buttonVariants({ variant: "destructive", size: "sm" }),
                  "w-full gap-2 rounded-full",
                )}
              >
                <LogOut className="size-3.5" />
                {t("logout")}
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mb-6 md:hidden">
          <PlatformUserCard
            fullName={user.fullName}
            email={user.email}
            avatarUrl={user.avatarUrl}
            profileHref={user.profileHref}
          />
        </div>
        <div className="mb-6 md:hidden">
          <PlatformNav
            items={nav}
            viewAllLabel={viewAllLabel}
            variant="mobile"
          />
        </div>
        {children}
        <Toaster richColors closeButton position="top-right" />
      </main>
    </div>
  );
}
