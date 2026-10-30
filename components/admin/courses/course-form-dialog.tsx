"use client";

import { useCallback } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createCourseAction,
  updateCourseAction,
} from "@/app/actions/admin";
import { I18nTextFields } from "@/components/admin/i18n-text-fields";
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
import { Label } from "@/components/ui/label";
import type { ActionFailure } from "@/lib/actions/result";
import { useActionFormResult } from "@/lib/hooks/use-action-form-result";
import { translateActionError } from "@/lib/i18n/translate-action-error";
import { localizedLanguageName } from "@/lib/i18n/localized-content";
import { COURSE_LEVELS } from "@/lib/courses/levels";
import type { Course, Language } from "@/lib/supabase/mappers";

export type CourseTableRow = {
  course: Course;
  language: Language | null;
};

type CourseFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  languages: Language[];
  courseRow?: CourseTableRow | null;
};

export function CourseFormDialog({
  open,
  onOpenChange,
  languages,
  courseRow,
}: CourseFormDialogProps) {
  const t = useTranslations("app.admin.courses");
  const tc = useTranslations("app.common");
  const td = useTranslations("app.teacher.dashboard");
  const te = useTranslations("app.errors");
  const isEdit = !!courseRow;
  const action = isEdit ? updateCourseAction : createCourseAction;
  const course = courseRow?.course;

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

  const languageOptions = languages.map((lang) => ({
    value: lang.id,
    label: `${localizedLanguageName(lang, "es")} · ${localizedLanguageName(lang, "en")} · ${localizedLanguageName(lang, "fr")}`,
  }));

  const levelOptions = COURSE_LEVELS.map((level) => ({
    value: level,
    label: level,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("newTitle")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>
        {open ? (
          <form
            key={course?.id ?? "new"}
            action={formAction}
            className="grid gap-4"
          >
          {isEdit ? <input type="hidden" name="id" value={course!.id} /> : null}
          <I18nTextFields
            fieldPrefix="title"
            label={tc("columns.title")}
            required
            placeholder="English A1"
            values={{
              es: course?.titleEs,
              en: course?.titleEn,
              fr: course?.titleFr,
            }}
          />
          <I18nTextFields
            fieldPrefix="description"
            label="Description"
            multiline
            placeholder={tc("noDescription")}
            values={{
              es: course?.descriptionEs,
              en: course?.descriptionEn,
              fr: course?.descriptionFr,
            }}
          />
          <div className="grid gap-2">
            <Label>{tc("language")}</Label>
            <FormSelect
              name="languageId"
              defaultValue={course?.languageId ?? ""}
              placeholder={tc("selectLanguage")}
              allowEmpty
              emptyLabel={td("noLanguage")}
              options={languageOptions}
            />
          </div>
          <div className="grid gap-2">
            <Label>{t("level")}</Label>
            <FormSelect
              name="level"
              defaultValue={course?.level ?? ""}
              placeholder={t("levelPlaceholder")}
              allowEmpty
              emptyLabel={t("noLevel")}
              options={levelOptions}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="published"
              defaultChecked={course?.published ?? false}
              className="size-4 rounded border border-input accent-primary"
            />
            {tc("published")}
          </label>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
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

export function CreateCourseButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("app.admin.courses");
  return (
    <Button size="sm" onClick={onClick}>
      <Plus />
      {t("newButton")}
    </Button>
  );
}
