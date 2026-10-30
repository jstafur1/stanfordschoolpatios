import Image from "next/image";
import Link from "next/link";
import { navFocusOnCardClass } from "@/lib/platform/nav-styles";
import { cn } from "@/lib/utils";

type PlatformUserCardProps = {
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  profileHref: string;
  className?: string;
};

export function PlatformUserCard({
  fullName,
  email,
  avatarUrl,
  profileHref,
  className,
}: PlatformUserCardProps) {
  const displayName = fullName?.trim() || email;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Link
      href={profileHref}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted",
        navFocusOnCardClass,
        className,
      )}
    >
      <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm font-semibold text-muted-foreground">
            {initial}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{displayName}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
    </Link>
  );
}
