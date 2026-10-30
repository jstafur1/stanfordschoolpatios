"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import {
  isImmersiveCoursePath,
  type CourseNavItem,
  type CourseRole,
} from "@/lib/platform/course-nav";
import {
  courseSidebarNavLinkClass,
  pillNavLinkClass,
} from "@/lib/platform/nav-styles";

const SEGMENT_ICONS: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  content: FileText,
  exams: ClipboardList,
  grades: GraduationCap,
  practice: Bot,
  chatbot: Bot,
};

type CourseNavProps = {
  role: CourseRole;
  courseId: string;
  items: CourseNavItem[];
  sectionLabel: string;
  variant: "sidebar" | "pills";
};

function isNavItemActive(
  item: CourseNavItem,
  pathname: string,
  role: CourseRole,
  courseId: string,
): boolean {
  if (pathname === item.href) return true;
  if (pathname.startsWith(`${item.href}/`)) return true;
  if (
    role === "student" &&
    item.segment === "overview" &&
    pathname.includes(`/courses/${courseId}/content/`)
  ) {
    return true;
  }
  return false;
}

export function CourseNav({
  role,
  courseId,
  items,
  sectionLabel,
  variant,
}: CourseNavProps) {
  const pathname = usePathname();

  if (isImmersiveCoursePath(role, pathname)) {
    return null;
  }

  if (variant === "pills") {
    return (
      <nav aria-label={sectionLabel} className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex w-max min-w-full gap-2">
          {items.map((item) => {
            const active = isNavItemActive(item, pathname, role, courseId);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={pillNavLinkClass(active)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label={sectionLabel}>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = isNavItemActive(item, pathname, role, courseId);
          const Icon = SEGMENT_ICONS[item.segment] ?? LayoutDashboard;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={courseSidebarNavLinkClass(active)}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
