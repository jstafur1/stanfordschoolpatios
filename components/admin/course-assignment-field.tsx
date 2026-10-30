"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { localizedCourseTitle } from "@/lib/i18n/localized-content";
import type { Course } from "@/lib/supabase/mappers";

type CourseAssignmentFieldProps = {
  courses: { course: Course }[];
  defaultCourseIds?: string[];
  label?: string;
  emptyMessage?: string;
};

export function CourseAssignmentField({
  courses,
  defaultCourseIds = [],
  label,
  emptyMessage,
}: CourseAssignmentFieldProps) {
  const tc = useTranslations("app.common");
  const resolvedLabel = label ?? tc("assignedCourses");
  const resolvedEmptyMessage = emptyMessage ?? tc("noCoursesYet");

  if (courses.length === 0) {
    return (
      <div className="grid gap-2">
        <Label>{resolvedLabel}</Label>
        <p className="text-sm text-muted-foreground">{resolvedEmptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Label>{resolvedLabel}</Label>
      <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
        {courses.map(({ course }) => (
          <label
            key={course.id}
            className="flex cursor-pointer items-start gap-2 text-sm"
          >
            <input
              type="checkbox"
              name="courseIds"
              value={course.id}
              defaultChecked={defaultCourseIds.includes(course.id)}
              className="mt-0.5 size-4 rounded border border-input accent-primary"
            />
            <span>{localizedCourseTitle(course)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
