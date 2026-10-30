"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { registerAction, type RegisterState } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  locale: string;
};

const initialState: RegisterState = {};

export function RegisterForm({ locale }: Props) {
  const t = useTranslations("register");
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  if (state.success) {
    return (
      <div className="mt-8 space-y-4">
        <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm text-foreground">
          {t("success")}
        </p>
        <p className="text-center text-sm">
          <Link href={`/${locale}/login`} className="text-primary hover:underline">
            {t("backToLogin")}
          </Link>
        </p>
      </div>
    );
  }

  const errorKey = state.error;
  const errorMessage =
    errorKey === "missingFields"
      ? t("errors.missingFields")
      : errorKey === "weakPassword"
        ? t("errors.weakPassword")
        : errorKey === "emailTaken"
          ? t("errors.emailTaken")
          : errorKey
            ? t("errors.generic")
            : null;

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {errorMessage && (
        <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      )}
      <div>
        <label htmlFor="fullName" className="text-sm font-medium text-foreground">
          {t("fullName")}
        </label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          required
          autoComplete="name"
          className="mt-1 rounded-full"
        />
      </div>
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
          placeholder="email@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          {t("password")}
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 rounded-full"
        />
        <p className="mt-1 text-xs text-muted-foreground">{t("passwordHint")}</p>
      </div>
      <button
        type="submit"
        disabled={pending}
        className={cn(buttonVariants(), "w-full rounded-full py-6")}
      >
        {pending ? t("submitting") : t("submit")}
      </button>
      <p className="text-center text-sm">
        <Link href={`/${locale}/login`} className="text-primary hover:underline">
          {t("hasAccount")}
        </Link>
      </p>
    </form>
  );
}
