import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/guards";
import { canManageCourse } from "@/lib/permissions/courses";
import { getCourseById } from "@/lib/services/courses.service";
import { listExamsByCourse } from "@/lib/services/exams.service";
import { TeacherExamsTable } from "@/components/teacher/exams/teacher-exams-table";

type Props = {
  params: Promise<{ courseId: string }>;
};

export default async function TeacherExamsPage({ params }: Props) {
  const { courseId } = await params;
  const [profile, t] = await Promise.all([
    requireRole("teacher"),
    getTranslations("app.teacher.exams"),
  ]);

  const allowed = await canManageCourse(profile.id, profile.role, courseId);
  if (!allowed) notFound();

  const [course, exams] = await Promise.all([
    getCourseById(courseId),
    listExamsByCourse(courseId),
  ]);

  if (!course) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <TeacherExamsTable courseId={courseId} exams={exams} />
    </div>
  );
}
