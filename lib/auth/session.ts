import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { mapProfile, type Profile } from "@/lib/supabase/mappers";
import { roleFromAuthUser } from "@/lib/auth/resolve-role";
import type { UserRole } from "./roles";

export type { Profile };

function profileFromAuthUser(user: User): Profile | null {
  const role = roleFromAuthUser(user);
  if (!role) return null;

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : (user.email ?? null);

  return {
    id: user.id,
    role,
    requiresEnrollmentApproval: true,
    fullName,
    avatarUrl: null,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at ?? user.created_at),
  };
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getSession();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, avatar_url, created_at, updated_at, requires_enrollment_approval")
    .eq("id", user.id)
    .maybeSingle();

  if (!error && data) {
    return mapProfile(data);
  }

  const fallback = profileFromAuthUser(user);
  if (fallback) return fallback;

  if (error) throw new Error(error.message);
  return null;
}

export async function getCurrentRole(): Promise<UserRole | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  return profile.role as UserRole;
}
