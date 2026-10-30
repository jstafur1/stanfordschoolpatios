"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { INSTITUTION } from "@/lib/landing/institution";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "default" | "compact";
  title?: string;
  className?: string;
};

export function GoogleMapEmbed({
  variant = "default",
  title,
  className,
}: Props) {
  const t = useTranslations("common");
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn("w-full", className)}>
      {title ? (
        <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      ) : null}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-3xl border border-border/60 shadow-sm",
          variant === "compact"
            ? "aspect-[16/9] max-h-48 sm:max-h-52"
            : "aspect-[4/3] sm:aspect-[16/10]",
        )}
      >
        {loaded ? (
          <iframe
            src={INSTITUTION.mapEmbedUrl}
            title={title ?? INSTITUTION.shortName}
            className="h-full w-full border-0 dark:opacity-90 dark:[filter:invert(90%)_hue-rotate(180deg)]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setLoaded(true)}
            className="absolute inset-0 flex items-center justify-center bg-muted/60 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
          >
            {t("loadMap")}
          </button>
        )}
      </div>
    </div>
  );
}
