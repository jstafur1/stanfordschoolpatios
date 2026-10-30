export type CourseRole = "student" | "teacher" | "admin";

export type CourseNavItem = {
  href: string;
  segment: string;
  label: string;
};

export type BreadcrumbItem = {
  href?: string;
  label: string;
};

const IMMERSIVE_PATTERNS: Record<CourseRole, RegExp[]> = {
  student: [
    /^\/student\/courses\/[^/]+\/exams\/[^/]+$/,
    /^\/student\/courses\/[^/]+\/exams\/[^/]+\/result$/,
  ],
  teacher: [
    /^\/teacher\/courses\/[^/]+\/exams\/[^/]+$/,
    /^\/teacher\/courses\/[^/]+\/grades\/[^/]+$/,
  ],
  admin: [],
};

export function isImmersiveCoursePath(
  role: CourseRole,
  pathname: string,
): boolean {
  return IMMERSIVE_PATTERNS[role].some((pattern) => pattern.test(pathname));
}

export function getCourseBasePath(role: CourseRole, courseId: string): string {
  return `/${role}/courses/${courseId}`;
}

type NavDefinition = {
  segment: string;
  suffix: string;
};

const STUDENT_NAV: NavDefinition[] = [
  { segment: "overview", suffix: "" },
  { segment: "exams", suffix: "/exams" },
  { segment: "practice", suffix: "/practice" },
];

const TEACHER_NAV: NavDefinition[] = [
  { segment: "overview", suffix: "" },
  { segment: "content", suffix: "/content" },
  { segment: "exams", suffix: "/exams" },
  { segment: "grades", suffix: "/grades" },
  { segment: "progress", suffix: "/progress" },
  { segment: "chatbot", suffix: "/chatbot" },
];

const ADMIN_NAV: NavDefinition[] = [
  { segment: "groups", suffix: "/groups" },
  { segment: "content", suffix: "/content" },
  { segment: "grades", suffix: "/grades" },
  { segment: "progress", suffix: "/progress" },
  { segment: "chatbot", suffix: "/chatbot" },
];

function buildNavItems(
  role: CourseRole,
  courseId: string,
  definitions: NavDefinition[],
  labels: Record<string, string>,
): CourseNavItem[] {
  const base = getCourseBasePath(role, courseId);
  return definitions.map(({ segment, suffix }) => ({
    segment,
    href: `${base}${suffix}`,
    label: labels[segment] ?? segment,
  }));
}

export function getStudentCourseNav(
  courseId: string,
  labels: Record<string, string>,
): CourseNavItem[] {
  return buildNavItems("student", courseId, STUDENT_NAV, labels);
}

export function getTeacherCourseNav(
  courseId: string,
  labels: Record<string, string>,
): CourseNavItem[] {
  return buildNavItems("teacher", courseId, TEACHER_NAV, labels);
}

export function getAdminCourseNav(
  courseId: string,
  labels: Record<string, string>,
): CourseNavItem[] {
  return buildNavItems("admin", courseId, ADMIN_NAV, labels);
}

function getNavDefinitions(role: CourseRole): NavDefinition[] {
  if (role === "student") return STUDENT_NAV;
  if (role === "teacher") return TEACHER_NAV;
  return ADMIN_NAV;
}

function resolveActiveSegment(
  role: CourseRole,
  pathname: string,
  courseId: string,
): string {
  const base = getCourseBasePath(role, courseId);
  if (pathname === base) return "overview";

  const relative = pathname.slice(base.length);
  if (relative.startsWith("/content/") && role === "student") {
    return "overview";
  }

  const navDefs = getNavDefinitions(role);

  const match = navDefs.find((item) => {
    if (item.suffix === "") return pathname === base;
    return relative === item.suffix || relative.startsWith(`${item.suffix}/`);
  });

  return match?.segment ?? relative.split("/").filter(Boolean)[0] ?? "overview";
}

function sectionHref(base: string, segment: string): string {
  if (segment === "overview") return base;
  return `${base}/${segment}`;
}

export function buildCourseBreadcrumbs({
  role,
  courseId,
  courseTitle,
  homeHref,
  homeLabel,
  pathname,
  segmentLabels,
  nestedLabels,
  extraItem = null,
}: {
  role: CourseRole;
  courseId: string;
  courseTitle: string;
  homeHref: string;
  homeLabel: string;
  pathname: string;
  segmentLabels: Record<string, string>;
  nestedLabels: Record<string, string>;
  extraItem?: BreadcrumbItem | null;
}): BreadcrumbItem[] {
  const base = getCourseBasePath(role, courseId);
  const items: BreadcrumbItem[] = [{ href: homeHref, label: homeLabel }];
  const relative = pathname.slice(base.length);
  const parts = relative.split("/").filter(Boolean);
  const activeSegment = resolveActiveSegment(role, pathname, courseId);
  const sectionLabel = segmentLabels[activeSegment];

  if (parts[0] === "content" && parts.length >= 2) {
    if (role === "admin") {
      items.push({ href: `${base}/content`, label: courseTitle });
    } else {
      items.push({ href: base, label: courseTitle });
    }
    if (extraItem) {
      items.push(extraItem);
    }
    return items;
  }

  if (role === "admin") {
    const adminHub = `${base}/content`;
    items.push({ href: adminHub, label: courseTitle });
    if (sectionLabel) {
      items.push({ label: sectionLabel });
    }
    return items;
  }

  if (parts.length === 0) {
    items.push({ label: courseTitle });
    return items;
  }

  items.push({ href: base, label: courseTitle });

  if (!sectionLabel || activeSegment === "overview") {
    return items;
  }

  const isNested = parts.length >= 2;
  if (isNested) {
    items.push({
      href: sectionHref(base, activeSegment),
      label: sectionLabel,
    });
    if (parts[1] === "result" && nestedLabels.result) {
      items.push({ label: nestedLabels.result });
    } else if (activeSegment === "grades" && nestedLabels.attempt) {
      items.push({ label: nestedLabels.attempt });
    }
    return items;
  }

  items.push({ label: sectionLabel });
  return items;
}
