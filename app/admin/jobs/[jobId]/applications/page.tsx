import { BackLink } from "@/components/ui/back-link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { JobApplicationsTable } from "@/components/admin/jobs/job-applications-table";
import { requireRole } from "@/lib/auth/guards";
import {
  getJobPostingById,
  listApplicationsForJob,
} from "@/lib/services/jobs.service";

type Props = {
  params: Promise<{ jobId: string }>;
};

export default async function AdminJobApplicationsPage({ params }: Props) {
  const { jobId } = await params;
  const [, t] = await Promise.all([
    requireRole("admin"),
    getTranslations("app.admin.jobs"),
  ]);

  const [job, applications] = await Promise.all([
    getJobPostingById(jobId),
    listApplicationsForJob(jobId),
  ]);

  if (!job) notFound();

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/jobs">{t("backToJobs")}</BackLink>
        <h1 className="mt-4 text-2xl font-bold">
          {t("applicationsTitle", { title: job.title })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("applicationsSubtitle", { count: applications.length })}
        </p>
      </div>
      <JobApplicationsTable jobId={jobId} applications={applications} />
    </div>
  );
}
