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
import { listCoursesForAdmin } from "@/lib/services/courses.service";
import { listJobPostingsForAdmin } from "@/lib/services/jobs.service";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, user, locale, t, courses, jobPostingsResult] = await Promise.all([
    requireRole("admin"),
    getSession(),
    getLocale(),
    getTranslations("app.admin"),
    listCoursesForAdmin(),
    listJobPostingsForAdmin().catch(() => [] as Awaited<ReturnType<typeof listJobPostingsForAdmin>>),
  ]);
  const jobPostings = jobPostingsResult;

  const nav: PlatformNavItem[] = [
    { type: "link", href: "/admin", label: t("nav.dashboard"), exact: true },
    { type: "link", href: "/admin/students", label: t("nav.students") },
    { type: "link", href: "/admin/teachers", label: t("nav.teachers") },
    { type: "link", href: "/admin/languages", label: t("nav.languages") },
    {
      type: "group",
      href: "/admin/courses",
      matchPrefix: "/admin/courses",
      label: t("nav.courses"),
      children: courses.map(({ course }) => ({
        href: `/admin/courses/${course.id}/content`,
        label: localizedCourseTitle(course, locale as AppLocale),
      })),
    },
    {
      type: "group",
      href: "/admin/jobs",
      matchPrefix: "/admin/jobs",
      label: t("nav.jobs"),
      children: jobPostings.map(({ job }) => ({
        href: `/admin/jobs/${job.id}/applications`,
        label: job.title,
      })),
    },
    { type: "link", href: "/admin/profile", label: t("nav.profile") },
  ];

  return (
    <PlatformIntlProvider>
      <PlatformShell
        roleLabel={t("role")}
        homeHref="/admin"
        nav={nav}
        locale={locale}
        user={{
          fullName: profile.fullName,
          email: user?.email ?? "—",
          avatarUrl: profile.avatarUrl,
          profileHref: getProfilePath("admin"),
        }}
      >
        {children}
      </PlatformShell>
    </PlatformIntlProvider>
  );
}
