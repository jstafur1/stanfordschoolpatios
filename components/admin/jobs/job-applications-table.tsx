"use client";

import { useMemo, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import {
  getCvDownloadUrlAction,
  updateApplicationStatusFormAction,
} from "@/app/actions/jobs";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import type { JobApplication } from "@/lib/supabase/mappers";
import { translateActionError } from "@/lib/i18n/translate-action-error";

type JobApplicationsTableProps = {
  jobId: string;
  applications: JobApplication[];
};

const STATUSES = ["new", "reviewed", "rejected", "hired"] as const;

export function JobApplicationsTable({
  jobId,
  applications,
}: JobApplicationsTableProps) {
  const t = useTranslations("app.admin.jobs");
  const tc = useTranslations("app.common");
  const te = useTranslations("app.errors");
  const [pending, startTransition] = useTransition();

  const statusOptions = STATUSES.map((value) => ({
    value,
    label: tc(`applicationStatus.${value}` as "applicationStatus.new"),
  }));

  function handleDownload(storagePath: string) {
    startTransition(async () => {
      const result = await getCvDownloadUrlAction(storagePath);
      if (result.ok && result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else if (!result.ok) {
        toast.error(translateActionError(result, te));
      }
    });
  }

  const columns = useMemo<ColumnDef<JobApplication>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => row.fullName,
        header: t("applicantName"),
        cell: ({ row }) => row.original.fullName,
      },
      {
        id: "email",
        accessorFn: (row) => row.email,
        header: tc("columns.email"),
        cell: ({ row }) => row.original.email,
      },
      {
        id: "experience",
        accessorFn: (row) => row.yearsOfExperience ?? "",
        header: t("yearsExperience"),
        cell: ({ row }) =>
          row.original.yearsOfExperience ?? tc("dash"),
      },
      {
        id: "createdAt",
        accessorFn: (row) => row.createdAt.toISOString(),
        header: t("appliedAt"),
        cell: ({ row }) =>
          row.original.createdAt.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          }),
      },
      {
        id: "status",
        accessorFn: (row) => row.status,
        header: t("applicationStatus"),
        cell: ({ row }) => (
          <form
            action={updateApplicationStatusFormAction}
            className="flex min-w-[140px] items-center gap-2"
          >
            <input type="hidden" name="applicationId" value={row.original.id} />
            <input type="hidden" name="jobId" value={jobId} />
            <FormSelect
              name="status"
              defaultValue={row.original.status}
              options={statusOptions}
            />
            <Button type="submit" size="sm" variant="outline" disabled={pending}>
              {tc("save")}
            </Button>
          </form>
        ),
      },
      {
        id: "cv",
        header: t("cv"),
        cell: ({ row }) =>
          row.original.cvStoragePath ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => handleDownload(row.original.cvStoragePath!)}
            >
              {t("downloadCv")}
            </Button>
          ) : (
            tc("dash")
          ),
      },
    ],
    [jobId, pending, statusOptions, t, tc],
  );

  if (applications.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("noApplications")}</p>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={applications}
      getRowId={(row) => row.id}
    />
  );
}
