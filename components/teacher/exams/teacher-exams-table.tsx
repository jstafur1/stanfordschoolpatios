"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { ListChecks } from "lucide-react";
import { deleteExamAction } from "@/app/actions/teacher";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
  ConfirmDeleteDialog,
  useDeleteDialog,
} from "@/components/admin/confirm-delete-dialog";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import type { Exam } from "@/lib/supabase/mappers";
import {
  CreateExamButton,
  ExamFormDialog,
} from "./exam-form-dialog";

type TeacherExamsTableProps = {
  courseId: string;
  exams: Exam[];
};

export function TeacherExamsTable({ courseId, exams }: TeacherExamsTableProps) {
  const t = useTranslations("app.teacher.exams");
  const tc = useTranslations("app.common");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const deleteDialog = useDeleteDialog<Exam>();

  const columns = useMemo<ColumnDef<Exam>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={tc("columns.title")} />
        ),
      },
      {
        accessorKey: "maxAttempts",
        header: tc("columns.maxAttempts"),
      },
      {
        id: "timeLimit",
        accessorFn: (row) => row.timeLimitMinutes ?? 0,
        header: tc("columns.timeLimit"),
        cell: ({ row }) =>
          row.original.timeLimitMinutes
            ? `${row.original.timeLimitMinutes} ${tc("min")}`
            : tc("dash"),
      },
      {
        id: "passThreshold",
        accessorFn: (row) => row.passThresholdPercent ?? 0,
        header: tc("columns.passPercent"),
        cell: ({ row }) =>
          row.original.passThresholdPercent != null
            ? `${row.original.passThresholdPercent}%`
            : tc("dash"),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={tc("columns.created")} />
        ),
        cell: ({ row }) =>
          row.original.createdAt.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
      },
      {
        id: "questions",
        header: tc("columns.questions"),
        enableHiding: false,
        cell: ({ row }) => (
          <Link
            href={`/teacher/courses/${courseId}/exams/${row.original.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ListChecks />
            {tc("build")}
          </Link>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
          <RowActionsMenu
            onEdit={() => {
              setEditing(row.original);
              setFormOpen(true);
            }}
            onDelete={() => deleteDialog.openFor(row.original)}
          />
        ),
      },
    ],
    [courseId, deleteDialog, tc],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={exams}
        getRowId={(row) => row.id}
        searchKey="title"
        searchPlaceholder={tc("filters.exams")}
        toolbarActions={
          <CreateExamButton
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          />
        }
      />
      <ExamFormDialog
        key={formOpen ? (editing?.id ?? "create") : "closed"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        courseId={courseId}
        exam={editing}
      />
      <ConfirmDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) deleteDialog.close();
        }}
        title={t("deleteTitle")}
        description={t("deleteDescription", {
          title: deleteDialog.target?.title ?? "",
        })}
        onConfirm={() =>
          deleteExamAction(deleteDialog.target!.id, courseId)
        }
      />
    </>
  );
}
