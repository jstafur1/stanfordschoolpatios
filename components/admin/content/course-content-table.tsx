"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getContentViewerPath } from "@/lib/content/viewer-config";
import type { CourseRole } from "@/lib/platform/course-nav";
import type { ColumnDef } from "@tanstack/react-table";
import {
  deleteContentAction,
} from "@/app/actions/admin";
import {
  deleteTeacherContentAction,
} from "@/app/actions/teacher";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
  ConfirmDeleteDialog,
  useDeleteDialog,
} from "@/components/admin/confirm-delete-dialog";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import type { CourseContent } from "@/lib/supabase/mappers";
import {
  ContentFormDialog,
  CreateContentButton,
} from "./content-form-dialog";

const KNOWN_CONTENT_TYPES = [
  "pdf",
  "youtube",
  "image",
  "excel",
  "word",
  "powerpoint",
  "video",
  "other",
] as const;

type CourseContentTableProps = {
  courseId: string;
  items: CourseContent[];
  variant?: "admin" | "teacher";
  nextSortOrder?: number;
};

export function CourseContentTable({
  courseId,
  items,
  variant = "admin",
  nextSortOrder = 0,
}: CourseContentTableProps) {
  const t = useTranslations("app.admin.content");
  const tc = useTranslations("app.common");
  const router = useRouter();
  const previewRole: CourseRole = variant === "teacher" ? "teacher" : "admin";
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CourseContent | null>(null);
  const deleteDialog = useDeleteDialog<CourseContent>();

  const deleteAction =
    variant === "teacher" ? deleteTeacherContentAction : deleteContentAction;

  const columns = useMemo<ColumnDef<CourseContent>[]>(
    () => {
      const contentTypeLabel = (type: string) => {
        if ((KNOWN_CONTENT_TYPES as readonly string[]).includes(type)) {
          return tc(`contentTypes.${type}`);
        }
        return type;
      };

      return [
      {
        accessorKey: "sortOrder",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={tc("columns.order")} />
        ),
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={tc("columns.title")} />
        ),
      },
      {
        accessorKey: "contentType",
        header: tc("columns.type"),
        cell: ({ row }) => contentTypeLabel(row.original.contentType),
      },
      {
        id: "link",
        header: tc("columns.urlPath"),
        cell: ({ row }) => {
          const { externalUrl, storagePath } = row.original;
          const value = externalUrl ?? storagePath;
          return (
            <div className="max-w-[200px] truncate text-sm text-muted-foreground">
              {value ?? tc("dash")}
            </div>
          );
        },
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
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const canPreview =
            row.original.externalUrl || row.original.storagePath;
          return (
            <RowActionsMenu
              onPreview={
                canPreview
                  ? () =>
                      router.push(
                        getContentViewerPath(
                          previewRole,
                          courseId,
                          row.original.id,
                        ),
                      )
                  : undefined
              }
              onEdit={() => {
                setEditing(row.original);
                setFormOpen(true);
              }}
              onDelete={() => deleteDialog.openFor(row.original)}
            />
          );
        },
      },
    ];
    },
    [courseId, deleteDialog, previewRole, router, tc],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={items}
        getRowId={(row) => row.id}
        searchKey="title"
        searchPlaceholder={tc("filters.content")}
        toolbarActions={
          <CreateContentButton
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          />
        }
      />
      <ContentFormDialog
        key={formOpen ? (editing?.id ?? "create") : "closed"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        courseId={courseId}
        content={editing}
        variant={variant}
        nextSortOrder={nextSortOrder}
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
          deleteAction(deleteDialog.target!.id, courseId)
        }
      />
    </>
  );
}
