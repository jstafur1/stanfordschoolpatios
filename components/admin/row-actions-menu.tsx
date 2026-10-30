"use client";

import { useTranslations } from "next-intl";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type RowActionsMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
  onPreview?: () => void;
  editLabel?: string;
  deleteLabel?: string;
  previewLabel?: string;
};

export function RowActionsMenu({
  onEdit,
  onDelete,
  onPreview,
  editLabel,
  deleteLabel,
  previewLabel,
}: RowActionsMenuProps) {
  const t = useTranslations("app.common");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="h-8 w-8 p-0" />
        }
      >
        <span className="sr-only">Open menu</span>
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
          {onPreview ? (
            <DropdownMenuItem onClick={onPreview}>
              <Eye />
              {previewLabel ?? t("preview")}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onClick={onEdit}>
            <Pencil />
            {editLabel ?? t("edit")}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 />
            {deleteLabel ?? t("delete")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
