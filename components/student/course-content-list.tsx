"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { getContentViewerPath } from "@/lib/content/viewer-config";
import type { CourseContent } from "@/lib/supabase/mappers";

type ContentItem = CourseContent & { downloadUrl?: string | null };

type CourseContentListProps = {
  courseId: string;
  items: ContentItem[];
  viewedContentIds: string[];
};

export function CourseContentList({
  courseId,
  items,
  viewedContentIds,
}: CourseContentListProps) {
  const t = useTranslations("app.student.course");
  const tc = useTranslations("app.common");
  const tv = useTranslations("app.common.contentViewer");
  const viewedSet = new Set(viewedContentIds);

  const knownTypes = [
    "pdf",
    "youtube",
    "image",
    "excel",
    "word",
    "powerpoint",
    "video",
    "audio",
    "other",
  ] as const;

  function contentTypeLabel(type: string) {
    if ((knownTypes as readonly string[]).includes(type)) {
      return tc(`contentTypes.${type}`);
    }
    return type;
  }

  const viewedCount = items.filter((item) => viewedSet.has(item.id)).length;
  const allViewed = items.length > 0 && viewedCount === items.length;

  return (
    <div>
      {items.length > 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {allViewed
            ? t("allMaterialsReviewed")
            : t("progress", { viewed: viewedCount, total: items.length })}
        </p>
      ) : null}
      <ul className="mt-4 divide-y divide-border rounded-2xl border border-border">
        {items.map((item) => {
          const viewed = viewedSet.has(item.id);
          const canOpen =
            item.externalUrl || item.downloadUrl || item.storagePath;
          const viewerHref = getContentViewerPath(
            "student",
            courseId,
            item.id,
          );

          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.title}</p>
                  {viewed ? (
                    <Badge variant="secondary">{t("viewed")}</Badge>
                  ) : (
                    <Badge variant="outline">{t("notViewed")}</Badge>
                  )}
                  {!canOpen ? (
                    <Badge variant="destructive">{t("unavailable")}</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {contentTypeLabel(item.contentType)}
                </p>
              </div>
              {canOpen ? (
                <Link
                  href={viewerHref}
                  className="text-sm text-primary hover:underline"
                >
                  {tv("view")}
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {tc("fileUnavailable")}
                </span>
              )}
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">
            {t("noContent")}
          </li>
        )}
      </ul>
    </div>
  );
}
