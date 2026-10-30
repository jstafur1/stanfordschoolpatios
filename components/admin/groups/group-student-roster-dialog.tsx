"use client";

import { useCallback, useMemo, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  addStudentsToGroupAction,
  removeStudentFromGroupAction,
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
import type { ActionFailure } from "@/lib/actions/result";
import { useActionFormResult } from "@/lib/hooks/use-action-form-result";
import { translateActionError } from "@/lib/i18n/translate-action-error";
import type { StudentRow } from "@/lib/services/users.service";

export type GroupStudent = {
  id: string;
  fullName: string | null;
  email: string;
};

type GroupStudentRosterDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  groupId: string;
  groupName: string;
  students: GroupStudent[];
  allStudents: StudentRow[];
};

export function GroupStudentRosterDialog({
  open,
  onOpenChange,
  courseId,
  groupId,
  groupName,
  students,
  allStudents,
}: GroupStudentRosterDialogProps) {
  const t = useTranslations("app.groups");
  const tc = useTranslations("app.common");
  const te = useTranslations("app.errors");
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isRemoving, startRemove] = useTransition();

  const eligibleStudents = useMemo(
    () =>
      allStudents.filter((student) => {
        const enrollment = student.enrollments.find(
          (entry) => entry.courseId === courseId,
        );
        return !enrollment || enrollment.groupId !== groupId;
      }),
    [allStudents, courseId, groupId],
  );

  const handleSuccess = useCallback(() => {
    toast.success(t("toastStudentsAdded"));
    router.refresh();
  }, [router, t]);

  const handleError = useCallback(
    (result: ActionFailure) => {
      toast.error(translateActionError(result, te));
    },
    [te],
  );

  const { formAction, pending } = useActionFormResult(addStudentsToGroupAction, {
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const handleRemove = (studentId: string) => {
    setRemovingId(studentId);
    startRemove(async () => {
      const result = await removeStudentFromGroupAction(
        groupId,
        courseId,
        studentId,
      );
      setRemovingId(null);
      if (result.ok) {
        toast.success(t("toastStudentRemoved"));
        router.refresh();
        return;
      }
      toast.error(translateActionError(result, te));
    });
  };

  const handleAddSubmit = (event: FormEvent<HTMLFormElement>) => {
    const checked = event.currentTarget.querySelectorAll<HTMLInputElement>(
      'input[name="studentIds"]:checked',
    );
    if (checked.length === 0) {
      event.preventDefault();
      toast.error(t("selectStudentsToAdd"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("manageStudentsTitle", { name: groupName })}</DialogTitle>
          <DialogDescription>{t("manageStudentsDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">{t("currentStudents")}</h3>
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("noStudentsInGroup")}
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {students.map((student) => (
                  <li
                    key={student.id}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {student.fullName ?? t("unnamedStudent")}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {student.email}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isRemoving && removingId === student.id}
                      onClick={() => handleRemove(student.id)}
                    >
                      {t("removeStudent")}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form action={formAction} className="space-y-3" onSubmit={handleAddSubmit}>
            <input type="hidden" name="courseId" value={courseId} />
            <input type="hidden" name="groupId" value={groupId} />
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t("addStudents")}</h3>
              {eligibleStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("noStudentsAvailable")}
                </p>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                  {eligibleStudents.map((student) => (
                    <label
                      key={student.id}
                      className="flex cursor-pointer items-start gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="studentIds"
                        value={student.id}
                        className="mt-0.5 size-4 rounded border border-input accent-primary"
                      />
                      <span>
                        <span className="block font-medium">
                          {student.fullName ?? t("unnamedStudent")}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {student.email}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? tc("saving") : t("addStudentsButton")}
              </Button>
            </DialogFooter>
          </form>

          <p className="text-xs text-muted-foreground">
            {t("createStudentHint")}{" "}
            <Link href="/admin/students" className="text-primary hover:underline">
              {t("createStudentLink")}
            </Link>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
