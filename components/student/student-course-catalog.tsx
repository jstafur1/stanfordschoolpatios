"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { joinCourseAction } from "@/app/actions/student";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  localizedCourseDescription,
  localizedCourseTitle,
  localizedLanguageName,
} from "@/lib/i18n/localized-content";
import { translateActionError } from "@/lib/i18n/translate-action-error";
import type { Course, Language } from "@/lib/supabase/mappers";

type CatalogItem = {
  course: Course;
  language: Language | null;
  enrollmentStatus: string | null;
};

type Props = {
  items: CatalogItem[];
};

export function StudentCourseCatalog({ items }: Props) {
  const t = useTranslations("app.student.catalog");
  const te = useTranslations("app.errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleJoin(courseId: string) {
    startTransition(async () => {
      const result = await joinCourseAction(courseId);
      if (!result.ok) {
        toast.error(translateActionError(result, te));
        return;
      }

      if (result.status === "pending") {
        toast.success(t("requestPending"));
      } else {
        toast.success(t("joined"));
      }
      router.refresh();
    });
  }

  if (!items.length) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {t("empty")}
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ course, language, enrollmentStatus }) => (
        <li
          key={course.id}
          className="flex flex-col rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground">
              {localizedCourseTitle(course)}
            </h3>
            {course.level ? <Badge variant="outline">{course.level}</Badge> : null}
          </div>
          <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
            {localizedCourseDescription(course) ?? t("noDescription")}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {language ? localizedLanguageName(language) : t("noLanguage")}
          </p>
          <div className="mt-4">
            {enrollmentStatus === "pending" ? (
              <Badge variant="secondary">{t("pendingBadge")}</Badge>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={() => handleJoin(course.id)}
                className={cn(buttonVariants(), "w-full rounded-full")}
              >
                {t("join")}
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
