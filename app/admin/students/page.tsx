import { getTranslations } from "next-intl/server";
import { listCoursesWithGroupsForAdmin } from "@/lib/services/groups.service";
import { listPendingEnrollmentsForAdmin } from "@/lib/services/enrollments.service";
import { listStudents } from "@/lib/services/users.service";
import { AdminStudentsTable } from "@/components/admin/students/admin-students-table";
import { PendingEnrollmentsPanel } from "@/components/admin/students/pending-enrollments-panel";

export default async function AdminStudentsPage() {
  const [students, coursesWithGroups, pendingResult, t, tPending] =
    await Promise.all([
      listStudents(),
      listCoursesWithGroupsForAdmin(),
      listPendingEnrollmentsForAdmin().catch(() => []),
      getTranslations("app.admin.students"),
      getTranslations("app.admin.pendingEnrollments"),
    ]);
  const pendingEnrollments = pendingResult;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{tPending("title")}</h2>
          <p className="text-sm text-muted-foreground">{tPending("subtitle")}</p>
        </div>
        <PendingEnrollmentsPanel items={pendingEnrollments} />
      </section>

      <AdminStudentsTable students={students} coursesWithGroups={coursesWithGroups} />
    </div>
  );
}
