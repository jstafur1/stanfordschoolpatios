import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/guards";
import { getExamTakeContext } from "@/lib/services/attempts.service";
import { getCourseById } from "@/lib/services/courses.service";
import { getExamById } from "@/lib/services/exams.service";
import { ExamTakeShell } from "@/components/student/exam-take-shell";

type Props = {
  params: Promise<{ courseId: string; examId: string }>;
  searchParams: Promise<{ attempt?: string }>;
};

export default async function StudentExamTakePage({
  params,
  searchParams,
}: Props) {
  const { courseId, examId } = await params;
  const { attempt: attemptId } = await searchParams;
  const profile = await requireRole("student");

  if (!attemptId) notFound();

  const [course, exam, context, t] = await Promise.all([
    getCourseById(courseId),
    getExamById(examId),
    getExamTakeContext(profile.id, examId, attemptId),
    getTranslations("app.student.exams"),
  ]);

  if (!course || !exam || exam.courseId !== courseId || !context) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold">{exam.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("takeHint")}</p>

      <div className="mt-8">
        <ExamTakeShell
          courseId={courseId}
          exam={exam}
          attemptId={attemptId}
          startedAt={context.attempt.startedAt.toISOString()}
          questions={context.questions}
          answers={context.answers}
        />
      </div>
    </div>
  );
}
