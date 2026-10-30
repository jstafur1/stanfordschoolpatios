"use client";

import { useCallback, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  createContentAction,
  updateContentAction,
} from "@/app/actions/admin";
import {
  createTeacherContentAction,
  updateTeacherContentAction,
} from "@/app/actions/teacher";
import { useTranslations } from "next-intl";
import { ActionFormErrorBoundary } from "@/components/action-form-error-boundary";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionFailure } from "@/lib/actions/result";
import { actionFail } from "@/lib/actions/result";
import { useActionFormResult } from "@/lib/hooks/use-action-form-result";
import { translateActionError } from "@/lib/i18n/translate-action-error";
import {
  getFormFile,
  isFileWithinLimit,
  MAX_COURSE_CONTENT_FILE_BYTES,
} from "@/lib/uploads/limits";
import type { CourseContent } from "@/lib/supabase/mappers";

type ContentFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  content?: CourseContent | null;
  variant?: "admin" | "teacher";
  nextSortOrder?: number;
};

export function ContentFormDialog({
  open,
  onOpenChange,
  courseId,
  content,
  variant = "admin",
  nextSortOrder = 0,
}: ContentFormDialogProps) {
  const t = useTranslations("app.admin.content");
  const tc = useTranslations("app.common");
  const te = useTranslations("app.errors");
  const isEdit = !!content;
  const createAction =
    variant === "teacher" ? createTeacherContentAction : createContentAction;
  const updateAction =
    variant === "teacher" ? updateTeacherContentAction : updateContentAction;
  const action = isEdit ? updateAction : createAction;

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

  const handleFormError = useCallback(() => {
    toast.error(te("generic"));
    onOpenChange(false);
  }, [onOpenChange, te]);

  const { formAction, pending } = useActionFormResult(action, {
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const contentTypes = [
    { value: "pdf", label: tc("contentTypes.pdf") },
    { value: "youtube", label: tc("contentTypes.youtube") },
    { value: "image", label: tc("contentTypes.image") },
    { value: "excel", label: tc("contentTypes.excel") },
    { value: "word", label: tc("contentTypes.word") },
    { value: "powerpoint", label: tc("contentTypes.powerpoint") },
    { value: "video", label: tc("contentTypes.video") },
    { value: "audio", label: tc("contentTypes.audio") },
    { value: "other", label: tc("contentTypes.other") },
  ];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const file = getFormFile(event.currentTarget, "file");
    if (file && !isFileWithinLimit(file, MAX_COURSE_CONTENT_FILE_BYTES)) {
      event.preventDefault();
      toast.error(translateActionError(actionFail("fileTooLarge"), te));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("newTitle")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {open ? (
          <ActionFormErrorBoundary onReset={handleFormError}>
            <form
              key={content?.id ?? "new"}
              action={formAction}
              onSubmit={handleSubmit}
              className="grid gap-4"
            >
              <input type="hidden" name="courseId" value={courseId} />
              {isEdit ? (
                <input type="hidden" name="id" value={content.id} />
              ) : null}
              <div className="grid gap-2">
                <Label htmlFor="title">{tc("columns.title")}</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  defaultValue={content?.title ?? ""}
                  placeholder={t("titlePlaceholder")}
                />
              </div>
              <div className="grid gap-2">
                <Label>{tc("columns.type")}</Label>
                <FormSelect
                  name="contentType"
                  defaultValue={content?.contentType ?? "pdf"}
                  options={contentTypes}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sortOrder">{t("sortOrder")}</Label>
                <Input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  min={0}
                  placeholder={String(nextSortOrder)}
                  defaultValue={content?.sortOrder ?? nextSortOrder}
                />
                <p className="text-xs text-muted-foreground">{t("sortOrderHint")}</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="externalUrl">{t("externalUrl")}</Label>
                <Input
                  id="externalUrl"
                  name="externalUrl"
                  type="url"
                  defaultValue={content?.externalUrl ?? ""}
                  placeholder="https://youtube.com/…"
                />
              </div>
              {isEdit ? (
                <input
                  type="hidden"
                  name="existingStoragePath"
                  value={content?.storagePath ?? ""}
                />
              ) : null}
              <div className="grid gap-2">
                <Label htmlFor="file">{t("fileUpload")}</Label>
                <Input
                  id="file"
                  name="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif,.mp4,.webm,.mov,.mp3,.wav,.m4a,.ogg,.aac"
                />
                {content?.storagePath ? (
                  <p className="text-xs text-muted-foreground">
                    {t("currentFile", {
                      name: content.storagePath.split("/").pop() ?? "",
                    })}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("fileHint")}</p>
                )}
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
          </ActionFormErrorBoundary>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function CreateContentButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("app.admin.content");
  return (
    <Button size="sm" onClick={onClick}>
      <Plus />
      {t("newButton")}
    </Button>
  );
}
