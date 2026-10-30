"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { localizedCourseTitle } from "@/lib/i18n/localized-content";
import type { Course } from "@/lib/supabase/mappers";
import type { CourseGroup } from "@/lib/supabase/mappers";

export type CourseWithGroups = {
  course: Course;
  groups: CourseGroup[];
};

type GroupAssignmentFieldProps = {
  coursesWithGroups: CourseWithGroups[];
  defaultEnrollments?: Array<{ courseId: string; groupId: string }>;
  label?: string;
  emptyMessage?: string;
};

export function GroupAssignmentField({
  coursesWithGroups,
  defaultEnrollments = [],
  label,
  emptyMessage,
}: GroupAssignmentFieldProps) {
  const tc = useTranslations("app.common");
  const tg = useTranslations("app.groups");
  const resolvedLabel = label ?? tg("assignGroups");
  const resolvedEmptyMessage = emptyMessage ?? tc("noCoursesYet");

  if (coursesWithGroups.length === 0) {
    return (
      <div className="grid gap-2">
        <Label>{resolvedLabel}</Label>
        <p className="text-sm text-muted-foreground">{resolvedEmptyMessage}</p>
      </div>
    );
  }

  const defaultByCourse = new Map(
    defaultEnrollments.map((enrollment) => [
      enrollment.courseId,
      enrollment.groupId,
    ]),
  );

  return (
    <div className="grid gap-2">
      <Label>{resolvedLabel}</Label>
      <div className="max-h-56 space-y-3 overflow-y-auto rounded-lg border border-border p-3">
        {coursesWithGroups.map(({ course, groups }) => (
          <div key={course.id}>
            <p className="text-sm font-medium">{localizedCourseTitle(course)}</p>
            {groups.length === 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">{tg("noGroups")}</p>
            ) : (
              <div className="mt-2 space-y-1 pl-2">
                {groups.map((group) => {
                  const fieldName = `enrollment_${course.id}`;
                  const defaultGroupId = defaultByCourse.get(course.id);
                  return (
                    <label
                      key={group.id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="radio"
                        name={fieldName}
                        value={group.id}
                        defaultChecked={defaultGroupId === group.id}
                        className="size-4 border border-input accent-primary"
                      />
                      <span>{group.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type TeacherGroupAssignmentFieldProps = {
  coursesWithGroups: CourseWithGroups[];
  defaultGroupIds?: string[];
  label?: string;
};

export function TeacherGroupAssignmentField({
  coursesWithGroups,
  defaultGroupIds = [],
  label,
}: TeacherGroupAssignmentFieldProps) {
  const tg = useTranslations("app.groups");
  const resolvedLabel = label ?? tg("assignTeacherGroups");

  return (
    <div className="grid gap-2">
      <Label>{resolvedLabel}</Label>
      <div className="max-h-56 space-y-3 overflow-y-auto rounded-lg border border-border p-3">
        {coursesWithGroups.map(({ course, groups }) => (
          <div key={course.id}>
            <p className="text-sm font-medium">{localizedCourseTitle(course)}</p>
            <div className="mt-2 space-y-1 pl-2">
              {groups.map((group) => (
                <label
                  key={group.id}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name="groupIds"
                    value={group.id}
                    defaultChecked={defaultGroupIds.includes(group.id)}
                    className="size-4 rounded border border-input accent-primary"
                  />
                  <span>{group.name}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
