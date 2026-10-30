import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

type PlatformSidebarBrandProps = {
  homeHref: string;
  roleLabel: string;
  compact?: boolean;
};

export async function PlatformSidebarBrand({
  homeHref,
  roleLabel,
  compact = false,
}: PlatformSidebarBrandProps) {
  const t = await getTranslations("app.common");
  const logoSize = compact ? 32 : 40;

  return (
    <Link href={homeHref} className="flex items-start gap-2.5">
      <Image
        src="/logo.png"
        alt=""
        width={logoSize}
        height={logoSize}
        className="shrink-0"
      />
      <div className="min-w-0 leading-tight">
        <p
          className={cn(
            "font-bold text-foreground",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {t("schoolName")}
        </p>
        <p
          className={cn(
            "font-bold text-foreground",
            compact ? "text-[0.65rem]" : "text-xs",
          )}
        >
          {t("schoolLocation")}
        </p>
        <p
          className={cn(
            "text-muted-foreground",
            compact ? "mt-0.5 text-[0.65rem]" : "mt-1 text-xs",
          )}
        >
          {roleLabel}
        </p>
      </div>
    </Link>
  );
}
