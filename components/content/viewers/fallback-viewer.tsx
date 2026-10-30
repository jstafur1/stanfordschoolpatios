"use client";

import { Download, FileWarning } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FallbackViewerProps = {
  downloadUrl: string | null;
};

export function FallbackViewer({ downloadUrl }: FallbackViewerProps) {
  const t = useTranslations("app.common.contentViewer");

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
      <FileWarning className="size-10 text-muted-foreground" />
      <div>
        <p className="font-medium text-foreground">{t("previewUnavailable")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("previewUnavailableHint")}
        </p>
      </div>
      {downloadUrl ? (
        <a
          href={downloadUrl}
          download
          className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
        >
          <Download className="size-4" />
          {t("download")}
        </a>
      ) : null}
    </div>
  );
}
