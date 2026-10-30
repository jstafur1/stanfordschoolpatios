"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { deleteTeacherAction } from "@/app/actions/admin";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
  ConfirmDeleteDialog,
  useDeleteDialog,
} from "@/components/admin/confirm-delete-dialog";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import type { CourseWithGroups } from "@/components/admin/group-assignment-field";
import { Badge } from "@/components/ui/badge";
import type { Language } from "@/lib/supabase/mappers";
import { localizedLanguageName } from "@/lib/i18n/localized-content";
import type { TeacherAdminRow } from "@/lib/services/teachers.service";
import {
  CreateTeacherButton,
  TeacherFormDialog,
} from "./teacher-form-dialog";

type AdminTeachersTableProps = {
  teachers: TeacherAdminRow[];
  languages: Language[];
  coursesWithGroups: CourseWithGroups[];
};

export function AdminTeachersTable({
  teachers,
  languages,
  coursesWithGroups,
}: AdminTeachersTableProps) {
  const t = useTranslations("app.admin.teachers");
  const tc = useTranslations("app.common");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherAdminRow | null>(null);
  const deleteDialog = useDeleteDialog<TeacherAdminRow>();

  const columns = useMemo<ColumnDef<TeacherAdminRow>[]>(
    () => [
      {
        id: "fullName",
        accessorFn: (row) => row.profile.fullName ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={tc("columns.name")} />
        ),
        cell: ({ row }) => row.original.profile.fullName ?? tc("dash"),
      },
      {
        id: "email",
        accessorFn: (row) => row.email,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={tc("columns.email")} />
        ),
      },
      {
        id: "language",
        accessorFn: (row) =>
          row.language ? localizedLanguageName(row.language, "es") : "",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={tc("columns.language")}
          />
        ),
        cell: ({ row }) =>
          row.original.language
            ? localizedLanguageName(row.original.language, "es")
            : tc("dash"),
      },
      {
        id: "groups",
        accessorFn: (row) => row.groupIds.length,
        header: tc("columns.groups"),
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.groupIds.length}</Badge>
        ),
      },
      {
        id: "bio",
        accessorFn: (row) => row.teacherProfile?.bio ?? "",
        header: tc("columns.bio"),
        cell: ({ row }) => (
          <span className="block max-w-[200px] truncate text-muted-foreground">
            {row.original.teacherProfile?.bio ?? tc("dash")}
          </span>
        ),
      },
      {
        id: "createdAt",
        accessorFn: (row) => row.profile.createdAt,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={tc("columns.created")} />
        ),
        cell: ({ row }) =>
          row.original.profile.createdAt.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
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
    deleteDialog.target?.profile.fullName ??
    deleteDialog.target?.email ??
    tc("roles.teacher");

  return (
    <>
      <DataTable
        columns={columns}
        data={teachers}
        getRowId={(row) => row.profile.id}
        searchKey="email"
        searchPlaceholder={tc("filters.email")}
        toolbarActions={
          <CreateTeacherButton
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          />
        }
      />
      <TeacherFormDialog
        key={formOpen ? (editing?.profile.id ?? "create") : "closed"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        languages={languages}
        coursesWithGroups={coursesWithGroups}
        teacher={editing}
      />
      <ConfirmDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) deleteDialog.close();
        }}
        title={t("deleteTitle")}
        description={t("deleteDescription", { name: deleteName })}
        onConfirm={() =>
          deleteTeacherAction(deleteDialog.target!.profile.id)
        }
      />
    </>
  );
}
