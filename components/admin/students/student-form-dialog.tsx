"use client";

import { useCallback } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createStudentAction,
  updateStudentAction,
} from "@/app/actions/admin";
import {
  GroupAssignmentField,
  type CourseWithGroups,
} from "@/components/admin/group-assignment-field";
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
import type { StudentRow } from "@/lib/services/users.service";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";

type StudentFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coursesWithGroups: CourseWithGroups[];
  student?: StudentRow | null;
};

export function StudentFormDialog({
  open,
  onOpenChange,
  coursesWithGroups,
  student,
}: StudentFormDialogProps) {
  const t = useTranslations("app.admin.students");
  const tc = useTranslations("app.common");
  const te = useTranslations("app.errors");
  const router = useRouter();
  const isEdit = !!student;
  const action = isEdit ? updateStudentAction : createStudentAction;
  const handleSuccess = useCallback(() => {
    toast.success(isEdit ? t("toastUpdated") : t("toastCreated"));
    router.refresh();
    onOpenChange(false);
  }, [isEdit, onOpenChange, router, t]);

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
            key={student?.id ?? "new"}
            action={formAction}
            className="grid gap-4"
          >
            {isEdit ? <input type="hidden" name="id" value={student.id} /> : null}
            <div className="grid gap-2">
              <Label htmlFor="fullName">{tc("columns.name")}</Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={student?.fullName ?? ""}
                placeholder={t("namePlaceholder")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{tc("columns.email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required={!isEdit}
                defaultValue={student?.email !== "—" ? student?.email : ""}
                placeholder={t("emailPlaceholder")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">
                {tc("password")}
                {isEdit ? t("passwordKeep") : ""}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required={!isEdit}
                minLength={isEdit ? undefined : MIN_PASSWORD_LENGTH}
                placeholder={
                  isEdit ? tc("passwordPlaceholder") : tc("passwordMin")
                }
              />
            </div>
            <GroupAssignmentField
              label={tc("enrolledCourses")}
              emptyMessage={tc("noPublishedCoursesYet")}
              coursesWithGroups={coursesWithGroups}
              defaultEnrollments={student?.enrollments}
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending
                  ? tc("saving")
                  : isEdit
                    ? tc("saveChanges")
                    : t("createButton")}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function CreateStudentButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("app.admin.students");
  return (
    <Button size="sm" onClick={onClick}>
      <Plus />
      {t("newButton")}
    </Button>
  );
}
