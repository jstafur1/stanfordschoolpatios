"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  getCourseBasePath,
  type CourseRole,
} from "@/lib/platform/course-nav";

export type CourseSwitcherOption = {
  id: string;
  title: string;
};

type CourseSwitcherProps = {
  role: CourseRole;
  courseId: string;
  courses: CourseSwitcherOption[];
  placeholder: string;
};

export function CourseSwitcher({
  role,
  courseId,
  courses,
  placeholder,
}: CourseSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (courses.length <= 1) {
    const current = courses.find((course) => course.id === courseId);
    if (!current) return null;
    return (
      <p className="truncate px-1 text-sm font-semibold text-foreground">
        {current.title}
      </p>
    );
  }

  function onCourseChange(nextCourseId: string | null) {
    if (!nextCourseId || nextCourseId === courseId) return;
    const base = getCourseBasePath(role, courseId);
    const suffix = pathname.startsWith(base) ? pathname.slice(base.length) : "";
    const nextBase = getCourseBasePath(role, nextCourseId);
    router.push(`${nextBase}${suffix}`);
  }

  const selectedTitle =
    courses.find((course) => course.id === courseId)?.title ?? placeholder;

  return (
    <Select value={courseId} onValueChange={onCourseChange}>
      <SelectTrigger className="w-full">
        <span className="truncate">{selectedTitle}</span>
      </SelectTrigger>
      <SelectContent>
        {courses.map((course) => (
          <SelectItem key={course.id} value={course.id}>
            {course.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
