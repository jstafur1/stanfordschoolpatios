import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/guards";
import {
  listCoursesForStudent,
  listPendingCoursesForStudent,
  listPublishedCoursesForStudentJoin,
} from "@/lib/services/enrollments.service";
import {
  localizedCourseDescription,
  localizedCourseTitle,
  localizedLanguageName,
} from "@/lib/i18n/localized-content";
import { translateCompletionStatus } from "@/lib/i18n/completion-status";
import { Badge } from "@/components/ui/badge";
import { StudentCourseCatalog } from "@/components/student/student-course-catalog";

export default async function StudentPage() {
  const profile = await requireRole("student");
  const [enrollments, pendingEnrollments, availableCourses, t, tCommon] =
    await Promise.all([
      listCoursesForStudent(profile.id),
      listPendingCoursesForStudent(profile.id),
      listPublishedCoursesForStudentJoin(profile.id),
      getTranslations("app.student"),
      getTranslations("app.common"),
    ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">
        {t("dashboard.title")}
      </h1>
      <p className="mt-2 text-muted-foreground">{t("dashboard.subtitle")}</p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">
          {t("dashboard.myCourses")}
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map(({ course, language, enrollment, group }) => (
            <li key={enrollment.id}>
              <Link
                href={`/student/courses/${course.id}`}
                className="block rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-foreground">
                    {localizedCourseTitle(course)}
                  </h3>
                  <div className="flex flex-col items-end gap-1">
                    {course.published ? (
                      <Badge>{tCommon("published")}</Badge>
                    ) : (
                      <Badge variant="secondary">{tCommon("draft")}</Badge>
                    )}
                    <Badge variant="outline">
                      {translateCompletionStatus(
                        enrollment.completionStatus,
                        tCommon,
                      )}
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {localizedCourseDescription(course) ??
                    tCommon("noDescription")}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {language ? localizedLanguageName(language) : "No language"}
                  {group ? ` · ${group.name}` : ""} ·
                  {t("dashboard.enrolled")}{" "}
                  {enrollment.enrolledAt.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </Link>
            </li>
          ))}
          {enrollments.length === 0 && (
            <li className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              {t("dashboard.empty")}
            </li>
          )}
        </ul>
      </section>

      {pendingEnrollments.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">
            {t("catalog.pendingTitle")}
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingEnrollments.map(({ course, language, enrollment }) => (
              <li
                key={enrollment.id}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <h3 className="font-semibold text-foreground">
                  {localizedCourseTitle(course)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {localizedCourseDescription(course) ??
                    tCommon("noDescription")}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {language ? localizedLanguageName(language) : "No language"}
                </p>
                <Badge className="mt-4" variant="secondary">
                  {t("catalog.pendingBadge")}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">
          {t("catalog.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("catalog.subtitle")}
        </p>
        <div className="mt-4">
          <StudentCourseCatalog items={availableCourses} />
        </div>
      </section>
    </div>
  );
}
