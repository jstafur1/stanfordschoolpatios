import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/guards";
import { canManageCourse } from "@/lib/permissions/courses";
import {
  getCourseById,
  listStudentsInCourse,
} from "@/lib/services/courses.service";
import { listGroupsForCourse } from "@/lib/services/groups.service";
import { listContentProgressForCourse } from "@/lib/services/progress.service";
import {
  localizedCourseDescription,
  localizedCourseTitle,
} from "@/lib/i18n/localized-content";

type Props = {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ groupId?: string }>;
};

export default async function TeacherCoursePage({
  params,
  searchParams,
}: Props) {
  const { courseId } = await params;
  const { groupId } = await searchParams;
  const [profile, t, tc, tStatus, tProgress] = await Promise.all([
    requireRole("teacher"),
    getTranslations("app.teacher.course"),
    getTranslations("app.common"),
    getTranslations("app.common.completionStatus"),
    getTranslations("app.progress"),
  ]);

  const allowed = await canManageCourse(profile.id, profile.role, courseId);
  if (!allowed) notFound();

  const [course, students, groups, progress] = await Promise.all([
    getCourseById(courseId),
    listStudentsInCourse(courseId, groupId),
    listGroupsForCourse(courseId),
    listContentProgressForCourse(courseId, groupId),
  ]);

  if (!course) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold">{localizedCourseTitle(course)}</h1>
      <p className="mt-1 text-muted-foreground">
        {localizedCourseDescription(course) ?? tc("dash")}
      </p>

      {groups.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/teacher/courses/${courseId}`}
            className={`rounded-full px-3 py-1 text-sm ${
              !groupId
                ? "bg-primary text-primary-foreground"
                : "border border-border"
            }`}
          >
            {t("allGroups")}
          </Link>
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/teacher/courses/${courseId}?groupId=${group.id}`}
              className={`rounded-full px-3 py-1 text-sm ${
                groupId === group.id
                  ? "bg-primary text-primary-foreground"
                  : "border border-border"
              }`}
            >
              {group.name}
            </Link>
          ))}
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="text-lg font-bold">
          {t("students")} ({students.length})
        </h2>
        <ul className="mt-4 divide-y divide-border rounded-2xl border border-border">
          {students.map(({ student, enrollment, group }) => {
            const studentProgress = progress.find(
              (row) => row.studentId === student.id,
            );
            return (
              <li key={enrollment.id} className="px-4 py-3">
                <p className="font-medium">{student.fullName ?? tc("dash")}</p>
                <p className="text-sm text-muted-foreground">
                  {group ? `${group.name} · ` : ""}
                  {t("statusLabel", {
                    status: tStatus(enrollment.completionStatus),
                  })}
                  {studentProgress
                    ? ` · ${tProgress("materialsViewed", {
                        viewed: studentProgress.viewedCount,
                        total: studentProgress.totalCount,
                      })}`
                    : ""}
                </p>
                <Link
                  href={`/teacher/courses/${courseId}/grades?studentId=${student.id}`}
                  className="mt-1 inline-block text-sm text-primary hover:underline"
                >
                  {t("viewResponses")}
                </Link>
              </li>
            );
          })}
          {students.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t("noStudents")}
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
