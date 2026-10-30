import { getTranslations } from "next-intl/server";
import { listCoursesWithGroupsForAdmin } from "@/lib/services/groups.service";
import { listLanguages } from "@/lib/services/languages.service";
import { listTeachersForAdmin } from "@/lib/services/teachers.service";
import { AdminTeachersTable } from "@/components/admin/teachers/admin-teachers-table";

export default async function AdminTeachersPage() {
  const [teachers, languages, coursesWithGroups, t] = await Promise.all([
    listTeachersForAdmin(),
    listLanguages(true),
    listCoursesWithGroupsForAdmin(),
    getTranslations("app.admin.teachers"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <AdminTeachersTable
        teachers={teachers}
        languages={languages}
        coursesWithGroups={coursesWithGroups}
      />
    </div>
  );
}
