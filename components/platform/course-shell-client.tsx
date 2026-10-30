"use client";

import { usePathname } from "next/navigation";
import { CourseNav } from "@/components/platform/course-nav";
import {
  CourseSwitcher,
  type CourseSwitcherOption,
} from "@/components/platform/course-switcher";
import {
  CourseBreadcrumbProvider,
  useCourseBreadcrumbExtra,
} from "@/components/platform/course-breadcrumb-context";
import { PlatformBreadcrumb } from "@/components/platform/platform-breadcrumb";
import {
  buildCourseBreadcrumbs,
  isImmersiveCoursePath,
  type CourseNavItem,
  type CourseRole,
} from "@/lib/platform/course-nav";

type CourseShellClientProps = {
  role: CourseRole;
  courseId: string;
  courseTitle: string;
  homeHref: string;
  homeLabel: string;
  navItems: CourseNavItem[];
  courses: CourseSwitcherOption[];
  segmentLabels: Record<string, string>;
  nestedLabels: Record<string, string>;
  sectionLabel: string;
  coursesLabel: string;
  selectCourseLabel: string;
  children: React.ReactNode;
};

export function CourseShellClient(props: CourseShellClientProps) {
  return (
    <CourseBreadcrumbProvider>
      <CourseShellInner {...props} />
    </CourseBreadcrumbProvider>
  );
}

function CourseShellInner({
  role,
  courseId,
  courseTitle,
  homeHref,
  homeLabel,
  navItems,
  courses,
  segmentLabels,
  nestedLabels,
  sectionLabel,
  coursesLabel,
  selectCourseLabel,
  children,
}: CourseShellClientProps) {
  const pathname = usePathname();
  const immersive = isImmersiveCoursePath(role, pathname);
  const extraItem = useCourseBreadcrumbExtra();

  const breadcrumbs = buildCourseBreadcrumbs({
    role,
    courseId,
    courseTitle,
    homeHref,
    homeLabel,
    pathname,
    segmentLabels,
    nestedLabels,
    extraItem,
  });

  if (immersive) {
    return (
      <div className="min-w-0">
        <PlatformBreadcrumb items={breadcrumbs} />
        <div className="mt-6">{children}</div>
      </div>
    );
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,13.5rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
      <aside className="hidden lg:flex lg:flex-col lg:gap-4 lg:border-r lg:border-border lg:pr-6">
        <div className="flex flex-col gap-2">
          <p className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {coursesLabel}
          </p>
          <CourseSwitcher
            role={role}
            courseId={courseId}
            courses={courses}
            placeholder={selectCourseLabel}
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {sectionLabel}
          </p>
          <CourseNav
            role={role}
            courseId={courseId}
            items={navItems}
            sectionLabel={sectionLabel}
            variant="sidebar"
          />
        </div>
      </aside>

      <div className="min-w-0">
        <PlatformBreadcrumb items={breadcrumbs} />
        <div className="mt-4 flex flex-col gap-3 lg:hidden">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {coursesLabel}
            </p>
            <CourseSwitcher
              role={role}
              courseId={courseId}
              courses={courses}
              placeholder={selectCourseLabel}
            />
          </div>
          <CourseNav
            role={role}
            courseId={courseId}
            items={navItems}
            sectionLabel={sectionLabel}
            variant="pills"
          />
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
