"use client";

import { useCallback } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createLanguageAction,
  updateLanguageAction,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionFailure } from "@/lib/actions/result";
import { useActionFormResult } from "@/lib/hooks/use-action-form-result";
import { translateActionError } from "@/lib/i18n/translate-action-error";
import type { Language } from "@/lib/supabase/mappers";

type LanguageFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language?: Language | null;
};

export function LanguageFormDialog({
  open,
  onOpenChange,
  language,
}: LanguageFormDialogProps) {
  const t = useTranslations("app.admin.languages");
  const tc = useTranslations("app.common");
  const te = useTranslations("app.errors");
  const isEdit = !!language;
  const action = isEdit ? updateLanguageAction : createLanguageAction;
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("newTitle")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>
        {open ? (
          <form
            key={language?.id ?? "new"}
            action={formAction}
            className="grid gap-4"
          >
            {isEdit ? <input type="hidden" name="id" value={language.id} /> : null}
            <I18nTextFields
              fieldPrefix="name"
              label={t("nameLabel")}
              required
              placeholder={t("namePlaceholder")}
              values={{
                es: language?.nameEs,
                en: language?.nameEn,
                fr: language?.nameFr,
              }}
            />
            <div className="grid gap-2">
              <Label htmlFor="code">{tc("columns.code")}</Label>
              <Input
                id="code"
                name="code"
                required
                defaultValue={language?.code ?? ""}
                placeholder="en"
                className="max-w-[120px]"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={language?.isActive ?? true}
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

export function CreateLanguageButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("app.admin.languages");
  return (
    <Button size="sm" onClick={onClick}>
      <Plus />
      {t("newButton")}
    </Button>
  );
}
