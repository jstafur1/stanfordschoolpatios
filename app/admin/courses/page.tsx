import { getTranslations } from "next-intl/server";
import { listCoursesForAdmin } from "@/lib/services/courses.service";
import { listLanguages } from "@/lib/services/languages.service";
import { AdminCoursesTable } from "@/components/admin/courses/admin-courses-table";

export default async function AdminCoursesPage() {
  const [courses, languages, t] = await Promise.all([
    listCoursesForAdmin(),
    listLanguages(true),
    getTranslations("app.admin.courses"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <AdminCoursesTable courses={courses} languages={languages} />
    </div>
  );
}
