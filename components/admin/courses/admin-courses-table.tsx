"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { Bot, FileStack } from "lucide-react";
import { deleteCourseAction } from "@/app/actions/admin";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ConfirmDeleteDialog,
  useDeleteDialog,
} from "@/components/admin/confirm-delete-dialog";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import {
  courseSearchText,
  localizedLanguageName,
} from "@/lib/i18n/localized-content";
import type { Language } from "@/lib/supabase/mappers";
import {
  CreateCourseButton,
  CourseFormDialog,
  type CourseTableRow,
} from "./course-form-dialog";

type CourseRow = CourseTableRow & { searchText: string };

type AdminCoursesTableProps = {
  courses: CourseTableRow[];
  languages: Language[];
};

export function AdminCoursesTable({
  courses,
  languages,
}: AdminCoursesTableProps) {
  const t = useTranslations("app.admin.courses");
  const tcb = useTranslations("app.admin.chatbot");
  const tc = useTranslations("app.common");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CourseTableRow | null>(null);
  const deleteDialog = useDeleteDialog<CourseTableRow>();

  const tableData = useMemo<CourseRow[]>(
    () =>
      courses.map((row) => ({
        ...row,
        searchText: courseSearchText(row.course),
      })),
    [courses],
  );

  const columns = useMemo<ColumnDef<CourseRow>[]>(
    () => [
      {
        accessorKey: "searchText",
        header: () => null,
        cell: () => null,
        enableHiding: false,
      },
      {
        id: "titleEs",
        accessorFn: (row) => row.course.titleEs,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={tc("columns.titleEs")}
          />
        ),
        cell: ({ row }) => (
          <div className="max-w-[220px] truncate font-medium">
            {row.original.course.titleEs}
          </div>
        ),
      },
      {
        id: "titleEn",
        accessorFn: (row) => row.course.titleEn,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={tc("columns.titleEn")}
          />
        ),
        cell: ({ row }) => (
          <div className="max-w-[220px] truncate">{row.original.course.titleEn}</div>
        ),
      },
      {
        id: "titleFr",
        accessorFn: (row) => row.course.titleFr,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={tc("columns.titleFr")}
          />
        ),
        cell: ({ row }) => (
          <div className="max-w-[220px] truncate">{row.original.course.titleFr}</div>
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
        id: "published",
        accessorFn: (row) => row.course.published,
        header: tc("columns.status"),
        cell: ({ row }) =>
          row.original.course.published ? (
            <Badge>{tc("published")}</Badge>
          ) : (
            <Badge variant="secondary">{tc("draft")}</Badge>
          ),
      },
      {
        id: "createdAt",
        accessorFn: (row) => row.course.createdAt,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={tc("columns.created")} />
        ),
        cell: ({ row }) =>
          row.original.course.createdAt.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
      },
      {
        id: "content",
        header: tc("columns.content"),
        enableHiding: false,
        cell: ({ row }) => (
          <Link
            href={`/admin/courses/${row.original.course.id}/content`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <FileStack />
            {tc("manage")}
          </Link>
        ),
      },
      {
        id: "chatbot",
        header: tcb("nav"),
        enableHiding: false,
        cell: ({ row }) => (
          <Link
            href={`/admin/courses/${row.original.course.id}/chatbot`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Bot />
            {tc("manage")}
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
    [deleteDialog, tcb, tc],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={tableData}
        getRowId={(row) => row.course.id}
        searchKey="searchText"
        searchPlaceholder={tc("filters.courses")}
        toolbarActions={
          <CreateCourseButton
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          />
        }
      />
      <CourseFormDialog
        key={formOpen ? (editing?.course.id ?? "create") : "closed"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        languages={languages}
        courseRow={editing}
      />
      <ConfirmDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) deleteDialog.close();
        }}
        title={t("deleteTitle")}
        description={t("deleteDescription", {
          title: deleteDialog.target?.course.titleEs ?? "",
        })}
        onConfirm={() => deleteCourseAction(deleteDialog.target!.course.id)}
      />
    </>
  );
}
