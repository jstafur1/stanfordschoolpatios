"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { deleteLanguageAction } from "@/app/actions/admin";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import {
  ConfirmDeleteDialog,
  useDeleteDialog,
} from "@/components/admin/confirm-delete-dialog";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import { languageSearchText } from "@/lib/i18n/localized-content";
import type { Language } from "@/lib/supabase/mappers";
import {
  CreateLanguageButton,
  LanguageFormDialog,
} from "./language-form-dialog";

type LanguageRow = Language & { searchText: string };

type AdminLanguagesTableProps = {
  languages: Language[];
};

export function AdminLanguagesTable({ languages }: AdminLanguagesTableProps) {
  const t = useTranslations("app.admin.languages");
  const tc = useTranslations("app.common");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Language | null>(null);
  const deleteDialog = useDeleteDialog<Language>();

  const tableData = useMemo<LanguageRow[]>(
    () =>
      languages.map((language) => ({
        ...language,
        searchText: languageSearchText(language),
      })),
    [languages],
  );

  const columns = useMemo<ColumnDef<LanguageRow>[]>(
    () => [
      {
        accessorKey: "searchText",
        header: () => null,
        cell: () => null,
        enableHiding: false,
      },
      {
        accessorKey: "nameEs",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={tc("columns.spanish")}
          />
        ),
      },
      {
        accessorKey: "nameEn",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={tc("columns.english")}
          />
        ),
      },
      {
        accessorKey: "nameFr",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={tc("columns.french")} />
        ),
      },
      {
        accessorKey: "code",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={tc("columns.code")} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs uppercase">{row.original.code}</span>
        ),
      },
      {
        accessorKey: "isActive",
        header: tc("columns.status"),
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge>{tc("published")}</Badge>
          ) : (
            <Badge variant="secondary">{tc("draft")}</Badge>
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

  return (
    <>
      <DataTable
        columns={columns}
        data={tableData}
        getRowId={(row) => row.id}
        searchKey="searchText"
        searchPlaceholder={tc("filters.languages")}
        toolbarActions={
          <CreateLanguageButton
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          />
        }
      />
      <LanguageFormDialog
        key={formOpen ? (editing?.id ?? "create") : "closed"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        language={editing}
      />
      <ConfirmDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) deleteDialog.close();
        }}
        title={t("deleteTitle")}
        description={t("deleteDescription", {
          name: deleteDialog.target?.nameEs ?? "",
        })}
        onConfirm={() => deleteLanguageAction(deleteDialog.target!.id)}
      />
    </>
  );
}
