import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/guards";
import { getCourseById } from "@/lib/services/courses.service";
import { getAttemptDetailForTeacher } from "@/lib/services/grading.service";
import { translateAttemptStatus } from "@/lib/i18n/completion-status";
import { Badge } from "@/components/ui/badge";
import { AttemptReviewPanel } from "@/components/teacher/grades/attempt-review-panel";

type Props = {
  params: Promise<{ courseId: string; attemptId: string }>;
};

export default async function AdminAttemptDetailPage({ params }: Props) {
  const { courseId, attemptId } = await params;
  const [profile, t, tCommon] = await Promise.all([
    requireRole("admin"),
    getTranslations("app.teacher.grades"),
    getTranslations("app.common"),
  ]);

  const [course, detail] = await Promise.all([
    getCourseById(courseId),
    getAttemptDetailForTeacher(
      profile.id,
      profile.role,
      courseId,
      attemptId,
    ).catch(() => null),
  ]);

  if (!course || !detail) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{detail.exam.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("student")}: {detail.studentName}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge>
            {translateAttemptStatus(detail.attempt.status, tCommon)}
          </Badge>
          {detail.attempt.scorePercent != null ? (
            <span className="text-sm font-medium">
              {t("score")}: {detail.attempt.scorePercent}%
            </span>
          ) : null}
        </div>
      </div>

      <AttemptReviewPanel
        courseId={courseId}
        attemptId={attemptId}
        items={detail.questions}
      />
    </div>
  );
}
