import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/guards";
import { getCourseById } from "@/lib/services/courses.service";
import { listExamsForStudentCourse } from "@/lib/services/attempts.service";
import { getStudentCourseIds } from "@/lib/services/enrollments.service";
import { startExamAndRedirectAction } from "@/app/actions/student";
import { translateAttemptStatus } from "@/lib/i18n/completion-status";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ courseId: string }>;
};

export default async function StudentExamsPage({ params }: Props) {
  const { courseId } = await params;
  const profile = await requireRole("student");

  const [course, enrolledIds, t, tCommon] = await Promise.all([
    getCourseById(courseId),
    getStudentCourseIds(profile.id),
    getTranslations("app.student.exams"),
    getTranslations("app.common"),
  ]);

  if (!course || !enrolledIds.includes(courseId)) notFound();

  const exams = await listExamsForStudentCourse(profile.id, courseId);

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>

      <ul className="mt-8 divide-y divide-border rounded-2xl border border-border">
        {exams.map(
          ({
            exam,
            attemptCount,
            inProgressAttemptId,
            canStart,
            bestScore,
            latestStatus,
            latestReviewableAttemptId,
            reviewableAttempts,
          }) => (
            <li key={exam.id} className="px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{exam.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("attempts", {
                      count: attemptCount,
                      max: exam.maxAttempts,
                    })}
                    {exam.timeLimitMinutes
                      ? ` · ${t("timeLimit", { minutes: exam.timeLimitMinutes })}`
                      : ""}
                    {exam.passThresholdPercent != null
                      ? ` · ${t("passThreshold", { percent: exam.passThresholdPercent })}`
                      : ""}
                  </p>
                  {bestScore != null ? (
                    <p className="mt-1 text-sm">
                      {t("bestScore", { score: bestScore })}
                    </p>
                  ) : null}
                  {latestStatus ? (
                    <Badge variant="secondary" className="mt-2">
                      {translateAttemptStatus(latestStatus, tCommon)}
                    </Badge>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {inProgressAttemptId ? (
                    <Link
                      href={`/student/courses/${courseId}/exams/${exam.id}?attempt=${inProgressAttemptId}`}
                      className={cn(buttonVariants({ size: "sm" }))}
                    >
                      {t("continue")}
                    </Link>
                  ) : null}
                  {latestReviewableAttemptId ? (
                    <Link
                      href={`/student/courses/${courseId}/exams/${exam.id}/result?attempt=${latestReviewableAttemptId}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                      )}
                    >
                      {t("viewAnswers")}
                    </Link>
                  ) : null}
                  {!inProgressAttemptId && canStart ? (
                    <form action={startExamAndRedirectAction}>
                      <input type="hidden" name="courseId" value={courseId} />
                      <input type="hidden" name="examId" value={exam.id} />
                      <Button type="submit" size="sm">
                        {t("start")}
                      </Button>
                    </form>
                  ) : !inProgressAttemptId && !canStart ? (
                    <Button size="sm" disabled>
                      {t("noAttemptsLeft")}
                    </Button>
                  ) : null}
                </div>
              </div>

              {reviewableAttempts.length > 1 ? (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-sm font-medium">{t("attemptHistory")}</p>
                  <ul className="mt-2 space-y-2">
                    {reviewableAttempts.map((attempt) => (
                      <li
                        key={attempt.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-sm"
                      >
                        <span className="text-muted-foreground">
                          {attempt.submittedAt
                            ? attempt.submittedAt.toLocaleString(undefined, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "—"}
                          {attempt.scorePercent != null
                            ? ` · ${attempt.scorePercent}%`
                            : ""}
                          {" · "}
                          {translateAttemptStatus(attempt.status, tCommon)}
                        </span>
                        <Link
                          href={`/student/courses/${courseId}/exams/${exam.id}/result?attempt=${attempt.id}`}
                          className="text-primary hover:underline"
                        >
                          {t("viewAnswers")}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          ),
        )}
        {exams.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">
            {t("empty")}
          </li>
        )}
      </ul>
    </div>
  );
}
