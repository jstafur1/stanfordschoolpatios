"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  requestPasswordResetAction,
  type ForgotPasswordState,
} from "@/app/actions/profile";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  locale: string;
};

const initialState: ForgotPasswordState = {};

export function ForgotPasswordForm({ locale }: Props) {
  const t = useTranslations("forgotPassword");
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  if (state.ok) {
    return (
      <p className="rounded-xl bg-muted px-4 py-3 text-sm text-foreground">
        {t("success")}
      </p>
    );
  }

  const errorMessage =
    state.error === "missingEmail"
      ? t("errors.missingEmail")
      : state.error
        ? t("errors.generic")
        : null;

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {errorMessage ? (
        <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
      <div>
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          {t("email")}
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
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
