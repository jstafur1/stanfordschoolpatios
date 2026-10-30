import "server-only";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "./session";
import type { UserRole } from "./roles";
import { getDashboardPath } from "./roles";

export async function requireAuth(locale = "es") {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/${locale}/login`);
  }
  return profile;
}

export async function requireRole(role: UserRole | UserRole[], locale = "es") {
  const profile = await requireAuth(locale);
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(profile.role as UserRole)) {
    redirect(getDashboardPath(profile.role as UserRole, locale));
  }
  return profile;
}
