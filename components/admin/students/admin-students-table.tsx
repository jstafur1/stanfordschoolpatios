"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { deleteStudentAction } from "@/app/actions/admin";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import {
  ConfirmDeleteDialog,
  useDeleteDialog,
} from "@/components/admin/confirm-delete-dialog";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import type { CourseWithGroups } from "@/components/admin/group-assignment-field";
import type { StudentRow } from "@/lib/services/users.service";
import {
  CreateStudentButton,
  StudentFormDialog,
} from "./student-form-dialog";

type AdminStudentsTableProps = {
  students: StudentRow[];
  coursesWithGroups: CourseWithGroups[];
};

export function AdminStudentsTable({
  students,
  coursesWithGroups,
}: AdminStudentsTableProps) {
  const t = useTranslations("app.admin.students");
  const tc = useTranslations("app.common");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const deleteDialog = useDeleteDialog<StudentRow>();

  const columns = useMemo<ColumnDef<StudentRow>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={tc("columns.name")} />
        ),
        cell: ({ row }) => row.original.fullName ?? tc("dash"),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={tc("columns.email")} />
        ),
      },
      {
        id: "courses",
        accessorFn: (row) => row.courseIds.length,
        header: tc("columns.courses"),
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.courseIds.length}</Badge>
        ),
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
        id: "role",
        header: tc("columns.role"),
        cell: () => (
          <Badge variant="secondary">{tc("roles.student")}</Badge>
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
    [deleteDialog, tc],
  );

  const deleteName =
    deleteDialog.target?.fullName ??
    deleteDialog.target?.email ??
    tc("roles.student");

  return (
    <>
      <DataTable
        columns={columns}
        data={students}
        searchKey="email"
        searchPlaceholder={tc("filters.email")}
        toolbarActions={
          <CreateStudentButton
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          />
        }
      />
      <StudentFormDialog
        key={formOpen ? (editing?.id ?? "create") : "closed"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        coursesWithGroups={coursesWithGroups}
        student={editing}
      />
      <ConfirmDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) deleteDialog.close();
        }}
        title={t("deleteTitle")}
        description={t("deleteDescription", { name: deleteName })}
        onConfirm={() => deleteStudentAction(deleteDialog.target!.id)}
      />
    </>
  );
}
