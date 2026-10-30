"use client";

import type { FormEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { submitJobApplicationAction } from "@/app/actions/jobs";
import { actionFail } from "@/lib/actions/result";
import { Button } from "@/components/ui/button";
import { FormDatePicker } from "@/components/ui/form-date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActionFormResult } from "@/lib/hooks/use-action-form-result";
import { translateActionError } from "@/lib/i18n/translate-action-error";
import { cn } from "@/lib/utils";
import {
  getFormFile,
  isFileWithinLimit,
  MAX_JOB_CV_FILE_BYTES,
} from "@/lib/uploads/limits";

type JobApplyFormProps = {
  jobId: string;
  className?: string;
  variant?: "panel" | "modal";
  onSuccess?: () => void;
};

export function JobApplyForm({
  jobId,
  className,
  variant = "panel",
  onSuccess,
}: JobApplyFormProps) {
  const t = useTranslations("employment");
  const te = useTranslations("app.errors");
  const { state, formAction, pending } = useActionFormResult(
    submitJobApplicationAction,
    {
      onSuccess: () => {
        toast.success(t("applySuccess"));
        onSuccess?.();
      },
      onError: (result) =>
        toast.error(translateActionError(result, te)),
    },
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const file = getFormFile(event.currentTarget, "cv");
    if (file && !isFileWithinLimit(file, MAX_JOB_CV_FILE_BYTES)) {
      event.preventDefault();
      toast.error(translateActionError(actionFail("cvTooLarge"), te));
    }
  }

  if (state?.ok) {
    return (
      <div
        className={cn(
          "rounded-3xl bg-accent-lavender/60 p-6 text-center",
          className,
        )}
      >
        <p className="font-medium text-foreground">{t("applySuccess")}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("applySuccessHint")}
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className={cn(
        "grid gap-4",
        variant === "panel" &&
          "rounded-3xl bg-accent-lavender px-6 py-8",
        variant === "modal" && "px-1",
        className,
      )}
    >
      <input type="hidden" name="jobId" value={jobId} />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />
      <h2 className="text-lg font-semibold">{t("applyTitle")}</h2>
      <div className="grid gap-2">
        <Label htmlFor="fullName">{t("fullName")}</Label>
        <Input id="fullName" name="fullName" required />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input id="phone" name="phone" type="tel" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="yearsOfExperience">{t("yearsExperience")}</Label>
        <Input
          id="yearsOfExperience"
          name="yearsOfExperience"
          type="number"
          min={0}
          step={1}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="linkedinUrl">{t("linkedin")}</Label>
          <Input id="linkedinUrl" name="linkedinUrl" type="url" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="portfolioUrl">{t("portfolio")}</Label>
          <Input id="portfolioUrl" name="portfolioUrl" type="url" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="availabilityStartDate">{t("availability")}</Label>
        <FormDatePicker
          id="availabilityStartDate"
          name="availabilityStartDate"
          placeholder={t("availability")}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="coverLetter">{t("coverLetter")}</Label>
        <Textarea id="coverLetter" name="coverLetter" rows={4} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cv">{t("cv")}</Label>
        <Input
          id="cv"
          name="cv"
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
        />
        <p className="text-xs text-muted-foreground">{t("cvHint")}</p>
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="w-full rounded-full"
      >
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
