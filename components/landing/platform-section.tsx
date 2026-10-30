"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  CourseCarousel,
  type CourseCarouselItem,
} from "@/components/landing/course-carousel";
import {
  CourseDetailModal,
  type SelectedCourse,
} from "@/components/landing/course-detail-modal";
import {
  filterCatalogCourses,
  uniqueCourseLevels,
  uniqueLanguageCodes,
  type CatalogCourse,
} from "@/lib/landing/catalog-filters";
import { landingCourses, type LandingCourse } from "@/lib/landing/courses";
import type { CourseLevel } from "@/lib/courses/levels";
import {
  localizedCourseDescription,
  localizedCourseTitle,
  localizedLanguageName,
  type AppLocale,
} from "@/lib/i18n/localized-content";
import {
  landingContentMt,
  landingLabel,
  landingSectionAlt,
  landingTitle,
} from "@/lib/landing/section-styles";

type PlatformSectionProps = {
  catalogCourses?: CatalogCourse[];
};

function localizedLanguageLabel(
  course: CatalogCourse,
  locale: AppLocale,
): string | null {
  if (!course.languageCode) return null;
  return localizedLanguageName(
    {
      name: course.languageNameEs ?? course.languageCode,
      nameEs: course.languageNameEs ?? course.languageCode,
      nameEn: course.languageNameEn ?? course.languageCode,
      nameFr: course.languageNameFr ?? course.languageCode,
    },
    locale,
  );
}

function filterStaticCourses(
  courses: LandingCourse[],
  options: {
    languageCode: string | null;
    level: CourseLevel | null;
    search: string;
    getTitle: (course: LandingCourse) => string;
    getDescription: (course: LandingCourse) => string;
  },
): LandingCourse[] {
  const query = options.search.trim().toLowerCase();

  return courses.filter((course) => {
    if (
      options.languageCode &&
      course.languageCode.toLowerCase() !== options.languageCode.toLowerCase()
    ) {
      return false;
    }

    if (options.level && course.level !== options.level) {
      return false;
    }

    if (query) {
      const haystack = `${options.getTitle(course)} ${options.getDescription(course)}`
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

export function PlatformSection({ catalogCourses = [] }: PlatformSectionProps) {
  const t = useTranslations("platform");
  const locale = useLocale() as AppLocale;
  const [languageCode, setLanguageCode] = useState<string | null>(null);
  const [level, setLevel] = useState<CourseLevel | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SelectedCourse | null>(null);

  const useLiveCatalog = catalogCourses.length > 0;

  const languageCodes = useMemo(
    () =>
      useLiveCatalog
        ? uniqueLanguageCodes(catalogCourses)
        : [...new Set(landingCourses.map((course) => course.languageCode))].sort(),
    [catalogCourses, useLiveCatalog],
  );

  const levels = useMemo(
    () =>
      useLiveCatalog
        ? uniqueCourseLevels(catalogCourses)
        : ([...new Set(landingCourses.map((course) => course.level).filter(Boolean))] as CourseLevel[]),
    [catalogCourses, useLiveCatalog],
  );

  const filteredLive = useMemo(
    () =>
      filterCatalogCourses(catalogCourses, {
        languageCode,
        level,
        search,
        locale,
      }),
    [catalogCourses, languageCode, level, search, locale],
  );

  const filteredStatic = useMemo(
    () =>
      filterStaticCourses(landingCourses, {
        languageCode,
        level,
        search,
        getTitle: (course) => t(`courses.${course.courseKey}.title`),
        getDescription: (course) =>
          t(`courses.${course.courseKey}.description`),
      }),
    [languageCode, level, search, t],
  );

  const filtered = useLiveCatalog ? filteredLive : filteredStatic;

  const carouselCourses = useMemo((): CourseCarouselItem[] => {
    if (useLiveCatalog) {
      return filteredLive.map((course) => ({
        id: course.id,
        image: course.image,
        title: localizedCourseTitle(course, locale),
        description:
          localizedCourseDescription(course, locale) ?? t("liveCourseMeta"),
        level: course.level,
      }));
    }

    return filteredStatic.map((course) => ({
      id: course.id,
      image: course.image,
      title: t(`courses.${course.courseKey}.title`),
      description: t(`courses.${course.courseKey}.description`),
      level: course.level,
    }));
  }, [filteredLive, filteredStatic, locale, t, useLiveCatalog]);

  const handleCarouselSelect = (courseId: string) => {
    if (useLiveCatalog) {
      const course = catalogCourses.find((item) => item.id === courseId);
      if (course) setSelected({ type: "live", course });
      return;
    }

    const course = landingCourses.find((item) => item.id === courseId);
    if (course) setSelected({ type: "static", course });
  };

  const languageLabelForCode = (code: string) => {
    if (useLiveCatalog) {
      const match = catalogCourses.find(
        (course) => course.languageCode?.toLowerCase() === code.toLowerCase(),
      );
      if (match) return localizedLanguageLabel(match, locale) ?? code;
    }
    return code.toUpperCase();
  };

  const modalProps = (() => {
    if (!selected) return null;

    if (selected.type === "live") {
      const course = selected.course;
      return {
        title: localizedCourseTitle(course, locale),
        description:
          localizedCourseDescription(course, locale) ?? t("liveCourseMeta"),
        level: course.level,
        languageLabel: localizedLanguageLabel(course, locale),
        studentCount: course.studentCount,
        teacherCount: course.teacherCount,
        materialCount: course.materialCount,
      };
    }

    const course = selected.course;
    return {
      title: t(`courses.${course.courseKey}.title`),
      description: t(`courses.${course.courseKey}.description`),
      level: course.level,
      languageLabel: languageLabelForCode(course.languageCode),
      studentCount: course.studentCount,
      teacherCount: course.teacherCount,
      materialCount: course.materialCount,
    };
  })();

  return (
    <section id="plataforma" className={landingSectionAlt}>
      <div className="mx-auto max-w-7xl">
        <p className={landingLabel}>{t("label")}</p>
        <h2 className={`${landingTitle} max-w-2xl`}>{t("title")}</h2>

        <div className="mt-4 space-y-3">
          <div className="relative max-w-xl">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="pl-9"
              aria-label={t("searchPlaceholder")}
            />
          </div>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
            <button
              type="button"
              onClick={() => setLanguageCode(null)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
                languageCode === null
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              {t("filters.allLanguages")}
            </button>
            {languageCodes.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLanguageCode(code)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
                  languageCode === code
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                {languageLabelForCode(code)}
              </button>
            ))}
          </div>

          {levels.length > 0 ? (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
              <button
                type="button"
                onClick={() => setLevel(null)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
                  level === null
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                {t("filters.allLevels")}
              </button>
              {levels.map((courseLevel) => (
                <button
                  key={courseLevel}
                  type="button"
                  onClick={() => setLevel(courseLevel)}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
                    level === courseLevel
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  {courseLevel}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <p className={`${landingContentMt} text-center text-sm text-muted-foreground`}>
            {t("noCoursesInFilter")}
          </p>
        ) : (
          <CourseCarousel
            key={`${languageCode ?? "all"}-${level ?? "all"}-${search}`}
            courses={carouselCourses}
            onSelect={handleCarouselSelect}
          />
        )}
      </div>

      {modalProps ? (
        <CourseDetailModal
          selected={selected}
          onClose={() => setSelected(null)}
          {...modalProps}
        />
      ) : null}
    </section>
  );
}
