import { getTranslations } from "next-intl/server";
import { CourseShellClient } from "@/components/platform/course-shell-client";
import type { CourseSwitcherOption } from "@/components/platform/course-switcher";
import type { CourseNavItem, CourseRole } from "@/lib/platform/course-nav";

type CourseShellProps = {
  role: CourseRole;
  courseId: string;
  courseTitle: string;
  homeHref: string;
  homeLabel: string;
  navItems: CourseNavItem[];
  courses: CourseSwitcherOption[];
  segmentLabels: Record<string, string>;
  nestedLabels: Record<string, string>;
  children: React.ReactNode;
};

export async function CourseShell({
  role,
  courseId,
  courseTitle,
  homeHref,
  homeLabel,
  navItems,
  courses,
  segmentLabels,
  nestedLabels,
  children,
}: CourseShellProps) {
  const t = await getTranslations("app.platform.courseNav");

  return (
    <CourseShellClient
      role={role}
      courseId={courseId}
      courseTitle={courseTitle}
      homeHref={homeHref}
      homeLabel={homeLabel}
      navItems={navItems}
      courses={courses}
      segmentLabels={segmentLabels}
      nestedLabels={nestedLabels}
      sectionLabel={t("sectionLabel")}
      coursesLabel={t("coursesLabel")}
      selectCourseLabel={t("selectCourse")}
    >
      {children}
    </CourseShellClient>
  );
}
