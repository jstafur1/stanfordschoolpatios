import type { CourseLevel } from "@/lib/courses/levels";
import type { AppLocale } from "@/lib/i18n/localized-content";
import {
  localizedCourseDescription,
  localizedCourseTitle,
} from "@/lib/i18n/localized-content";

export type CatalogCourse = {
  id: string;
  title: string;
  titleEs: string;
  titleEn: string;
  titleFr: string;
  description: string | null;
  descriptionEs: string | null;
  descriptionEn: string | null;
  descriptionFr: string | null;
  image: string;
  languageCode: string | null;
  languageNameEs: string | null;
  languageNameEn: string | null;
  languageNameFr: string | null;
  level: CourseLevel | null;
  studentCount: number;
  teacherCount: number;
  materialCount: number;
};

export function localizedCatalogSearchText(
  course: CatalogCourse,
  locale: AppLocale,
): string {
  const title = localizedCourseTitle(course, locale);
  const description = localizedCourseDescription(course, locale);
  return [title, description].filter(Boolean).join(" ").toLowerCase();
}

export function filterCatalogCourses(
  courses: CatalogCourse[],
  options: {
    languageCode: string | null;
    level: CourseLevel | null;
    search: string;
    locale: AppLocale;
  },
): CatalogCourse[] {
  const query = options.search.trim().toLowerCase();

  return courses.filter((course) => {
    if (
      options.languageCode &&
      course.languageCode?.toLowerCase() !== options.languageCode.toLowerCase()
    ) {
      return false;
    }

    if (options.level && course.level !== options.level) {
      return false;
    }

    if (query && !localizedCatalogSearchText(course, options.locale).includes(query)) {
      return false;
    }

    return true;
  });
}

export function uniqueLanguageCodes(courses: CatalogCourse[]): string[] {
  const codes = new Set<string>();
  for (const course of courses) {
    if (course.languageCode) {
      codes.add(course.languageCode);
    }
  }
  return [...codes].sort((a, b) => a.localeCompare(b));
}

export function uniqueCourseLevels(courses: CatalogCourse[]): CourseLevel[] {
  const levels = new Set<CourseLevel>();
  for (const course of courses) {
    if (course.level) {
      levels.add(course.level);
    }
  }
  const order: CourseLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
  return order.filter((level) => levels.has(level));
}
