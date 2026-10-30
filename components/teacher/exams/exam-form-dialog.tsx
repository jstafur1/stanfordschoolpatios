"use client";

import { useCallback } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createExamAction,
  updateExamAction,
} from "@/app/actions/teacher";
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
import type { Exam } from "@/lib/supabase/mappers";

type ExamFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  exam?: Exam | null;
};

export function ExamFormDialog({
  open,
  onOpenChange,
  courseId,
  exam,
}: ExamFormDialogProps) {
  const t = useTranslations("app.teacher.exams");
  const tc = useTranslations("app.common");
  const te = useTranslations("app.errors");
  const isEdit = !!exam;
  const action = isEdit ? updateExamAction : createExamAction;
  const handleSuccess = useCallback(() => {
    toast.success(isEdit ? t("toastUpdated") : t("toastCreated"));
    onOpenChange(false);
  }, [isEdit, onOpenChange, t]);

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("newTitle")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {open ? (
          <form
            key={exam?.id ?? "new"}
            action={formAction}
            className="grid gap-4"
          >
            <input type="hidden" name="courseId" value={courseId} />
            {isEdit ? <input type="hidden" name="id" value={exam.id} /> : null}
            <div className="grid gap-2">
              <Label htmlFor="title">{tc("columns.title")}</Label>
              <Input
                id="title"
                name="title"
                required
                defaultValue={exam?.title ?? ""}
                placeholder={t("titlePlaceholder")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timeLimitMinutes">{t("timeLimit")}</Label>
              <Input
                id="timeLimitMinutes"
                name="timeLimitMinutes"
                type="number"
                min={0}
                defaultValue={exam?.timeLimitMinutes ?? ""}
                placeholder={t("optionalPlaceholder")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxAttempts">{t("maxAttempts")}</Label>
              <Input
                id="maxAttempts"
                name="maxAttempts"
                type="number"
                min={1}
                required
                defaultValue={exam?.maxAttempts ?? 1}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="passThresholdPercent">{t("passThreshold")}</Label>
              <Input
                id="passThresholdPercent"
                name="passThresholdPercent"
                type="number"
                min={0}
                max={100}
                defaultValue={exam?.passThresholdPercent ?? ""}
                placeholder={t("optionalPlaceholder")}
              />
            </div>
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

export function CreateExamButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("app.teacher.exams");
  return (
    <Button size="sm" onClick={onClick}>
      <Plus />
      {t("newButton")}
    </Button>
  );
}
