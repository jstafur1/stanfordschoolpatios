import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isUserRole, type UserRole } from "@/lib/auth/roles";

/** Role from service-role provisioning (app_metadata) or legacy seeds (user_metadata). */
export function roleFromAuthUser(user: User): UserRole | null {
  const fromApp = user.app_metadata?.role;
  if (typeof fromApp === "string" && isUserRole(fromApp)) {
    return fromApp;
  }

  const fromUser = user.user_metadata?.role;
  if (typeof fromUser === "string" && isUserRole(fromUser)) {
    return fromUser;
  }

  return null;
}

/** Resolve platform role from profiles, falling back to auth metadata when needed. */
export async function resolveRoleForUser(
  supabase: SupabaseClient,
  user: User,
): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!error && data?.role && isUserRole(data.role)) {
    return data.role;
  }

  return roleFromAuthUser(user);
}
