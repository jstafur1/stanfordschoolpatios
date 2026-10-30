import "server-only";
import { createClient } from "@/utils/supabase/server";
import type { PostgrestError } from "@supabase/supabase-js";

export async function getSupabase() {
  return createClient();
}

export function throwOnError<T>(
  label: string,
  result: { data: T | null; error: PostgrestError | null },
): T {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
  if (result.data === null) {
    throw new Error(`${label}: empty response`);
  }
  return result.data;
}

/** For insert/update/delete/upsert without `.select()` — Postgrest returns null data on success. */
export function assertNoError(
  label: string,
  result: { error: PostgrestError | null },
): void {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
}
