"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { translateCompletionStatus } from "@/lib/i18n/completion-status";
import { getContentViewerPath } from "@/lib/content/viewer-config";
import type { StudentCourseProgress } from "@/lib/services/student-course-progress.service";
import { cn } from "@/lib/utils";

type CourseProgressSummaryProps = {
  courseId: string;
  progress: StudentCourseProgress;
};

function translateExamOutcome(
  outcome: string,
  t: ReturnType<typeof useTranslations>,
  tc: ReturnType<typeof useTranslations>,
) {
  if (outcome === "none") return t("examNotStarted");
  return translateCompletionStatus(outcome, tc);
}

export function CourseProgressSummary({
  courseId,
  progress,
}: CourseProgressSummaryProps) {
  const t = useTranslations("app.student.course");
  const tc = useTranslations("app.common");

  const { enrollment, materials, exams, whatsLeft } = progress;

  const whatsLeftParts: string[] = [];
  if (whatsLeft.unviewedMaterials > 0) {
    whatsLeftParts.push(
      t("whatsLeftReviewMaterials", { count: whatsLeft.unviewedMaterials }),
    );
  }
  if (whatsLeft.examsNotPassed > 0) {
    whatsLeftParts.push(
      t("whatsLeftPassExams", { count: whatsLeft.examsNotPassed }),
    );
  }
  const whatsLeftText =
    whatsLeftParts.length > 0
      ? whatsLeftParts.join(", ")
      : t("whatsLeftNothing");

  const firstUnviewed = materials.unviewedItems[0];

  return (
    <section className="mt-6 rounded-2xl border border-border p-6">
      <h2 className="text-lg font-semibold">{t("progressSummary")}</h2>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Badge
          variant={
            enrollment.completionStatus === "passed" ? "default" : "secondary"
          }
          className="text-sm"
        >
          {translateCompletionStatus(enrollment.completionStatus, tc)}
        </Badge>
        {enrollment.completionStatus === "passed" && enrollment.completedAt ? (
          <p className="text-sm text-muted-foreground">
            {t("completedOn", {
              date: enrollment.completedAt.toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              }),
            })}
          </p>
        ) : null}
      </div>

      {enrollment.completionStatus !== "passed" ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {t("whatsLeft", { items: whatsLeftText })}
        </p>
      ) : null}

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t("requirements")}
      </h3>

      <ul className="mt-3 space-y-3">
        <li className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-muted/40 px-4 py-3">
          <div>
            <p className="font-medium">
              {t("materialsRequirement", {
                viewed: materials.viewedCount,
                total: materials.totalCount,
              })}
            </p>
            {materials.allViewed && materials.totalCount > 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {t("allMaterialsReviewed")}
              </p>
            ) : materials.unviewedItems.length > 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {t("materialsNotReviewed", {
                  count: materials.unviewedItems.length,
                })}
              </p>
            ) : null}
            {materials.unavailableCount > 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {materials.unavailableCount} {t("unavailable").toLowerCase()}
              </p>
            ) : null}
          </div>
          {firstUnviewed ? (
            <Link
              href={getContentViewerPath(
                "student",
                courseId,
                firstUnviewed.id,
              )}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {t("viewFirstUnreviewed")}
            </Link>
          ) : null}
        </li>

        {exams.length > 0 ? (
          <li>
            <p className="mb-2 font-medium">{t("examsRequirement")}</p>
            <ul className="divide-y divide-border rounded-xl border border-border">
              {exams.map((exam) => (
                <li
                  key={exam.examId}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{exam.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {translateExamOutcome(exam.outcome, t, tc)}
                      </Badge>
                      {exam.bestScore != null ? (
                        <span className="text-sm text-muted-foreground">
                          {exam.bestScore}%
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <Link
                    href={`/student/courses/${courseId}/exams`}
                    className="text-sm text-primary hover:underline"
                  >
                    {t("goToExams")}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ) : (
          <li className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            {t("noExamsRequired")}
          </li>
        )}
      </ul>
    </section>
  );
}
