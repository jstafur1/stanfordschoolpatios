"use client";

import { useCallback } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createJobPostingAction,
  updateJobPostingAction,
} from "@/app/actions/jobs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormDateTimePicker } from "@/components/ui/form-datetime-picker";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionFailure } from "@/lib/actions/result";
import { useActionFormResult } from "@/lib/hooks/use-action-form-result";
import { translateActionError } from "@/lib/i18n/translate-action-error";
import type { JobPosting } from "@/lib/supabase/mappers";

type JobFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: JobPosting | null;
};

const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "temporary",
] as const;

const WORK_MODES = ["on_site", "remote", "hybrid"] as const;
const JOB_STATUSES = ["draft", "published", "closed"] as const;

export function JobFormDialog({ open, onOpenChange, job }: JobFormDialogProps) {
  const t = useTranslations("app.admin.jobs");
  const tc = useTranslations("app.common");
  const te = useTranslations("app.errors");
  const isEdit = !!job;
  const action = isEdit ? updateJobPostingAction : createJobPostingAction;
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

  const employmentOptions = EMPLOYMENT_TYPES.map((value) => ({
    value,
    label: tc(`employmentType.${value}` as "employmentType.full_time"),
  }));

  const workModeOptions = WORK_MODES.map((value) => ({
    value,
    label: tc(`workMode.${value}` as "workMode.on_site"),
  }));

  const statusOptions = JOB_STATUSES.map((value) => ({
    value,
    label: tc(`jobStatus.${value}` as "jobStatus.draft"),
  }));

  const deadlineValue = job?.applicationDeadline
    ? job.applicationDeadline.toISOString().slice(0, 16)
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("newTitle")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>
        {open ? (
          <form
            key={job?.id ?? "new"}
            action={formAction}
            className="grid gap-4"
          >
            {isEdit ? <input type="hidden" name="id" value={job.id} /> : null}
            <div className="grid gap-2">
              <Label htmlFor="title">{t("title")}</Label>
              <Input
                id="title"
                name="title"
                required
                defaultValue={job?.title ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{t("description")}</Label>
              <Textarea
                id="description"
                name="description"
                required
                rows={4}
                defaultValue={job?.description ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="requirements">{t("requirements")}</Label>
              <Textarea
                id="requirements"
                name="requirements"
                rows={3}
                defaultValue={job?.requirements ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="benefits">{t("benefits")}</Label>
              <Textarea
                id="benefits"
                name="benefits"
                rows={3}
                defaultValue={job?.benefits ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("employmentType")}</Label>
                <FormSelect
                  name="employmentType"
                  defaultValue={job?.employmentType ?? "full_time"}
                  options={employmentOptions}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("workMode")}</Label>
                <FormSelect
                  name="workMode"
                  defaultValue={job?.workMode ?? "on_site"}
                  options={workModeOptions}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">{t("location")}</Label>
              <Input
                id="location"
                name="location"
                defaultValue={job?.location ?? ""}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="salaryMin">{t("salaryMin")}</Label>
                <Input
                  id="salaryMin"
                  name="salaryMin"
                  type="number"
                  step="0.01"
                  defaultValue={job?.salaryMin ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salaryMax">{t("salaryMax")}</Label>
                <Input
                  id="salaryMax"
                  name="salaryMax"
                  type="number"
                  step="0.01"
                  defaultValue={job?.salaryMax ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salaryCurrency">{t("salaryCurrency")}</Label>
                <Input
                  id="salaryCurrency"
                  name="salaryCurrency"
                  defaultValue={job?.salaryCurrency ?? "EUR"}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="showSalary"
                defaultChecked={job?.showSalary ?? false}
              />
              {t("showSalary")}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="contactEmail">{t("contactEmail")}</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  defaultValue={job?.contactEmail ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactPhone">{t("contactPhone")}</Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  defaultValue={job?.contactPhone ?? ""}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="applicationDeadline">{t("deadline")}</Label>
              <FormDateTimePicker
                id="applicationDeadline"
                name="applicationDeadline"
                defaultValue={deadlineValue}
                datePlaceholder={t("deadline")}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("status")}</Label>
              <FormSelect
                name="status"
                defaultValue={job?.status ?? "draft"}
                options={statusOptions}
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

export function CreateJobButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("app.admin.jobs");
  return (
    <Button size="sm" onClick={onClick}>
      <Plus />
      {t("newButton")}
    </Button>
  );
}
