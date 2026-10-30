import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/guards";
import { listCoursesForTeacher } from "@/lib/services/courses.service";
import {
  localizedCourseTitle,
  localizedLanguageName,
} from "@/lib/i18n/localized-content";

export default async function TeacherPage() {
  const profile = await requireRole("teacher");
  const [courses, t] = await Promise.all([
    listCoursesForTeacher(profile.id),
    getTranslations("app.teacher"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">
        {t("dashboard.title")}
      </h1>
      <p className="mt-2 text-muted-foreground">{t("dashboard.subtitle")}</p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map(({ course, language }) => (
          <li key={course.id}>
            <Link
              href={`/teacher/courses/${course.id}`}
              className="block rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <h2 className="font-bold text-foreground">
                {localizedCourseTitle(course)}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {language ? localizedLanguageName(language) : t("dashboard.noLanguage")}
                {course.published ? " · Published" : " · Draft"}
              </p>
            </Link>
          </li>
        ))}
        {courses.length === 0 && (
          <li className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            {t("dashboard.empty")}
          </li>
        )}
      </ul>
    </div>
  );
}
