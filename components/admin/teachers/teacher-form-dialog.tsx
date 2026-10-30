"use client";

import { useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createTeacherAction,
  updateTeacherAction,
} from "@/app/actions/admin";
import {
  TeacherGroupAssignmentField,
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
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionFailure } from "@/lib/actions/result";
import { useActionFormResult } from "@/lib/hooks/use-action-form-result";
import { translateActionError } from "@/lib/i18n/translate-action-error";
import { localizedLanguageName } from "@/lib/i18n/localized-content";
import type { Language } from "@/lib/supabase/mappers";
import type { TeacherAdminRow } from "@/lib/services/teachers.service";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";

type TeacherFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  languages: Language[];
  coursesWithGroups: CourseWithGroups[];
  teacher?: TeacherAdminRow | null;
};

export function TeacherFormDialog({
  open,
  onOpenChange,
  languages,
  coursesWithGroups,
  teacher,
}: TeacherFormDialogProps) {
  const t = useTranslations("app.admin.teachers");
  const ts = useTranslations("app.admin.students");
  const tc = useTranslations("app.common");
  const te = useTranslations("app.errors");
  const router = useRouter();
  const isEdit = !!teacher;
  const action = isEdit ? updateTeacherAction : createTeacherAction;
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

  const languageOptions = useMemo(
    () =>
      languages.map((lang) => ({
        value: lang.id,
        label: `${localizedLanguageName(lang, "es")} · ${localizedLanguageName(lang, "en")} · ${localizedLanguageName(lang, "fr")}`,
      })),
    [languages],
  );

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
            key={teacher?.profile.id ?? "new"}
            action={formAction}
            className="grid gap-4"
          >
            {isEdit ? (
              <input type="hidden" name="id" value={teacher.profile.id} />
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="fullName">{tc("columns.name")}</Label>
              <Input
                id="fullName"
                name="fullName"
                required
                defaultValue={teacher?.profile.fullName ?? ""}
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
                defaultValue={teacher?.email !== "—" ? teacher?.email : ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">
                {tc("password")}
                {isEdit ? ts("passwordKeep") : ""}
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
            <div className="grid gap-2">
              <Label>{tc("language")}</Label>
              <FormSelect
                name="languageId"
                defaultValue={teacher?.teacherProfile?.languageId ?? ""}
                placeholder={tc("selectLanguage")}
                allowEmpty
                emptyLabel={tc("optional")}
                options={languageOptions}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">{tc("columns.bio")}</Label>
              <Textarea
                id="bio"
                name="bio"
                rows={2}
                defaultValue={teacher?.teacherProfile?.bio ?? ""}
                placeholder={t("bioPlaceholder")}
              />
            </div>
            <TeacherGroupAssignmentField
              coursesWithGroups={coursesWithGroups}
              defaultGroupIds={teacher?.groupIds}
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

export function CreateTeacherButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("app.admin.teachers");
  return (
    <Button size="sm" onClick={onClick}>
      <Plus />
      {t("newButton")}
    </Button>
  );
}
