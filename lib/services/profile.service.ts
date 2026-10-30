import "server-only";
import { getSupabase } from "@/lib/supabase/server-query";
import { mapProfile } from "@/lib/supabase/mappers";

export async function updateOwnProfile(
  userId: string,
  input: { fullName: string; avatarUrl?: string | null },
) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      ...(input.avatarUrl !== undefined ? { avatar_url: input.avatarUrl } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("updateOwnProfile: empty response");

  return mapProfile(data);
}
