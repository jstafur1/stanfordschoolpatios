import type { Course, Language } from "@/lib/supabase/mappers";

export type AppLocale = "es" | "en" | "fr";

export const LOCALE_LABELS: Record<AppLocale, string> = {
  es: "Spanish",
  en: "English",
  fr: "French",
};

export function localizedLanguageName(
  language: Pick<Language, "nameEs" | "nameEn" | "nameFr" | "name">,
  locale: AppLocale = "es",
): string {
  switch (locale) {
    case "en":
      return language.nameEn;
    case "fr":
      return language.nameFr;
    default:
      return language.nameEs;
  }
}

export function localizedCourseTitle(
  course: Pick<Course, "titleEs" | "titleEn" | "titleFr" | "title">,
  locale: AppLocale = "es",
): string {
  switch (locale) {
    case "en":
      return course.titleEn;
    case "fr":
      return course.titleFr;
    default:
      return course.titleEs;
  }
}

export function localizedCourseDescription(
  course: Pick<
    Course,
    "descriptionEs" | "descriptionEn" | "descriptionFr" | "description"
  >,
  locale: AppLocale = "es",
): string | null {
  switch (locale) {
    case "en":
      return course.descriptionEn;
    case "fr":
      return course.descriptionFr;
    default:
      return course.descriptionEs;
  }
}

export function languageSearchText(
  language: Pick<Language, "nameEs" | "nameEn" | "nameFr" | "code">,
): string {
  return [language.nameEs, language.nameEn, language.nameFr, language.code]
    .join(" ")
    .toLowerCase();
}

export function courseSearchText(
  course: Pick<
    Course,
    "titleEs" | "titleEn" | "titleFr" | "descriptionEs" | "descriptionEn" | "descriptionFr"
  >,
): string {
  return [
    course.titleEs,
    course.titleEn,
    course.titleFr,
    course.descriptionEs,
    course.descriptionEn,
    course.descriptionFr,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
