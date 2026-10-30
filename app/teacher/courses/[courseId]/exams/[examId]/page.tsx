import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/guards";
import { canManageCourse } from "@/lib/permissions/courses";
import { getCourseById } from "@/lib/services/courses.service";
import { getExamById } from "@/lib/services/exams.service";
import { listQuestionsWithOptions } from "@/lib/services/questions.service";
import { TeacherQuestionsList } from "@/components/teacher/exams/teacher-questions-list";

type Props = {
  params: Promise<{ courseId: string; examId: string }>;
};

export default async function TeacherExamQuestionsPage({ params }: Props) {
  const { courseId, examId } = await params;
  const [profile, t] = await Promise.all([
    requireRole("teacher"),
    getTranslations("app.teacher.exams"),
  ]);

  const allowed = await canManageCourse(profile.id, profile.role, courseId);
  if (!allowed) notFound();

  const [course, exam, questions] = await Promise.all([
    getCourseById(courseId),
    getExamById(examId),
    listQuestionsWithOptions(examId),
  ]);

  if (!course || !exam || exam.courseId !== courseId) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{exam.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("questionsPage.subtitle")}
        </p>
      </div>
      <TeacherQuestionsList
        courseId={courseId}
        examId={examId}
        questions={questions}
      />
    </div>
  );
}
