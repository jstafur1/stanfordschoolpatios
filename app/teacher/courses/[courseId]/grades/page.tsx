import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/guards";
import { canManageCourse } from "@/lib/permissions/courses";
import { getCourseById } from "@/lib/services/courses.service";
import {
  listAttemptsForCourse,
  listPendingOpenAnswers,
} from "@/lib/services/grading.service";
import { translateAttemptStatus } from "@/lib/i18n/completion-status";
import { PendingReviewList } from "@/components/teacher/grades/pending-review-list";

type Props = {
  params: Promise<{ courseId: string }>;
};

export default async function TeacherGradesPage({ params }: Props) {
  const { courseId } = await params;
  const [profile, t, tCommon] = await Promise.all([
    requireRole("teacher"),
    getTranslations("app.teacher.grades"),
    getTranslations("app.common"),
  ]);

  const allowed = await canManageCourse(profile.id, profile.role, courseId);
  if (!allowed) notFound();

  const [course, attempts, pending] = await Promise.all([
    getCourseById(courseId),
    listAttemptsForCourse(courseId),
    listPendingOpenAnswers(courseId),
  ]);

  if (!course) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>

      <section className="mt-8">
        <h2 className="font-bold">{t("pending", { count: pending.length })}</h2>
        <div className="mt-4">
          <PendingReviewList courseId={courseId} items={pending} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-bold">
          {t("allAttempts", { count: attempts.length })}
        </h2>
        <ul className="mt-4 divide-y divide-border rounded-2xl border border-border">
          {attempts.map(({ attempt, exam, studentName }) => (
            <li key={attempt.id} className="px-4 py-3">
              <Link
                href={`/teacher/courses/${courseId}/grades/${attempt.id}`}
                className="block hover:opacity-80"
              >
                <p className="font-medium">{exam.title}</p>
                <p className="text-sm text-muted-foreground">{studentName}</p>
                <p className="text-sm text-muted-foreground">
                  {translateAttemptStatus(attempt.status, tCommon)}
                  {attempt.scorePercent != null
                    ? ` · ${attempt.scorePercent}%`
                    : ""}
                </p>
              </Link>
            </li>
          ))}
          {attempts.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t("noAttempts")}
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
