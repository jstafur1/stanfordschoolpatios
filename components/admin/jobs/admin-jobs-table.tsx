"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { Users } from "lucide-react";
import { deleteJobPostingAction } from "@/app/actions/jobs";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
  ConfirmDeleteDialog,
  useDeleteDialog,
} from "@/components/admin/confirm-delete-dialog";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { JobPostingWithCount } from "@/lib/services/jobs.service";
import type { JobPosting } from "@/lib/supabase/mappers";
import { CreateJobButton, JobFormDialog } from "./job-form-dialog";

type JobRow = JobPostingWithCount;

type AdminJobsTableProps = {
  jobs: JobRow[];
};

export function AdminJobsTable({ jobs }: AdminJobsTableProps) {
  const t = useTranslations("app.admin.jobs");
  const tc = useTranslations("app.common");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JobPosting | null>(null);
  const deleteDialog = useDeleteDialog<JobRow>();

  const columns = useMemo<ColumnDef<JobRow>[]>(
    () => [
      {
        id: "title",
        accessorFn: (row) => row.job.title,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("title")} />
        ),
        cell: ({ row }) => (
          <div className="max-w-[240px] truncate font-medium">
            {row.original.job.title}
          </div>
        ),
      },
      {
        id: "employmentType",
        accessorFn: (row) => row.job.employmentType,
        header: t("employmentType"),
        cell: ({ row }) =>
          tc(
            `employmentType.${row.original.job.employmentType}` as "employmentType.full_time",
          ),
      },
      {
        id: "status",
        accessorFn: (row) => row.job.status,
        header: t("status"),
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.job.status === "published" ? "default" : "secondary"
            }
          >
            {tc(
              `jobStatus.${row.original.job.status}` as "jobStatus.draft",
            )}
          </Badge>
        ),
      },
      {
        id: "deadline",
        accessorFn: (row) => row.job.applicationDeadline?.toISOString() ?? "",
        header: t("deadline"),
        cell: ({ row }) =>
          row.original.job.applicationDeadline
            ? row.original.job.applicationDeadline.toLocaleDateString()
            : tc("dash"),
      },
      {
        id: "applicants",
        accessorFn: (row) => row.applicantCount,
        header: t("applicants"),
        cell: ({ row }) => row.original.applicantCount,
      },
      {
        id: "applications",
        header: t("viewApplications"),
        cell: ({ row }) => (
          <Link
            href={`/admin/jobs/${row.original.job.id}/applications`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Users />
            {row.original.applicantCount}
          </Link>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
          <RowActionsMenu
            onEdit={() => {
              setEditing(row.original.job);
              setFormOpen(true);
            }}
            onDelete={() => deleteDialog.openFor(row.original)}
          />
        ),
      },
    ],
    [deleteDialog, t, tc],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={jobs}
        getRowId={(row) => row.job.id}
        toolbarActions={
          <CreateJobButton
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          />
        }
      />
      <JobFormDialog
        key={formOpen ? (editing?.id ?? "create") : "closed"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        job={editing}
      />
      <ConfirmDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) deleteDialog.close();
        }}
        title={t("deleteTitle")}
        description={t("deleteDescription", {
          title: deleteDialog.target?.job.title ?? "",
        })}
        onConfirm={() =>
          deleteJobPostingAction(deleteDialog.target!.job.id)
        }
      />
    </>
  );
}
