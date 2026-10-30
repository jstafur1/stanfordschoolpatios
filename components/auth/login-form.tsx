"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  locale: string;
};

const initialState: LoginState = {};

export function LoginForm({ locale }: Props) {
  const t = useTranslations("login");
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  const errorKey = state.error;
  const errorMessage =
    errorKey === "invalidCredentials"
      ? t("errors.invalidCredentials")
      : errorKey === "emailNotConfirmed"
        ? t("errors.emailNotConfirmed")
        : errorKey === "missingFields"
          ? t("errors.missingFields")
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
          autoComplete="current-password"
          className="mt-1 rounded-full"
        />
        <p className="mt-2 text-right text-sm">
          <Link
            href={`/${locale}/forgot-password`}
            className="text-primary hover:underline"
          >
            {t("forgotPassword")}
          </Link>
        </p>
      </div>
      <button
        type="submit"
        disabled={pending}
        className={cn(buttonVariants(), "w-full rounded-full py-6")}
      >
        {pending ? t("submitting") : t("submit")}
      </button>
      <p className="text-center text-sm">
        <Link href={`/${locale}/register`} className="text-primary hover:underline">
          {t("createAccount")}
        </Link>
      </p>
    </form>
  );
}
