"use client";

import Image from "next/image";
import { useActionState, useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  changeOwnPasswordAction,
  updateProfileAction,
} from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actionFail, type ActionResult } from "@/lib/actions/result";
import { translateActionError } from "@/lib/i18n/translate-action-error";
import {
  getFormFile,
  isFileWithinLimit,
  MAX_AVATAR_FILE_BYTES,
} from "@/lib/uploads/limits";
import type { Profile } from "@/lib/supabase/mappers";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";

type ProfileSettingsProps = {
  profile: Profile;
  email: string;
  locale?: string;
};

const initialState: ActionResult | null = null;

export function ProfileSettings({
  profile,
  email,
  locale = "es",
}: ProfileSettingsProps) {
  const t = useTranslations("app.profile");
  const te = useTranslations("app.errors");
  const [profileState, profileAction, profilePending] = useActionState(
    updateProfileAction,
    initialState,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    changeOwnPasswordAction,
    initialState,
  );
  const [fullName, setFullName] = useState(() => profile.fullName ?? "");
  const [prevFullName, setPrevFullName] = useState(profile.fullName);

  if (profile.fullName !== prevFullName) {
    setPrevFullName(profile.fullName);
    setFullName(profile.fullName ?? "");
  }

  useEffect(() => {
    if (profileState?.ok) toast.success(t("profileUpdated"));
    if (profileState && !profileState.ok) {
      toast.error(translateActionError(profileState, te));
    }
  }, [profileState, t, te]);

  useEffect(() => {
    if (passwordState?.ok) toast.success(t("passwordUpdated"));
    if (passwordState && !passwordState.ok) {
      toast.error(translateActionError(passwordState, te));
    }
  }, [passwordState, t, te]);

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    const file = getFormFile(event.currentTarget, "avatar");
    if (file && !isFileWithinLimit(file, MAX_AVATAR_FILE_BYTES)) {
      event.preventDefault();
      toast.error(
        translateActionError(actionFail("avatarTooLarge"), te),
      );
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold">{t("sectionProfile")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{email}</p>
        <form
          action={profileAction}
          onSubmit={handleProfileSubmit}
          className="mt-6 grid gap-4"
        >
          <input type="hidden" name="locale" value={locale} />
          <div className="flex items-center gap-4">
            <div className="relative size-16 overflow-hidden rounded-full border border-border bg-muted">
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.fullName ?? "Avatar"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex size-full items-center justify-center text-lg font-semibold text-muted-foreground">
                  {(profile.fullName ?? email).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="grid flex-1 gap-2">
              <Label htmlFor="avatar">{t("avatar")}</Label>
              <Input
                id="avatar"
                name="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
              />
              <p className="text-xs text-muted-foreground">{t("avatarHint")}</p>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fullName">{t("fullName")}</Label>
            <Input
              id="fullName"
              name="fullName"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={profilePending}>
            {profilePending ? t("saving") : t("saveProfile")}
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold">{t("changePassword")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("passwordHint")}</p>
        <form action={passwordAction} className="mt-6 grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <div className="grid gap-2">
            <Label htmlFor="password">{t("newPassword")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" disabled={passwordPending}>
            {passwordPending ? t("updating") : t("updatePassword")}
          </Button>
        </form>
      </section>
    </div>
  );
}
