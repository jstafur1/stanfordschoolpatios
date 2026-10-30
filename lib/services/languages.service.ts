import "server-only";
import {
  assertNoError,
  getSupabase,
  throwOnError,
} from "@/lib/supabase/server-query";
import { mapLanguage, type LanguageRow } from "@/lib/supabase/mappers";

export type LanguageInput = {
  nameEs: string;
  nameEn: string;
  nameFr: string;
  code: string;
  isActive?: boolean;
};

function toLanguageRow(input: LanguageInput) {
  return {
    name: input.nameEs,
    name_es: input.nameEs,
    name_en: input.nameEn,
    name_fr: input.nameFr,
    code: input.code.toLowerCase(),
    is_active: input.isActive ?? true,
  };
}

export async function listLanguages(activeOnly = false) {
  const supabase = await getSupabase();
  let query = supabase.from("languages").select("*").order("name");
  if (activeOnly) {
    query = query.eq("is_active", true);
  }
  const data = throwOnError("listLanguages", await query);
  return data.map(mapLanguage);
}

export async function createLanguage(input: LanguageInput) {
  const supabase = await getSupabase();
  const data = throwOnError<LanguageRow>(
    "createLanguage",
    await supabase.from("languages").insert(toLanguageRow(input)).select().single(),
  );
  return mapLanguage(data);
}

export async function updateLanguage(
  id: string,
  input: Partial<LanguageInput>,
) {
  const supabase = await getSupabase();
  const data = throwOnError<LanguageRow>(
    "updateLanguage",
    await supabase
      .from("languages")
      .update({
        ...(input.nameEs !== undefined
          ? { name: input.nameEs, name_es: input.nameEs }
          : {}),
        ...(input.nameEn !== undefined ? { name_en: input.nameEn } : {}),
        ...(input.nameFr !== undefined ? { name_fr: input.nameFr } : {}),
        ...(input.code !== undefined ? { code: input.code.toLowerCase() } : {}),
        ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
      })
      .eq("id", id)
      .select()
      .single(),
  );
  return mapLanguage(data);
}

export async function deleteLanguage(id: string) {
  const supabase = await getSupabase();
  assertNoError(
    "deleteLanguage",
    await supabase.from("languages").delete().eq("id", id),
  );
}
