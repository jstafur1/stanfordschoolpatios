import { getLocale, getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/guards";
import { getProfilePath } from "@/lib/auth/profile-path";
import { getSession } from "@/lib/auth/session";
import { PlatformIntlProvider } from "@/components/platform/platform-intl-provider";
import { PlatformShell } from "@/components/platform/platform-shell";
import {
  localizedCourseTitle,
  type AppLocale,
} from "@/lib/i18n/localized-content";
import type { PlatformNavItem } from "@/lib/platform/platform-nav";
import { listCoursesForTeacher } from "@/lib/services/courses.service";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("teacher");
  const [user, locale, t, teacherCourses] = await Promise.all([
    getSession(),
    getLocale(),
    getTranslations("app.teacher"),
    listCoursesForTeacher(profile.id),
  ]);

  const nav: PlatformNavItem[] = [
    {
      type: "group",
      href: "/teacher",
      matchPrefix: "/teacher/courses",
      label: t("nav.courses"),
      children: teacherCourses.map(({ course }) => ({
        href: `/teacher/courses/${course.id}`,
        label: localizedCourseTitle(course, locale as AppLocale),
      })),
    },
    { type: "link", href: "/teacher/profile", label: t("nav.profile") },
  ];

  return (
    <PlatformIntlProvider>
      <PlatformShell
        roleLabel={t("role")}
        homeHref="/teacher"
        nav={nav}
        locale={locale}
        user={{
          fullName: profile.fullName,
          email: user?.email ?? "—",
          avatarUrl: profile.avatarUrl,
          profileHref: getProfilePath("teacher"),
        }}
      >
        {children}
      </PlatformShell>
    </PlatformIntlProvider>
  );
}
