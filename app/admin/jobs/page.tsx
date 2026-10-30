import { getTranslations } from "next-intl/server";
import { AdminJobsTable } from "@/components/admin/jobs/admin-jobs-table";
import { requireRole } from "@/lib/auth/guards";
import { listJobPostingsForAdmin } from "@/lib/services/jobs.service";

export default async function AdminJobsPage() {
  const [, t] = await Promise.all([
    requireRole("admin"),
    getTranslations("app.admin.jobs"),
  ]);

  const jobs = await listJobPostingsForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <AdminJobsTable jobs={jobs} />
    </div>
  );
}
