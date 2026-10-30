import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listLanguages } from "@/lib/services/languages.service";
import { listTeachersForAdmin } from "@/lib/services/teachers.service";
import { listCoursesForAdmin } from "@/lib/services/courses.service";
import { listStudents } from "@/lib/services/users.service";

export default async function AdminPage() {
  const [students, languages, teachers, courses, t] = await Promise.all([
    listStudents(),
    listLanguages(),
    listTeachersForAdmin(),
    listCoursesForAdmin(),
    getTranslations("app.admin"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">
        {t("dashboard.title")}
      </h1>
      <p className="mt-2 text-muted-foreground">{t("dashboard.subtitle")}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t("nav.students"), count: students.length, href: "/admin/students" },
          { label: t("nav.teachers"), count: teachers.length, href: "/admin/teachers" },
          { label: t("nav.languages"), count: languages.length, href: "/admin/languages" },
          { label: t("nav.courses"), count: courses.length, href: "/admin/courses" },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{stat.count}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
