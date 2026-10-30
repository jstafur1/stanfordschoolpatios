"use client";

import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createGroupAction,
  deleteGroupAction,
  updateGroupAction,
} from "@/app/actions/groups";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionFailure } from "@/lib/actions/result";
import { useActionFormResult } from "@/lib/hooks/use-action-form-result";
import { translateActionError } from "@/lib/i18n/translate-action-error";
import type { CourseGroup, Profile } from "@/lib/supabase/mappers";
import type { StudentRow } from "@/lib/services/users.service";
import {
  ConfirmDeleteDialog,
  useDeleteDialog,
} from "@/components/admin/confirm-delete-dialog";
import {
  GroupStudentRosterDialog,
  type GroupStudent,
} from "./group-student-roster-dialog";

type GroupRow = {
  group: CourseGroup;
  studentCount: number;
  teacherCount: number;
  teacherIds: string[];
  students: GroupStudent[];
};

type CourseGroupsPanelProps = {
  courseId: string;
  groups: GroupRow[];
  teachers: Profile[];
  allStudents: StudentRow[];
  nextSortOrder: number;
};

export function CourseGroupsPanel({
  courseId,
  groups,
  teachers,
  allStudents,
  nextSortOrder,
}: CourseGroupsPanelProps) {
  const t = useTranslations("app.groups");
  const tc = useTranslations("app.common");
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [editing, setEditing] = useState<GroupRow | null>(null);
  const [managingStudents, setManagingStudents] = useState<GroupRow | null>(null);
  const deleteDialog = useDeleteDialog<GroupRow>();
  const activeGroupRow =
    managingStudents == null
      ? null
      : groups.find((row) => row.group.id === managingStudents.group.id) ??
        managingStudents;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus />
          {t("newButton")}
        </Button>
      </div>

      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border">
        {groups.map((row) => (
          <li key={row.group.id} className="flex items-start justify-between gap-4 px-4 py-4">
            <div>
              <p className="font-medium">{row.group.name}</p>
              <p className="text-sm text-muted-foreground">
                {t("rosterSummary", {
                  students: row.studentCount,
                  teachers: row.teacherCount,
                })}
                {row.group.maxStudents
                  ? ` · ${t("capacity", { max: row.group.maxStudents })}`
                  : ""}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setManagingStudents(row);
                  setRosterOpen(true);
                }}
              >
                {t("manageStudents")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(row);
                  setFormOpen(true);
                }}
              >
                {tc("edit")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteDialog.openFor(row)}
              >
                {tc("delete")}
              </Button>
            </div>
          </li>
        ))}
        {groups.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">
            {t("empty")}
          </li>
        )}
      </ul>

      <GroupFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        courseId={courseId}
        teachers={teachers}
        groupRow={editing}
        nextSortOrder={nextSortOrder}
        onSaved={() => router.refresh()}
      />

      {activeGroupRow ? (
        <GroupStudentRosterDialog
          open={rosterOpen}
          onOpenChange={(open) => {
            setRosterOpen(open);
            if (!open) setManagingStudents(null);
          }}
          courseId={courseId}
          groupId={activeGroupRow.group.id}
          groupName={activeGroupRow.group.name}
          students={activeGroupRow.students}
          allStudents={allStudents}
        />
      ) : null}

      <ConfirmDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) deleteDialog.close();
        }}
        title={t("deleteTitle")}
        description={t("deleteDescription", {
          name: deleteDialog.target?.group.name ?? "",
        })}
        onConfirm={() =>
          deleteGroupAction(deleteDialog.target!.group.id, courseId)
        }
      />
    </>
  );
}

function GroupFormDialog({
  open,
  onOpenChange,
  courseId,
  teachers,
  groupRow,
  nextSortOrder,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  teachers: Profile[];
  groupRow: GroupRow | null;
  nextSortOrder: number;
  onSaved: () => void;
}) {
  const t = useTranslations("app.groups");
  const tc = useTranslations("app.common");
  const te = useTranslations("app.errors");
  const isEdit = !!groupRow;
  const action = isEdit ? updateGroupAction : createGroupAction;

  const handleSuccess = useCallback(() => {
    toast.success(isEdit ? t("toastUpdated") : t("toastCreated"));
    onSaved();
    onOpenChange(false);
  }, [isEdit, onOpenChange, onSaved, t]);

  const handleError = useCallback(
    (result: ActionFailure) => {
      toast.error(translateActionError(result, te));
    },
    [te],
  );

  const { formAction, pending } = useActionFormResult(action, {
    onSuccess: handleSuccess,
    onError: handleError,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("newTitle")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("editDescription") : t("newDescription")}
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <form
            key={groupRow?.group.id ?? "new"}
            action={formAction}
            className="grid gap-4"
          >
            <input type="hidden" name="courseId" value={courseId} />
            {isEdit ? (
              <input type="hidden" name="id" value={groupRow.group.id} />
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="name">{t("name")}</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={groupRow?.group.name ?? ""}
                placeholder={t("namePlaceholder")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sortOrder">{t("sortOrder")}</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                placeholder={String(nextSortOrder)}
                defaultValue={
                  groupRow ? groupRow.group.sortOrder : nextSortOrder
                }
              />
              <p className="text-xs text-muted-foreground">{t("sortOrderHint")}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxStudents">{t("maxStudents")}</Label>
              <Input
                id="maxStudents"
                name="maxStudents"
                type="number"
                defaultValue={groupRow?.group.maxStudents ?? ""}
                placeholder={tc("optional")}
              />
            </div>
            {isEdit ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={groupRow.group.isActive}
                  className="size-4 rounded border border-input accent-primary"
                />
                {t("active")}
              </label>
            ) : null}
            <div className="grid gap-2">
              <Label>{t("teachers")}</Label>
              <p className="text-xs text-muted-foreground">{t("teachersHelper")}</p>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                {teachers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("noTeachers")}</p>
                ) : (
                  teachers.map((teacher) => (
                    <label
                      key={teacher.id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="teacherIds"
                        value={teacher.id}
                        defaultChecked={groupRow?.teacherIds.includes(teacher.id)}
                        className="size-4 rounded border border-input accent-primary"
                      />
                      <span>{teacher.fullName ?? teacher.id}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t("studentsHelper")}</p>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? tc("saving") : isEdit ? tc("saveChanges") : t("createButton")}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
