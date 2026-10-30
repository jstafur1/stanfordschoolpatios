"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { actionError, actionFail, type ActionResult } from "@/lib/actions/result";
import { isPasswordLongEnough } from "@/lib/auth/password";
import { getSiteUrl } from "@/lib/auth/site-url";
import { getDashboardPath } from "@/lib/auth/roles";
import { requireAuth } from "@/lib/auth/guards";
import { updateOwnProfile } from "@/lib/services/profile.service";
import {
  deleteAvatarFile,
  uploadAvatarFile,
} from "@/lib/services/storage.service";

export type ForgotPasswordState = {
  ok?: boolean;
  error?: string;
};

function revalidateProfilePaths(role: string) {
  revalidatePath(`/${role}/profile`);
  revalidatePath(getDashboardPath(role as "admin" | "student" | "teacher"));
}

export async function requestPasswordResetAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();
  const locale = String(formData.get("locale") ?? "es");

  if (!email) {
    return { error: "missingEmail" };
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const redirectTo = `${siteUrl}/auth/callback?next=/${locale}/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return { error: "generic" };
  }

  return { ok: true };
}

export async function updatePasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  const locale = String(formData.get("locale") ?? "es");

  if (!password || !isPasswordLongEnough(password)) {
    return actionFail("passwordMinLength");
  }

  if (password !== confirm) {
    return actionFail("passwordsMismatch");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  } catch (error) {
    return actionError(error);
  }

  const profile = await requireAuth(locale);
  redirect(
    getDashboardPath(profile.role as "admin" | "student" | "teacher", locale),
  );
}

function getUploadedAvatar(formData: FormData) {
  const value = formData.get("avatar");
  if (!(value instanceof File) || value.size === 0) return null;
  return value;
}

export async function updateProfileAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const locale = String(formData.get("locale") ?? "es");
    const fullName = String(formData.get("fullName") ?? "").trim();
    const profile = await requireAuth(locale);
    const avatarFile = getUploadedAvatar(formData);

    if (!fullName) {
      return actionFail("nameRequired");
    }

    let avatarUrl = profile.avatarUrl;
    if (avatarFile) {
      if (profile.avatarUrl) {
        try {
          await deleteAvatarFile(profile.avatarUrl);
        } catch {
          // Previous avatar may already be gone.
        }
      }
      avatarUrl = await uploadAvatarFile(profile.id, avatarFile);
    }

    await updateOwnProfile(profile.id, { fullName, avatarUrl });
    revalidateProfilePaths(profile.role);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function changeOwnPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const locale = String(formData.get("locale") ?? "es");
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirmPassword") ?? "");

    if (!password || !isPasswordLongEnough(password)) {
      return actionFail("passwordMinLength");
    }

    if (password !== confirm) {
      return actionFail("passwordsMismatch");
    }

    const profile = await requireAuth(locale);
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);

    revalidateProfilePaths(profile.role);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}
