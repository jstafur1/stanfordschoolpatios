import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/guards";
import { getAttemptResultDetailForStudent } from "@/lib/services/attempts.service";
import { getCourseById } from "@/lib/services/courses.service";
import { getExamById } from "@/lib/services/exams.service";
import { translateAttemptStatus } from "@/lib/i18n/completion-status";
import { Badge } from "@/components/ui/badge";
import { ExamResultBreakdown } from "@/components/student/exam-result-breakdown";

type Props = {
  params: Promise<{ courseId: string; examId: string }>;
  searchParams: Promise<{ attempt?: string }>;
};

export default async function StudentExamResultPage({
  params,
  searchParams,
}: Props) {
  const { courseId, examId } = await params;
  const { attempt: attemptId } = await searchParams;
  const profile = await requireRole("student");

  if (!attemptId) notFound();

  const [course, exam, detail, t, tCommon] = await Promise.all([
    getCourseById(courseId),
    getExamById(examId),
    getAttemptResultDetailForStudent(profile.id, attemptId),
    getTranslations("app.student.exams"),
    getTranslations("app.common"),
  ]);

  if (
    !course ||
    !exam ||
    exam.courseId !== courseId ||
    !detail ||
    detail.exam.id !== examId
  ) {
    notFound();
  }

  const { attempt } = detail;

  return (
    <div>
      <h1 className="text-2xl font-bold">{exam.title}</h1>
      <p className="mt-2 text-muted-foreground">{t("resultSubmitted")}</p>

      <div className="mt-8 rounded-2xl border border-border p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>
            {translateAttemptStatus(attempt.status, tCommon)}
          </Badge>
          {attempt.scorePercent != null ? (
            <p className="text-lg font-semibold">{attempt.scorePercent}%</p>
          ) : null}
        </div>
        {attempt.status === "pending_review" ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {t("resultPendingReview")}
          </p>
        ) : attempt.status === "submitted" &&
          attempt.scorePercent != null &&
          exam.passThresholdPercent == null ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {t("resultGradedNoThreshold")}
          </p>
        ) : attempt.submittedAt ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {t("resultSubmittedAt", {
              date: attempt.submittedAt.toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              }),
            })}
          </p>
        ) : null}
      </div>

      <h2 className="mt-10 text-lg font-semibold">{t("yourAnswers")}</h2>
      <ExamResultBreakdown
        items={detail.questions}
        attemptStatus={attempt.status}
      />
    </div>
  );
}
