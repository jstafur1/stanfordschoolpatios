"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updatePasswordAction } from "@/app/actions/profile";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions/result";
import { translateActionError } from "@/lib/i18n/translate-action-error";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { cn } from "@/lib/utils";

type Props = {
  locale: string;
};

const initialState: ActionResult | null = null;

export function ResetPasswordForm({ locale }: Props) {
  const t = useTranslations("resetPassword");
  const te = useTranslations("app.errors");
  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
    initialState,
  );

  useEffect(() => {
    if (!state) return;
    if (!state.ok) {
      toast.error(translateActionError(state, te));
    }
  }, [state, te]);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <label
          htmlFor="password"
          className="text-sm font-medium text-foreground"
        >
          {t("password")}
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          className="mt-1 rounded-full"
        />
      </div>
      <div>
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-foreground"
        >
          {t("confirmPassword")}
        </label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          className="mt-1 rounded-full"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className={cn(buttonVariants(), "w-full rounded-full py-6")}
      >
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
