import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertNoError } from "@/lib/supabase/server-query";

function isAuthUserNotFound(message: string) {
  return /user not found/i.test(message);
}

/** Paginated lookup — listUsers() only returns the first page by default. */
export async function findAuthUserByEmail(email: string) {
  const admin = createAdminClient();
  const normalized = email.toLowerCase();
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw new Error(error.message);

    const match = (data.users ?? []).find(
      (user) => user.email?.toLowerCase() === normalized,
    );
    if (match) return match;

    if ((data.users ?? []).length < 1000) break;
    page += 1;
  }

  return null;
}

/**
 * Deletes an account by auth user id (same as profiles.id).
 * If the auth user is already gone, removes the orphan profile row instead.
 */
export async function deleteUserAccount(id: string) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);

  if (!error) return;

  if (!isAuthUserNotFound(error.message)) {
    throw new Error(error.message);
  }

  assertNoError(
    "deleteOrphanProfile",
    await admin.from("profiles").delete().eq("id", id),
  );
}
