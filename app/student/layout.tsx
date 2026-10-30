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
import { listCoursesForStudent } from "@/lib/services/enrollments.service";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("student");
  const [user, locale, t, enrollments] = await Promise.all([
    getSession(),
    getLocale(),
    getTranslations("app.student"),
    listCoursesForStudent(profile.id),
  ]);

  const nav: PlatformNavItem[] = [
    {
      type: "group",
      href: "/student",
      matchPrefix: "/student/courses",
      label: t("nav.courses"),
      children: enrollments.map(({ course }) => ({
        href: `/student/courses/${course.id}`,
        label: localizedCourseTitle(course, locale as AppLocale),
      })),
    },
    { type: "link", href: "/student/profile", label: t("nav.profile") },
  ];

  return (
    <PlatformIntlProvider>
      <PlatformShell
        roleLabel={t("role")}
        homeHref="/student"
        nav={nav}
        locale={locale}
        user={{
          fullName: profile.fullName,
          email: user?.email ?? "—",
          avatarUrl: profile.avatarUrl,
          profileHref: getProfilePath("student"),
        }}
      >
        {children}
      </PlatformShell>
    </PlatformIntlProvider>
  );
}
